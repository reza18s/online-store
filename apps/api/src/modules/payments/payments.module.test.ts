import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createPaymentGateway } from './payments.module';

const baseConfig = {
  WEB_ORIGIN: 'http://127.0.0.1:5173',
  AUTH_SECRET: 'local-payment-test-secret-with-at-least-32-chars',
  ZARINPAL_MERCHANT_ID: undefined,
  ZARINPAL_BASE_URL: undefined,
  ZARINPAL_SANDBOX: true,
};

test('uses the provider-free payment adapter in development and test', () => {
  assert.equal(createPaymentGateway({ ...baseConfig, NODE_ENV: 'development' }).name, 'local');
  assert.equal(createPaymentGateway({ ...baseConfig, NODE_ENV: 'test' }).name, 'local');
});

test('keeps staging and production on the real provider boundary', () => {
  assert.equal(createPaymentGateway({ ...baseConfig, NODE_ENV: 'staging' }).name, 'zarinpal');
  assert.equal(createPaymentGateway({ ...baseConfig, NODE_ENV: 'production' }).name, 'zarinpal');
});
