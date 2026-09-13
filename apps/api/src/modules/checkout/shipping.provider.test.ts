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

test('development and test selection is deterministic and does not use a transport', async () => {
  let transportCalls = 0;
  const transport: TapinShippingTransport = {
    quote: async () => {
      transportCalls += 1;
      throw new Error('network must not be used');
    },
  };

  for (const nodeEnv of ['development', 'test'] as const) {
    const provider = createShippingProvider({ NODE_ENV: nodeEnv, TAPIN_SANDBOX: true }, transport);
    assert.ok(provider instanceof LocalShippingProvider);
    assert.deepEqual(await provider.quote(standardInput), {
      method: 'STANDARD',
      amountToman: 0,
      label: 'پیشتاز',
      estimate: 'تحویل بین ۲ تا ۴ روز کاری · سراسر ایران',
    });
  }
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

test('production config and transport context are trimmed before a Tapin quote', async () => {
  let receivedContext: unknown;
  const provider = new TapinShippingProvider(
    {
      apiKey: '  tapin-test-key  ',
      baseUrl: '  https://tapin.example.test  ',
      sandbox: true,
    },
    {
      quote: async (_input, context) => {
        receivedContext = context;
        return {
          method: 'STANDARD',
          amount: 25_000,
          unit: 'TOMAN',
          label: 'پیشتاز تاپین',
          estimate: 'تحویل طبق اعلام سرویس',
        };
      },
    },
  );

  await provider.quote(standardInput);
  assert.deepEqual(receivedContext, {
    apiKey: 'tapin-test-key',
    baseUrl: 'https://tapin.example.test',
    sandbox: true,
  });
});

test('non-HTTPS URLs fail closed before invoking the Tapin transport', async () => {
  let transportCalls = 0;
  const transport: TapinShippingTransport = {
    quote: async () => {
      transportCalls += 1;
      throw new Error('transport must not be called');
    },
  };

  for (const baseUrl of ['http://tapin.example.test', 'ftp://tapin.example.test', 'not-a-url']) {
    const provider = new TapinShippingProvider({ ...productionConfig, baseUrl }, transport);
    await assert.rejects(provider.quote(standardInput), (error: unknown) => {
      return error instanceof ServiceUnavailableException;
    });
  }

  assert.equal(transportCalls, 0);
});

test('Tapin transport errors become sanitized ServiceUnavailableExceptions', async () => {
  const secretPayload = 'tapin-secret-response-payload';
  const provider = new TapinShippingProvider(productionConfig, {
    quote: async () => {
      throw new Error(secretPayload);
    },
  });

  await assert.rejects(provider.quote(standardInput), (error: unknown) => {
    assert.ok(error instanceof ServiceUnavailableException);
    assert.equal(error.message, 'سرویس حمل‌ونقل تاپین در دسترس نیست.');
    assert.equal(error.message.includes(secretPayload), false);
    return true;
  });
});

test('invalid RIAL conversion and integer overflow fail closed', async () => {
  for (const amount of [25_001, -10, 21_474_836_480]) {
    const provider = new TapinShippingProvider(productionConfig, {
      quote: async () => ({
        method: 'STANDARD',
        amount,
        unit: 'RIAL',
        label: 'پیشتاز تاپین',
        estimate: 'تحویل طبق اعلام سرویس',
      }),
    });

    await assert.rejects(provider.quote(standardInput), (error: unknown) => {
      return error instanceof ServiceUnavailableException;
    });
  }
});

test('a Tapin response with a mismatched shipping method fails closed', async () => {
  const provider = new TapinShippingProvider(productionConfig, {
    quote: async () => ({
      method: 'EXPRESS',
      amount: 100_000,
      unit: 'TOMAN',
      label: 'اکسپرس',
      estimate: 'تحویل سریع',
      supportsExpress: true,
    }),
  });

  await assert.rejects(provider.quote(standardInput), (error: unknown) => {
    return error instanceof ServiceUnavailableException;
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
