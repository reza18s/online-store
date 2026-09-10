import assert from 'node:assert/strict';
import { ConflictException, type ArgumentsHost } from '@nestjs/common';
import { test } from 'node:test';

import { ApiExceptionFilter } from './api-exception.filter';

class FakeResponse {
  public statusCode = 200;
  public body: unknown;

  public status(code: number): { json: (body: unknown) => void } {
    this.statusCode = code;
    return { json: (body: unknown) => (this.body = body) };
  }

  public setHeader(): void {}
}

test('preserves bounded structured details in the API error envelope', () => {
  const response = new FakeResponse();
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({ requestId: 'request-1' }),
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;

  new ApiExceptionFilter().catch(
    new ConflictException({
      code: 'CART_MERGE_CONFLICT',
      message: 'بخشی از سبد خرید قابل ادغام نیست.',
      details: { conflicts: [{ variantId: 'variant-1', reason: 'STOCK_LIMIT' }] },
    }),
    host,
  );

  assert.equal(response.statusCode, 409);
  assert.deepEqual(response.body, {
    error: {
      code: 'CART_MERGE_CONFLICT',
      message: 'بخشی از سبد خرید قابل ادغام نیست.',
      statusCode: 409,
      requestId: 'request-1',
      timestamp: (response.body as { error: { timestamp: string } }).error.timestamp,
      details: { conflicts: [{ variantId: 'variant-1', reason: 'STOCK_LIMIT' }] },
    },
  });
  assert.match(
    (response.body as { error: { timestamp: string } }).error.timestamp,
    /^\d{4}-\d{2}-\d{2}T/,
  );
});
