import assert from 'node:assert/strict';
import { test } from 'node:test';

import { BadRequestException } from '@nestjs/common';

import { isAllowedPaymentRedirectUrl } from '../checkout/payment.gateway';
import { LocalPaymentGateway } from './local.payment.gateway';

const config = {
  WEB_ORIGIN: 'http://127.0.0.1:5173',
  AUTH_SECRET: 'local-payment-test-secret-with-at-least-32-chars',
};

test('starts and verifies a signed local payment without making an HTTP request', async () => {
  const gateway = new LocalPaymentGateway(config);
  const started = await gateway.startPayment({
    orderNumber: 'NV-LOCAL-1',
    amountToman: 289_000,
    idempotencyKey: 'checkout-local-1',
  });

  assert.equal(gateway.name, 'local');
  assert.equal(
    isAllowedPaymentRedirectUrl(started.redirectUrl, gateway.name, config.WEB_ORIGIN),
    true,
  );

  const credentialedRedirect = started.redirectUrl.replace(
    'http://127.0.0.1:5173',
    'http://user:password@127.0.0.1:5173',
  );
  assert.equal(
    isAllowedPaymentRedirectUrl(credentialedRedirect, gateway.name, config.WEB_ORIGIN),
    false,
  );
  const redirectWithQuery = new URL(started.redirectUrl);
  redirectWithQuery.search = '?unexpected=1';
  assert.equal(
    isAllowedPaymentRedirectUrl(redirectWithQuery.toString(), gateway.name, config.WEB_ORIGIN),
    false,
  );

  const redirect = new URL(started.redirectUrl);
  const payload = Object.fromEntries(new URLSearchParams(redirect.hash.split('?')[1] ?? ''));
  const result = await gateway.verifyCallback({ payload });

  assert.deepEqual(result, {
    providerEventId: started.providerTransactionId,
    orderNumber: 'NV-LOCAL-1',
    status: 'PAID',
    amountToman: 289_000,
    providerTransactionId: started.providerTransactionId,
  });
});

test('rejects tampered local payment callbacks before payment state changes', async () => {
  const gateway = new LocalPaymentGateway(config);
  const started = await gateway.startPayment({
    orderNumber: 'NV-LOCAL-2',
    amountToman: 1000,
    idempotencyKey: 'checkout-local-2',
  });
  const redirect = new URL(started.redirectUrl);
  const payload = Object.fromEntries(new URLSearchParams(redirect.hash.split('?')[1] ?? ''));
  payload.amountToman = '1001';

  await assert.rejects(gateway.verifyCallback({ payload }), (error: unknown) => {
    return error instanceof BadRequestException && /نشانه/.test(error.message);
  });
});

test('returns deterministic local refund identifiers without contacting a provider', async () => {
  const gateway = new LocalPaymentGateway(config);
  const first = await gateway.refundPayment({
    orderNumber: 'NV-LOCAL-3',
    amountToman: 1000,
    idempotencyKey: 'refund-local-1',
    reason: 'test',
  });
  const second = await gateway.refundPayment({
    orderNumber: 'NV-LOCAL-3',
    amountToman: 1000,
    idempotencyKey: 'refund-local-1',
    reason: 'test',
  });

  assert.equal(first.providerRefundId, second.providerRefundId);
  assert.match(first.providerRefundId ?? '', /^local-refund-[0-9a-f]{48}$/);
});
