import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';

import { environment } from '@nova/config';

import {
  S3CatalogMediaStorage,
  createCatalogMediaStorage,
  type CatalogMediaUploadInput,
  type CatalogMediaUploadPlan,
} from './catalog-media.storage';

const liveS3Enabled = process.env.NOVA_RUN_S3_INTEGRATION === '1';

function assertLoopbackS3Configuration(): void {
  const endpoint = new URL(environment.S3_ENDPOINT);
  assert.equal(endpoint.protocol, 'http:', 'live S3 integration must use HTTP locally');
  assert.ok(
    ['127.0.0.1', 'localhost', '[::1]'].includes(endpoint.hostname),
    'live S3 integration must target a loopback MinIO endpoint',
  );
  assert.equal(environment.S3_FORCE_PATH_STYLE, true);
}

async function putObject(
  target: CatalogMediaUploadPlan['original'] | CatalogMediaUploadPlan['derivative'],
  body: ArrayBuffer,
): Promise<void> {
  const response = await fetch(target.url, {
    method: 'PUT',
    headers: target.headers,
    body,
  });
  assert.equal(response.status, 200, `MinIO presigned PUT failed with ${response.status}`);
}

const testLiveMinio = async (): Promise<void> => {
  assertLoopbackS3Configuration();

  const storage = createCatalogMediaStorage();
  assert.ok(storage instanceof S3CatalogMediaStorage);

  const input: CatalogMediaUploadInput = {
    assetId: `s3-it-${randomUUID().replaceAll('-', '')}`,
    productId: 's3-integration',
    contentType: 'image/webp',
    sizeBytes: 1024,
    width: 64,
    height: 64,
  };
  const plan = await storage.createUpload(input);
  let originalObjectUploaded = false;
  let bothObjectsUploaded = false;
  let cleanupError: unknown;

  try {
    const originalBody = new ArrayBuffer(input.sizeBytes);
    new Uint8Array(originalBody).fill(0x5a);
    const derivativeBody = new ArrayBuffer(16);
    new Uint8Array(derivativeBody).fill(0x2a);
    await putObject(plan.original, originalBody);
    originalObjectUploaded = true;
    await putObject(plan.derivative, derivativeBody);
    bothObjectsUploaded = true;

    const completed = await storage.completeUpload(input);

    assert.deepEqual(completed, {
      originalKey: plan.original.key,
      derivativeKey: plan.derivative.key,
      contentType: input.contentType,
      sizeBytes: input.sizeBytes,
    });
  } finally {
    if (originalObjectUploaded) {
      try {
        await storage.quarantine({
          mediaId: input.assetId,
          productId: input.productId,
          originalKey: plan.original.key,
          derivativeKey: plan.derivative.key,
        });
      } catch (error) {
        if (bothObjectsUploaded) cleanupError = error;
      }
    }
  }

  if (cleanupError !== undefined) throw cleanupError;
};

if (liveS3Enabled) {
  test('round-trips real MinIO presigned PUTs through completeUpload', testLiveMinio);
} else {
  test.skip('round-trips real MinIO presigned PUTs through completeUpload', testLiveMinio);
}
