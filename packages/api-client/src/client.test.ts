import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ApiClient, ApiClientError, CSRF_HEADER_NAME } from './client';

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

test('API client binds the default fetcher to the browser global', async () => {
  const previousFetch = globalThis.fetch;
  const strictFetch = function (this: unknown): Promise<Response> {
    if (this !== globalThis) {
      throw new TypeError('fetch called without the browser global receiver');
    }
    return Promise.resolve(
      new Response(JSON.stringify({ data: { ok: true } }), {
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  } as typeof fetch;

  Object.defineProperty(globalThis, 'fetch', {
    configurable: true,
    value: strictFetch,
  });

  try {
    const client = new ApiClient({ baseUrl: 'http://localhost:5173' });
    await assert.doesNotReject(() => client.get('/v1/example'));
  } finally {
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: previousFetch,
    });
  }
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

test('API client supports JSON mutations with credentials and method-specific helpers', async () => {
  const requests: Array<{ method: string | undefined; body: string | undefined }> = [];
  const client = new ApiClient({
    fetcher: async (_input, init) => {
      requests.push({
        method: init?.method,
        body: typeof init?.body === 'string' ? init.body : undefined,
      });
      return new Response(JSON.stringify({ data: { ok: true } }), {
        headers: { 'Content-Type': 'application/json' },
      });
    },
  });

  await client.post('/v1/cart/items', { variantId: 'variant-1', quantity: 1 });
  await client.patch('/v1/cart/items/variant-1', { quantity: 2 });
  await client.put('/v1/admin/catalog/products/product-1/categories', { categoryIds: [] });
  await client.delete('/v1/cart/items/variant-1');

  assert.deepEqual(requests, [
    { method: 'POST', body: '{"variantId":"variant-1","quantity":1}' },
    { method: 'PATCH', body: '{"quantity":2}' },
    { method: 'PUT', body: '{"categoryIds":[]}' },
    { method: 'DELETE', body: undefined },
  ]);
});

test('API client mirrors the browser CSRF cookie into mutation headers', async () => {
  type BrowserGlobal = typeof globalThis & { document?: { cookie: string } };
  const browserGlobal = globalThis as BrowserGlobal;
  const hadDocument = 'document' in browserGlobal;
  const previousDocument = browserGlobal.document;
  const token = 'a'.repeat(43);
  let requestInit: RequestInit | undefined;

  Object.defineProperty(browserGlobal, 'document', {
    configurable: true,
    value: { cookie: `nova_csrf=${token}` },
  });

  try {
    const client = new ApiClient({
      fetcher: async (_input, init) => {
        requestInit = init;
        return new Response(JSON.stringify({ data: { ok: true } }), {
          headers: { 'Content-Type': 'application/json' },
        });
      },
    });

    await client.post('/v1/cart/items', { variantId: 'variant-1', quantity: 1 });
    assert.equal(new Headers(requestInit?.headers).get(CSRF_HEADER_NAME), token);
  } finally {
    if (hadDocument) {
      Object.defineProperty(browserGlobal, 'document', {
        configurable: true,
        value: previousDocument,
      });
    } else {
      Reflect.deleteProperty(browserGlobal, 'document');
    }
  }
});
