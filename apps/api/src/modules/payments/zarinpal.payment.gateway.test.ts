import assert from 'node:assert/strict';
import { test } from 'node:test';

import { BadGatewayException, ServiceUnavailableException } from '@nestjs/common';

import {
  ZARINPAL_PAYMENT_GATEWAY_NAME,
  ZarinPalPaymentGateway,
  toZarinPalRial,
  type ZarinPalGatewayConfig,
} from './zarinpal.payment.gateway';

const merchantId = '00000000-0000-0000-0000-000000000000';
const config: ZarinPalGatewayConfig = {
  WEB_ORIGIN: 'http://127.0.0.1:5173',
  ZARINPAL_MERCHANT_ID: merchantId,
  ZARINPAL_BASE_URL: 'https://sandbox.zarinpal.com/pg/v4/payment/',
  ZARINPAL_SANDBOX: true,
};

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function gateway(
  responses: Response[],
  requests: Array<{ url: string; body: Record<string, unknown> }> = [],
): ZarinPalPaymentGateway {
  let index = 0;
  return new ZarinPalPaymentGateway(config, async (input, init) => {
    requests.push({
      url: String(input),
      body: JSON.parse(String(init?.body)) as Record<string, unknown>,
    });
    return responses[index++] ?? response({});
  });
}

test('keeps the provider name stable and converts Toman to Rial for payment requests', async () => {
  const requests: Array<{ url: string; body: Record<string, unknown> }> = [];
  const payment = gateway(
    [response({ data: { code: 100, authority: 'A00000000000000000000000000' }, errors: [] })],
    requests,
  );

  const result = await payment.startPayment({
    orderNumber: 'NOVA-1001',
    amountToman: 2_490_000,
    idempotencyKey: 'checkout-1001',
  });

  assert.equal(payment.name, ZARINPAL_PAYMENT_GATEWAY_NAME);
  assert.equal(requests[0]?.url, 'https://sandbox.zarinpal.com/pg/v4/payment/request.json');
  assert.equal(requests[0]?.body.merchant_id, merchantId);
  assert.equal(requests[0]?.body.amount, 24_900_000);
  assert.match(String(requests[0]?.body.callback_url), /\/v1\/payments\/zarinpal\/callback/);
  assert.match(String(requests[0]?.body.callback_url), /orderNumber=NOVA-1001/);
  assert.equal(result.providerTransactionId, 'A00000000000000000000000000');
  assert.equal(
    result.redirectUrl,
    'https://sandbox.zarinpal.com/pg/StartPay/A00000000000000000000000000',
  );
});

test('converts provider money exactly at the adapter boundary', () => {
  assert.equal(toZarinPalRial(100), 1_000);
  assert.equal(toZarinPalRial(2_490_000), 24_900_000);
  assert.throws(() => toZarinPalRial(99));
  assert.throws(() => toZarinPalRial(Number.MAX_SAFE_INTEGER));
});

test('verifies a callback on the server and maps authority/ref_id safely', async () => {
  const requests: Array<{ url: string; body: Record<string, unknown> }> = [];
  const payment = gateway(
    [response({ data: { code: 100, ref_id: 987654321 }, errors: [] })],
    requests,
  );

  const result = await payment.verifyCallback({
    payload: {
      Status: 'OK',
      Authority: 'A00000000000000000000000000',
      orderNumber: 'NOVA-1001',
      amountToman: '100',
    },
  });

  assert.equal(requests[0]?.url, 'https://sandbox.zarinpal.com/pg/v4/payment/verify.json');
  assert.deepEqual(requests[0]?.body, {
    merchant_id: merchantId,
    amount: 1_000,
    authority: 'A00000000000000000000000000',
  });
  assert.deepEqual(result, {
    providerEventId: '987654321',
    orderNumber: 'NOVA-1001',
    status: 'PAID',
    amountToman: 100,
    providerTransactionId: 'A00000000000000000000000000',
  });
});

