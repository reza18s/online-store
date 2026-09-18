import { createHash, createHmac } from 'node:crypto';
import { environment } from '@nova/config';

export const CATALOG_MEDIA_STORAGE = Symbol('CATALOG_MEDIA_STORAGE');

export const CATALOG_MEDIA_UPLOAD_EXPIRES_SECONDS = 15 * 60;
export const CATALOG_MEDIA_MULTIPART_EXPIRY_HOURS = 24;
export const CATALOG_MEDIA_MAX_BYTES = 15 * 1024 * 1024;

export const CATALOG_MEDIA_CONTENT_TYPES = [
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type CatalogMediaContentType = (typeof CATALOG_MEDIA_CONTENT_TYPES)[number];

const MEDIA_EXTENSION_BY_CONTENT_TYPE: Record<CatalogMediaContentType, string> = {
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const SAFE_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

export interface CatalogMediaUploadInput {
  assetId: string;
  productId: string;
  contentType: CatalogMediaContentType;
  sizeBytes: number;
  width: number;
  height: number;
}

export interface CatalogMediaUploadPlan {
  assetId: string;
  original: {
    key: string;
    url: string;
    headers: Record<string, string>;
  };
  derivative: {
    key: string;
    url: string;
    headers: Record<string, string>;
  };
  expiresInSeconds: number;
  multipartExpiresHours: number;
}

export interface CatalogMediaCompletedAsset {
  originalKey: string;
  derivativeKey: string;
  contentType: CatalogMediaContentType;
  sizeBytes: number;
}

export interface CatalogMediaReadUrlInput {
  mediaId: string;
  productId: string;
  derivativeKey: string;
}

export interface CatalogMediaQuarantineInput {
  mediaId: string;
  productId: string;
  originalKey: string;
  derivativeKey: string;
}

export interface CatalogMediaStorage {
  createUpload(input: CatalogMediaUploadInput): Promise<CatalogMediaUploadPlan>;
  completeUpload(input: CatalogMediaUploadInput): Promise<CatalogMediaCompletedAsset>;
  createDerivativeReadUrl(input: CatalogMediaReadUrlInput): Promise<string>;
  quarantine(input: CatalogMediaQuarantineInput): Promise<void>;
}

export class CatalogMediaStorageError extends Error {
  public constructor(
    public readonly code: string,
    message: string,
    options?: { cause?: unknown; status?: number },
  ) {
    super(message, options);
    this.name = 'CatalogMediaStorageError';
    this.status = options?.status;
  }

  public readonly status?: number;
}

export interface S3CatalogMediaStorageConfig {
  endpoint?: string;
  region?: string;
  bucket?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  forcePathStyle?: boolean;
}

type S3CatalogMediaStorageDependencies = {
  fetch?: typeof fetch;
  now?: () => Date;
};

function assertSafeId(value: string, field: string): void {
  if (typeof value !== 'string' || SAFE_ID_PATTERN.exec(value)?.[0] !== value) {
    throw new CatalogMediaStorageError(
      'MEDIA_KEY_INVALID',
      `${field} is not safe for an object key.`,
    );
  }
}

function assertUploadInput(input: CatalogMediaUploadInput): void {
  assertSafeId(input.productId, 'product id');
  assertSafeId(input.assetId, 'asset id');
  if (!(CATALOG_MEDIA_CONTENT_TYPES as readonly string[]).includes(input.contentType)) {
    throw new CatalogMediaStorageError(
      'MEDIA_CONTENT_TYPE_INVALID',
      'Media content type is not supported.',
    );
  }
  if (
    !Number.isInteger(input.sizeBytes) ||
    input.sizeBytes < 1 ||
    input.sizeBytes > CATALOG_MEDIA_MAX_BYTES
  ) {
    throw new CatalogMediaStorageError(
      'MEDIA_SIZE_INVALID',
      'Media size is outside the allowed range.',
    );
  }
  if (!Number.isInteger(input.width) || input.width < 1 || input.width > 10_000) {
    throw new CatalogMediaStorageError(
      'MEDIA_DIMENSIONS_INVALID',
      'Media width is outside the allowed range.',
    );
  }
  if (!Number.isInteger(input.height) || input.height < 1 || input.height > 10_000) {
    throw new CatalogMediaStorageError(
      'MEDIA_DIMENSIONS_INVALID',
      'Media height is outside the allowed range.',
    );
  }
}

export function catalogMediaObjectKeys(input: CatalogMediaUploadInput): {
  originalKey: string;
  derivativeKey: string;
} {
  assertUploadInput(input);
  const extension = MEDIA_EXTENSION_BY_CONTENT_TYPE[input.contentType];
  const prefix = `catalog/products/${input.productId}/${input.assetId}`;
  return {
    originalKey: `${prefix}/original.${extension}`,
    derivativeKey: `${prefix}/derivative.${extension}`,
  };
}

type CatalogMediaObjectRole = 'original' | 'derivative';

function assertOwnedKey(
  key: string,
  expectedPrefix: string,
  expectedRole?: CatalogMediaObjectRole,
): void {
  const ownedPrefix = `${expectedPrefix}/`;
  const objectName = key.startsWith(ownedPrefix) ? key.slice(ownedPrefix.length) : '';
  const hasExpectedObjectName =
    expectedRole === undefined ||
    Object.values(MEDIA_EXTENSION_BY_CONTENT_TYPE).some(
      (extension) => objectName === `${expectedRole}.${extension}`,
    );

  if (
    !key.startsWith(ownedPrefix) ||
    key.includes('..') ||
    key.includes('\\') ||
    !hasExpectedObjectName
  ) {
    throw new CatalogMediaStorageError(
      'MEDIA_KEY_INVALID',
      'Media object key is outside its ownership boundary.',
    );
  }
}

function assetIdFromOwnedKey(
  productId: string,
  key: string,
  expectedRole: CatalogMediaObjectRole,
): string {
  assertSafeId(productId, 'product id');
  const productPrefix = `catalog/products/${productId}/`;
  if (!key.startsWith(productPrefix)) {
    throw new CatalogMediaStorageError(
      'MEDIA_KEY_INVALID',
      'Media object key is outside its ownership boundary.',
    );
  }

  const [assetId, objectName, ...extraSegments] = key.slice(productPrefix.length).split('/');
  if (!assetId || !objectName || extraSegments.length > 0) {
    throw new CatalogMediaStorageError(
      'MEDIA_KEY_INVALID',
      'Media object key is outside its ownership boundary.',
    );
  }
  assertSafeId(assetId, 'asset id');
  assertOwnedKey(key, `${productPrefix}${assetId}`, expectedRole);
  return assetId;
}

function isMissingObject(error: unknown): boolean {
  return (
    error instanceof CatalogMediaStorageError &&
    error.code === 'MEDIA_STORAGE_REQUEST_FAILED' &&
    error.status === 404
  );
}

export function catalogMediaAssetIdFromObjectKey(
  productId: string,
  key: string,
  expectedRole: 'original' | 'derivative',
): string {
  return assetIdFromOwnedKey(productId, key, expectedRole);
}

export function catalogMediaAssetIdFromObjectKeys(
  productId: string,
  keys: Pick<CatalogMediaQuarantineInput, 'originalKey' | 'derivativeKey'>,
): string {
  const originalAssetId = catalogMediaAssetIdFromObjectKey(productId, keys.originalKey, 'original');
  const derivativeAssetId = catalogMediaAssetIdFromObjectKey(
    productId,
    keys.derivativeKey,
    'derivative',
  );
  if (originalAssetId !== derivativeAssetId) {
    throw new CatalogMediaStorageError(
      'MEDIA_KEY_INVALID',
      'Media object keys do not belong to the same asset.',
    );
  }
  return originalAssetId;
}

function configured(
  options: S3CatalogMediaStorageConfig,
): options is Required<S3CatalogMediaStorageConfig> {
  return Boolean(
    options.endpoint &&
    options.region &&
    options.bucket &&
    options.accessKeyId &&
    options.secretAccessKey,
  );
}

function storageUnavailable(): CatalogMediaStorageError {
  return new CatalogMediaStorageError(
    'MEDIA_STORAGE_UNAVAILABLE',
    'Catalog media storage is not configured.',
  );
}

export class DisabledCatalogMediaStorage implements CatalogMediaStorage {
  public async createUpload(input: CatalogMediaUploadInput): Promise<CatalogMediaUploadPlan> {
    void input;
    throw storageUnavailable();
  }

  public async completeUpload(input: CatalogMediaUploadInput): Promise<CatalogMediaCompletedAsset> {
    void input;
    throw storageUnavailable();
  }

  public async createDerivativeReadUrl(input: CatalogMediaReadUrlInput): Promise<string> {
    void input;
    throw storageUnavailable();
  }

  public async quarantine(input: CatalogMediaQuarantineInput): Promise<void> {
    void input;
    throw storageUnavailable();
  }
}

export class S3CatalogMediaStorage implements CatalogMediaStorage {
  public constructor(
    private readonly options: Required<S3CatalogMediaStorageConfig>,
    private readonly dependencies: S3CatalogMediaStorageDependencies = {},
  ) {}

  public async createUpload(input: CatalogMediaUploadInput): Promise<CatalogMediaUploadPlan> {
    const keys = catalogMediaObjectKeys(input);
    const originalHeaders = {
      'content-type': input.contentType,
      'x-amz-meta-media-content-type': input.contentType,
      'x-amz-meta-media-width': String(input.width),
      'x-amz-meta-media-height': String(input.height),
      'x-amz-meta-media-size': String(input.sizeBytes),
      'x-amz-meta-media-role': 'original',
    };
    const derivativeHeaders = {
      'content-type': input.contentType,
      'x-amz-meta-media-content-type': input.contentType,
      'x-amz-meta-media-width': String(input.width),
      'x-amz-meta-media-height': String(input.height),
      'x-amz-meta-media-role': 'derivative',
    };
    const originalUrl = this.presignedUrl('PUT', keys.originalKey, originalHeaders);
    const derivativeUrl = this.presignedUrl('PUT', keys.derivativeKey, derivativeHeaders);

    return {
      assetId: input.assetId,
      original: {
        key: keys.originalKey,
        url: originalUrl,
        headers: {
          ...originalHeaders,
        },
      },
      derivative: {
        key: keys.derivativeKey,
        url: derivativeUrl,
        headers: {
          ...derivativeHeaders,
        },
      },
      expiresInSeconds: CATALOG_MEDIA_UPLOAD_EXPIRES_SECONDS,
      multipartExpiresHours: CATALOG_MEDIA_MULTIPART_EXPIRY_HOURS,
    };
  }

  public async completeUpload(input: CatalogMediaUploadInput): Promise<CatalogMediaCompletedAsset> {
    const keys = catalogMediaObjectKeys(input);
    const expectedPrefix = `catalog/products/${input.productId}/${input.assetId}`;
    assertOwnedKey(keys.originalKey, expectedPrefix, 'original');
    assertOwnedKey(keys.derivativeKey, expectedPrefix, 'derivative');

    const [original, derivative] = await Promise.all([
      this.head(keys.originalKey),
      this.head(keys.derivativeKey),
    ]);
    this.assertHead(original, input, 'original', input.sizeBytes);
    this.assertHead(derivative, input, 'derivative');

    return {
      originalKey: keys.originalKey,
      derivativeKey: keys.derivativeKey,
      contentType: input.contentType,
      sizeBytes: input.sizeBytes,
    };
  }

  public async createDerivativeReadUrl(input: CatalogMediaReadUrlInput): Promise<string> {
    assertSafeId(input.productId, 'product id');
    assertSafeId(input.mediaId, 'media id');
    assertOwnedKey(
      input.derivativeKey,
      `catalog/products/${input.productId}/${input.mediaId}`,
      'derivative',
    );
    return this.presignedUrl('GET', input.derivativeKey, {}, 300, {
      'response-cache-control': 'public, max-age=31536000, immutable',
    });
  }

  public async quarantine(input: CatalogMediaQuarantineInput): Promise<void> {
    const assetId = catalogMediaAssetIdFromObjectKeys(input.productId, input);
    assertSafeId(input.mediaId, 'media id');
    if (input.mediaId !== assetId) {
      throw new CatalogMediaStorageError(
        'MEDIA_KEY_INVALID',
        'Media id does not match the asset encoded by its object keys.',
      );
    }
    const quarantinePrefix = `catalog/quarantine/${input.productId}/${assetId}/${Date.now()}`;

    for (const key of [input.originalKey, input.derivativeKey]) {
      const quarantineKey = `${quarantinePrefix}/${key.split('/').at(-1)}`;
      try {
        await this.request('PUT', quarantineKey, {
          'x-amz-copy-source': `/${this.options.bucket}/${key}`,
        });
      } catch (error) {
        if (isMissingObject(error)) continue;
        throw new CatalogMediaStorageError(
          'MEDIA_QUARANTINE_FAILED',
          'Catalog media could not be quarantined.',
          { cause: error },
        );
      }
      try {
        await this.request('DELETE', key);
      } catch (error) {
        if (isMissingObject(error)) continue;
        throw new CatalogMediaStorageError(
          'MEDIA_QUARANTINE_FAILED',
          'Catalog media could not be quarantined.',
          { cause: error },
        );
      }
    }
  }

  private async head(key: string): Promise<{
    ContentType?: string;
    ContentLength?: number;
    Metadata?: Record<string, string>;
  }> {
    try {
      const response = await this.request('HEAD', key);
      const metadata: Record<string, string> = {};
      response.headers.forEach((value, name) => {
        if (name.startsWith('x-amz-meta-')) metadata[name.slice('x-amz-meta-'.length)] = value;
      });
      return {
        ContentType: response.headers.get('content-type') ?? undefined,
        ContentLength: Number(response.headers.get('content-length') ?? NaN),
        Metadata: metadata,
      };
    } catch (error) {
      throw new CatalogMediaStorageError(
        'MEDIA_OBJECT_NOT_READY',
        'Catalog media objects are not ready.',
        { cause: error },
      );
    }
  }

  private assertHead(
    result: { ContentType?: string; ContentLength?: number; Metadata?: Record<string, string> },
    input: CatalogMediaUploadInput,
    role: 'original' | 'derivative',
    expectedSize?: number,
  ): void {
    if (result.ContentType !== input.contentType) {
      throw new CatalogMediaStorageError(
        'MEDIA_CONTENT_TYPE_MISMATCH',
        'Uploaded media type does not match the request.',
      );
    }
    if (expectedSize !== undefined && result.ContentLength !== expectedSize) {
      throw new CatalogMediaStorageError(
        'MEDIA_SIZE_MISMATCH',
        'Uploaded media size does not match the request.',
      );
    }
    const metadata = result.Metadata ?? {};
    if (
      metadata['media-content-type'] !== input.contentType ||
      metadata['media-width'] !== String(input.width) ||
      metadata['media-height'] !== String(input.height) ||
      metadata['media-role'] !== role ||
      (role === 'original' && metadata['media-size'] !== String(input.sizeBytes))
    ) {
      throw new CatalogMediaStorageError(
        'MEDIA_METADATA_MISMATCH',
        'Uploaded media metadata is invalid.',
      );
    }
  }

  private presignedUrl(
    method: 'GET' | 'PUT',
    key: string,
    headers: Record<string, string>,
    expiresIn = CATALOG_MEDIA_UPLOAD_EXPIRES_SECONDS,
    queryParameters: Record<string, string> = {},
  ): string {
    const now = this.dependencies.now?.() ?? new Date();
    const endpoint = this.objectUrl(key);
    const amzDate = toAmzDate(now);
    const shortDate = amzDate.slice(0, 8);
    const credentialScope = `${shortDate}/${this.options.region}/s3/aws4_request`;
    const canonicalHeaders = canonicalHeaderMap({ host: endpoint.host, ...headers });
    const signedHeaders = Object.keys(canonicalHeaders).sort().join(';');
    const query = new URLSearchParams({
      'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
      'X-Amz-Credential': `${this.options.accessKeyId}/${credentialScope}`,
      'X-Amz-Date': amzDate,
      'X-Amz-Expires': String(expiresIn),
      'X-Amz-SignedHeaders': signedHeaders,
      ...queryParameters,
    });
    const canonicalRequest = [
      method,
      endpoint.pathname,
      canonicalQuery(query),
      canonicalHeadersText(canonicalHeaders),
      signedHeaders,
      'UNSIGNED-PAYLOAD',
    ].join('\n');
    const signature = signatureFor(
      this.options.secretAccessKey,
      shortDate,
      this.options.region,
      canonicalRequest,
      amzDate,
      credentialScope,
    );
    query.set('X-Amz-Signature', signature);
    endpoint.search = canonicalQuery(query);
    return endpoint.toString();
  }

  private async request(
    method: 'HEAD' | 'PUT' | 'DELETE',
    key: string,
    extraHeaders: Record<string, string> = {},
  ): Promise<Response> {
    const endpoint = this.objectUrl(key);
    const now = this.dependencies.now?.() ?? new Date();
    const amzDate = toAmzDate(now);
    const shortDate = amzDate.slice(0, 8);
    const headers = canonicalHeaderMap({
      host: endpoint.host,
      'x-amz-content-sha256': sha256Hex(''),
      'x-amz-date': amzDate,
      ...extraHeaders,
    });
    const signedHeaders = Object.keys(headers).sort().join(';');
    const canonicalRequest = [
      method,
      endpoint.pathname,
      '',
      canonicalHeadersText(headers),
      signedHeaders,
      headers['x-amz-content-sha256'],
    ].join('\n');
    const scope = `${shortDate}/${this.options.region}/s3/aws4_request`;
    const authorization = `AWS4-HMAC-SHA256 Credential=${this.options.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signatureFor(this.options.secretAccessKey, shortDate, this.options.region, canonicalRequest, amzDate, scope)}`;
    const requestHeaders = { ...headers };
    delete requestHeaders.host;
    const response = await (this.dependencies.fetch ?? fetch)(endpoint, {
      method,
      headers: { ...requestHeaders, authorization },
    });
    if (!response.ok) {
      throw new CatalogMediaStorageError(
        'MEDIA_STORAGE_REQUEST_FAILED',
        'Object storage request failed.',
        { status: response.status },
      );
    }
    return response;
  }

  private objectUrl(key: string): URL {
    if (!key.startsWith('catalog/') || key.includes('..') || key.includes('\\')) {
      throw new CatalogMediaStorageError(
        'MEDIA_KEY_INVALID',
        'Media object key is outside the storage namespace.',
      );
    }
    const endpoint = new URL(this.options.endpoint);
    const prefix = endpoint.pathname.replace(/\/$/, '');
    const encodedKey = key.split('/').map(awsEncode).join('/');
    if (this.options.forcePathStyle) {
      endpoint.pathname = `${prefix}/${awsEncode(this.options.bucket)}/${encodedKey}`;
    } else {
      endpoint.hostname = `${this.options.bucket}.${endpoint.hostname}`;
      endpoint.pathname = `${prefix}/${encodedKey}`;
    }
    return endpoint;
  }
}

function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function hmac(key: Uint8Array | string, value: string): Buffer {
  return createHmac('sha256', key).update(value).digest();
}

function toAmzDate(value: Date): string {
  return value
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
}

function canonicalHeaderMap(headers: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers)
      .map(([name, value]) => [name.toLowerCase(), value.trim().replace(/\s+/g, ' ')] as const)
      .sort(([left], [right]) => compareCanonicalStrings(left, right)),
  );
}

