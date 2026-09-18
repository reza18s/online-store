import { spawn } from 'node:child_process';
import type { ChildProcessByStdio } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import type { Readable } from 'node:stream';

import { DatabaseClient } from '../../packages/db/src/client';
import type { S3CatalogMediaStorage } from '../../apps/api/src/modules/catalog/catalog-media.storage';

const DATABASE_PREFIX = 'nova_media_validation_';
const DATABASE_NAME_PATTERN = /^nova_media_validation_[a-z0-9-]+$/;
const BUCKET_PREFIX = 'nova-media-validation-';
const BUCKET_NAME_PATTERN = /^nova-media-validation-[a-z0-9-]+$/;
const API_PORT_MIN = 1_024;
const API_PORT_MAX = 65_535;
const REQUEST_TIMEOUT_MS = 10_000;
const API_READY_ATTEMPTS = 60;
const API_READY_DELAY_MS = 250;
const API_SHUTDOWN_TIMEOUT_MS = 5_000;
const CSRF_COOKIE_NAME = 'nova_csrf';
const STAFF_COOKIE_NAME = 'nova_staff_session';
const TEST_AUTH_SECRET = 'live-media-validation-auth-secret-20260914';
const TEST_STAFF_TOTP_KEY = 'live-media-validation-staff-totp-key-20260914';
const PROVIDER_ENVIRONMENT_KEYS = [
  'ZARINPAL_MERCHANT_ID',
  'ZARINPAL_BASE_URL',
  'SMS_IR_API_KEY',
  'SMS_IR_LINE_NUMBER',
  'SMS_IR_TEMPLATE_ID',
  'SMS_IR_BASE_URL',
  'IRAN_POST_API_KEY',
  'IRAN_POST_BASE_URL',
] as const;

interface DatabaseTarget {
  databaseName: 'disposable validation database';
  host: 'loopback';
  protocol: 'postgresql';
}

interface LocalS3Target {
  accessKey: string;
  bucket: string;
  endpoint: string;
  region: string;
  secretKey: string;
}

interface Fixture {
  email: string;
  phone: string;
  password: string;
  productId: string;
  productSlug: string;
  roleId: string;
  totpSecret: string;
  userId: string;
}

interface UploadPlan {
  assetId: string;
  original: {
    headers: Record<string, string>;
    key: string;
    url: string;
  };
  derivative: {
    headers: Record<string, string>;
    key: string;
    url: string;
  };
}

interface HttpResult {
  body: string;
  headers: Headers;
  status: number | null;
}

interface CleanupEvidence {
  auditRows: number;
  mediaRows: number;
  productRows: number;
  roleRows: number;
  userRows: number;
}

interface MediaEvidence {
  api: {
    binding: 'loopback';
    port: number;
  };
  cleanup: CleanupEvidence;
  databaseTarget: DatabaseTarget;
  delete: {
    databaseRowRemoved: boolean;
    sourceDerivativeStatus: number;
    status: number;
  };
  login: {
    csrfStatus: number;
    loginStatus: number;
    meStatus: number;
  };
  media: {
    completeStatus: number;
    derivativeGetStatus: number;
    persistedStatus: 'READY';
    presignStatus: number;
    productId: 'synthetic disposable product';
  };
  storage: {
    derivativePutStatus: number;
    originalPutStatus: number;
    quarantineRouteStatus: number;
  };
}

type ApiProcess = ChildProcessByStdio<null, Readable, Readable>;

class HarnessFailure extends Error {
  public constructor(public readonly code: string) {
    super(code);
  }
}

function fail(code: string): never {
  throw new HarnessFailure(code);
}

function assertCondition(condition: unknown, code: string): asserts condition {
  if (!condition) fail(code);
}

