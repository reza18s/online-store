import { type CheckoutRequestInput, type CheckoutQuote } from '@nova/api-client';

export type CheckoutStep = 'address' | 'shipping' | 'payment';

export type CheckoutFailureKind =
  | 'offline'
  | 'session-expired'
  | 'permission'
  | 'invalid-address'
  | 'unsupported-region'
  | 'shipping-unavailable'
  | 'quote-expired'
  | 'stock-conflict'
  | 'price-change'
  | 'coupon-error'
  | 'payment-unavailable'
  | 'network'
  | 'generic';

export type PaymentRecoveryState =
  'redirecting' | 'pending' | 'failed' | 'cancelled' | 'timeout' | 'recovery';

export interface CheckoutRouteParams {
  addressId: string;
  shippingMethod: CheckoutRequestInput['shippingMethod'];
  couponCode: string;
  orderNumber: string;
  paymentState: PaymentRecoveryState | null;
}

export interface CheckoutFailure {
  kind: CheckoutFailureKind;
  title: string;
  message: string;
  actionLabel: string;
  action: 'retry' | 'address' | 'shipping' | 'payment' | 'login' | 'cart' | 'orders';
}

export const paymentStates = new Set<PaymentRecoveryState>([
  'redirecting',
  'pending',
  'failed',
  'cancelled',
  'timeout',
  'recovery',
]);

export type CheckoutIdempotencyQuote = {
  cartId: CheckoutQuote['cartId'];
  lines: ReadonlyArray<
    Pick<CheckoutQuote['lines'][number], 'cartItemId' | 'variantId' | 'quantity'>
  >;
};

export const idempotencyStorageKey = 'nova.checkout.idempotency.v1';

export type CheckoutIdempotencyStorage = Pick<Storage, 'getItem' | 'setItem'>;

export const unconfiguredPaymentGatewayMessage = 'درگاه پرداخت پیکربندی نشده است.';
