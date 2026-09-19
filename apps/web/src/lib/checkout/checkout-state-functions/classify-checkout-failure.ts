import { ApiClientError } from '@nova/api-client';

import type { CheckoutFailure } from '../checkout-state-shared';

import { errorCode } from './error-code';

import { errorText } from './error-text';

import { isConfirmedTerminalPaymentStartFailure } from './is-confirmed-terminal-payment-start-failure';

import { looksOffline } from './looks-offline';

export function classifyCheckoutFailure(error: unknown): CheckoutFailure {
  const text = errorText(error).toLowerCase();
  const code = errorCode(error);
  if (looksOffline(error)) {
    return {
      kind: 'offline',
      title: 'اتصال اینترنت برقرار نیست',
      message: 'اطلاعات واردشده حفظ شده است. پس از اتصال دوباره، همین مرحله را تکرار کنید.',
      actionLabel: 'تلاش دوباره',
      action: 'retry',
    };
  }
  if (error instanceof ApiClientError && error.status === 401) {
    return {
      kind: 'session-expired',
      title: 'نشست شما منقضی شده است',
      message: 'برای ادامه پرداخت، دوباره وارد حساب نوا شوید.',
      actionLabel: 'ورود به حساب',
      action: 'login',
    };
  }
  if (error instanceof ApiClientError && error.status === 403) {
    return {
      kind: 'permission',
      title: 'دسترسی به این سفارش ممکن نیست',
      message: 'این آدرس یا سفارش به حساب فعلی تعلق ندارد. آدرس حساب خود را انتخاب کنید.',
      actionLabel: 'انتخاب آدرس',
      action: 'address',
    };
  }
  if (/(coupon|کد تخفیف|کوپن)/i.test(`${code} ${text}`)) {
    return {
      kind: 'coupon-error',
      title: 'کد تخفیف اعمال نشد',
      message: 'کد را بررسی کنید یا بدون آن و با مبلغ به‌روز سفارش ادامه دهید.',
      actionLabel: 'اصلاح کد تخفیف',
      action: 'payment',
    };
  }
  if (/(unsupported|region|منطقه|استان|شهر پشتیبانی|آدرس قابل)/i.test(`${code} ${text}`)) {
    return {
      kind: 'unsupported-region',
      title: 'این منطقه پشتیبانی نمی‌شود',
      message: 'یک آدرس معتبر در محدوده ارسال نوا انتخاب کنید.',
      actionLabel: 'تغییر آدرس',
      action: 'address',
    };
  }
  if (/(shipping|delivery|ارسال|تحویل)/i.test(`${code} ${text}`)) {
    return {
      kind: 'shipping-unavailable',
      title: 'روش ارسال در دسترس نیست',
      message: 'روش دیگری را انتخاب کنید یا آدرس تحویل را تغییر دهید.',
      actionLabel: 'انتخاب روش ارسال',
      action: 'shipping',
    };
  }
  if (/(quote|expired|منقضی|اعتبار قیمت|قیمت نهایی)/i.test(`${code} ${text}`)) {
    return {
      kind: 'quote-expired',
      title: 'قیمت سفارش نیاز به به‌روزرسانی دارد',
      message: 'مبلغ نهایی تغییر کرده است. قیمت جدید را دریافت و پیش از پرداخت بررسی کنید.',
      actionLabel: 'به‌روزرسانی مبلغ',
      action: 'retry',
    };
  }
  if (/(stock|inventory|موجودی|تعداد کالا|سبد خالی)/i.test(`${code} ${text}`)) {
    return {
      kind: 'stock-conflict',
      title: 'موجودی سبد تغییر کرده است',
      message: 'سبد خرید را بررسی کنید تا تعداد یا کالاهای در دسترس به‌روز شوند.',
      actionLabel: 'بررسی سبد خرید',
      action: 'cart',
    };
  }
  if (/(price|مبلغ|قیمت)/i.test(`${code} ${text}`)) {
    return {
      kind: 'price-change',
      title: 'قیمت یکی از کالاها تغییر کرده است',
      message: 'مبلغ جدید را بررسی کنید و فقط در صورت تأیید دوباره ادامه دهید.',
      actionLabel: 'به‌روزرسانی مبلغ',
      action: 'retry',
    };
  }
  if (/(address|آدرس|postal|کد پستی)/i.test(`${code} ${text}`)) {
    return {
      kind: 'invalid-address',
      title: 'اطلاعات آدرس معتبر نیست',
      message: 'فیلدهای آدرس را اصلاح کنید؛ اطلاعات واردشده تا حد امکان حفظ می‌شود.',
      actionLabel: 'اصلاح آدرس',
      action: 'address',
    };
  }
  if (
    error instanceof ApiClientError &&
    error.status === 503 &&
    /payment|درگاه|پرداخت/i.test(text)
  ) {
    const terminalPaymentStartFailure = isConfirmedTerminalPaymentStartFailure(error);
    return {
      kind: 'payment-unavailable',
      title: 'درگاه پرداخت در دسترس نیست',
      message: terminalPaymentStartFailure
        ? 'تلاش قبلی لغو شده است؛ پس از پیکربندی درگاه واقعی، پرداخت را دوباره از همین مرحله شروع کنید.'
        : 'درگاه پرداخت موقتاً در دسترس نیست. پس از بررسی وضعیت سفارش، دوباره از همین مرحله ادامه دهید.',
      actionLabel: terminalPaymentStartFailure ? 'شروع دوباره پرداخت' : 'بازگشت به پرداخت',
      action: terminalPaymentStartFailure ? 'retry' : 'payment',
    };
  }
  if (error instanceof ApiClientError && error.status >= 500) {
    return {
      kind: 'network',
      title: 'سرویس موقتاً پاسخ نمی‌دهد',
      message:
        'نتیجه ثبت سفارش قطعی نیست؛ ممکن است تلاش لغوشده‌ای در حساب شما ثبت شده باشد. چند لحظه بعد همین مرحله را دوباره امتحان کنید.',
      actionLabel: 'تلاش دوباره',
      action: 'retry',
    };
  }
  return {
    kind: 'generic',
    title: 'ادامه سفارش ممکن نشد',
    message: errorText(error) || 'اطلاعات سفارش را بررسی کنید و دوباره تلاش کنید.',
    actionLabel: 'تلاش دوباره',
    action: 'retry',
  };
}
