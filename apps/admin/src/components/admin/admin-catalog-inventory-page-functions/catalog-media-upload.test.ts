import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { catalogMediaContentType, validateCatalogMediaFile } from './catalog-media-upload';

function file(type: string, size: number): File {
  return { type, size } as File;
}

describe('catalog media upload validation', () => {
  test('accepts supported image types within the storage limit', () => {
    const selected = file('image/webp', 1024);
    assert.deepEqual(validateCatalogMediaFile(selected), []);
    assert.equal(catalogMediaContentType(selected), 'image/webp');
  });

  test('rejects unsupported types, empty files, and oversized files', () => {
    assert.equal(validateCatalogMediaFile(file('application/pdf', 1024)).length, 1);
    assert.equal(validateCatalogMediaFile(file('image/png', 0)).length, 1);
    assert.equal(validateCatalogMediaFile(file('image/png', 15 * 1024 * 1024 + 1)).length, 1);
    assert.equal(validateCatalogMediaFile(null).length, 1);
  });
});