test('maps an explicit provider NOK status to a failed callback without verification', async () => {
  const requests: Array<{ url: string; body: Record<string, unknown> }> = [];
  const payment = gateway(
    [response({ data: { code: 100, ref_id: 'must-not-be-used' }, errors: [] })],
    requests,
  );

  const result = await payment.verifyCallback({
    payload: {
      Status: 'NOK',
      Authority: 'A00000000000000000000000000',
      order_number: 'NOVA-1001',
      amount_toman: '100',
    },
  });

  assert.equal(requests.length, 0);
  assert.equal(result.status, 'FAILED');
  assert.equal(result.providerTransactionId, 'A00000000000000000000000000');
});

test('maps a successful official reversal to the payment refund contract', async () => {
  const requests: Array<{ url: string; body: Record<string, unknown> }> = [];
  const payment = gateway(
    [response({ data: { code: 100, id: 'refund-1001' }, errors: [] })],
    requests,
  );

  const result = await payment.refundPayment({
    orderNumber: 'NOVA-1001',
    amountToman: 100,
    isFullRefund: true,
    providerTransactionId: 'A00000000000000000000000000',
    idempotencyKey: 'refund-1001',
    reason: 'late-payment-inventory-unavailable',
  });

  assert.equal(requests[0]?.url, 'https://sandbox.zarinpal.com/pg/v4/payment/reverse.json');
  assert.deepEqual(requests[0]?.body, {
    merchant_id: merchantId,
    authority: 'A00000000000000000000000000',
  });
  assert.deepEqual(result, { providerRefundId: 'refund-1001' });
});

test('fails closed instead of using full reversal for a partial refund', async () => {
  let requests = 0;
  const payment = new ZarinPalPaymentGateway(config, async () => {
    requests += 1;
    return response({ data: { code: 100 }, errors: [] });
  });

  await assert.rejects(
    payment.refundPayment({
      orderNumber: 'NOVA-1001',
      amountToman: 100,
      providerTransactionId: 'A00000000000000000000000000',
      idempotencyKey: 'refund-1001',
      reason: 'customer-request',
    }),
    ServiceUnavailableException,
  );
  assert.equal(requests, 0);
});

test('fails closed for absent, invalid, or non-sandbox configuration', async () => {
  const configurations: ZarinPalGatewayConfig[] = [
    { ...config, ZARINPAL_MERCHANT_ID: undefined },
    { ...config, ZARINPAL_MERCHANT_ID: 'merchant-id' },
    { ...config, ZARINPAL_BASE_URL: undefined },
    { ...config, ZARINPAL_BASE_URL: 'https://payment.zarinpal.com/pg/v4/payment/' },
    { ...config, ZARINPAL_SANDBOX: false },
  ];

  for (const current of configurations) {
    const payment = new ZarinPalPaymentGateway(current, async () => response({}));
    await assert.rejects(
      payment.startPayment({ orderNumber: 'NOVA-1001', amountToman: 100, idempotencyKey: 'x' }),
      ServiceUnavailableException,
    );
  }
});

test('rejects malformed callbacks and provider transport responses without exposing payloads', async () => {
  const payment = gateway([response({ data: { code: 100 }, errors: [] })]);
  await assert.rejects(
    payment.verifyCallback({
      payload: { Status: 'OK', Authority: 'bad', orderNumber: 'NOVA-1001' },
    }),
  );

  const failedHttp = gateway([response({ errors: [{ code: 'secret-provider-detail' }] }, 502)]);
  await assert.rejects(
    failedHttp.startPayment({ orderNumber: 'NOVA-1001', amountToman: 100, idempotencyKey: 'x' }),
    BadGatewayException,
  );

  const malformed = gateway([response({ data: { authority: 'A00000000000000000000000000' } })]);
  await assert.rejects(
    malformed.startPayment({ orderNumber: 'NOVA-1001', amountToman: 100, idempotencyKey: 'x' }),
    BadGatewayException,
  );
});
