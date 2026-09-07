import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseEnvironment } from './env';

test('environment validation supplies safe local defaults', () => {
  const environment = parseEnvironment({});

  assert.equal(environment.NODE_ENV, 'development');
  assert.equal(environment.API_PORT, 4000);
  assert.equal(environment.DATABASE_URL, 'postgresql://nova:nova_local_only@localhost:5432/nova?schema=public');
});

test('environment validation coerces a valid port and preserves URLs', () => {
  const environment = parseEnvironment({
    NODE_ENV: 'staging',
    API_PORT: '4310',
    WEB_ORIGIN: 'https://store.example.ir',
    DATABASE_URL: 'postgresql://user:pass@db.example.ir:5432/nova',
    REDIS_URL: 'redis://cache.example.ir:6379',
  });

  assert.equal(environment.NODE_ENV, 'staging');
  assert.equal(environment.API_PORT, 4310);
  assert.equal(environment.WEB_ORIGIN, 'https://store.example.ir');
});

test('environment validation rejects an invalid port', () => {
  assert.throws(() => parseEnvironment({ API_PORT: 'not-a-port' }));
});