function canonicalHeadersText(headers: Record<string, string>): string {
  return `${Object.entries(headers)
    .map(([name, value]) => `${name}:${value}`)
    .join('\n')}\n`;
}

function canonicalQuery(query: URLSearchParams): string {
  return [...query.entries()]
    .map(([name, value]) => [awsEncode(name), awsEncode(value)] as const)
    .sort(([leftName, leftValue], [rightName, rightValue]) =>
      compareCanonicalStrings(`${leftName}=${leftValue}`, `${rightName}=${rightValue}`),
    )
    .map(([name, value]) => `${name}=${value}`)
    .join('&');
}

function awsEncode(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function compareCanonicalStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function signatureFor(
  secret: string,
  shortDate: string,
  region: string,
  canonicalRequest: string,
  amzDate: string,
  scope: string,
): string {
  const dateKey = hmac(`AWS4${secret}`, shortDate);
  const regionKey = hmac(dateKey, region);
  const serviceKey = hmac(regionKey, 's3');
  const signingKey = hmac(serviceKey, 'aws4_request');
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${sha256Hex(canonicalRequest)}`;
  return createHmac('sha256', signingKey).update(stringToSign).digest('hex');
}

export function createCatalogMediaStorage(): CatalogMediaStorage {
  const options: S3CatalogMediaStorageConfig = {
    endpoint: environment.S3_ENDPOINT,
    region: environment.S3_REGION,
    bucket: environment.S3_BUCKET,
    accessKeyId: environment.S3_ACCESS_KEY,
    secretAccessKey: environment.S3_SECRET_KEY,
    forcePathStyle: environment.S3_FORCE_PATH_STYLE,
  };
  return configured(options)
    ? new S3CatalogMediaStorage(options)
    : new DisabledCatalogMediaStorage();
}
