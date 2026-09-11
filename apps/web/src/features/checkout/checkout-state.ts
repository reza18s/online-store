import { ApiClientError, type CheckoutRequestInput, type CheckoutQuote } from '@nova/api-client';

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

const paymentStates = new Set<PaymentRecoveryState>([
  'redirecting',
  'pending',
  'failed',
  'cancelled',
  'timeout',
  'recovery',
]);

function readPaymentState(value: string | null): PaymentRecoveryState | null {
  return value && paymentStates.has(value as PaymentRecoveryState)
    ? (value as PaymentRecoveryState)
    : null;
}

export function normalizeCheckoutStep(step: string): CheckoutStep {
  return step === 'shipping' || step === 'payment' ? step : 'address';
}

export function parseCheckoutRouteParams(queryString = ''): CheckoutRouteParams {
  const params = new URLSearchParams(
    queryString.startsWith('?') ? queryString.slice(1) : queryString,
  );
  return {
    addressId: params.get('addressId')?.trim() ?? '',
    shippingMethod: params.get('shipping') === 'EXPRESS' ? 'EXPRESS' : 'STANDARD',
    couponCode: params.get('coupon')?.trim() ?? '',
    orderNumber: params.get('orderNumber')?.trim() ?? '',
    paymentState: readPaymentState(params.get('paymentState') ?? params.get('status')),
  };
}

export function buildCheckoutHref(
  step: CheckoutStep,
  input: Pick<CheckoutRequestInput, 'addressId' | 'shippingMethod' | 'couponCode'>,
): string {
  const params = new URLSearchParams();
  if (input.addressId) params.set('addressId', input.addressId);
  if (step !== 'address') params.set('shipping', input.shippingMethod);
  if (step === 'payment' && input.couponCode?.trim()) {
    params.set('coupon', input.couponCode.trim());
  }
  const query = params.toString();
  return `#checkout/${step}${query ? `?${query}` : ''}`;
}

function storageAvailable(): Storage | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
}

function createRandomKey(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `nova-checkout-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

function checkoutFingerprint(input: CheckoutRequestInput): string {
  return JSON.stringify({
    addressId: input.addressId,
    shippingMethod: input.shippingMethod,
    couponCode: input.couponCode?.trim() || undefined,
  });
}

const idempotencyStorageKey = 'nova.checkout.idempotency.v1';

export function getStableCheckoutIdempotencyKey(
  input: CheckoutRequestInput,
  storage: Pick<Storage, 'getItem' | 'setItem'> | undefined = storageAvailable(),
): string {
  const fingerprint = checkoutFingerprint(input);
  if (storage) {
    try {
      const stored = JSON.parse(storage.getItem(idempotencyStorageKey) ?? '{}') as unknown;
      const entries =
        stored && typeof stored === 'object' && !Array.isArray(stored)
          ? (stored as Record<string, unknown>)
          : {};
      const existing = entries[fingerprint];
      if (typeof existing === 'string' && existing.trim()) return existing;
      const key = createRandomKey();
      storage.setItem(idempotencyStorageKey, JSON.stringify({ ...entries, [fingerprint]: key }));
      return key;
    } catch {
      return createRandomKey();
    }
  }
  return createRandomKey();
}

export function isQuoteExpired(quote: CheckoutQuote | undefined, now = Date.now()): boolean {
  if (!quote) return false;
  const expiresAt = Date.parse(quote.expiresAt);
  return !Number.isFinite(expiresAt) || expiresAt <= now;
}

function errorCode(error: unknown): string {
  return error instanceof ApiClientError ? (error.payload?.error.code ?? '') : '';
}

function errorText(error: unknown): string {
  return error instanceof ApiClientError && error.payload?.error.message
    ? error.payload.error.message
    : error instanceof Error
      ? error.message
      : '';
}

function looksOffline(error: unknown): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  return error instanceof TypeError && /fetch|network|connection/i.test(error.message);
}

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
    return {
      kind: 'payment-unavailable',
      title: 'درگاه پرداخت در دسترس نیست',
      message: 'سفارش یا پرداختی ثبت نشد. پس از پیکربندی درگاه واقعی، دوباره تلاش کنید.',
      actionLabel: 'بازگشت به پرداخت',
      action: 'payment',
    };
  }
  if (error instanceof ApiClientError && error.status >= 500) {
    return {
      kind: 'network',
      title: 'سرویس موقتاً پاسخ نمی‌دهد',
      message: 'سفارش ثبت نشده است. چند لحظه بعد همین مرحله را دوباره امتحان کنید.',
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

export function paymentRecoveryCopy(state: PaymentRecoveryState): {
  title: string;
  message: string;
  actionLabel: string;
} {
  switch (state) {
    case 'pending':
      return {
        title: 'پرداخت هنوز تأیید نشده است',
        message: 'وضعیت پرداخت توسط سرور بررسی می‌شود. تا دریافت نتیجه، دوباره پرداخت نکنید.',
        actionLabel: 'بررسی دوباره وضعیت',
      };
    case 'failed':
      return {
        title: 'پرداخت ناموفق بود',
        message:
          'از حساب شما تأیید موفقی دریافت نشده است. می‌توانید وضعیت سفارش را ببینید یا دوباره از مرحله پرداخت شروع کنید.',
        actionLabel: 'بازگشت به پرداخت',
      };
    case 'cancelled':
      return {
        title: 'پرداخت لغو شد',
        message:
          'سفارش جدیدی ثبت نشده است. در صورت تمایل، پرداخت را از همین سفارش دوباره بررسی کنید.',
        actionLabel: 'بازگشت به پرداخت',
      };
    case 'timeout':
      return {
        title: 'زمان پاسخ پرداخت تمام شد',
        message:
          'نتیجه قطعی دریافت نشد. برای جلوگیری از پرداخت تکراری، ابتدا وضعیت سفارش را بررسی کنید.',
        actionLabel: 'مشاهده وضعیت سفارش',
      };
    case 'redirecting':
      return {
        title: 'در حال انتقال به درگاه',
        message: 'درگاه پرداخت باز می‌شود. صفحه را نبندید.',
        actionLabel: 'ادامه',
      };
    case 'recovery':
      return {
        title: 'بازگشت از پرداخت',
        message:
          'نتیجه پرداخت از پارامترهای مرورگر تأیید نمی‌شود؛ وضعیت معتبر سفارش را از سرور می‌خوانیم.',
        actionLabel: 'بررسی وضعیت',
      };
  }
}
