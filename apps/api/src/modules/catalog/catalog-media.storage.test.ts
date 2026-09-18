import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  CATALOG_MEDIA_MAX_BYTES,
  CatalogMediaStorageError,
  S3CatalogMediaStorage,
  catalogMediaObjectKeys,
} from './catalog-media.storage';

const input = {
  assetId: 'asset-1',
  productId: 'product-1',
  contentType: 'image/webp' as const,
  sizeBytes: 240_000,
  width: 1200,
  height: 1600,
};

function storage(fetch?: typeof globalThis.fetch) {
  return new S3CatalogMediaStorage(
    {
      endpoint: 'http://127.0.0.1:59000',
      region: 'us-east-1',
      bucket: 'nova-media-test',
      accessKeyId: 'test-access-key',
      secretAccessKey: 'test-secret-key',
      forcePathStyle: true,
    },
    { fetch, now: () => new Date('2026-09-12T10:20:30.000Z') },
  );
}

test('builds owned original and derivative keys without contacting object storage', async () => {
  const keys = catalogMediaObjectKeys(input);
  assert.deepEqual(keys, {
    originalKey: 'catalog/products/product-1/asset-1/original.webp',
    derivativeKey: 'catalog/products/product-1/asset-1/derivative.webp',
  });

  const plan = await storage().createUpload(input);
  assert.match(plan.original.url, /X-Amz-Signature=/);
  assert.match(plan.derivative.url, /X-Amz-Signature=/);
  assert.equal(plan.original.headers['x-amz-meta-media-role'], 'original');
  assert.equal(plan.derivative.headers['x-amz-meta-media-role'], 'derivative');
  assert.equal(plan.multipartExpiresHours, 24);
});

test('rejects unsafe keys and invalid sizes before signing', () => {
  assert.throws(
    () => catalogMediaObjectKeys({ ...input, productId: '../other' }),
    (error: unknown) =>
      error instanceof CatalogMediaStorageError && error.code === 'MEDIA_KEY_INVALID',
  );
  assert.throws(
    () => catalogMediaObjectKeys({ ...input, sizeBytes: CATALOG_MEDIA_MAX_BYTES + 1 }),
    (error: unknown) =>
      error instanceof CatalogMediaStorageError && error.code === 'MEDIA_SIZE_INVALID',
  );
  assert.throws(
    () => catalogMediaObjectKeys({ ...input, productId: 'product-1\n' }),
    (error: unknown) =>
      error instanceof CatalogMediaStorageError && error.code === 'MEDIA_KEY_INVALID',
  );
});

test('uses bytewise canonical query ordering for S3-compatible signatures', async () => {
  const url = await storage().createDerivativeReadUrl({
    mediaId: 'media-1',
    productId: 'product-1',
    derivativeKey: 'catalog/products/product-1/media-1/derivative.webp',
  });

  assert.deepEqual(
    [...new URL(url).searchParams.keys()],
    [
      'X-Amz-Algorithm',
      'X-Amz-Credential',
      'X-Amz-Date',
      'X-Amz-Expires',
      'X-Amz-Signature',
      'X-Amz-SignedHeaders',
      'response-cache-control',
    ],
  );
});

test('does not sign a derivative read URL for a different owned object', async () => {
  await assert.rejects(
    storage().createDerivativeReadUrl({
      mediaId: 'media-1',
      productId: 'product-1',
      derivativeKey: 'catalog/products/product-1/media-1/original.webp',
    }),
    (error: unknown) =>
      error instanceof CatalogMediaStorageError && error.code === 'MEDIA_KEY_INVALID',
  );
});

test('completes only when original and derivative metadata match the request', async () => {
  const calls: string[] = [];
  const fakeFetch: typeof fetch = async (url) => {
    calls.push(String(url));
    const derivative = String(url).includes('/derivative.webp');
    return new Response(null, {
      status: 200,
      headers: {
        'content-type': 'image/webp',
        'content-length': derivative ? '12' : String(input.sizeBytes),
        'x-amz-meta-media-content-type': 'image/webp',
        'x-amz-meta-media-width': '1200',
        'x-amz-meta-media-height': '1600',
        'x-amz-meta-media-size': String(input.sizeBytes),
        'x-amz-meta-media-role': derivative ? 'derivative' : 'original',
      },
    });
  };

  const completed = await storage(fakeFetch).completeUpload(input);
  assert.equal(completed.derivativeKey, 'catalog/products/product-1/asset-1/derivative.webp');
  assert.equal(calls.length, 2);
});

