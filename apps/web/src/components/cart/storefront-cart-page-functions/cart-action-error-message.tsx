import { ApiClientError } from '@nova/api-client';

export function cartActionErrorMessage(error: unknown): string {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return 'اتصال شبکه برقرار نیست؛ پس از اتصال دوباره تلاش کنید.';
  }
  if (error instanceof ApiClientError) {
    if (error.status === 409)
      return 'قیمت یا موجودی یکی از کالاها تغییر کرده است؛ سبد را دوباره بررسی کنید.';
    if (error.payload?.error.message) return error.payload.error.message;
  }
  return error instanceof Error && error.message ? error.message : 'عملیات سبد خرید انجام نشد.';
}