function failureCode(error: unknown, fallback: string): string {
  return error instanceof HarnessFailure ? error.code : fallback;
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function loopbackHostname(hostname: string): boolean {
  return hostname.toLowerCase() === '127.0.0.1' || hostname.toLowerCase() === 'localhost';
}

function parseDatabaseTarget(databaseUrl: string): DatabaseTarget {
  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    fail('media-database-url-invalid');
  }

  assertCondition(
    parsed.protocol === 'postgres:' || parsed.protocol === 'postgresql:',
    'media-database-url-not-postgresql',
  );
  assertCondition(loopbackHostname(parsed.hostname), 'media-database-url-not-loopback');
  assertCondition(!parsed.hash, 'media-database-url-fragment');

  const targetOverrideParameters = new Set([
    'database',
    'dbname',
    'host',
    'hostaddr',
    'port',
    'service',
  ]);
  assertCondition(
    [...parsed.searchParams.keys()].every(
      (parameter) => !targetOverrideParameters.has(parameter.toLowerCase()),
    ),
    'media-database-url-target-override',
  );

  let databaseName: string;
  try {
    databaseName = decodeURIComponent(parsed.pathname.slice(1));
  } catch {
    fail('media-database-name-invalid');
  }
  assertCondition(
    databaseName.startsWith(DATABASE_PREFIX) && DATABASE_NAME_PATTERN.test(databaseName),
    'media-database-url-not-disposable',
  );

  return {
    databaseName: 'disposable validation database',
    host: 'loopback',
    protocol: 'postgresql',
  };
}

function parseLocalS3Target(): LocalS3Target {
  const endpointValue = process.env.NOVA_MEDIA_S3_ENDPOINT?.trim() || 'http://127.0.0.1:59000';
  let endpoint: URL;
  try {
    endpoint = new URL(endpointValue);
  } catch {
    fail('media-s3-endpoint-invalid');
  }

  assertCondition(endpoint.protocol === 'http:', 'media-s3-endpoint-not-http');
  assertCondition(loopbackHostname(endpoint.hostname), 'media-s3-endpoint-not-loopback');
  assertCondition(!endpoint.username && !endpoint.password, 'media-s3-endpoint-credentials');
  assertCondition(!endpoint.search && !endpoint.hash, 'media-s3-endpoint-query');
  assertCondition(endpoint.pathname === '/' || endpoint.pathname === '', 'media-s3-endpoint-path');

  const bucket = process.env.NOVA_MEDIA_S3_BUCKET?.trim() || fail('media-s3-bucket-missing');
  assertCondition(
    bucket.startsWith(BUCKET_PREFIX) && BUCKET_NAME_PATTERN.test(bucket),
    'media-s3-bucket-not-disposable',
  );

  const accessKey = process.env.NOVA_MEDIA_S3_ACCESS_KEY?.trim() || 'nova_local_s3';
  const secretKey =
    process.env.NOVA_MEDIA_S3_SECRET_KEY?.trim() || 'nova_local_s3_secret_change_me';
  assertCondition(accessKey.length > 0 && secretKey.length > 0, 'media-s3-credentials-missing');

  return {
    accessKey,
    bucket,
    endpoint: endpoint.origin,
    region: process.env.NOVA_MEDIA_S3_REGION?.trim() || 'us-east-1',
    secretKey,
  };
}

function parseLocalRedisUrl(): string {
  const value = process.env.NOVA_MEDIA_REDIS_URL?.trim() || 'redis://127.0.0.1:56379/15';
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    fail('media-redis-url-invalid');
  }

  assertCondition(parsed.protocol === 'redis:', 'media-redis-url-not-redis');
  assertCondition(loopbackHostname(parsed.hostname), 'media-redis-url-not-loopback');
  assertCondition(!parsed.username && !parsed.password, 'media-redis-url-credentials');
  assertCondition(!parsed.search && !parsed.hash, 'media-redis-url-query');
  assertCondition(parsed.pathname === '/15', 'media-redis-url-not-isolated-database');
  return parsed.toString();
}

function parseApiPort(): number {
  const raw = process.env.NOVA_MEDIA_API_PORT?.trim() || '4190';
  const port = Number(raw);
  assertCondition(
    Number.isInteger(port) && port >= API_PORT_MIN && port <= API_PORT_MAX,
    'media-api-port-invalid',
  );
  return port;
}

