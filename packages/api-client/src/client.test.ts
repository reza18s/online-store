import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ApiClient, ApiClientError } from './client';

test('API client sends JSON-aware requests and returns typed responses', async () => {
  let requestedUrl = '';
  let requestedCredentials: RequestCredentials | undefined;

  const client = new ApiClient({
    baseUrl: 'http://localhost:4000/',
    fetcher: async (input, init) => {
      requestedUrl = String(input);
      requestedCredentials = init?.credentials;
      return new Response(JSON.stringify({ data: { ok: true } }), {
        headers: { 'Content-Type': 'application/json' },
      });
    },
  });

  const result = await client.get<{ data: { ok: boolean } }>('/v1/example');

  assert.deepEqual(result, { data: { ok: true } });
  assert.equal(requestedUrl, 'http://localhost:4000/v1/example');
  assert.equal(requestedCredentials, 'include');
});

test('API client exposes the server error envelope for failed requests', async () => {
  const client = new ApiClient({
    fetcher: async () =>
      new Response(
        JSON.stringify({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'اطلاعات واردشده معتبر نیست.',
            statusCode: 422,
            requestId: 'request-1',
            timestamp: '2026-09-06T00:00:00.000Z',
          },
        }),
        { status: 422, headers: { 'Content-Type': 'application/json' } },
      ),
  });

  await assert.rejects(
    () => client.get('/v1/example'),
    (error: unknown) => {
      assert.ok(error instanceof ApiClientError);
      assert.equal(error.status, 422);
      assert.equal(error.payload?.error.code, 'VALIDATION_ERROR');
      return true;
    },
  );
});
