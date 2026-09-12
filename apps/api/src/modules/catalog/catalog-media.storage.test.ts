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