function captureEnvironment(names: readonly string[]): Map<string, string | undefined> {
  return new Map(names.map((name) => [name, process.env[name]]));
}

function restoreEnvironment(values: Map<string, string | undefined>): void {
  for (const [name, value] of values) {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }
}

function configureHarnessEnvironment(
  databaseUrl: string,
  redisUrl: string,
  apiPort: number,
  apiOrigin: string,
  s3: LocalS3Target,
): void {
  Object.assign(process.env, {
    NODE_ENV: 'test',
    API_PORT: String(apiPort),
    WEB_ORIGIN: apiOrigin,
    DATABASE_URL: databaseUrl,
    REDIS_URL: redisUrl,
    S3_ENDPOINT: s3.endpoint,
    S3_REGION: s3.region,
    S3_BUCKET: s3.bucket,
    S3_ACCESS_KEY: s3.accessKey,
    S3_SECRET_KEY: s3.secretKey,
    S3_FORCE_PATH_STYLE: 'true',
    AUTH_SECRET: TEST_AUTH_SECRET,
    STAFF_TOTP_ENCRYPTION_KEY: TEST_STAFF_TOTP_KEY,
  });
}

function childEnvironment(): NodeJS.ProcessEnv {
  const environment: NodeJS.ProcessEnv = { ...process.env };
  for (const key of PROVIDER_ENVIRONMENT_KEYS) delete environment[key];
  return environment;
}

async function request(url: string, init: RequestInit = {}): Promise<HttpResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    return {
      body: await response.text(),
      headers: response.headers,
      status: response.status,
    };
  } catch {
    return { body: '', headers: new Headers(), status: null };
  } finally {
    clearTimeout(timeout);
  }
}

async function binaryRequest(url: string, init: RequestInit = {}): Promise<HttpResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const body = await response.arrayBuffer();
    return {
      body: String(body.byteLength),
      headers: response.headers,
      status: response.status,
    };
  } catch {
    return { body: '', headers: new Headers(), status: null };
  } finally {
    clearTimeout(timeout);
  }
}

function expectStatus(response: HttpResult, expected: number, code: string): void {
  if (response.status !== expected) {
    fail(`${code}-status-${response.status ?? 'unreachable'}`);
  }
}

function parseObject(body: string, code: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    fail(code);
  }
  assertCondition(typeof parsed === 'object' && parsed !== null, code);
  return parsed as Record<string, unknown>;
}

function objectValue(source: Record<string, unknown>, key: string, code: string): unknown {
  const value = source[key];
  if (value === undefined) fail(code);
  return value;
}

function objectRecord(
  source: Record<string, unknown>,
  key: string,
  code: string,
): Record<string, unknown> {
  const value = objectValue(source, key, code);
  assertCondition(typeof value === 'object' && value !== null, code);
  return value as Record<string, unknown>;
}

function setCookieValue(headers: Headers, name: string): string {
  const raw = headers.get('set-cookie') ?? '';
  const marker = `${name}=`;
  const start = raw.indexOf(marker);
  assertCondition(start >= 0, `media-cookie-${name}-missing`);
  const valueStart = start + marker.length;
  const end = raw.indexOf(';', valueStart);
  const value = raw.slice(valueStart, end < 0 ? raw.length : end).trim();
  assertCondition(value.length > 0, `media-cookie-${name}-empty`);
  return value;
}

function cookieHeader(csrfToken: string, staffToken: string): string {
  return `${CSRF_COOKIE_NAME}=${csrfToken}; ${STAFF_COOKIE_NAME}=${staffToken}`;
}

function assertOwnedObjectKey(key: string, productId: string, assetId: string, role: string): void {
  assertCondition(
    key === `catalog/products/${productId}/${assetId}/${role}.webp`,
    `media-${role}-key-unexpected`,
  );
}

function childOutputTail(output: string[]): string {
  return output
    .join('')
    .slice(-1_000)
    .replace(/[\r\n]+/gu, ' ')
    .trim();
}

