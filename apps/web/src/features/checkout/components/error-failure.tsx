import {
  classifyCheckoutFailure,
  type CheckoutFailure,
} from '@/features/checkout/api/checkout-state';

export function errorFailure(error: unknown, fallback: string): CheckoutFailure {
  const failure = classifyCheckoutFailure(error);
  return failure.kind === 'generic' &&
    failure.message === 'اطلاعات سفارش را بررسی کنید و دوباره تلاش کنید.'
    ? { ...failure, message: fallback }
    : failure;
}
