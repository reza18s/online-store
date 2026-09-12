import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ServiceUnavailableException } from '@nestjs/common';

import {
  isValidSmsIrOtpDeliveryConfig,
  SmsIrOtpDelivery,
  type SmsIrHttpRequest,
} from './otp-delivery';

function response(status: number, body: unknown) {
  return {
    status,
    json: async () => body,
  };
}

function configured(
  transport: (request: SmsIrHttpRequest) => Promise<ReturnType<typeof response>>,
) {
  return new SmsIrOtpDelivery({
    apiKey: 'sandbox-api-key',
    templateId: 123456,
    baseUrl: 'https://api.sms.ir/v1',
    sandbox: true,
    transport,
  });
}

test('sends a normalized OTP through the SMS.ir sandbox verify contract', async () => {
  let request: SmsIrHttpRequest | undefined;
  const delivery = configured(async (received) => {
    request = received;
    return response(200, { status: 1, message: 'ok', data: { messageId: 42 } });
  });

  await delivery.send('+989123456789', '123456');

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
    parameters: [{ name: 'Code', value: '123456' }],
  });
  assert.equal(request.signal.aborted, false);
});

test('trims an accepted sandbox base URL before building the verify endpoint', async () => {
  let request: SmsIrHttpRequest | undefined;
  const delivery = new SmsIrOtpDelivery({
    apiKey: 'sandbox-api-key',
    templateId: 123456,
    baseUrl: '  https://api.sms.ir/v1  ',
    sandbox: true,
    transport: async (received) => {
      request = received;
      return response(200, { status: 1 });
    },
  });

  await delivery.send('+989123456789', '123456');

  assert.equal(request?.url, 'https://api.sms.ir/v1/send/verify');
});

test('rejects missing, non-sandbox, and invalid provider configuration without transport calls', async () => {
  assert.equal(
    isValidSmsIrOtpDeliveryConfig({
      apiKey: undefined,
      templateId: 123456,
      baseUrl: 'https://api.sms.ir/v1',
      sandbox: true,
    }),
    false,
  );
  assert.equal(
    isValidSmsIrOtpDeliveryConfig({
      apiKey: 'sandbox-api-key',
      templateId: 123456,
      baseUrl: 'https://api.sms.ir/v1',
      sandbox: false,
    }),
    false,
  );
  assert.equal(
    isValidSmsIrOtpDeliveryConfig({
      apiKey: 'sandbox-api-key',
      templateId: 0,
      baseUrl: 'https://api.sms.ir/v1',
      sandbox: true,
    }),
    false,
  );
  assert.equal(
    isValidSmsIrOtpDeliveryConfig({
      apiKey: 'sandbox-api-key',
      templateId: 123456,
      baseUrl: 'not-a-url',
      sandbox: true,
    }),
    false,
  );

  let calls = 0;
  const delivery = new SmsIrOtpDelivery({
    apiKey: 'sandbox-api-key',
    templateId: 123456,
    baseUrl: 'https://api.sms.ir/v1',
    sandbox: false,
    transport: async () => {
      calls += 1;
      return response(200, { status: 1 });
    },
  });

  await assert.rejects(delivery.send('+989123456789', '123456'), (error: unknown) => {
    return error instanceof ServiceUnavailableException && /پیکربندی/.test(error.message);
  });
  assert.equal(calls, 0);
});

test('sanitizes malformed and provider error responses', async () => {
  for (const receivedResponse of [
    response(200, { message: 'malformed' }),
    response(400, { status: 0, message: 'api-key=sandbox-api-key mobile=+989123456789' }),
  ]) {
    const delivery = configured(async () => receivedResponse);
    await assert.rejects(delivery.send('+989123456789', '123456'), (error: unknown) => {
      assert.ok(error instanceof ServiceUnavailableException);
      assert.equal(error.message, 'سرویس ارسال پیامک در دسترس نیست.');
      assert.doesNotMatch(error.message, /sandbox-api-key|989123456789|123456/);
      return true;
    });
  }
});

test('sanitizes transport failures and invalid normalized inputs', async () => {
  const delivery = configured(async () => {
    throw new Error('secret=sandbox-api-key recipient=+989123456789');
  });

  await assert.rejects(delivery.send('+989123456789', '123456'), (error: unknown) => {
    return (
      error instanceof ServiceUnavailableException &&
      error.message === 'سرویس ارسال پیامک در دسترس نیست.' &&
      !/sandbox-api-key|989123456789|123456/.test(error.message)
    );
  });
  await assert.rejects(delivery.send('09123456789', '123456'), /در دسترس نیست/);
  await assert.rejects(delivery.send('+989123456789', '12345'), /در دسترس نیست/);
});
