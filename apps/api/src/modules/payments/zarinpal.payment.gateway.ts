import { BadGatewayException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { Environment } from '@nova/config';

import type {
  PaymentCallbackInput,
  PaymentCallbackResult,
  PaymentGateway,
  PaymentRefundInput,
  PaymentRefundResult,
  PaymentStartInput,
  PaymentStartResult,
} from '../checkout/payment.gateway';

export const ZARINPAL_PAYMENT_GATEWAY_NAME = 'zarinpal';

const SANDBOX_ORIGIN = 'https://sandbox.zarinpal.com';
const PAYMENT_API_PATH = '/pg/v4/payment/';
const PAYMENT_REQUEST_PATH = 'request.json';
const PAYMENT_VERIFY_PATH = 'verify.json';
const PAYMENT_REVERSE_PATH = 'reverse.json';
const CALLBACK_PATH = '/v1/payments/zarinpal/callback';
const ZARINPAL_REQUEST_TIMEOUT_MS = 10_000;
const SUCCESS_CODES = new Set([100, 101]);
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/;
const ORDER_NUMBER_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const MERCHANT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ZarinPalGatewayConfig = Pick<
  Environment,
  'WEB_ORIGIN' | 'ZARINPAL_MERCHANT_ID' | 'ZARINPAL_BASE_URL' | 'ZARINPAL_SANDBOX'
>;

export type ZarinPalHttpRequest = (input: string | URL, init?: RequestInit) => Promise<Response>;

interface ProviderResponseData {
  code: number;
  authority?: string;
  ref_id?: string | number;
  id?: string | number;
}

interface ProviderResponse {
  data: ProviderResponseData;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isSafeInteger(value)) return String(value);
  }
  return undefined;
}

function assertIdentifier(value: string, message: string): void {
  if (!IDENTIFIER_PATTERN.test(value)) throw new Error(message);
}

function assertOrderNumber(value: string): void {
  if (!ORDER_NUMBER_PATTERN.test(value)) throw new Error('order number is invalid');
}

function assertTomanAmount(value: number): void {
  if (!Number.isSafeInteger(value) || value < 1) throw new Error('amount is invalid');
}

export function toZarinPalRial(amountToman: number): number {
  assertTomanAmount(amountToman);
  const amountRial = amountToman * 10;
  if (!Number.isSafeInteger(amountRial) || amountRial < 1_000) {
    throw new Error('provider amount is invalid');
  }
  return amountRial;
}

function asProviderResponse(value: unknown): ProviderResponse {
  if (!isRecord(value) || !isRecord(value.data)) throw new Error('provider response is malformed');
  const code = value.data.code;
  if (typeof code !== 'number' || !Number.isSafeInteger(code)) {
    throw new Error('provider response code is malformed');
  }
  return { data: { ...value.data, code } as ProviderResponseData };
}

function providerIdentifier(value: unknown, message: string): string {
  const identifier =
    typeof value === 'string' && value.trim()
      ? value.trim()
      : typeof value === 'number' && Number.isSafeInteger(value)
        ? String(value)
        : undefined;
  if (!identifier) throw new Error(message);
  assertIdentifier(identifier, message);
  return identifier;
}

function configurationError(config: ZarinPalGatewayConfig): string | undefined {
  if (config.ZARINPAL_SANDBOX !== true) return 'ZarinPal sandbox mode must remain enabled.';
  if (!config.ZARINPAL_MERCHANT_ID?.trim()) return 'ZarinPal merchant credentials are missing.';
  if (!MERCHANT_ID_PATTERN.test(config.ZARINPAL_MERCHANT_ID.trim())) {
    return 'ZarinPal merchant credentials are invalid.';
  }
  if (!config.ZARINPAL_BASE_URL?.trim()) return 'ZarinPal sandbox base URL is missing.';

  let baseUrl: URL;
  try {
    baseUrl = new URL(config.ZARINPAL_BASE_URL);
  } catch {
    return 'ZarinPal sandbox base URL is invalid.';
  }
  if (
    baseUrl.protocol !== 'https:' ||
    baseUrl.origin !== SANDBOX_ORIGIN ||
    baseUrl.username ||
    baseUrl.password ||
    baseUrl.search ||
    baseUrl.hash ||
    `${baseUrl.pathname.replace(/\/+$/, '')}/` !== PAYMENT_API_PATH
  ) {
    return 'ZarinPal sandbox base URL is invalid.';
  }

  try {
    const callbackOrigin = new URL(config.WEB_ORIGIN);
    if (
      (callbackOrigin.protocol !== 'http:' && callbackOrigin.protocol !== 'https:') ||
      callbackOrigin.username ||
      callbackOrigin.password
    ) {
      return 'Payment callback origin is invalid.';
    }
  } catch {
    return 'Payment callback origin is invalid.';
  }
  return undefined;
}

@Injectable()
export class ZarinPalPaymentGateway implements PaymentGateway {
  public readonly name = ZARINPAL_PAYMENT_GATEWAY_NAME;

  private readonly request: ZarinPalHttpRequest;

