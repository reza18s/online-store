import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { Environment } from '@nova/config';

import {
  LocalShippingProvider,
  type ShippingMethod,
  type ShippingProvider,
  type ShippingQuote,
  type ShippingQuoteInput,
} from './shipping.provider';

export const TAPIN_SHIPPING_TRANSPORT = Symbol('TAPIN_SHIPPING_TRANSPORT');

const POSTGRES_INT_MAX = 2_147_483_647;

export type TapinMoneyUnit = 'TOMAN' | 'RIAL';

export interface TapinShippingConfig {
  apiKey?: string;
  baseUrl?: string;
  sandbox: boolean;
}

export interface TapinTransportContext {
  apiKey: string;
  baseUrl: string;
  sandbox: boolean;
}

/**
 * This is an adapter-level response, not an undocumented Tapin HTTP payload.
 * A future transport must map the documented Tapin response into this shape.
 */
export interface TapinQuoteResponse {
  method: ShippingMethod;
  amount: number;
  unit: TapinMoneyUnit;
  label: string;
  estimate: string;
  supportsExpress?: boolean;
}

/**
 * The transport is intentionally injected. The current checkout boundary does
 * not contain the address/weight/dimensions or a verified Tapin API contract, so
 * this task does not invent an endpoint or a request body.
 */
export interface TapinShippingTransport {
  quote(input: ShippingQuoteInput, context: TapinTransportContext): Promise<unknown>;
}

/**
 * Safe default until a documented Tapin transport is supplied. It never performs
 * network I/O and makes a configured production checkout fail closed.
 */
@Injectable()
export class UnconfiguredTapinShippingTransport implements TapinShippingTransport {
  public async quote(): Promise<never> {
    throw new ServiceUnavailableException(
      'اتصال واقعی سرویس حمل‌ونقل تاپین هنوز قراردادبندی نشده است.',
    );
  }
}

@Injectable()
export class TapinShippingProvider implements ShippingProvider {
  public readonly name = 'tapin';

  public constructor(
    private readonly config: TapinShippingConfig,
    private readonly transport: TapinShippingTransport,
  ) {}

  public async quote(input: ShippingQuoteInput): Promise<ShippingQuote> {
    const context = this.productionContext();

    let response: unknown;
    try {
      response = await this.transport.quote(input, context);
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      throw new ServiceUnavailableException('سرویس حمل‌ونقل تاپین در دسترس نیست.');
    }

    return normalizeTapinQuote(input, response);
  }

  private productionContext(): TapinTransportContext {
    const apiKey = this.config.apiKey?.trim();
    const baseUrl = this.config.baseUrl?.trim();
    if (!apiKey || !baseUrl || !isHttpUrl(baseUrl)) {
      throw new ServiceUnavailableException('پیکربندی سرویس حمل‌ونقل تاپین کامل نیست.');
    }

    return {
      apiKey,
      baseUrl,
      sandbox: this.config.sandbox,
    };
  }
}

export type ShippingEnvironment = Pick<
  Environment,
  'NODE_ENV' | 'TAPIN_API_KEY' | 'TAPIN_BASE_URL' | 'TAPIN_SANDBOX'
>;

export function createShippingProvider(
  environment: ShippingEnvironment,
  transport: TapinShippingTransport = new UnconfiguredTapinShippingTransport(),
): ShippingProvider {
  if (environment.NODE_ENV === 'production') {
    return new TapinShippingProvider(
      {
        apiKey: environment.TAPIN_API_KEY,
        baseUrl: environment.TAPIN_BASE_URL,
        sandbox: environment.TAPIN_SANDBOX,
      },
      transport,
    );
  }

  return new LocalShippingProvider();
}

function normalizeTapinQuote(input: ShippingQuoteInput, response: unknown): ShippingQuote {
  if (!isTapinQuoteResponse(response)) {
    throw new ServiceUnavailableException('پاسخ سرویس حمل‌ونقل تاپین معتبر نیست.');
  }
  if (response.method !== input.method) {
    throw new ServiceUnavailableException('روش ارسال پاسخ‌داده‌شده توسط تاپین معتبر نیست.');
  }
  if (input.method === 'EXPRESS' && response.supportsExpress !== true) {
    throw new ServiceUnavailableException('ارسال اکسپرس توسط تاپین پشتیبانی نمی‌شود.');
  }

  const amountToman = toToman(response.amount, response.unit);
  return {
    method: response.method,
    amountToman,
    label: response.label,
    estimate: response.estimate,
  };
}

function toToman(amount: number, unit: TapinMoneyUnit): number {
  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw new ServiceUnavailableException('مبلغ ارسال دریافتی از تاپین معتبر نیست.');
  }

  let amountToman: number;
  if (unit === 'TOMAN') {
    amountToman = amount;
  } else {
    if (unit !== 'RIAL' || amount % 10 !== 0) {
      throw new ServiceUnavailableException('واحد مبلغ ارسال دریافتی از تاپین معتبر نیست.');
    }
    amountToman = amount / 10;
  }

  if (!Number.isSafeInteger(amountToman) || amountToman > POSTGRES_INT_MAX) {
    throw new ServiceUnavailableException('مبلغ ارسال دریافتی از تاپین معتبر نیست.');
  }
  return amountToman;
}

function isTapinQuoteResponse(value: unknown): value is TapinQuoteResponse {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const response = value as Record<string, unknown>;
  return (
    (response.method === 'STANDARD' || response.method === 'EXPRESS') &&
    typeof response.amount === 'number' &&
    (response.unit === 'TOMAN' || response.unit === 'RIAL') &&
    typeof response.label === 'string' &&
    response.label.trim().length > 0 &&
    typeof response.estimate === 'string' &&
    response.estimate.trim().length > 0 &&
    (response.supportsExpress === undefined || typeof response.supportsExpress === 'boolean')
  );
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