test('round-trips synthetic presigned PUTs before completing the upload', async () => {
  const objects = new Map<
    string,
    { contentType: string; sizeBytes: number; metadata: Record<string, string> }
  >();
  const fakeFetch: typeof fetch = async (url, init) => {
    const requestUrl = new URL(String(url));
    const method = init?.method?.toUpperCase() ?? 'GET';
    const objectKey = requestUrl.pathname.replace(/^\/nova-media-test\//, '');
    const headers = new Headers(init?.headers);

    if (method === 'PUT') {
      assert.equal(requestUrl.searchParams.get('X-Amz-Signature')?.length, 64);
      const body = init?.body;
      const sizeBytes = body instanceof Uint8Array ? body.byteLength : 0;
      const metadata: Record<string, string> = {};
      headers.forEach((value, name) => {
        if (name.startsWith('x-amz-meta-')) {
          metadata[name.slice('x-amz-meta-'.length)] = value;
        }
      });
      objects.set(objectKey, {
        contentType: headers.get('content-type') ?? '',
        sizeBytes,
        metadata,
      });
      return new Response(null, { status: 200 });
    }

    if (method === 'HEAD') {
      assert.match(headers.get('authorization') ?? '', /Signature=[a-f0-9]{64}$/);
      const object = objects.get(objectKey);
      if (!object) return new Response(null, { status: 404 });
      return new Response(null, {
        status: 200,
        headers: {
          'content-type': object.contentType,
          'content-length': String(object.sizeBytes),
          ...Object.fromEntries(
            Object.entries(object.metadata).map(([name, value]) => [`x-amz-meta-${name}`, value]),
          ),
        },
      });
    }

    throw new Error(`Unexpected synthetic object-store method: ${method}`);
  };

  const storageClient = storage(fakeFetch);
  const plan = await storageClient.createUpload(input);
  const originalPut = await fakeFetch(plan.original.url, {
    method: 'PUT',
    headers: plan.original.headers,
    body: new Uint8Array(input.sizeBytes),
  });
  const derivativePut = await fakeFetch(plan.derivative.url, {
    method: 'PUT',
    headers: plan.derivative.headers,
    body: new Uint8Array(12),
  });

  assert.equal(originalPut.status, 200);
  assert.equal(derivativePut.status, 200);
  assert.equal(objects.size, 2);

  const completed = await storageClient.completeUpload(input);

  assert.deepEqual(completed, {
    originalKey: 'catalog/products/product-1/asset-1/original.webp',
    derivativeKey: 'catalog/products/product-1/asset-1/derivative.webp',
    contentType: 'image/webp',
    sizeBytes: input.sizeBytes,
  });
});

test('quarantines each owned object by signed copy before deleting its source', async () => {
  const calls: Array<{ method: string; url: URL; headers: Headers }> = [];
  const fakeFetch: typeof fetch = async (url, init) => {
    calls.push({
      method: init?.method ?? 'GET',
      url: new URL(String(url)),
      headers: new Headers(init?.headers),
    });
    return new Response(null, { status: 200 });
  };

  await storage(fakeFetch).quarantine({
    mediaId: 'asset-1',
    productId: 'product-1',
    originalKey: 'catalog/products/product-1/asset-1/original.webp',
    derivativeKey: 'catalog/products/product-1/asset-1/derivative.webp',
  });

  assert.deepEqual(
    calls.map(({ method }) => method),
    ['PUT', 'DELETE', 'PUT', 'DELETE'],
  );
  assert.match(
    calls[0]?.url.pathname ?? '',
    /^\/nova-media-test\/catalog\/quarantine\/product-1\/asset-1\/\d+\/original\.webp$/,
  );
  assert.equal(
    calls[1]?.url.pathname,
    '/nova-media-test/catalog/products/product-1/asset-1/original.webp',
  );
  assert.match(
    calls[2]?.url.pathname ?? '',
    /^\/nova-media-test\/catalog\/quarantine\/product-1\/asset-1\/\d+\/derivative\.webp$/,
  );
  assert.equal(
    calls[3]?.url.pathname,
    '/nova-media-test/catalog/products/product-1/asset-1/derivative.webp',
  );
  assert.equal(
    calls[0]?.headers.get('x-amz-copy-source'),
    '/nova-media-test/catalog/products/product-1/asset-1/original.webp',
  );
  assert.match(calls[0]?.headers.get('authorization') ?? '', /Signature=[a-f0-9]{64}$/);
  assert.equal(calls[1]?.headers.has('x-amz-copy-source'), false);
  assert.match(calls[1]?.headers.get('authorization') ?? '', /Signature=[a-f0-9]{64}$/);
  assert.equal(
    calls[2]?.headers.get('x-amz-copy-source'),
    '/nova-media-test/catalog/products/product-1/asset-1/derivative.webp',
  );
});

test('rejects quarantine when the interface id differs from the asset encoded by owned keys', async () => {
  const calls: string[] = [];
  const fakeFetch: typeof fetch = async (_url, init) => {
    calls.push(init?.method ?? 'GET');
    return new Response(null, { status: 200 });
  };

  await assert.rejects(
    storage(fakeFetch).quarantine({
      mediaId: 'database-media-1',
      productId: 'product-1',
      originalKey: 'catalog/products/product-1/asset-1/original.webp',
      derivativeKey: 'catalog/products/product-1/asset-1/derivative.webp',
    }),
    (error: unknown) =>
      error instanceof CatalogMediaStorageError && error.code === 'MEDIA_KEY_INVALID',
  );
  assert.deepEqual(calls, []);
});

test('does not delete a source when its quarantine copy fails', async () => {
  const calls: string[] = [];
  const fakeFetch: typeof fetch = async (_url, init) => {
    calls.push(init?.method ?? 'GET');
    return new Response(null, { status: 503 });
  };

  await assert.rejects(
    storage(fakeFetch).quarantine({
      mediaId: 'asset-1',
      productId: 'product-1',
      originalKey: 'catalog/products/product-1/asset-1/original.webp',
      derivativeKey: 'catalog/products/product-1/asset-1/derivative.webp',
    }),
    (error: unknown) =>
      error instanceof CatalogMediaStorageError && error.code === 'MEDIA_QUARANTINE_FAILED',
  );
  assert.deepEqual(calls, ['PUT']);
});

test('retries quarantine safely when one source object is already absent', async () => {
  const calls: string[] = [];
  const fakeFetch: typeof fetch = async (url, init) => {
    const requestUrl = new URL(String(url));
    const method = init?.method ?? 'GET';
    const objectKey = requestUrl.pathname.replace(/^\/nova-media-test\//, '');
    const copySource = new Headers(init?.headers).get('x-amz-copy-source') ?? '';
    calls.push(`${method} ${objectKey}`);
    if (method === 'PUT' && copySource.endsWith('/derivative.webp')) {
      return new Response(null, { status: 404 });
    }
    return new Response(null, { status: 200 });
  };

  await storage(fakeFetch).quarantine({
    mediaId: 'asset-1',
    productId: 'product-1',
    originalKey: 'catalog/products/product-1/asset-1/original.webp',
    derivativeKey: 'catalog/products/product-1/asset-1/derivative.webp',
  });

  assert.match(calls[0] ?? '', /^PUT catalog\/quarantine\/product-1\/asset-1\/\d+\/original\.webp$/);
  assert.equal(calls[1], 'DELETE catalog/products/product-1/asset-1/original.webp');
  assert.match(calls[2] ?? '', /^PUT catalog\/quarantine\/product-1\/asset-1\/\d+\/derivative\.webp$/);
  assert.equal(calls.length, 3);
});
