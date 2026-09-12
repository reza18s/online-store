import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ServiceUnavailableException } from '@nestjs/common';

import {
  createShippingProvider,
  TapinShippingProvider,
  type TapinShippingTransport,
  UnconfiguredTapinShippingTransport,
} from './tapin-shipping.provider';
import { LocalShippingProvider } from './shipping.provider';

const standardInput = {
  method: 'STANDARD' as const,
  province: 'تهران',
  subtotalToman: 200_000,
};

const productionConfig = {
  apiKey: 'tapin-test-key',
  baseUrl: 'https://tapin.example.test',
  sandbox: false,
};

test('local and test selection is deterministic and does not use a transport', async () => {
  let transportCalls = 0;
  const transport: TapinShippingTransport = {
    quote: async () => {
      transportCalls += 1;
      throw new Error('network must not be used');
    },
  };

  const provider = createShippingProvider({ NODE_ENV: 'test', TAPIN_SANDBOX: true }, transport);
  assert.ok(provider instanceof LocalShippingProvider);
  assert.deepEqual(await provider.quote(standardInput), {
    method: 'STANDARD',
    amountToman: 0,
    label: 'پیشتاز',
    estimate: 'تحویل بین ۲ تا ۴ روز کاری · سراسر ایران',
  });
  assert.equal(transportCalls, 0);
});

test('production Tapin configuration without credentials or base URL fails closed', async () => {
  for (const incompleteConfig of [
    { ...productionConfig, apiKey: undefined },
    { ...productionConfig, baseUrl: undefined },
  ]) {
    const provider = new TapinShippingProvider(
      incompleteConfig,
      new UnconfiguredTapinShippingTransport(),
    );

    await assert.rejects(provider.quote(standardInput), (error: unknown) => {
      return error instanceof ServiceUnavailableException;
    });
  }
});

test('configured Tapin transport is authoritative and converts provider money inside the adapter', async () => {
  let receivedContext: unknown;
  const provider = new TapinShippingProvider(productionConfig, {
    quote: async (input, context) => {
      assert.deepEqual(input, standardInput);
      receivedContext = context;
      return {
        method: 'STANDARD',
        amount: 250_000,
        unit: 'RIAL',
        label: 'پیشتاز تاپین',
        estimate: 'تحویل طبق اعلام سرویس',
      };
    },
  });

  assert.deepEqual(await provider.quote(standardInput), {
    method: 'STANDARD',
    amountToman: 25_000,
    label: 'پیشتاز تاپین',
    estimate: 'تحویل طبق اعلام سرویس',
  });
  assert.deepEqual(receivedContext, {
    apiKey: 'tapin-test-key',
    baseUrl: 'https://tapin.example.test',
    sandbox: false,
  });
});

test('express is accepted only when the provider explicitly supports it', async () => {
  const provider = new TapinShippingProvider(productionConfig, {
    quote: async () => ({
      method: 'EXPRESS',
      amount: 100_000,
      unit: 'TOMAN',
      label: 'اکسپرس',
      estimate: 'تحویل سریع',
      supportsExpress: false,
    }),
  });

  await assert.rejects(
    provider.quote({ ...standardInput, method: 'EXPRESS' }),
    (error: unknown) => error instanceof ServiceUnavailableException,
  );
});

test('invalid Tapin responses fail closed instead of falling back to local pricing', async () => {
  const provider = new TapinShippingProvider(productionConfig, {
    quote: async () => ({
      method: 'STANDARD',
      amount: 25_000,
      unit: 'RIAL',
      label: '',
      estimate: 'unknown',
    }),
  });

  await assert.rejects(provider.quote(standardInput), (error: unknown) => {
    return error instanceof ServiceUnavailableException;
  });
});

test('the default configured production transport is explicitly non-network and unavailable', async () => {
  const provider = new TapinShippingProvider(
    productionConfig,
    new UnconfiguredTapinShippingTransport(),
  );

  await assert.rejects(provider.quote(standardInput), (error: unknown) => {
    return error instanceof ServiceUnavailableException;
  });
});
