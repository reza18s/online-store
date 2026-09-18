import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { Environment } from '@nova/config';

import {
  LocalShippingProvider,
  type ShippingMethod,
  type ShippingProvider,
  type ShippingQuote,
  type ShippingQuoteInput,
} from './shipping.provider';

export const IRAN_POST_SHIPPING_TRANSPORT = Symbol('IRAN_POST_SHIPPING_TRANSPORT');

const POSTGRES_INT_MAX = 2_147_483_647;

export type IranPostMoneyUnit = 'TOMAN' | 'RIAL';

export interface IranPostShippingConfig {
  apiKey?: string;
  baseUrl?: string;
  sandbox: boolean;
}

export interface IranPostTransportContext {
  apiKey: string;
  baseUrl: string;
  sandbox: boolean;
}

/**
 * This is an adapter-level response, not an undocumented Iran Post HTTP payload.
 * A future transport must map the official Iran Post response into this shape.
 */
export interface IranPostQuoteResponse {
  method: ShippingMethod;
  amount: number;
  unit: IranPostMoneyUnit;
  label: string;
  estimate: string;
  supportsExpress?: boolean;
}

/**
 * The transport is intentionally injected. The current checkout boundary does
 * not contain the address/weight/dimensions or a verified Iran Post API contract,
 * so this adapter does not invent an endpoint or a request body.
 */
export interface IranPostShippingTransport {
  quote(input: ShippingQuoteInput, context: IranPostTransportContext): Promise<unknown>;
}

/**
 * Safe default until a documented Iran Post transport is supplied. It never
 * performs network I/O and makes a configured production checkout fail closed.
 */
@Injectable()
export class UnconfiguredIranPostShippingTransport implements IranPostShippingTransport {
  public async quote(): Promise<never> {
    throw new ServiceUnavailableException(
      'اتصال واقعی سرویس حمل‌ونقل ایران‌پست هنوز قراردادبندی نشده است.',
    );
  }
}

@Injectable()
export class IranPostShippingProvider implements ShippingProvider {
  public readonly name = 'iran-post';

  public constructor(
    private readonly config: IranPostShippingConfig,
    private readonly transport: IranPostShippingTransport,
  ) {}

  public async quote(input: ShippingQuoteInput): Promise<ShippingQuote> {
    const context = this.productionContext();

    let response: unknown;
    try {
      response = await this.transport.quote(input, context);
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      throw new ServiceUnavailableException('سرویس حمل‌ونقل ایران‌پست در دسترس نیست.');
    }

    return normalizeIranPostQuote(input, response);
  }

  private productionContext(): IranPostTransportContext {
    const apiKey = this.config.apiKey?.trim();
    const baseUrl = this.config.baseUrl?.trim();
    if (!apiKey || !baseUrl || !isHttpsUrl(baseUrl)) {
      throw new ServiceUnavailableException('پیکربندی سرویس حمل‌ونقل ایران‌پست کامل نیست.');
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
  'NODE_ENV' | 'IRAN_POST_API_KEY' | 'IRAN_POST_BASE_URL' | 'IRAN_POST_SANDBOX'
>;

export function createShippingProvider(
  environment: ShippingEnvironment,
  transport: IranPostShippingTransport = new UnconfiguredIranPostShippingTransport(),
): ShippingProvider {
  if (environment.NODE_ENV === 'production') {
    return new IranPostShippingProvider(
      {
        apiKey: environment.IRAN_POST_API_KEY,
        baseUrl: environment.IRAN_POST_BASE_URL,
        sandbox: environment.IRAN_POST_SANDBOX,
      },
      transport,
    );
  }

  if (environment.NODE_ENV === 'development' || environment.NODE_ENV === 'test') {
    return new LocalShippingProvider();
  }

  throw new ServiceUnavailableException('پیکربندی محیط اجرای سرویس حمل‌ونقل معتبر نیست.');
}

function normalizeIranPostQuote(input: ShippingQuoteInput, response: unknown): ShippingQuote {
  if (!isIranPostQuoteResponse(response)) {
    throw new ServiceUnavailableException('پاسخ سرویس حمل‌ونقل ایران‌پست معتبر نیست.');
  }
  if (response.method !== input.method) {
    throw new ServiceUnavailableException('روش ارسال پاسخ‌داده‌شده توسط ایران‌پست معتبر نیست.');
  }
  if (input.method === 'EXPRESS' && response.supportsExpress !== true) {
    throw new ServiceUnavailableException('ارسال اکسپرس توسط ایران‌پست پشتیبانی نمی‌شود.');
  }

  const amountToman = toToman(response.amount, response.unit);
  return {
    method: response.method,
    amountToman,
    label: response.label,
    estimate: response.estimate,
  };
}

function toToman(amount: number, unit: IranPostMoneyUnit): number {
  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw new ServiceUnavailableException('مبلغ ارسال دریافتی از ایران‌پست معتبر نیست.');
  }

  let amountToman: number;
  if (unit === 'TOMAN') {
    amountToman = amount;
  } else {
    if (unit !== 'RIAL' || amount % 10 !== 0) {
      throw new ServiceUnavailableException('واحد مبلغ ارسال دریافتی از ایران‌پست معتبر نیست.');
    }
    amountToman = amount / 10;
  }

  if (!Number.isSafeInteger(amountToman) || amountToman > POSTGRES_INT_MAX) {
    throw new ServiceUnavailableException('مبلغ ارسال دریافتی از ایران‌پست معتبر نیست.');
  }
  return amountToman;
}

function isIranPostQuoteResponse(value: unknown): value is IranPostQuoteResponse {
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

function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}