  public constructor(
    private readonly config: ZarinPalGatewayConfig,
    request: ZarinPalHttpRequest = (input, init) => fetch(input, init),
    private readonly requestTimeoutMs = ZARINPAL_REQUEST_TIMEOUT_MS,
  ) {
    this.request = request;
  }

  public async startPayment(input: PaymentStartInput): Promise<PaymentStartResult> {
    this.assertConfigured();
    assertOrderNumber(input.orderNumber);
    const amountRial = toZarinPalRial(input.amountToman);
    const callbackUrl = new URL(CALLBACK_PATH, this.config.WEB_ORIGIN);
    callbackUrl.searchParams.set('orderNumber', input.orderNumber);
    callbackUrl.searchParams.set('amountToman', String(input.amountToman));

    const response = await this.post(PAYMENT_REQUEST_PATH, {
      merchant_id: this.config.ZARINPAL_MERCHANT_ID,
      amount: amountRial,
      description: `NOVA order ${input.orderNumber}`,
      callback_url: callbackUrl.toString(),
    });
    if (!SUCCESS_CODES.has(response.data.code) || response.data.code !== 100) {
      throw new BadGatewayException('ZarinPal payment request was rejected.');
    }
    const authority = providerIdentifier(response.data.authority, 'ZarinPal authority is invalid.');
    return {
      redirectUrl: `${SANDBOX_ORIGIN}/pg/StartPay/${encodeURIComponent(authority)}`,
      providerTransactionId: authority,
    };
  }

  public async verifyCallback(input: PaymentCallbackInput): Promise<PaymentCallbackResult> {
    this.assertConfigured();
    if (!isRecord(input.payload)) throw new Error('ZarinPal callback is malformed.');

    const authority = readString(input.payload, 'Authority', 'authority');
    const status = readString(input.payload, 'Status', 'status')?.toUpperCase();
    const orderNumber = readString(input.payload, 'orderNumber', 'order_number');
    const amountValue = readString(input.payload, 'amountToman', 'amount_toman');
    if (!authority || !status || !orderNumber || !amountValue) {
      throw new Error('ZarinPal callback is incomplete.');
    }
    assertIdentifier(authority, 'ZarinPal authority is invalid.');
    assertOrderNumber(orderNumber);
    if (status !== 'OK' && status !== 'NOK') throw new Error('ZarinPal status is invalid.');

    const amountToman = Number(amountValue);
    const amountRial = toZarinPalRial(amountToman);
    if (status === 'NOK') {
      return {
        providerEventId: authority,
        orderNumber,
        status: 'FAILED',
        amountToman,
        providerTransactionId: authority,
      };
    }

    const response = await this.post(PAYMENT_VERIFY_PATH, {
      merchant_id: this.config.ZARINPAL_MERCHANT_ID,
      amount: amountRial,
      authority,
    });
    if (!SUCCESS_CODES.has(response.data.code)) {
      return {
        providerEventId: authority,
        orderNumber,
        status: 'FAILED',
        amountToman,
        providerTransactionId: authority,
      };
    }

    const providerEventId = response.data.ref_id
      ? providerIdentifier(response.data.ref_id, 'ZarinPal transaction identifier is invalid.')
      : authority;
    return {
      providerEventId,
      orderNumber,
      status: 'PAID',
      amountToman,
      providerTransactionId: authority,
    };
  }

  public async refundPayment(input: PaymentRefundInput): Promise<PaymentRefundResult> {
    this.assertConfigured();
    assertOrderNumber(input.orderNumber);
    if (input.isFullRefund !== true) {
      throw new ServiceUnavailableException('ZarinPal partial refunds are not configured.');
    }
    toZarinPalRial(input.amountToman);
    const authority = input.providerTransactionId?.trim();
    if (!authority) throw new Error('ZarinPal authority is required for reversal.');
    assertIdentifier(authority, 'ZarinPal authority is invalid.');

    const response = await this.post(PAYMENT_REVERSE_PATH, {
      merchant_id: this.config.ZARINPAL_MERCHANT_ID,
      authority,
    });
    if (response.data.code !== 100)
      throw new BadGatewayException('ZarinPal reversal was rejected.');

    const providerRefundId = response.data.id
      ? providerIdentifier(response.data.id, 'ZarinPal refund identifier is invalid.')
      : authority;
    return { providerRefundId };
  }

  private assertConfigured(): void {
    const error = configurationError(this.config);
    if (error) throw new ServiceUnavailableException('ZarinPal sandbox is not configured.');
  }

  private async post(path: string, body: Record<string, unknown>): Promise<ProviderResponse> {
    const baseUrl = new URL(
      this.config.ZARINPAL_BASE_URL ?? `${SANDBOX_ORIGIN}${PAYMENT_API_PATH}`,
    );
    const url = new URL(path, baseUrl);
    let response: Response;
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), this.requestTimeoutMs);
    try {
      response = await this.request(url, {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch {
      throw new BadGatewayException('ZarinPal request failed.');
    } finally {
      clearTimeout(timeoutHandle);
    }
    if (!response.ok) throw new BadGatewayException('ZarinPal request failed.');

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new BadGatewayException('ZarinPal response was malformed.');
    }
    try {
      return asProviderResponse(payload);
    } catch {
      throw new BadGatewayException('ZarinPal response was malformed.');
    }
  }
}