function waitForExit(child: ApiProcess, timeoutMs: number): Promise<boolean> {
  if (child.exitCode !== null) return Promise.resolve(true);
  return new Promise((resolvePromise) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      resolvePromise(false);
    }, timeoutMs);
    child.once('exit', () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolvePromise(true);
    });
  });
}

async function assertApiPortAvailable(apiOrigin: string): Promise<void> {
  const response = await request(`${apiOrigin}/health/live`);
  if (response.status !== null) fail('media-api-port-in-use');
}

async function startApi(
  apiOrigin: string,
  apiPort: number,
  environment: NodeJS.ProcessEnv,
): Promise<{ child: ApiProcess; output: string[] }> {
  const entrypoint = resolve(process.cwd(), 'apps/api/dist/main.js');
  const output: string[] = [];
  const child = spawn(process.execPath, [entrypoint], {
    cwd: process.cwd(),
    env: environment,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (chunk: Buffer) => {
    if (output.join('').length < 4_000) output.push(chunk.toString());
  });
  child.stderr.on('data', (chunk: Buffer) => {
    if (output.join('').length < 4_000) output.push(chunk.toString());
  });

  try {
    for (let attempt = 0; attempt < API_READY_ATTEMPTS; attempt += 1) {
      if (child.exitCode !== null) {
        fail(`media-api-exited-before-ready-${child.exitCode}`);
      }
      const response = await request(`${apiOrigin}/health/ready`);
      if (
        response.status === 200 &&
        response.body.includes('"status":"ok"') &&
        response.body.includes('"database":"ok"')
      ) {
        return { child, output };
      }
      await new Promise((resolvePromise) => setTimeout(resolvePromise, API_READY_DELAY_MS));
    }
  } catch (error) {
    await stopApi(child);
    throw error;
  }

  void apiPort;
  fail(`media-api-readiness-timeout-${childOutputTail(output) || 'no-output'}`);
}

async function stopApi(child: ApiProcess): Promise<void> {
  if (child.exitCode !== null) return;
  child.kill('SIGTERM');
  if (await waitForExit(child, API_SHUTDOWN_TIMEOUT_MS)) return;
  child.kill('SIGKILL');
  await waitForExit(child, API_SHUTDOWN_TIMEOUT_MS);
}

async function createFixture(
  database: DatabaseClient,
  hashStaffPassword: (password: string) => string,
  encryptTotpSecret: (secret: string) => string,
): Promise<Fixture> {
  const suffix = randomUUID().replaceAll('-', '');
  const fixture: Fixture = {
    email: `live-media-${suffix}@example.invalid`,
    phone: `+9899${suffix.slice(0, 10)}`,
    password: 'Live media validation password 2026',
    productId: `live-media-product-${suffix}`,
    productSlug: `live-media-${suffix}`,
    roleId: `live-media-role-${suffix}`,
    totpSecret: 'JBSWY3DPEHPK3PXP',
    userId: `live-media-user-${suffix}`,
  };

  const [existingRole, existingUser, existingProduct, existingSlug] = await Promise.all([
    database.role.findUnique({ where: { key: 'admin' }, select: { id: true } }),
    database.user.findUnique({ where: { id: fixture.userId }, select: { id: true } }),
    database.product.findUnique({ where: { id: fixture.productId }, select: { id: true } }),
    database.product.findUnique({ where: { slug: fixture.productSlug }, select: { id: true } }),
  ]);
  assertCondition(!existingRole, 'media-database-has-admin-role');
  assertCondition(!existingUser && !existingProduct && !existingSlug, 'media-fixture-id-collision');

  await database.$transaction(async (transaction) => {
    await transaction.role.create({
      data: { id: fixture.roleId, key: 'admin', name: 'Disposable media validation admin' },
    });
    await transaction.user.create({
      data: {
        id: fixture.userId,
        phone: fixture.phone,
        email: fixture.email,
        status: 'ACTIVE',
        staffCredential: {
          create: {
            passwordHash: hashStaffPassword(fixture.password),
            totpSecretEncrypted: encryptTotpSecret(fixture.totpSecret),
          },
        },
      },
    });
    await transaction.userRole.create({
      data: { userId: fixture.userId, roleId: fixture.roleId },
    });
    await transaction.product.create({
      data: {
        id: fixture.productId,
        slug: fixture.productSlug,
        name: 'Disposable media validation product',
        basePriceToman: 1,
        status: 'DRAFT',
      },
    });
  });

  return fixture;
}

async function cleanupFixture(
  database: DatabaseClient,
  fixture: Fixture,
): Promise<CleanupEvidence> {
  await database.auditEvent.deleteMany({ where: { actorUserId: fixture.userId } });
  await database.productMedia.deleteMany({ where: { productId: fixture.productId } });
  await database.product.deleteMany({ where: { id: fixture.productId } });
  await database.user.deleteMany({ where: { id: fixture.userId } });
  await database.role.deleteMany({ where: { id: fixture.roleId, key: 'admin' } });

  const [auditRows, mediaRows, productRows, roleRows, userRows] = await Promise.all([
    database.auditEvent.count({ where: { actorUserId: fixture.userId } }),
    database.productMedia.count({ where: { productId: fixture.productId } }),
    database.product.count({ where: { id: fixture.productId } }),
    database.role.count({ where: { id: fixture.roleId, key: 'admin' } }),
    database.user.count({ where: { id: fixture.userId } }),
  ]);
  assertCondition(
    auditRows === 0 && mediaRows === 0 && productRows === 0 && roleRows === 0 && userRows === 0,
    'media-fixture-residue',
  );
  return { auditRows, mediaRows, productRows, roleRows, userRows };
}

async function main(): Promise<void> {
  assertCondition(process.versions.bun, 'media-harness-requires-bun');

  const databaseUrl = process.env.NOVA_MEDIA_DATABASE_URL?.trim();
  assertCondition(databaseUrl, 'media-database-url-missing');
  const databaseTarget = parseDatabaseTarget(databaseUrl);
  const redisUrl = parseLocalRedisUrl();
  const s3 = parseLocalS3Target();
  const apiPort = parseApiPort();
  const apiOrigin = `http://127.0.0.1:${apiPort}`;
  const environmentNames = [
    'NODE_ENV',
    'API_PORT',
    'WEB_ORIGIN',
    'DATABASE_URL',
    'REDIS_URL',
    'S3_ENDPOINT',
    'S3_REGION',
    'S3_BUCKET',
    'S3_ACCESS_KEY',
    'S3_SECRET_KEY',
    'S3_FORCE_PATH_STYLE',
    'AUTH_SECRET',
    'STAFF_TOTP_ENCRYPTION_KEY',
  ] as const;
  const previousEnvironment = captureEnvironment(environmentNames);

  let database: DatabaseClient | null = null;
  let fixture: Fixture | null = null;
  let api: ApiProcess | null = null;
  let apiOutput: string[] = [];
  let storage: S3CatalogMediaStorage | null = null;
  let plan: UploadPlan | null = null;
  let originalObjectUploaded = false;
  let derivativeObjectUploaded = false;
  let apiDeleteSucceeded = false;
  let primaryFailure: string | null = null;
  let cleanupFailure: string | null = null;
  let disconnectFailure: string | null = null;
  let cleanup: CleanupEvidence | null = null;
  let evidence: Omit<MediaEvidence, 'cleanup'> | null = null;

  try {
    configureHarnessEnvironment(databaseUrl, redisUrl, apiPort, apiOrigin, s3);
    const [{ encryptTotpSecret, generateTotpCode, hashStaffPassword }, { S3CatalogMediaStorage }] =
      await Promise.all([
        import('../../apps/api/src/modules/staff-auth/staff-auth.crypto'),
        import('../../apps/api/src/modules/catalog/catalog-media.storage'),
      ]);
    storage = new S3CatalogMediaStorage({
      endpoint: s3.endpoint,
      region: s3.region,
      bucket: s3.bucket,
      accessKeyId: s3.accessKey,
      secretAccessKey: s3.secretKey,
      forcePathStyle: true,
    });
    database = new DatabaseClient({ connectionString: databaseUrl });
    await database.$connect();
    fixture = await createFixture(database, hashStaffPassword, encryptTotpSecret);

    await assertApiPortAvailable(apiOrigin);
    const started = await startApi(apiOrigin, apiPort, childEnvironment());
    api = started.child;
    apiOutput = started.output;

    const csrfResponse = await request(`${apiOrigin}/v1/staff/auth/csrf`);
    expectStatus(csrfResponse, 200, 'media-staff-csrf-failed');
    const csrfToken = setCookieValue(csrfResponse.headers, CSRF_COOKIE_NAME);

    const totpCode = generateTotpCode(fixture.totpSecret, Math.floor(Date.now() / 1_000));
    const loginResponse = await request(`${apiOrigin}/v1/staff/auth/login`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `${CSRF_COOKIE_NAME}=${csrfToken}`,
        origin: apiOrigin,
        'x-csrf-token': csrfToken,
      },
      body: JSON.stringify({ email: fixture.email, password: fixture.password, factor: totpCode }),
    });
    expectStatus(loginResponse, 201, 'media-staff-login-failed');
    const staffToken = setCookieValue(loginResponse.headers, STAFF_COOKIE_NAME);
    const cookies = cookieHeader(csrfToken, staffToken);
    const loginBody = parseObject(loginResponse.body, 'media-login-envelope-invalid');
    const loginData = objectRecord(loginBody, 'data', 'media-login-data-missing');
    assertCondition(
      loginData.email === fixture.email &&
        Array.isArray(loginData.roles) &&
        loginData.roles.includes('admin'),
      'media-login-user-invalid',
    );

    const meResponse = await request(`${apiOrigin}/v1/staff/auth/me`, {
      headers: { cookie: cookies },
    });
    expectStatus(meResponse, 200, 'media-staff-session-failed');
    const meBody = parseObject(meResponse.body, 'media-me-envelope-invalid');
    const meData = objectRecord(meBody, 'data', 'media-me-data-missing');
    assertCondition(meData.id === fixture.userId, 'media-me-user-invalid');

    const mediaInput = { contentType: 'image/webp', sizeBytes: 32, width: 4, height: 4 };
    const presignResponse = await request(
      `${apiOrigin}/v1/admin/catalog/products/${fixture.productId}/media/presign`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          cookie: cookies,
          origin: apiOrigin,
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify(mediaInput),
      },
    );
    expectStatus(presignResponse, 201, 'media-presign-failed');
    const presignBody = parseObject(presignResponse.body, 'media-presign-envelope-invalid');
    const presignData = objectRecord(presignBody, 'data', 'media-presign-data-missing');
    const original = objectRecord(presignData, 'original', 'media-presign-original-missing');
    const derivative = objectRecord(presignData, 'derivative', 'media-presign-derivative-missing');
    const assetId = String(objectValue(presignData, 'assetId', 'media-presign-asset-missing'));
    const originalKey = String(objectValue(original, 'key', 'media-presign-original-key-missing'));
    const originalUrl = String(objectValue(original, 'url', 'media-presign-original-url-missing'));
    const derivativeKey = String(
      objectValue(derivative, 'key', 'media-presign-derivative-key-missing'),
    );
    const derivativeUrl = String(
      objectValue(derivative, 'url', 'media-presign-derivative-url-missing'),
    );
    const originalHeaders = objectValue(
      original,
      'headers',
      'media-presign-original-headers-missing',
    );
    const derivativeHeaders = objectValue(
      derivative,
      'headers',
      'media-presign-derivative-headers-missing',
    );
    assertCondition(
      typeof originalHeaders === 'object' && originalHeaders !== null,
      'media-original-headers-invalid',
    );
    assertCondition(
      typeof derivativeHeaders === 'object' && derivativeHeaders !== null,
      'media-derivative-headers-invalid',
    );
    assertOwnedObjectKey(originalKey, fixture.productId, assetId, 'original');
    assertOwnedObjectKey(derivativeKey, fixture.productId, assetId, 'derivative');
    plan = {
      assetId,
      original: {
        headers: originalHeaders as Record<string, string>,
        key: originalKey,
        url: originalUrl,
      },
      derivative: {
        headers: derivativeHeaders as Record<string, string>,
        key: derivativeKey,
        url: derivativeUrl,
      },
    };

    const originalBody = new Uint8Array(32).fill(0x5a);
    const derivativeBody = new Uint8Array(16).fill(0x2a);
    const originalPutResponse = await request(plan.original.url, {
      method: 'PUT',
      headers: plan.original.headers,
      body: originalBody,
    });
    expectStatus(originalPutResponse, 200, 'media-original-put-failed');
    originalObjectUploaded = true;
    const derivativePutResponse = await request(plan.derivative.url, {
      method: 'PUT',
      headers: plan.derivative.headers,
      body: derivativeBody,
    });
    expectStatus(derivativePutResponse, 200, 'media-derivative-put-failed');
    derivativeObjectUploaded = true;

    const completeResponse = await request(
      `${apiOrigin}/v1/admin/catalog/products/${fixture.productId}/media/complete`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          cookie: cookies,
          origin: apiOrigin,
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({
          ...mediaInput,
          assetId: plan.assetId,
          altText: 'Disposable media validation image',
          kind: 'PRODUCT',
          sortOrder: 0,
        }),
      },
    );
    expectStatus(completeResponse, 201, 'media-complete-failed');
    const completeBody = parseObject(completeResponse.body, 'media-complete-envelope-invalid');
    const completeData = objectRecord(completeBody, 'data', 'media-complete-data-missing');
    const mediaId = String(objectValue(completeData, 'id', 'media-id-missing'));
    assertCondition(
      completeData.productId === fixture.productId &&
        completeData.url === `/v1/catalog/media/${mediaId}`,
      'media-complete-response-invalid',
    );
    assertCondition(mediaId !== plan.assetId, 'media-db-id-must-differ-from-asset-id');

    const persisted = await database.productMedia.findMany({
      where: { productId: fixture.productId },
      select: {
        id: true,
        storageStatus: true,
        originalKey: true,
        derivativeKey: true,
        contentType: true,
        sizeBytes: true,
      },
    });
    assertCondition(
      persisted.length === 1 &&
        persisted[0]?.id === mediaId &&
        persisted[0].storageStatus === 'READY' &&
        persisted[0].originalKey === plan.original.key &&
        persisted[0].derivativeKey === plan.derivative.key &&
        persisted[0].contentType === 'image/webp' &&
        persisted[0].sizeBytes === 32,
      'media-persistence-invalid',
    );

    const redirectResponse = await request(`${apiOrigin}/v1/catalog/media/${mediaId}`, {
      redirect: 'manual',
    });
    expectStatus(redirectResponse, 302, 'media-derivative-redirect-failed');
    const redirectUrl = redirectResponse.headers.get('location');
    assertCondition(redirectUrl, 'media-derivative-redirect-location-missing');
    const parsedRedirect = new URL(redirectUrl);
    assertCondition(
      parsedRedirect.origin === new URL(s3.endpoint).origin,
      'media-redirect-origin-invalid',
    );
    assertCondition(
      parsedRedirect.searchParams.has('X-Amz-Signature'),
      'media-redirect-not-signed',
    );
    const derivativeGetResponse = await binaryRequest(redirectUrl);
    expectStatus(derivativeGetResponse, 200, 'media-derivative-get-failed');
    assertCondition(derivativeGetResponse.body === '16', 'media-derivative-body-invalid');

    const sourceDerivativeReadUrl = await storage.createDerivativeReadUrl({
      mediaId: plan.assetId,
      productId: fixture.productId,
      derivativeKey: plan.derivative.key,
    });
    const deleteResponse = await request(
      `${apiOrigin}/v1/admin/catalog/products/${fixture.productId}/media/${mediaId}`,
      {
        method: 'DELETE',
        headers: {
          cookie: cookies,
          origin: apiOrigin,
          'x-csrf-token': csrfToken,
        },
      },
    );
    expectStatus(deleteResponse, 200, 'media-delete-quarantine-failed');
    const deleteBody = parseObject(deleteResponse.body, 'media-delete-envelope-invalid');
    const deleteData = objectRecord(deleteBody, 'data', 'media-delete-data-missing');
    assertCondition(deleteData.deleted === true, 'media-delete-response-invalid');
    apiDeleteSucceeded = true;

    const afterDelete = await database.productMedia.findUnique({
      where: { id: mediaId },
      select: { id: true },
    });
    assertCondition(afterDelete === null, 'media-row-remains-after-delete');
    const sourceDerivativeResponse = await request(sourceDerivativeReadUrl, { redirect: 'manual' });
    expectStatus(sourceDerivativeResponse, 404, 'media-source-derivative-remains');
    const afterRoute = await request(`${apiOrigin}/v1/catalog/media/${mediaId}`);
    expectStatus(afterRoute, 404, 'media-route-remains-after-delete');

    evidence = {
      api: { binding: 'loopback', port: apiPort },
      databaseTarget,
      delete: {
        databaseRowRemoved: true,
        sourceDerivativeStatus: sourceDerivativeResponse.status ?? -1,
        status: deleteResponse.status ?? -1,
      },
      login: {
        csrfStatus: csrfResponse.status ?? -1,
        loginStatus: loginResponse.status ?? -1,
        meStatus: meResponse.status ?? -1,
      },
      media: {
        completeStatus: completeResponse.status ?? -1,
        derivativeGetStatus: derivativeGetResponse.status ?? -1,
        persistedStatus: 'READY',
        presignStatus: presignResponse.status ?? -1,
        productId: 'synthetic disposable product',
      },
      storage: {
        derivativePutStatus: derivativePutResponse.status ?? -1,
        originalPutStatus: originalPutResponse.status ?? -1,
        quarantineRouteStatus: deleteResponse.status ?? -1,
      },
    };
  } catch (error) {
    primaryFailure = failureCode(error, 'media-primary-operation-failed');
  } finally {
    if (api) {
      try {
        await stopApi(api);
      } catch (error) {
        cleanupFailure = `media-api-shutdown-${errorText(error)}`;
      }
    }

    if (
      storage &&
      plan &&
      !apiDeleteSucceeded &&
      (originalObjectUploaded || derivativeObjectUploaded)
    ) {
      try {
        await storage.quarantine({
          mediaId: plan.assetId,
          productId: fixture?.productId ?? 'unknown',
          originalKey: plan.original.key,
          derivativeKey: plan.derivative.key,
        });
      } catch {
        cleanupFailure = cleanupFailure ?? 'media-object-cleanup-failed';
      }
    }

    if (database && fixture) {
      try {
        cleanup = await cleanupFixture(database, fixture);
      } catch (error) {
        cleanupFailure = cleanupFailure ?? `media-database-cleanup-${errorText(error)}`;
      }
    }

    if (database) {
      try {
        await database.$disconnect();
      } catch {
        disconnectFailure = 'media-database-disconnect-failed';
      }
    }
    restoreEnvironment(previousEnvironment);
  }

  if (primaryFailure || cleanupFailure || disconnectFailure || !evidence || !cleanup) {
    const details = [
      primaryFailure ? `primary=${primaryFailure}` : null,
      cleanupFailure ? `cleanup=${cleanupFailure}` : null,
      disconnectFailure ? `disconnect=${disconnectFailure}` : null,
      !evidence ? 'evidence=missing' : null,
      !cleanup ? 'cleanup-evidence=missing' : null,
      apiOutput.length && primaryFailure?.startsWith('media-api-')
        ? `api-output=${childOutputTail(apiOutput)}`
        : null,
    ].filter((detail): detail is string => detail !== null);
    fail(details.join(';'));
  }

  console.log(JSON.stringify({ ...evidence, cleanup } satisfies MediaEvidence));
}

await main().catch((error: unknown) => {
  console.error(`[FAIL] live media: ${failureCode(error, 'media-harness-failed')}`);
  process.exitCode = 1;
});
