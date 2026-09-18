import { Injectable, ServiceUnavailableException } from '@nestjs/common';

export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');
export const LOCAL_PAYMENT_GATEWAY_NAME = 'local';

export function isAllowedPaymentRedirectUrl(
  redirectUrl: string,
  gatewayName: string,
  webOrigin: string,
): boolean {
  try {
    const url = new URL(redirectUrl);
    if (gatewayName !== LOCAL_PAYMENT_GATEWAY_NAME) return url.protocol === 'https:';

    const origin = new URL(webOrigin);
    return (
      (origin.protocol === 'http:' || origin.protocol === 'https:') &&
      url.protocol === origin.protocol &&
      url.origin === origin.origin &&
      !url.username &&
      !url.password &&
      !url.search &&
      url.hash.startsWith('#checkout/local-payment?')
    );
  } catch {
    return false;
  }
}

export interface PaymentStartInput {
  orderNumber: string;
  amountToman: number;
  idempotencyKey: string;
}

export interface PaymentStartResult {
  redirectUrl: string;
  providerTransactionId?: string;
}

export interface PaymentCallbackInput {
  payload: unknown;
  signature?: string;
}

export interface PaymentCallbackResult {
  providerEventId: string;
  orderNumber: string;
  status: 'PAID' | 'FAILED';
  amountToman: number;
  providerTransactionId?: string;
}

export interface PaymentRefundInput {
  orderNumber: string;
  amountToman: number;
  isFullRefund?: boolean;
  providerTransactionId?: string;
  idempotencyKey: string;
  reason: string;
}

export interface PaymentRefundResult {
  providerRefundId?: string;
}

export interface PaymentGateway {
  readonly name: string;
  startPayment(input: PaymentStartInput): Promise<PaymentStartResult>;
  verifyCallback(input: PaymentCallbackInput): Promise<PaymentCallbackResult>;
  refundPayment(input: PaymentRefundInput): Promise<PaymentRefundResult>;
}

@Injectable()
export class UnconfiguredPaymentGateway implements PaymentGateway {
  public readonly name = 'unconfigured';

  public async startPayment(): Promise<never> {
    throw new ServiceUnavailableException('درگاه پرداخت پیکربندی نشده است.');
  }

  public async verifyCallback(): Promise<never> {
    throw new ServiceUnavailableException('درگاه پرداخت پیکربندی نشده است.');
  }

  public async refundPayment(): Promise<never> {
    throw new ServiceUnavailableException('درگاه پرداخت پیکربندی نشده است.');
  }
}
