import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { Environment } from '@nova/config';

import {
  LOCAL_PAYMENT_GATEWAY_NAME,
  type PaymentCallbackInput,
  type PaymentCallbackResult,
  type PaymentGateway,
  type PaymentRefundInput,
  type PaymentRefundResult,
  type PaymentStartInput,
  type PaymentStartResult,
} from '../checkout/payment.gateway';

const LOCAL_PAYMENT_ROUTE = '#checkout/local-payment';
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/;
const ORDER_NUMBER_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const TOKEN_PATTERN = /^[0-9a-f]{64}$/;

export type LocalPaymentGatewayConfig = Pick<Environment, 'WEB_ORIGIN' | 'AUTH_SECRET'>;

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

function assertOrderNumber(value: string): void {
  if (!ORDER_NUMBER_PATTERN.test(value)) {
    throw new BadRequestException('شماره سفارش برای پرداخت محلی معتبر نیست.');
  }
}

function assertAmount(value: number): void {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new BadRequestException('مبلغ پرداخت محلی معتبر نیست.');
  }
}

function assertIdentifier(value: string, message: string): void {
  if (!IDENTIFIER_PATTERN.test(value)) throw new BadRequestException(message);
}

function assertWebOrigin(value: string): URL {
  let origin: URL;
  try {
    origin = new URL(value);
  } catch {
    throw new ServiceUnavailableException('آدرس فروشگاه برای پرداخت محلی معتبر نیست.');
  }
  if (
    (origin.protocol !== 'http:' && origin.protocol !== 'https:') ||
    origin.username ||
    origin.password ||
    origin.search ||
    origin.hash
  ) {
    throw new ServiceUnavailableException('آدرس فروشگاه برای پرداخت محلی معتبر نیست.');
  }
  return origin;
}

function transactionId(input: PaymentStartInput): string {
  return `local-${createHash('sha256')
    .update(`${input.idempotencyKey}:${input.orderNumber}:${input.amountToman}`, 'utf8')
    .digest('hex')
    .slice(0, 48)}`;
}

function callbackToken(
  secret: string,
  orderNumber: string,
  amountToman: number,
  providerTransactionId: string,
  status: 'OK' | 'NOK',
): string {
  return createHmac('sha256', secret)
    .update(`${status}:${orderNumber}:${amountToman}:${providerTransactionId}`, 'utf8')
    .digest('hex');
}

function hasValidToken(received: string, expected: string): boolean {
  if (!TOKEN_PATTERN.test(received)) return false;
  return timingSafeEqual(Buffer.from(received, 'hex'), Buffer.from(expected, 'hex'));
}

@Injectable()
export class LocalPaymentGateway implements PaymentGateway {
  public readonly name = LOCAL_PAYMENT_GATEWAY_NAME;

  public constructor(private readonly config: LocalPaymentGatewayConfig) {}

  public async startPayment(input: PaymentStartInput): Promise<PaymentStartResult> {
    const origin = this.assertConfigured();
    assertOrderNumber(input.orderNumber);
    assertAmount(input.amountToman);
    if (!input.idempotencyKey.trim()) {
      throw new BadRequestException('کلید پرداخت محلی معتبر نیست.');
    }

    const providerTransactionId = transactionId(input);
    const token = callbackToken(
      this.config.AUTH_SECRET,
      input.orderNumber,
      input.amountToman,
      providerTransactionId,
      'OK',
    );
    const redirect = new URL(origin.toString());
    const params = new URLSearchParams({
      orderNumber: input.orderNumber,
      amountToman: String(input.amountToman),
      transactionId: providerTransactionId,
      status: 'OK',
      token,
    });
    redirect.hash = `${LOCAL_PAYMENT_ROUTE}?${params.toString()}`;
    return { redirectUrl: redirect.toString(), providerTransactionId };
  }

  public async verifyCallback(input: PaymentCallbackInput): Promise<PaymentCallbackResult> {
    this.assertConfigured();
    if (!isRecord(input.payload)) {
      throw new BadRequestException('callback پرداخت محلی معتبر نیست.');
    }

    const orderNumber = readString(input.payload, 'orderNumber', 'order_number');
    const amountValue = readString(input.payload, 'amountToman', 'amount_toman');
    const providerTransactionId = readString(
      input.payload,
      'transactionId',
      'providerTransactionId',
      'provider_event_id',
    );
    const token = readString(input.payload, 'token');
    const status = readString(input.payload, 'Status', 'status')?.toUpperCase();
    if (!orderNumber || !amountValue || !providerTransactionId || !token || !status) {
      throw new BadRequestException('callback پرداخت محلی ناقص است.');
    }
    assertOrderNumber(orderNumber);
    assertIdentifier(providerTransactionId, 'شناسه تراکنش محلی معتبر نیست.');
    if (status !== 'OK' && status !== 'NOK') {
      throw new BadRequestException('وضعیت پرداخت محلی معتبر نیست.');
    }

    const amountToman = Number(amountValue);
    assertAmount(amountToman);
    const expectedToken = callbackToken(
      this.config.AUTH_SECRET,
      orderNumber,
      amountToman,
      providerTransactionId,
      status,
    );
    if (!hasValidToken(token, expectedToken)) {
      throw new BadRequestException('نشانه پرداخت محلی معتبر نیست.');
    }

    return {
      providerEventId: providerTransactionId,
      orderNumber,
      status: status === 'OK' ? 'PAID' : 'FAILED',
      amountToman,
      providerTransactionId,
    };
  }

  public async refundPayment(input: PaymentRefundInput): Promise<PaymentRefundResult> {
    this.assertConfigured();
    assertOrderNumber(input.orderNumber);
    assertAmount(input.amountToman);
    if (!input.idempotencyKey.trim()) {
      throw new BadRequestException('کلید بازپرداخت محلی معتبر نیست.');
    }
    return {
      providerRefundId: `local-refund-${createHash('sha256')
        .update(`${input.idempotencyKey}:${input.orderNumber}:${input.amountToman}`, 'utf8')
        .digest('hex')
        .slice(0, 48)}`,
    };
  }

  private assertConfigured(): URL {
    if (!this.config.AUTH_SECRET?.trim()) {
      throw new ServiceUnavailableException('کلید پرداخت محلی پیکربندی نشده است.');
    }
    return assertWebOrigin(this.config.WEB_ORIGIN);
  }
}
