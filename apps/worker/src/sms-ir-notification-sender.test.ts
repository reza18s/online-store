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

  await assert.rejects(sender.send(job({ kind: 'WELCOME' })), {
    message: 'sms-ir-unsupported-notification-kind',
  });
  await assert.rejects(
    sender.send(
      job({
        payload: {
          orderNumber: 'NV-100',
          otp: '123456',
          secret: 'must-not-appear-in-errors',
        },
      }),
    ),
    {
      message: 'sms-ir-invalid-notification-payload',
    },
  );
  assert.equal(calls, 0);
});

test('fails closed for missing or invalid sandbox configuration', async () => {
  const configs = [
    { ...configured, apiKey: undefined },
    { ...configured, templateId: undefined },
    { ...configured, baseUrl: undefined },
    { ...configured, apiKey: '  ' },
    { ...configured, templateId: 1.5 },
    { ...configured, templateId: Number.NaN },
    { ...configured, baseUrl: 'not-a-url' },
    { ...configured, baseUrl: '   ' },
    { ...configured, baseUrl: 'http://api.sms.ir/v1' },
    { ...configured, baseUrl: 'https://user:password@api.sms.ir/v1' },
    { ...configured, baseUrl: 'https://api.sms.ir/v1?token=secret' },
    { ...configured, baseUrl: 'https://api.sms.ir/v1#secret' },
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
  for (const [receivedResponse, expectedMessage] of [
    [response(Number.NaN, { status: 1 }), 'sms-ir-provider-error'],
    [response(200, { message: 'malformed' }), 'sms-ir-provider-error'],
    [
      response(400, { status: 0, message: 'api-key=sandbox-api-key mobile=+989123456789' }),
      'sms-ir-provider-error',
    ],
    [
      {
        status: 200,
        json: async () => {
          throw new Error('provider body');
        },
      } satisfies SmsIrNotificationHttpResponse,
      'sms-ir-malformed-response',
    ],
  ]) {
    const sender = new SmsIrNotificationSender({
      ...configured,
      transport: async () => receivedResponse as SmsIrNotificationHttpResponse,
    });
    await assert.rejects(sender.send(job()), { message: expectedMessage });
  }
});

test('maps abort-shaped transport failures to a sanitized request error', async () => {
  const sender = new SmsIrNotificationSender({
    ...configured,
    transport: async () => {
      throw new DOMException(
        'The operation was aborted: apiKey=sandbox-api-key mobile=+989123456789 order=NV-100',
        'AbortError',
      );
    },
  });

  await assert.rejects(sender.send(job()), (error: unknown) => {
    return (
      error instanceof Error &&
      error.message === 'sms-ir-request-failed' &&
      !/sandbox-api-key|989123456789|NV-100/.test(error.message)
    );
  });
});

test('does not trust a transport error message that resembles an internal error code', async () => {
  const sender = new SmsIrNotificationSender({
    ...configured,
    transport: async () => {
      throw new Error('sms-ir-provider-error otp=123456 apiKey=sandbox-api-key');
    },
  });

  await assert.rejects(sender.send(job()), {
    message: 'sms-ir-request-failed',
  });
});
