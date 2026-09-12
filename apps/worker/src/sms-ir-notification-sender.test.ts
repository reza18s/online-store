import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  isValidSmsIrNotificationConfig,
  SmsIrNotificationSender,
  type SmsIrNotificationHttpRequest,
  type SmsIrNotificationHttpResponse,
  type SmsIrNotificationHttpTransport,
} from './sms-ir-notification-sender';

function response(status: number, body: unknown): SmsIrNotificationHttpResponse {
  return { status, json: async () => body };
}

function job(
  overrides: Partial<{
    id: string;
    kind: string;
    recipient: string;
    payload: unknown;
    attempts: number;
  }> = {},
) {
  return {
    id: 'job-1',
    kind: 'PAYMENT_SUCCEEDED',
    recipient: '+989123456789',
    payload: { orderNumber: 'NV-100', amountToman: 289_000, currency: 'TOMAN' },
    attempts: 1,
    ...overrides,
  };
}

const configured = {
  apiKey: 'sandbox-api-key',
  templateId: 123456,
  baseUrl: 'https://api.sms.ir/v1',
  sandbox: true,
};

test('sends supported payment notifications through the injected sandbox transport', async () => {
  let request: SmsIrNotificationHttpRequest | undefined;
  const transport: SmsIrNotificationHttpTransport = async (received) => {
    request = received;
    return response(200, { status: 1, data: { messageId: 42 } });
  };

  await new SmsIrNotificationSender({ ...configured, transport }).send(job());

  assert.ok(request);
  assert.equal(request.url, 'https://api.sms.ir/v1/send/verify');
  assert.deepEqual(request.headers, {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-API-KEY': 'sandbox-api-key',
  });
  assert.deepEqual(JSON.parse(request.body), {
    mobile: '+989123456789',
    templateId: 123456,
    parameters: [
      { name: 'OrderNumber', value: 'NV-100' },
      { name: 'AmountToman', value: '289000' },
    ],
  });
  assert.equal(request.signal.aborted, false);
});

test('trims an accepted sandbox base URL before building the verify endpoint', async () => {
  let request: SmsIrNotificationHttpRequest | undefined;
  const transport: SmsIrNotificationHttpTransport = async (received) => {
    request = received;
    return response(200, { status: 1 });
  };

  await new SmsIrNotificationSender({
    ...configured,
    baseUrl: '  https://api.sms.ir/v1  ',
    transport,
  }).send(job());

  assert.equal(request?.url, 'https://api.sms.ir/v1/send/verify');
});

test('rejects unsupported kinds and OTP-shaped persisted payloads without HTTP', async () => {
  let calls = 0;
  const transport: SmsIrNotificationHttpTransport = async () => {
    calls += 1;
    return response(200, { status: 1 });
  };
  const sender = new SmsIrNotificationSender({ ...configured, transport });

  await assert.rejects(sender.send(job({ kind: 'WELCOME' })));
  await assert.rejects(sender.send(job({ payload: { orderNumber: 'NV-100', code: '123456' } })));
  assert.equal(calls, 0);
});

test('fails closed for missing or invalid sandbox configuration', async () => {
  const configs = [
    { ...configured, apiKey: undefined },
    { ...configured, templateId: undefined },
    { ...configured, baseUrl: undefined },
    { ...configured, baseUrl: 'not-a-url' },
    { ...configured, baseUrl: 'http://api.sms.ir/v1' },
    { ...configured, sandbox: false },
  ];

  for (const config of configs) {
    assert.equal(isValidSmsIrNotificationConfig(config), false);
    let calls = 0;
    const sender = new SmsIrNotificationSender({
      ...config,
      transport: async () => {
        calls += 1;
        return response(200, { status: 1 });
      },
    });
    await assert.rejects(sender.send(job()), /sms-ir-unconfigured/);
    assert.equal(calls, 0);
  }
});

test('sanitizes malformed and provider error responses', async () => {
  for (const receivedResponse of [
    response(200, { message: 'malformed' }),
    response(400, { status: 0, message: 'api-key=sandbox-api-key mobile=+989123456789' }),
    {
      status: 200,
      json: async () => {
        throw new Error('provider body');
      },
    } satisfies SmsIrNotificationHttpResponse,
  ]) {
    const sender = new SmsIrNotificationSender({
      ...configured,
      transport: async () => receivedResponse,
    });
    await assert.rejects(sender.send(job()), (error: unknown) => {
      return (
        error instanceof Error &&
        !error.message.includes('sandbox-api-key') &&
        !error.message.includes('989123456789')
      );
    });
  }
});
