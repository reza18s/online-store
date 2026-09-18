import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseEnvironment } from './env';

test('environment validation supplies safe local defaults', () => {
  const environment = parseEnvironment({});

  assert.equal(environment.NODE_ENV, 'development');
  assert.equal(environment.API_PORT, 4000);
  assert.equal(environment.WEB_ORIGIN, 'http://127.0.0.1:5173');
  assert.equal(
    environment.DATABASE_URL,
    'postgresql://nova:nova_local_only@localhost:5432/nova?schema=public',
  );
  assert.equal(environment.S3_ENDPOINT, 'http://127.0.0.1:59000');
  assert.equal(environment.S3_FORCE_PATH_STYLE, true);
  assert.equal(environment.ZARINPAL_SANDBOX, true);
  assert.equal(environment.SMS_IR_SANDBOX, true);
  assert.equal(environment.IRAN_POST_SANDBOX, true);
  assert.equal(environment.LOCAL_TEST_MODE, false);
});

test('environment validation accepts the explicit local fixture mode only for development/test', () => {
  assert.equal(parseEnvironment({ LOCAL_TEST_MODE: 'true' }).LOCAL_TEST_MODE, true);
  assert.equal(
    parseEnvironment({ NODE_ENV: 'test', LOCAL_TEST_MODE: 'true' }).LOCAL_TEST_MODE,
    true,
  );
  assert.throws(() => parseEnvironment({ NODE_ENV: 'staging', LOCAL_TEST_MODE: 'true' }));
  assert.throws(() => parseEnvironment({ NODE_ENV: 'production', LOCAL_TEST_MODE: 'true' }));
});

test('environment validation coerces a valid port and preserves URLs', () => {
  const environment = parseEnvironment({
    NODE_ENV: 'staging',
    API_PORT: '4310',
    WEB_ORIGIN: 'https://store.example.ir',
    DATABASE_URL: 'postgresql://user:pass@db.example.ir:5432/nova',
    REDIS_URL: 'redis://cache.example.ir:6379',
    S3_FORCE_PATH_STYLE: 'false',
    ZARINPAL_SANDBOX: 'false',
    SMS_IR_SANDBOX: 'false',
    SMS_IR_TEMPLATE_ID: '12345',
    IRAN_POST_SANDBOX: 'false',
  });

  assert.equal(environment.NODE_ENV, 'staging');
  assert.equal(environment.API_PORT, 4310);
  assert.equal(environment.WEB_ORIGIN, 'https://store.example.ir');
  assert.equal(environment.S3_FORCE_PATH_STYLE, false);
  assert.equal(environment.ZARINPAL_SANDBOX, false);
  assert.equal(environment.SMS_IR_SANDBOX, false);
  assert.equal(environment.SMS_IR_TEMPLATE_ID, 12345);
  assert.equal(environment.IRAN_POST_SANDBOX, false);
});

test('environment validation rejects an invalid port', () => {
  assert.throws(() => parseEnvironment({ API_PORT: 'not-a-port' }));
});

test('environment validation treats blank optional provider settings as unconfigured', () => {
  const environment = parseEnvironment({
    ZARINPAL_MERCHANT_ID: '',
    ZARINPAL_BASE_URL: '',
    SMS_IR_API_KEY: '',
    SMS_IR_LINE_NUMBER: '',
    SMS_IR_TEMPLATE_ID: '',
    IRAN_POST_API_KEY: '',
    IRAN_POST_BASE_URL: '',
  });

  assert.equal(environment.ZARINPAL_MERCHANT_ID, undefined);
  assert.equal(environment.ZARINPAL_BASE_URL, undefined);
  assert.equal(environment.SMS_IR_API_KEY, undefined);
  assert.equal(environment.SMS_IR_TEMPLATE_ID, undefined);
  assert.equal(environment.IRAN_POST_BASE_URL, undefined);
});
