import assert from 'node:assert/strict';
import { test } from 'node:test';

import { endpointUrl, parseE2eEndpoint } from './run';

test('keeps E2E endpoint logs at the safe origin boundary', () => {
  const endpoint = parseE2eEndpoint(
    'NOVA_E2E_WEB_URL',
    'https://store.example:8443/store/',
    'http://127.0.0.1:5173',
  );

  assert.equal(endpoint.safeOrigin, 'https://store.example:8443');
  assert.equal(endpointUrl(endpoint, '/'), 'https://store.example:8443/');
});

test('rejects E2E URL credentials, queries, and fragments without echoing them', () => {
  const unsafeValue = 'https://user:secret@example.test:8443/?token=private#account';

  assert.throws(
    () => parseE2eEndpoint('NOVA_E2E_API_URL', unsafeValue, 'http://127.0.0.1:4000'),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /NOVA_E2E_API_URL/);
      assert.doesNotMatch(error.message, /user|secret|private|example\.test/);
      return true;
    },
  );
});
