import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';

import { Button } from '@nova/ui';
import { ApiClientError } from '@nova/api-client';
import type {
  AdminCatalogProductListItem,
  AdminCatalogProductStatus,
  AdminInventoryItem,
  AdminOrderSummary,
  CartView,
} from '@nova/api-client';

import {
  useAdminCatalogCategories,
  useAdminCatalogProducts,
  useStaffLogin,
  useStaffLogout,
  useStaffUser,
} from './features/admin/admin-catalog-api';
import { isStaffAuthFailure, isStaffAuthorizationFailure } from './features/admin/admin-auth';
import { useAdminInventory } from './features/admin/admin-inventory-api';
import { useAdminOrders } from './features/admin/admin-orders-api';
import { AdminOrderDetailPage, AdminOrdersPage } from './features/admin/admin-orders-page';
import { AdminSupportFinancePage } from './features/admin/admin-support-finance-page';
import { AdminCatalogInventoryPage } from './features/admin/admin-catalog-inventory-page';
import { AdminContentSeoPage } from './features/admin/admin-content-seo-page';
import {
  useCurrentCustomer,
  useRequestCustomerOtp,
  useVerifyCustomerOtp,
} from './features/auth/auth-api';
import { Icon, type IconName } from './shared/icon';
import {
  parseHashRoute,
  decodeHashSegment,
  useHashRoute,
  useScrollToTop,
  type PreviewState,
} from './shared/hash-route';
import { Header, Logo, MenuDrawer, MobileBottomNav, SearchDialog } from './shared/site-shell';
import { applySeoDocument, clientSeoForHashRoute, readInitialRenderContext } from './seo/metadata';
import type { StorefrontProduct } from './features/catalog/catalog-api';
import { StorefrontDiscoveryPage } from './features/catalog/storefront-discovery-page';
import { StorefrontCartPage } from './features/cart/storefront-cart-page';
import {
  CheckoutConfirmationPage,
  CheckoutPage as StorefrontCheckoutPage,
  CheckoutPaymentRecoveryPage,
} from './features/checkout/checkout-page';
import {
  CustomerAccountPage,
  CustomerAddressBookPage,
  CustomerOrderPage,
  CustomerReturnPage,
} from './features/account';
import { PublicContentSystemPage } from './features/content/public-content-system-page';
import { useCart } from './features/cart/cart-api';

type Product = StorefrontProduct;

const products: Product[] = [
  {
    slug: 'linen-overshirt',
    name: 'مانتوی لینن کمربندی آوا',
    audience: 'women',
    category: 'مانتو و رویه',
    price: 2490000,
    compareAt: 2890000,
    image: '/assets/nova-product-linen-overshirt.webp',
    alt: 'مانتوی لینن روشن با کمربند پارچه‌ای',
    colors: ['#e6ddd0', '#a89b8d', '#272220'],
    tag: 'تازه‌وارد',
    stock: 'موجود',
  },
  {
    slug: 'oxford-shirt',
    name: 'پیراهن آکسفورد مردانه',
    audience: 'men',
    category: 'پیراهن مردانه',
    price: 1890000,
    image: '/assets/nova-product-oxford-shirt.webp',
    alt: 'پیراهن آکسفورد آبی روشن',
    colors: ['#b7c7dc', '#263d68'],
    tag: 'پرفروش',
    stock: 'موجود',
  },
  {
    slug: 'kids-knit-set',
    name: 'ست دورس و شلوار کودک',
    audience: 'children',
    category: 'لباس کودک',
    price: 1690000,
    image: '/assets/nova-product-kids-set.webp',
    alt: 'ست دورس سبز زیتونی کودک',
    colors: ['#65705b', '#263026'],
    tag: 'سایزهای کامل',
    stock: 'موجود',
  },
  {
    slug: 'textured-scarf',
    name: 'شال بافت برجسته',
    audience: 'women',
    category: 'اکسسوری',
    price: 890000,
    image: '/assets/nova-product-textured-scarf.webp',
    alt: 'شال بافتنی با رنگ خنثی',
    colors: ['#e7ded2', '#9b8b78'],
    tag: 'اکسسوری',
    stock: 'موجود',
  },
  {
    slug: 'soft-trousers',
    name: 'شلوار نرم و راسته',
    audience: 'women',
    category: 'شلوار',
    price: 1990000,
    image: '/assets/nova-product-soft-trousers.webp',
    alt: 'شلوار پارچه‌ای نرم به رنگ خاکی',
    colors: ['#b1a394', '#292621'],
    stock: 'رو به اتمام',
  },
  {
    slug: 'knit-cardigan',
    name: 'ژاکت بافت یقه‌گرد',
    audience: 'women',
    category: 'بافت',
    price: 2190000,
    image: '/assets/nova-product-knit-cardigan.webp',
    alt: 'ژاکت بافتنی قهوه‌ای روشن',
    colors: ['#817464', '#44382d', '#d7cbbb'],
    tag: 'فصل تازه',
    stock: 'موجود',
  },
];

function formatToman(amount: number) {
  return `${new Intl.NumberFormat('fa-IR').format(amount)} تومان`;
}

function formatPersianNumber(value: number) {
  return new Intl.NumberFormat('fa-IR').format(value);
}

function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiClientError && error.payload?.error.message) {
    return error.payload.error.message;
  }
  return error instanceof Error ? error.message : fallback;
}

function normalizeSeoPath(path: string): string {
  const normalized = path.trim().replace(/\/+$/, '');
  return normalized || '/';
}

const authPhoneStorageKey = 'nova.auth.phone';

function readAuthPhone(): string {
  try {
    return window.sessionStorage.getItem(authPhoneStorageKey) ?? '';
  } catch {
    return '';
  }
}

function writeAuthPhone(phone: string): void {
  try {
    window.sessionStorage.setItem(authPhoneStorageKey, phone);
  } catch {
    // Session storage can be unavailable in privacy-restricted browser contexts.
  }
}

function clearAuthPhone(): void {
  try {
    window.sessionStorage.removeItem(authPhoneStorageKey);
  } catch {
    // Session storage can be unavailable in privacy-restricted browser contexts.
  }
}

function authErrorMessage(error: unknown): string {
  return apiErrorMessage(error, 'ورود انجام نشد؛ دوباره تلاش کنید.');
}

function AuthPage({
  mode,
  queryString = '',
}: {
  mode: 'request' | 'verify';
  queryString?: string;
}) {
  const isVerify = mode === 'verify';
  const requestOtpMutation = useRequestCustomerOtp();
  const verifyOtpMutation = useVerifyCustomerOtp();
  const [phone, setPhone] = useState(() => (isVerify ? readAuthPhone() : ''));
  const [code, setCode] = useState('');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const challengeId = new URLSearchParams(queryString).get('challengeId') ?? '';
  const isSubmitting = requestOtpMutation.isPending || verifyOtpMutation.isPending;

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (isVerify) {
      if (!challengeId) {
        setFormError('نشست ورود پیدا نشد؛ دوباره درخواست کد بدهید.');
        return;
      }
      if (!code.trim()) {
        setFormError('کد تأیید را وارد کنید.');
        return;
      }

      try {
        await verifyOtpMutation.mutateAsync({ challengeId, code: code.trim() });
        clearAuthPhone();
        window.location.hash = '#account';
      } catch (error) {
        setFormError(authErrorMessage(error));
      }
      return;
    }

    if (!phone.trim()) {
      setFormError('شماره موبایل را وارد کنید.');
      return;
    }

    try {
      const result = await requestOtpMutation.mutateAsync({ phone: phone.trim() });
      writeAuthPhone(phone.trim());
      window.location.hash = `#auth/verify?challengeId=${encodeURIComponent(result.challengeId)}`;
    } catch (error) {
      setFormError(authErrorMessage(error));
    }
  };

  const resendCode = async () => {
    const storedPhone = phone.trim() || readAuthPhone();
    setFormError('');
    setSuccessMessage('');
    if (!storedPhone) {
      setFormError('شماره موبایل پیدا نشد؛ ابتدا شماره را وارد کنید.');
      return;
    }

    try {
      const result = await requestOtpMutation.mutateAsync({ phone: storedPhone });
      writeAuthPhone(storedPhone);
      setSuccessMessage('کد جدید ارسال شد.');
      window.location.hash = `#auth/verify?challengeId=${encodeURIComponent(result.challengeId)}`;
    } catch (error) {
      setFormError(authErrorMessage(error));
    }
  };

  return (
    <main className="shell inner-page mx-auto flex min-h-[70svh] w-[calc(100%-2rem)] max-w-[1280px] items-center justify-center bg-background">
      <section className="w-full max-w-xl border border-border bg-surface px-6 py-12 text-center shadow-card md:px-12">
        <span className="section-heading__eyebrow">
          NOVA / {isVerify ? 'OTP VERIFY' : 'SIGN IN'}
        </span>
        <span className="mx-auto mb-5 mt-3 flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-primary">
          <Icon name={isVerify ? 'check' : 'user'} size={24} />
        </span>
        <h1 className="text-3xl leading-relaxed">
          {isVerify ? 'کد ورود را وارد کنید' : 'به نوا خوش آمدید'}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-8 text-muted-foreground">
          {isVerify
            ? 'کد شش‌رقمی ارسال‌شده به شماره شما را وارد کنید. کد تا ۵ دقیقه معتبر است.'
            : 'برای ورود یا ساخت حساب، شماره موبایل خود را وارد کنید تا کد یکبار مصرف برای شما ارسال شود.'}
        </p>
        <form
          className="mx-auto mt-8 flex max-w-md flex-col gap-4 text-right"
          onSubmit={(event) => void submitForm(event)}
        >
          <label className="flex flex-col gap-2 text-sm font-medium">
            {isVerify ? 'کد تأیید' : 'شماره موبایل'}
            <input
              className="min-h-12 border border-border bg-background px-4 text-center outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-accent-soft"
              dir="ltr"
              inputMode={isVerify ? 'numeric' : 'tel'}
              maxLength={isVerify ? 6 : undefined}
              placeholder={isVerify ? '۱۲۳۴۵۶' : '۰۹۱۲ ۱۲۳ ۴۵۶۷'}
              required
              type={isVerify ? 'text' : 'tel'}
              value={isVerify ? code : phone}
              onChange={(event) =>
                isVerify ? setCode(event.target.value) : setPhone(event.target.value)
              }
              autoComplete={isVerify ? 'one-time-code' : 'tel'}
              aria-invalid={formError ? 'true' : undefined}
            />
          </label>
          {successMessage ? (
            <div className="inline-message inline-message--success" role="status">
              <Icon name="check" size={16} />
              {successMessage}
            </div>
          ) : null}
          {formError ||
          (isVerify && !challengeId ? 'نشست ورود پیدا نشد؛ دوباره درخواست کد بدهید.' : '') ? (
            <div className="inline-message inline-message--error" role="alert">
              <Icon name="warning" size={16} />
              {formError || 'نشست ورود پیدا نشد؛ دوباره درخواست کد بدهید.'}
            </div>
          ) : null}
          {isVerify ? (
            <Button disabled={isSubmitting || !challengeId} size="lg" type="submit">
              {verifyOtpMutation.isPending ? 'در حال بررسی...' : 'تأیید و ورود'}{' '}
              <Icon name="arrow-left" size={17} />
            </Button>
          ) : (
            <Button disabled={isSubmitting} size="lg" type="submit">
              {requestOtpMutation.isPending ? 'در حال ارسال...' : 'ارسال کد ورود'}{' '}
              <Icon name="arrow-left" size={17} />
            </Button>
          )}
        </form>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <a className="text-link" href={isVerify ? '#auth' : '#home'}>
            {isVerify ? 'تغییر شماره' : 'بازگشت به فروشگاه'} <Icon name="arrow-left" size={14} />
          </a>
          {isVerify ? (
            <button
              className="min-h-11 text-primary underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting}
              onClick={() => void resendCode()}
              type="button"
            >
              {requestOtpMutation.isPending ? 'در حال ارسال...' : 'ارسال دوباره کد'}
            </button>
          ) : null}
        </div>
      </section>
    </main>
  );
}

const previewStateCopy: Record<
  PreviewState,
  {
    eyebrow: string;
    title: string;
    description: string;
    icon: IconName;
    primary: string;
    primaryHref: string;
    secondary?: string;
    secondaryHref?: string;
  }
> = {
  'cart-conflict': {
    eyebrow: 'CART / STOCK CONFLICT',
    title: 'یک کالا در سبد شما تغییر کرده است',
    description:
      'موجودی یا قیمت یکی از کالاها تغییر کرده است. سبد را دوباره بررسی کنید تا مبلغ نهایی دقیق نمایش داده شود.',
    icon: 'warning',
    primary: 'بررسی سبد خرید',
    primaryHref: '#cart',
    secondary: 'ادامه خرید',
    secondaryHref: '#products',
  },
  'payment-pending': {
    eyebrow: 'PAYMENT / PENDING',
    title: 'در حال بررسی پرداخت',
    description:
      'پرداخت شما هنوز توسط درگاه تأیید نشده است. این صفحه را نبندید؛ وضعیت سفارش به‌صورت امن بررسی می‌شود.',
    icon: 'refresh',
    primary: 'پیگیری سفارش',
    primaryHref: '#account/orders',
    secondary: 'بازگشت به خانه',
    secondaryHref: '#home',
  },
  'payment-failed': {
    eyebrow: 'PAYMENT / FAILED',
    title: 'پرداخت انجام نشد',
    description:
      'پرداخت تأیید نشد اما سبد شما حفظ شده است. می‌توانید دوباره تلاش کنید یا روش پرداخت دیگری انتخاب کنید.',
    icon: 'close',
    primary: 'تلاش دوباره',
    primaryHref: '#checkout/payment',
    secondary: 'بازگشت به سبد',
    secondaryHref: '#cart',
  },
  'payment-recovery': {
    eyebrow: 'PAYMENT / RECOVERY',
    title: 'ادامه پرداخت سفارش',
    description:
      'برای تکمیل سفارش، پرداخت را از همان سبد و مبلغ معتبر ادامه دهید. وضعیت نهایی فقط توسط سرور تأیید می‌شود.',
    icon: 'refresh',
    primary: 'ادامه پرداخت',
    primaryHref: '#checkout/payment',
    secondary: 'مشاهده سفارش',
    secondaryHref: '#account/orders',
  },
  offline: {
    eyebrow: 'NOVA / OFFLINE',
    title: 'ارتباط با نوا برقرار نیست',
    description:
      'اتصال اینترنت را بررسی کنید و دوباره تلاش کنید. اطلاعات فرم سفارش تا جای ممکن در همین صفحه حفظ می‌شود.',
    icon: 'refresh',
    primary: 'تلاش دوباره',
    primaryHref: '#home',
    secondary: 'راهنمای پشتیبانی',
    secondaryHref: '#support',
  },
  error: {
    eyebrow: 'NOVA / ERROR',
    title: 'مشکلی پیش آمد',
    description:
      'این پیش‌نمایش نتوانست صفحه را کامل آماده کند. اگر مشکل ادامه داشت، با پشتیبانی نوا در تماس باشید.',
    icon: 'warning',
    primary: 'بازگشت به خانه',
    primaryHref: '#home',
    secondary: 'تماس با پشتیبانی',
    secondaryHref: '#support',
  },
  maintenance: {
    eyebrow: 'NOVA / MAINTENANCE',
    title: 'نوا برای لحظاتی در حال به‌روزرسانی است',
    description: 'فروشگاه به‌زودی دوباره در دسترس خواهد بود. از شکیبایی شما ممنونیم.',
    icon: 'settings',
    primary: 'تلاش دوباره',
    primaryHref: '#home',
  },
};

function PreviewStatePage({ state }: { state: PreviewState }) {
  const copy = previewStateCopy[state];
  return (
    <main className="shell inner-page mx-auto flex min-h-[70svh] w-[calc(100%-2rem)] max-w-[1280px] items-center justify-center bg-background">
      <section className="w-full max-w-2xl border border-border bg-surface px-6 py-14 text-center shadow-card md:px-12">
        <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft text-primary">
          <Icon name={copy.icon} size={27} />
        </span>
        <span className="section-heading__eyebrow">{copy.eyebrow}</span>
        <h1 className="mx-auto mt-2 max-w-xl text-3xl leading-relaxed">{copy.title}</h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-8 text-muted-foreground">
          {copy.description}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <a href={copy.primaryHref}>
              {copy.primary} <Icon name="arrow-left" size={17} />
            </a>
          </Button>
          {copy.secondary && copy.secondaryHref ? (
            <Button asChild size="lg" variant="outline">
              <a href={copy.secondaryHref}>{copy.secondary}</a>
            </Button>
          ) : null}
        </div>
      </section>
    </main>
  );
}

type AdminStatusTone = 'success' | 'info' | 'warning' | 'neutral';

const adminStatusClasses: Record<AdminStatusTone, string> = {
  success: 'bg-success-100 text-success',
  info: 'bg-info-100 text-info',
  warning: 'bg-warning-100 text-warning',
  neutral: 'bg-secondary text-muted-foreground',
};

function AdminStatusChip({
  tone = 'neutral',
  children,
}: {
  tone?: AdminStatusTone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-md px-2.5 py-1 text-[10px] font-medium ${adminStatusClasses[tone]}`}
    >
      {children}
    </span>
  );
}

function AdminMetricCard({
  label,
  value,
  note,
  icon,
  iconTone,
  orderClass,
}: {
  label: string;
  value: string;
  note: string;
  icon: IconName;
  iconTone: string;
  orderClass: string;
}) {
  return (
    <article
      className={`flex min-h-[124px] flex-col justify-between border border-border bg-surface p-4 shadow-card transition-shadow hover:shadow-float md:p-5 ${orderClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${iconTone}`}
        >
          <Icon name={icon} size={20} />
        </span>
        <span className="text-right text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="text-right">
        <strong className="block font-display text-2xl leading-none tracking-tight text-foreground md:text-[27px]">
          {value}
        </strong>
        <span className="mt-2 block text-[10px] text-success">{note}</span>
      </div>
    </article>
  );
}

function AdminSalesChart() {
  const labels = ['۱ مرداد', '۵ مرداد', '۱۰ مرداد', '۱۵ مرداد', '۲۰ مرداد', '۲۵ مرداد', '۳۰ مرداد'];
  return (
    <section
      className="overflow-hidden border border-border bg-surface p-4 shadow-card md:p-5"
      aria-labelledby="sales-chart-title"
    >
      <header className="flex items-start justify-between gap-4">
        <div className="text-right">
          <span className="section-heading__eyebrow">ANALYTICS / ۳۰ روز</span>
          <h2 id="sales-chart-title" className="mt-1 text-lg md:text-xl">
            فروش و درآمد
          </h2>
        </div>
        <button
          className="inline-flex min-h-10 items-center gap-2 border border-border bg-background px-3 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          type="button"
        >
          ۳۰ روز گذشته <Icon name="chevron-down" size={14} />
        </button>
      </header>
      <div className="mt-4 flex flex-wrap justify-end gap-4 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <i className="h-2.5 w-2.5 rounded-full bg-primary" />
          درآمد (تومان)
        </span>
        <span className="inline-flex items-center gap-2">
          <i className="h-2.5 w-2.5 rounded-full bg-border" />
          تعداد سفارش
        </span>
      </div>
      <div className="mt-2 overflow-x-auto">
        <svg
          className="h-[180px] min-w-[560px] w-full"
          viewBox="0 0 680 230"
          role="img"
          aria-label="نمودار فروش و درآمد در ۳۰ روز گذشته"
          preserveAspectRatio="none"
        >
          <g stroke="currentColor" className="text-border" strokeWidth="1" opacity="0.7">
            <line x1="34" y1="24" x2="650" y2="24" />
            <line x1="34" y1="67" x2="650" y2="67" />
            <line x1="34" y1="110" x2="650" y2="110" />
            <line x1="34" y1="153" x2="650" y2="153" />
            <line x1="34" y1="196" x2="650" y2="196" />
          </g>
          <path
            d="M34 177 C72 178 74 159 112 158 S145 146 168 142 S202 126 230 132 S268 155 292 145 S330 100 356 108 S391 155 420 146 S458 121 482 131 S518 99 548 110 S600 119 650 94"
            fill="none"
            stroke="#712D42"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M34 188 C72 182 76 175 112 179 S150 166 168 172 S200 160 230 168 S267 183 292 173 S330 145 356 157 S388 181 420 176 S456 158 482 165 S520 144 548 153 S604 158 650 145"
            fill="none"
            stroke="#C9C2BC"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M34 177 C72 178 74 159 112 158 S145 146 168 142 S202 126 230 132 S268 155 292 145 S330 100 356 108 S391 155 420 146 S458 121 482 131 S518 99 548 110 S600 119 650 94 L650 196 L34 196 Z"
            fill="#712D42"
            opacity="0.08"
          />
          <g fill="#712D42">
            <circle cx="34" cy="177" r="4" />
            <circle cx="112" cy="158" r="4" />
            <circle cx="168" cy="142" r="4" />
            <circle cx="230" cy="132" r="4" />
            <circle cx="292" cy="145" r="4" />
            <circle cx="356" cy="108" r="4" />
            <circle cx="420" cy="146" r="4" />
            <circle cx="482" cy="131" r="4" />
            <circle cx="548" cy="110" r="4" />
            <circle cx="650" cy="94" r="4" />
          </g>
        </svg>
      </div>
      <div className="flex justify-between gap-2 pr-8 text-[9px] text-muted-foreground" dir="ltr">
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </section>
  );
}

function AdminOrderStatus() {
  const statuses = [
    { label: 'در حال پردازش', value: '۲۸٪', color: 'bg-[#d9d1c8]' },
    { label: 'ارسال شده', value: '۴۵٪', color: 'bg-primary' },
    { label: 'تحویل شده', value: '۱۸٪', color: 'bg-[#989492]' },
    { label: 'لغو شده', value: '۶٪', color: 'bg-[#ef7a9d]' },
    { label: 'بازگشت', value: '۳٪', color: 'bg-[#e5ddd5]' },
  ];
  return (
    <section
      className="border border-border bg-surface p-4 shadow-card md:p-5"
      aria-labelledby="order-status-title"
    >
      <header className="flex items-center justify-between">
        <h2 id="order-status-title" className="text-lg md:text-xl">
          وضعیت سفارش‌ها
        </h2>
        <Icon name="package" size={18} className="text-muted-foreground" />
      </header>
      <div className="mt-5 flex items-center justify-center gap-5">
        <div className="relative h-40 w-40 shrink-0">
          <svg
            className="h-full w-full -rotate-90"
            viewBox="0 0 120 120"
            role="img"
            aria-label="۸۴۲ سفارش کل"
          >
            <circle cx="60" cy="60" r="42" fill="none" stroke="#f1ece6" strokeWidth="16" />
            <circle
              cx="60"
              cy="60"
              r="42"
              fill="none"
              stroke="#712D42"
              strokeWidth="16"
              pathLength="100"
              strokeDasharray="45 55"
              strokeDashoffset="0"
            />
            <circle
              cx="60"
              cy="60"
              r="42"
              fill="none"
              stroke="#989492"
              strokeWidth="16"
              pathLength="100"
              strokeDasharray="18 82"
              strokeDashoffset="-45"
            />
            <circle
              cx="60"
              cy="60"
              r="42"
              fill="none"
              stroke="#d9d1c8"
              strokeWidth="16"
              pathLength="100"
              strokeDasharray="28 72"
              strokeDashoffset="-63"
            />
            <circle
              cx="60"
              cy="60"
              r="42"
              fill="none"
              stroke="#ef7a9d"
              strokeWidth="16"
              pathLength="100"
              strokeDasharray="6 94"
              strokeDashoffset="-91"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] text-muted-foreground">کل سفارش‌ها</span>
            <strong className="mt-1 font-display text-2xl">۸۴۲</strong>
          </div>
        </div>
        <ul className="flex min-w-0 flex-1 flex-col gap-3 text-[10px] text-muted-foreground">
          {statuses.map((status) => (
            <li className="flex items-center justify-between gap-3" key={status.label}>
              <span className="inline-flex items-center gap-2">
                <i className={`h-2.5 w-2.5 shrink-0 rounded-full ${status.color}`} />
                {status.label}
              </span>
              <strong className="text-foreground">{status.value}</strong>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const adminLatestOrders = [
  {
    id: '#10042',
    customer: 'علی محمدی',
    amount: '۱٬۲۴۰٬۰۰۰ تومان',
    status: 'در حال پردازش',
    tone: 'info' as AdminStatusTone,
    time: 'امروز ۱۴:۳۲',
  },
  {
    id: '#10041',
    customer: 'سارا رضایی',
    amount: '۳٬۸۵۰٬۰۰۰ تومان',
    status: 'ارسال شده',
    tone: 'success' as AdminStatusTone,
    time: 'امروز ۱۴:۱۸',
  },
  {
    id: '#10040',
    customer: 'مهدی حسینی',
    amount: '۹۸۰٬۰۰۰ تومان',
    status: 'در انتظار پرداخت',
    tone: 'warning' as AdminStatusTone,
    time: 'امروز ۱۴:۰۶',
  },
  {
    id: '#10039',
    customer: 'نازنین احمدی',
    amount: '۴٬۲۹۰٬۰۰۰ تومان',
    status: 'تکمیل شد',
    tone: 'success' as AdminStatusTone,
    time: 'دیروز ۲۲:۴۱',
  },
  {
    id: '#10038',
    customer: 'رضا کریمی',
    amount: '۲٬۱۱۰٬۰۰۰ تومان',
    status: 'ارسال شده',
    tone: 'success' as AdminStatusTone,
    time: 'دیروز ۱۸:۵۵',
  },
];

function AdminLatestOrders({ className = '' }: { className?: string }) {
  return (
    <section
      className={`border border-border bg-surface p-4 shadow-card md:p-5 ${className}`}
      aria-labelledby="latest-orders-title"
    >
      <header className="flex items-center justify-between border-b border-border pb-3">
        <h2 id="latest-orders-title" className="text-base md:text-lg">
          آخرین سفارش‌ها
        </h2>
        <a className="text-link text-xs" href="#admin/orders">
          مشاهده همه <Icon name="arrow-left" size={14} />
        </a>
      </header>
      <div className="mt-1">
        {adminLatestOrders.map((order) => (
          <a
            className="grid min-h-[58px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-border py-2.5 text-right last:border-b-0 md:grid-cols-[auto_minmax(0,1fr)_auto_auto] md:gap-3"
            href={`#admin/orders/${order.id.slice(1)}`}
            key={order.id}
          >
            <span className="font-latin text-[10px] text-muted-foreground" dir="ltr">
              {order.id}
            </span>
            <span className="min-w-0">
              <strong className="block truncate text-xs font-medium">{order.customer}</strong>
              <small className="mt-1 block text-[9px] text-muted-foreground">{order.time}</small>
            </span>
            <span className="hidden text-[10px] text-muted-foreground md:block">
              {order.amount}
            </span>
            <AdminStatusChip tone={order.tone}>{order.status}</AdminStatusChip>
          </a>
        ))}
      </div>
    </section>
  );
}

function AdminNewCustomers() {
  const customers = [
    {
      name: 'آرمان صادقی',
      email: 'arman.sadeghi@gmail.com',
      time: 'امروز ۱۳:۳۰',
      image: '/assets/nova-hero-men.webp',
    },
    {
      name: 'نگین مرادی',
      email: 'negin.moradi@gmail.com',
      time: 'امروز ۱۱:۴۵',
      image: '/assets/nova-women-lifestyle.webp',
    },
    {
      name: 'علی کاظمی',
      email: 'ali.kazemi@gmail.com',
      time: 'امروز ۱۰:۱۸',
      image: '/assets/nova-children-lifestyle.webp',
    },
    {
      name: 'مهسا محمدی',
      email: 'mahsa.mohammadi@gmail.com',
      time: 'دیروز ۱۷:۳۶',
      image: '/assets/nova-materials.webp',
    },
    {
      name: 'سینا رضایی',
      email: 'sina.rezaei@gmail.com',
      time: 'دیروز ۱۵:۱۲',
      image: '/assets/nova-product-oxford-shirt.webp',
    },
  ];
  return (
    <section
      className="border border-border bg-surface p-4 shadow-card md:p-5"
      aria-labelledby="new-customers-title"
    >
      <header className="flex items-center justify-between border-b border-border pb-3">
        <h2 id="new-customers-title" className="text-base md:text-lg">
          مشتریان جدید
        </h2>
        <a className="text-link text-xs" href="#admin/customers">
          مشاهده همه <Icon name="arrow-left" size={14} />
        </a>
      </header>
      <div className="mt-1">
        {customers.map((customer) => (
          <div
            className="flex items-center gap-3 border-b border-border py-2.5 last:border-b-0"
            key={customer.email}
          >
            <img
              className="h-9 w-9 shrink-0 rounded-full object-cover"
              src={customer.image}
              alt=""
            />
            <div className="min-w-0 flex-1 text-right">
              <strong className="block truncate text-xs font-medium">{customer.name}</strong>
              <small className="mt-1 block truncate text-[9px] text-muted-foreground" dir="ltr">
                {customer.email}
              </small>
            </div>
            <time className="shrink-0 text-[9px] text-muted-foreground">{customer.time}</time>
          </div>
        ))}
      </div>
    </section>
  );
}

function AdminPopularProducts() {
  const sales = ['۳۴۸', '۲۹۱', '۱۸۶', '۱۷۳', '۱۵۹'];
  return (
    <section
      className="border border-border bg-surface p-4 shadow-card md:p-5"
      aria-labelledby="popular-products-title"
    >
      <header className="flex items-center justify-between border-b border-border pb-3">
        <h2 id="popular-products-title" className="text-base md:text-lg">
          محصولات پرفروش
        </h2>
        <a className="text-link text-xs" href="#admin/products">
          مشاهده همه <Icon name="arrow-left" size={14} />
        </a>
      </header>
      <div className="mt-1">
        {products.slice(0, 5).map((product, index) => (
          <a
            className="flex items-center gap-3 border-b border-border py-2.5 last:border-b-0"
            href={`#product/${product.slug}`}
            key={product.slug}
          >
            <img
              className="h-11 w-11 shrink-0 rounded-md bg-background object-contain p-1"
              src={product.image}
              alt=""
            />
            <span className="min-w-0 flex-1 text-right">
              <strong className="block truncate text-xs font-medium">{product.name}</strong>
              <small className="mt-1 block text-[10px] text-muted-foreground">
                {sales[index] ?? '۱۲۴'} فروش
              </small>
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

function AdminCampaignBanner() {
  return (
    <a
      className="relative isolate flex min-h-[120px] items-center overflow-hidden bg-primary-hover p-5 text-primary-foreground shadow-card md:min-h-[132px] md:px-8"
      href="#campaign"
    >
      <img
        className="absolute inset-0 -z-20 h-full w-full object-cover opacity-40"
        src="/assets/nova-women-lifestyle.webp"
        alt=""
      />
      <span className="absolute inset-0 -z-10 bg-primary-hover/65" />
      <div className="relative ml-auto max-w-lg text-right">
        <span className="section-heading__eyebrow !text-primary-foreground/75">
          NOVA / AUTUMN ۱۴۰۵
        </span>
        <h2 className="mt-1 text-xl md:text-2xl">مجموعه پاییز ۱۴۰۵</h2>
        <p className="mt-1 text-xs leading-7 text-primary-foreground/80">
          الهام از سادگی، ساخته برای زندگی امروز
        </p>
      </div>
      <span className="relative hidden min-h-10 items-center gap-2 border border-primary-foreground/50 bg-primary-foreground px-4 text-xs text-primary-hover md:inline-flex">
        مشاهده و ویرایش <Icon name="arrow-left" size={15} />
      </span>
    </a>
  );
}

function AdminDashboard() {
  const metrics = [
    {
      label: 'محصولات فعال',
      value: '۱٬۲۴۶',
      note: '↑ ۵٪ از ماه گذشته',
      icon: 'package' as IconName,
      iconTone: 'bg-[#f3e7e9] text-primary',
      orderClass: 'order-3 xl:order-1',
    },
    {
      label: 'درآمد کل',
      value: '۲۹۸٬۵۰۰٬۰۰۰',
      note: '↑ ۱۸٪ از ماه گذشته',
      icon: 'tag' as IconName,
      iconTone: 'bg-warning-100 text-warning',
      orderClass: 'order-4 xl:order-2',
    },
    {
      label: 'مشتریان جدید',
      value: '۳۴۲',
      note: '↑ ۸٪ از ماه گذشته',
      icon: 'user' as IconName,
      iconTone: 'bg-[#f3e7e9] text-primary',
      orderClass: 'order-1 xl:order-3',
    },
    {
      label: 'سفارش‌های جدید',
      value: '۱۲۸',
      note: '↑ ۱۲٪ از ماه گذشته',
      icon: 'bag' as IconName,
      iconTone: 'bg-[#f3e7e9] text-primary',
      orderClass: 'order-2 xl:order-4',
    },
  ];
  return (
    <div className="mx-auto max-w-[1120px] space-y-4 md:space-y-5">
      <header className="flex flex-col gap-4 py-1 md:flex-row md:items-end md:justify-between">
        <div className="text-right">
          <span className="section-heading__eyebrow">NOVA / ADMIN DASHBOARD</span>
          <h1 className="mt-1 text-2xl leading-relaxed md:text-3xl">
            خوش آمدید، رضا <span aria-hidden="true">👋</span>
          </h1>
          <p className="mt-1 text-xs leading-7 text-muted-foreground">
            امروز روز خوبی برای ساختن یک برند بهتر است.
          </p>
        </div>
        <button
          className="inline-flex min-h-10 w-max items-center gap-2 border border-border bg-surface px-3 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          type="button"
        >
          ۳۰ روز گذشته <Icon name="chevron-down" size={14} />
        </button>
      </header>
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="شاخص‌های کلیدی">
        {metrics.map((metric) => (
          <AdminMetricCard {...metric} key={metric.label} />
        ))}
      </section>
      <div className="grid gap-4 xl:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.45fr)]">
        <div className="hidden xl:block">
          <AdminOrderStatus />
        </div>
        <AdminSalesChart />
      </div>
      <div className="xl:hidden">
        <AdminLatestOrders />
      </div>
      <div className="hidden gap-4 xl:grid xl:grid-cols-[minmax(230px,0.8fr)_minmax(0,1.4fr)_minmax(260px,0.9fr)]">
        <AdminNewCustomers />
        <AdminLatestOrders />
        <AdminPopularProducts />
      </div>
      <AdminCampaignBanner />
    </div>
  );
}

function staffLoginErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.status === 429) {
      return 'تعداد تلاش‌ها بیش از حد مجاز است؛ کمی بعد دوباره تلاش کنید.';
    }
    if (error.status === 401 || error.status === 403) {
      return 'ایمیل، رمز عبور یا کد تأیید دومرحله‌ای نادرست است.';
    }
    if (error.status === 422) {
      return 'اطلاعات ورود را با قالب درست وارد کنید.';
    }
  }
  return 'ورود به فضای مدیریت انجام نشد؛ دوباره تلاش کنید.';
}

type StaffLoginField = 'email' | 'password' | 'factor';

export type StaffLoginValidation = {
  field: StaffLoginField;
  message: string;
};

export function validateStaffLoginInput(
  email: string,
  password: string,
  factor: string,
): StaffLoginValidation | null {
  const normalizedEmail = email.trim();
  if (!normalizedEmail) return { field: 'email', message: 'ایمیل سازمانی را وارد کنید.' };
  if (!/^[^\s@]+@[^\s@]+$/.test(normalizedEmail)) {
    return { field: 'email', message: 'لطفاً یک ایمیل معتبر وارد کنید.' };
  }
  if (!password.trim()) return { field: 'password', message: 'رمز عبور را وارد کنید.' };
  if (!factor.trim()) {
    return { field: 'factor', message: 'کد تأیید دومرحله‌ای یا کد بازیابی را وارد کنید.' };
  }
  return null;
}

function AdminLoginPage({ sessionExpired = false }: { sessionExpired?: boolean }) {
  const loginMutation = useStaffLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [factor, setFactor] = useState('');
  const [formError, setFormError] = useState('');
  const [fieldError, setFieldError] = useState<StaffLoginValidation | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    const validation = validateStaffLoginInput(email, password, factor);
    if (validation) {
      setFieldError(validation);
      document.getElementById(`staff-${validation.field}`)?.focus();
      return;
    }
    setFieldError(null);
    loginMutation.mutate(
      { email, password, factor },
      {
        onSuccess: () => {
          window.location.hash = '#admin';
        },
        onError: (error) => setFormError(staffLoginErrorMessage(error)),
      },
    );
  };

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10" dir="rtl">
      <section className="w-full max-w-[460px] border border-border bg-surface p-7 text-right shadow-none md:p-8">
        <div className="flex justify-center">
          <Logo descriptor="" />
        </div>
        <span className="section-heading__eyebrow mt-8 block text-center">NOVA / ADMIN ACCESS</span>
        <h1 className="mt-5 text-center text-3xl leading-relaxed">ورود به فضای مدیریت</h1>
        <p className="mx-auto mt-3 max-w-[360px] text-center text-sm leading-8 text-muted-foreground">
          برای ادامه، رمز عبور و کد تأیید دومرحله‌ای مدیر را وارد کنید.
        </p>
        {sessionExpired ? (
          <p
            className="mt-6 flex items-start gap-2 border border-error/20 bg-error-soft px-3 py-3 text-sm leading-7 text-error"
            role="status"
          >
            <Icon name="warning" size={17} className="mt-1 shrink-0" />
            نشست مدیریت منقضی شده است؛ برای ادامه دوباره وارد شوید.
          </p>
        ) : null}
        <form className="mt-7 flex flex-col gap-5" noValidate onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="staff-email">
            <span>ایمیل سازمانی</span>
            <span className="relative block">
              <input
                id="staff-email"
                className={`min-h-12 w-full border bg-background pe-10 ps-3 outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft ${fieldError?.field === 'email' ? 'border-destructive' : 'border-border'}`}
                dir="ltr"
                name="email"
                autoComplete="username"
                required
                type="email"
                value={email}
                aria-describedby={fieldError?.field === 'email' ? 'staff-email-error' : undefined}
                aria-invalid={fieldError?.field === 'email' ? 'true' : undefined}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (fieldError?.field === 'email') setFieldError(null);
                }}
                placeholder="admin@example.com"
              />
              <Icon
                name="mail"
                size={18}
                className="pointer-events-none absolute inset-inline-end-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
            </span>
            {fieldError?.field === 'email' ? (
              <span
                id="staff-email-error"
                className="flex items-start gap-1 text-sm leading-6 text-destructive"
                role="alert"
              >
                <Icon name="warning" size={16} className="mt-1 shrink-0" />
                {fieldError.message}
              </span>
            ) : null}
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="staff-password">
            <span>رمز عبور</span>
            <span className="relative block">
              <input
                id="staff-password"
                className={`min-h-12 w-full border bg-background pe-10 ps-3 outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft ${fieldError?.field === 'password' ? 'border-destructive' : 'border-border'}`}
                dir="ltr"
                name="password"
                autoComplete="current-password"
                required
                type="password"
                value={password}
                aria-describedby={
                  fieldError?.field === 'password' ? 'staff-password-error' : undefined
                }
                aria-invalid={fieldError?.field === 'password' ? 'true' : undefined}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (fieldError?.field === 'password') setFieldError(null);
                }}
              />
              <Icon
                name="eye"
                size={18}
                className="pointer-events-none absolute inset-inline-end-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
            </span>
            {fieldError?.field === 'password' ? (
              <span
                id="staff-password-error"
                className="flex items-start gap-1 text-sm leading-6 text-destructive"
                role="alert"
              >
                <Icon name="warning" size={16} className="mt-1 shrink-0" />
                {fieldError.message}
              </span>
            ) : null}
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="staff-factor">
            <span>کد تأیید دومرحله‌ای یا کد بازیابی</span>
            <span className="relative block">
              <input
                id="staff-factor"
                className={`min-h-12 w-full border bg-background pe-10 ps-3 outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft ${fieldError?.field === 'factor' ? 'border-destructive' : 'border-border'}`}
                dir="ltr"
                name="factor"
                autoComplete="one-time-code"
                inputMode="numeric"
                required
                type="text"
                value={factor}
                aria-describedby={fieldError?.field === 'factor' ? 'staff-factor-error' : undefined}
                aria-invalid={fieldError?.field === 'factor' ? 'true' : undefined}
                onChange={(event) => {
                  setFactor(event.target.value);
                  if (fieldError?.field === 'factor') setFieldError(null);
                }}
              />
              <Icon
                name="shield"
                size={18}
                className="pointer-events-none absolute inset-inline-end-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
            </span>
            {fieldError?.field === 'factor' ? (
              <span
                id="staff-factor-error"
                className="flex items-start gap-1 text-sm leading-6 text-destructive"
                role="alert"
              >
                <Icon name="warning" size={16} className="mt-1 shrink-0" />
                {fieldError.message}
              </span>
            ) : null}
          </label>
          {formError ? (
            <p
              className="flex items-start gap-2 border border-error/20 bg-error-soft px-3 py-2 text-sm leading-7 text-error"
              role="alert"
              aria-live="polite"
            >
              <Icon name="warning" size={17} className="mt-1 shrink-0" />
              {formError}
            </p>
          ) : null}
          <Button
            className="w-full !rounded-control"
            size="lg"
            type="submit"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? 'در حال بررسی...' : 'ورود به پنل'}
            <Icon name="arrow-right" size={17} />
          </Button>
        </form>
        <a
          className="mt-5 flex items-center justify-center gap-2 border-t border-border pt-5 text-sm text-muted-foreground transition-colors hover:text-primary"
          href="#home"
        >
          بازگشت به فروشگاه <Icon name="arrow-right" size={15} />
        </a>
      </section>
    </main>
  );
}

function AdminLogoutButton({
  className = '',
  compact = false,
  label = 'خروج از حساب',
}: {
  className?: string;
  compact?: boolean;
  label?: string;
}) {
  const logoutMutation = useStaffLogout();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        window.location.hash = '#admin/login';
      },
    });
  };

  return (
    <button
      className={className}
      type="button"
      disabled={logoutMutation.isPending}
      aria-busy={logoutMutation.isPending}
      aria-label={compact ? label : undefined}
      onClick={handleLogout}
    >
      <Icon name="arrow-right" size={17} />
      {compact ? (
        <span className="sr-only">{logoutMutation.isPending ? 'در حال خروج...' : label}</span>
      ) : logoutMutation.isPending ? (
        'در حال خروج...'
      ) : (
        label
      )}
    </button>
  );
}

export function AdminLegacyPage({ page }: { page: string }) {
  const titleMap: Record<string, string> = {
    admin: 'نمای کلی',
    products: 'محصولات',
    categories: 'دسته‌بندی‌ها',
    inventory: 'موجودی',
    orders: 'سفارش‌ها',
    payments: 'پرداخت‌ها',
    promotions: 'کدهای تخفیف',
    customers: 'مشتری‌ها',
    content: 'محتوا',
    audit: 'گزارش فعالیت',
    operations: 'عملیات',
    login: 'ورود مدیر',
    'products/new': 'محصول جدید',
    'products/linen-overshirt/edit': 'ویرایش محصول',
    'products/linen-overshirt/variants': 'تنوع‌ها',
    'products/linen-overshirt/media': 'رسانه محصول',
    'orders/NV-1405-2481': 'جزئیات سفارش',
  };
  const title = titleMap[page] ?? 'پنل مدیریت';
  const nav = [
    ['admin', 'نمای کلی', 'grid'],
    ['products', 'محصولات', 'shirt'],
    ['categories', 'دسته‌بندی‌ها', 'layers'],
    ['inventory', 'موجودی', 'warehouse'],
    ['orders', 'سفارش‌ها', 'package'],
    ['payments', 'پرداخت‌ها', 'tag'],
    ['customers', 'مشتری‌ها', 'users'],
    ['content', 'محتوا', 'book'],
    ['audit', 'گزارش فعالیت', 'eye'],
  ].map(([key, label, icon]) => ({ key, label, icon: icon as IconName }));
  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Logo />
        <span className="admin-sidebar__label">فضای مدیریت</span>
        {nav.map((item) => (
          <a
            className={page === item.key ? 'is-active' : ''}
            href={`#admin${item.key === 'admin' ? '' : `/${item.key}`}`}
            key={item.key}
          >
            <Icon name={item.icon} size={18} />
            {item.label}
          </a>
        ))}
        <AdminLogoutButton className="admin-sidebar__logout flex min-h-11 w-full items-center gap-2 border-0 bg-transparent px-[11px] text-right text-xs text-inherit transition-colors hover:bg-secondary disabled:opacity-50" />
      </aside>
      <section className="admin-content">
        <header className="admin-topbar">
          <AdminLogoutButton
            compact
            label="خروج"
            className="icon-button border-0 md:hidden disabled:opacity-50"
          />
          <button className="icon-button" type="button" aria-label="اعلان‌ها">
            <Icon name="bell" size={19} />
          </button>
          <div>
            <span>سلام، مدیر نوا</span>
            <small>آخرین ورود: امروز ۱۰:۲۴</small>
          </div>
        </header>
        <div className="admin-page">
          <div className="admin-page__heading">
            <div>
              <span className="section-heading__eyebrow">NOVA / ADMIN</span>
              <h1>{title}</h1>
            </div>
            <div className="admin-page__actions">
              <button className="admin-secondary" type="button">
                <Icon name="settings" size={16} />
                تنظیمات
              </button>
              {page === 'products' ? (
                <Button asChild>
                  <a href="#admin/products/new">
                    <Icon name="plus" size={17} />
                    محصول جدید
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
          <div className="admin-stat-grid">
            <div>
              <span>سفارش‌های امروز</span>
              <strong>۲۴</strong>
              <small className="stat-up">+۱۲٪ نسبت به دیروز</small>
            </div>
            <div>
              <span>در انتظار بررسی</span>
              <strong>۸</strong>
              <small>۳ پرداخت نیازمند توجه</small>
            </div>
            <div>
              <span>موجودی کم</span>
              <strong>۶</strong>
              <small className="stat-warning">نیازمند اقدام</small>
            </div>
            <div>
              <span>فروش این ماه</span>
              <strong>۲۴۹٬۸۰۰٬۰۰۰</strong>
              <small>تومان</small>
            </div>
          </div>
          <div className="admin-panels">
            <section className="admin-panel admin-panel--wide">
              <div className="admin-panel__heading">
                <h2>
                  {page === 'orders'
                    ? 'صف سفارش‌ها'
                    : page === 'products'
                      ? 'محصولات اخیر'
                      : 'کارهای نیازمند اقدام'}
                </h2>
                <a className="text-link" href="#admin/orders">
                  مشاهده همه <Icon name="arrow-left" size={15} />
                </a>
              </div>
              {[
                ['NV-1405-2481', 'مانتوی لینن کمربندی آوا', 'در حال آماده‌سازی'],
                ['NV-1405-2478', 'پیراهن آکسفورد مردانه', 'پرداخت تأیید شد'],
                ['NV-1405-2472', 'ست دورس و شلوار کودک', 'در انتظار پرداخت'],
              ].map(([id, name, status]) => (
                <div className="admin-row" key={id}>
                  <span dir="ltr">{id}</span>
                  <strong>{name}</strong>
                  <span className="status-badge">{status}</span>
                  <button className="icon-button" type="button" aria-label={`مشاهده ${id}`}>
                    <Icon name="arrow-left" size={16} />
                  </button>
                </div>
              ))}
            </section>
            <section className="admin-panel">
              <div className="admin-panel__heading">
                <h2>سلامت عملیات</h2>
                <Icon name="check" size={18} />
              </div>
              {['پرداخت آنلاین', 'ارسال سفارش‌ها', 'رسانه‌ها', 'اعلان‌ها'].map((item) => (
                <div className="health-row" key={item}>
                  <span className="health-dot" />
                  {item}
                  <strong>فعال</strong>
                </div>
              ))}
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

type AdminProductStatusFilter = 'all' | AdminCatalogProductStatus;
type AdminProductStockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

type AdminProductRow = {
  id: string;
  slug: string;
  name: string;
  category: string;
  categorySlug: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  image: string | null;
  alt: string;
  lifecycleStatus: AdminCatalogProductStatus;
  stockStatus: AdminProductStockStatus;
};

type AdminLowStockItem = {
  productId: string;
  slug: string;
  name: string;
  stock: number;
  image: string | null;
  alt: string;
};

type AdminOrderPreview = {
  id: string;
  orderNumber: string;
  customer: string;
  amount: number;
  status: string;
  statusTone: 'warning' | 'success' | 'danger';
  date: string;
};

const adminProductRows: AdminProductRow[] = [
  {
    id: 'preview-linen-overshirt',
    slug: 'linen-overshirt',
    name: 'مانتوی لینن کمربندی آوا',
    category: 'مانتو',
    categorySlug: 'outerwear',
    price: 2490000,
    compareAtPrice: 2890000,
    stock: 24,
    image: '/assets/nova-product-linen-overshirt.webp',
    alt: 'مانتوی لینن روشن با کمربند پارچه‌ای',
    lifecycleStatus: 'PUBLISHED',
    stockStatus: 'IN_STOCK',
  },
  {
    id: 'preview-knit-cardigan',
    slug: 'knit-cardigan',
    name: 'ژاکت بافت یقه‌گرد',
    category: 'بافت',
    categorySlug: 'knitwear',
    price: 4200000,
    compareAtPrice: null,
    stock: 3,
    image: '/assets/nova-product-knit-cardigan.webp',
    alt: 'ژاکت بافتنی قهوه‌ای روشن',
    lifecycleStatus: 'PUBLISHED',
    stockStatus: 'LOW_STOCK',
  },
  {
    id: 'preview-oxford-shirt',
    slug: 'oxford-shirt',
    name: 'پیراهن آکسفورد مردانه',
    category: 'پیراهن',
    categorySlug: 'shirts',
    price: 3650000,
    compareAtPrice: null,
    stock: 15,
    image: '/assets/nova-product-oxford-shirt.webp',
    alt: 'پیراهن آکسفورد آبی روشن',
    lifecycleStatus: 'PUBLISHED',
    stockStatus: 'IN_STOCK',
  },
  {
    id: 'preview-textured-scarf',
    slug: 'textured-scarf',
    name: 'شال بافت برجسته',
    category: 'اکسسوری',
    categorySlug: 'accessories',
    price: 890000,
    compareAtPrice: null,
    stock: 2,
    image: '/assets/nova-product-textured-scarf.webp',
    alt: 'شال بافتنی با رنگ خنثی',
    lifecycleStatus: 'PUBLISHED',
    stockStatus: 'LOW_STOCK',
  },
  {
    id: 'preview-soft-trousers',
    slug: 'soft-trousers',
    name: 'شلوار نرم و راسته',
    category: 'شلوار',
    categorySlug: 'trousers',
    price: 2900000,
    compareAtPrice: null,
    stock: 8,
    image: '/assets/nova-product-soft-trousers.webp',
    alt: 'شلوار پارچه‌ای نرم به رنگ خاکی',
    lifecycleStatus: 'PUBLISHED',
    stockStatus: 'IN_STOCK',
  },
];

const adminLowStockItems: AdminLowStockItem[] = [
  {
    productId: 'preview-knit-cardigan',
    slug: 'knit-cardigan',
    name: 'ژاکت بافت یقه‌گرد',
    stock: 3,
    image: '/assets/nova-product-knit-cardigan.webp',
    alt: 'ژاکت بافتنی قهوه‌ای روشن',
  },
  {
    productId: 'preview-textured-scarf',
    slug: 'textured-scarf',
    name: 'شال بافت برجسته',
    stock: 2,
    image: '/assets/nova-product-textured-scarf.webp',
    alt: 'شال بافتنی با رنگ خنثی',
  },
  {
    productId: 'preview-soft-trousers',
    slug: 'soft-trousers',
    name: 'شلوار نرم و راسته',
    stock: 4,
    image: '/assets/nova-product-soft-trousers.webp',
    alt: 'شلوار پارچه‌ای نرم به رنگ خاکی',
  },
];

const adminOrderPreviews: AdminOrderPreview[] = [
  {
    id: '#13445',
    orderNumber: 'NV-1405-2481',
    customer: 'نگار محمدی',
    amount: 9800000,
    status: 'در حال آماده‌سازی',
    statusTone: 'warning',
    date: '۱۴۰۵/۰۲/۲۵',
  },
  {
    id: '#13444',
    orderNumber: 'NV-1405-2480',
    customer: 'بهزاد رضایی',
    amount: 4200000,
    status: 'فعال',
    statusTone: 'success',
    date: '۱۴۰۵/۰۲/۲۴',
  },
  {
    id: '#13443',
    orderNumber: 'NV-1405-2479',
    customer: 'سارا حسینی',
    amount: 7650000,
    status: 'در حال آماده‌سازی',
    statusTone: 'warning',
    date: '۱۴۰۵/۰۲/۲۴',
  },
  {
    id: '#13442',
    orderNumber: 'NV-1405-2478',
    customer: 'مهدی کریمی',
    amount: 2900000,
    status: 'فعال',
    statusTone: 'success',
    date: '۱۴۰۵/۰۲/۲۳',
  },
  {
    id: '#13441',
    orderNumber: 'NV-1405-2477',
    customer: 'آتنا موسوی',
    amount: 5500000,
    status: 'در حال آماده‌سازی',
    statusTone: 'warning',
    date: '۱۴۰۵/۰۲/۲۳',
  },
];

function toAdminProductRow(source: AdminCatalogProductListItem): AdminProductRow {
  const category = source.categories[0];

  return {
    id: source.id,
    slug: source.slug,
    name: source.name,
    category: category?.name ?? 'بدون دسته‌بندی',
    categorySlug: category?.slug ?? null,
    price: source.basePriceToman,
    compareAtPrice: source.compareAtPriceToman,
    stock: source.inventory.available,
    image: source.primaryMedia?.url ?? null,
    alt: source.primaryMedia?.altText ?? source.name,
    lifecycleStatus: source.status,
    stockStatus: source.inventory.status,
  };
}

function toAdminLowStockItem(
  source: AdminInventoryItem,
  products: AdminProductRow[],
): AdminLowStockItem {
  const product = products.find(
    (candidate) => candidate.id === source.productId || candidate.slug === source.productSlug,
  );

  return {
    productId: source.productId,
    slug: source.productSlug,
    name: source.productName,
    stock: source.available,
    image: product?.image ?? null,
    alt: product?.alt ?? source.productName,
  };
}

function formatAdminDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function adminOrderStatusLabel(status: AdminOrderSummary['status']): string {
  const labels: Record<AdminOrderSummary['status'], string> = {
    PENDING_PAYMENT: 'در انتظار پرداخت',
    CONFIRMED: 'تایید شده',
    PREPARING: 'در حال آماده‌سازی',
    SHIPPED: 'ارسال شده',
    DELIVERED: 'تحویل شده',
    CANCELLED: 'لغو شده',
    RETURNED: 'مرجوع شده',
  };
  return labels[status];
}

function toAdminOrderPreview(source: AdminOrderSummary): AdminOrderPreview {
  const customer = source.customer?.email || source.customer?.phone || 'مشتری نوا';
  const statusTone: AdminOrderPreview['statusTone'] =
    source.status === 'CANCELLED' || source.status === 'RETURNED'
      ? 'danger'
      : source.status === 'DELIVERED' || source.status === 'SHIPPED'
        ? 'success'
        : 'warning';

  return {
    id: `#${source.orderNumber}`,
    orderNumber: source.orderNumber,
    customer,
    amount: source.totalToman,
    status: adminOrderStatusLabel(source.status),
    statusTone,
    date: formatAdminDate(source.createdAt),
  };
}

function adminLifecycleStatusLabel(status: AdminCatalogProductStatus): string {
  const labels: Record<AdminCatalogProductStatus, string> = {
    DRAFT: 'پیش‌نویس',
    PUBLISHED: 'فعال',
    ARCHIVED: 'بایگانی شده',
  };
  return labels[status];
}

function adminStockStatusLabel(status: AdminProductStockStatus): string {
  const labels: Record<AdminProductStockStatus, string> = {
    IN_STOCK: 'فعال',
    LOW_STOCK: 'موجودی کم',
    OUT_OF_STOCK: 'ناموجود',
  };
  return labels[status];
}

function AdminOperationsLogo({ mobile = false }: { mobile?: boolean } = {}) {
  return (
    <a
      className={`flex w-max flex-col leading-none ${mobile ? 'items-end' : 'items-center'}`}
      href="#admin"
      aria-label="نوا، فضای مدیریت"
    >
      <span className={`${mobile ? 'text-xl' : 'text-[30px]'} font-display tracking-[0.16em]`}>
        نوا
      </span>
      <span className="mt-2 text-[8px] tracking-[0.2em] text-[#e7ded2]/70">ATELIER EDITORIAL</span>
    </a>
  );
}

function AdminProductsPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState<AdminProductStatusFilter>('all');
  const [quickFilterActive, setQuickFilterActive] = useState(false);
  const [page, setPage] = useState(1);
  const [openActionSlug, setOpenActionSlug] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);
  const staffQuery = useStaffUser();
  const isStaffAuthenticated = Boolean(staffQuery.data) && !isStaffAuthFailure(staffQuery.error);
  const isPreview = import.meta.env.DEV && !isStaffAuthenticated;
  const productListQuery = useMemo(
    () => ({
      page,
      limit: 12,
      q: deferredQuery.trim() || undefined,
      category: category === 'all' ? undefined : category,
      status: status === 'all' ? undefined : status,
      lowStock: quickFilterActive || undefined,
    }),
    [category, deferredQuery, page, quickFilterActive, status],
  );
  const productsQuery = useAdminCatalogProducts(productListQuery, isStaffAuthenticated);
  const categoriesQuery = useAdminCatalogCategories(isStaffAuthenticated);
  const inventoryQuery = useAdminInventory(
    { page: 1, limit: 3, lowStock: true },
    isStaffAuthenticated,
  );
  const ordersQuery = useAdminOrders({ page: 1, limit: 5 }, isStaffAuthenticated);

  useEffect(() => {
    setPage(1);
  }, [category, query, quickFilterActive, status]);

  const liveProducts = useMemo(
    () => productsQuery.data?.items.map(toAdminProductRow) ?? [],
    [productsQuery.data],
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (isStaffAuthenticated) return liveProducts;

    return adminProductRows.filter((product) => {
      const matchesQuery =
        !normalizedQuery ||
        `${product.name} ${product.category} ${product.slug}`
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesCategory = category === 'all' || product.categorySlug === category;
      const matchesStatus = status === 'all' || product.lifecycleStatus === status;
      const matchesQuickFilter = !quickFilterActive || product.stockStatus === 'LOW_STOCK';

      return matchesQuery && matchesCategory && matchesStatus && matchesQuickFilter;
    });
  }, [category, isStaffAuthenticated, liveProducts, query, quickFilterActive, status]);

  const categoryOptions = isStaffAuthenticated
    ? (categoriesQuery.data ?? []).map((item) => ({ value: item.slug, label: item.name }))
    : Array.from(
        new Map(
          adminProductRows.map((product) => [
            product.categorySlug ?? product.category,
            { value: product.categorySlug ?? product.category, label: product.category },
          ]),
        ).values(),
      );
  const resultCount = isStaffAuthenticated
    ? (productsQuery.data?.total ?? filteredProducts.length)
    : filteredProducts.length;
  const pageSize = productListQuery.limit;
  const totalPages = isStaffAuthenticated ? Math.max(1, Math.ceil(resultCount / pageSize)) : 1;
  const visibleStart = resultCount === 0 ? 0 : isStaffAuthenticated ? (page - 1) * pageSize + 1 : 1;
  const visibleEnd = isStaffAuthenticated
    ? Math.min(page * pageSize, resultCount)
    : filteredProducts.length;
  const lowStockItems = isStaffAuthenticated
    ? (inventoryQuery.data?.items ?? []).map((item) => toAdminLowStockItem(item, liveProducts))
    : adminLowStockItems;
  const lowStockCount = isStaffAuthenticated
    ? (inventoryQuery.data?.total ?? lowStockItems.length)
    : lowStockItems.length;
  const orderPreviews = isStaffAuthenticated
    ? (ordersQuery.data?.items ?? []).map(toAdminOrderPreview)
    : adminOrderPreviews;
  const isPermissionDenied = [
    productsQuery.error,
    categoriesQuery.error,
    inventoryQuery.error,
    ordersQuery.error,
  ].some(isStaffAuthorizationFailure);
  const dataState = !isStaffAuthenticated
    ? staffQuery.isPending
      ? {
          title: 'در حال بررسی دسترسی',
          message: 'نشست مدیریت شما در حال بررسی است.',
          role: 'status' as const,
        }
      : {
          title: 'ورود مدیر لازم است',
          message: 'برای مشاهده داده‌های واقعی کاتالوگ، با یک حساب مدیر وارد شوید.',
          role: 'alert' as const,
        }
    : isPermissionDenied
      ? {
          title: 'دسترسی کافی نیست',
          message: 'نقش کاربری شما اجازه مشاهده یکی از بخش‌های این صفحه را نمی‌دهد.',
          role: 'alert' as const,
        }
      : productsQuery.isPending && !productsQuery.data
        ? {
            title: 'در حال دریافت محصولات',
            message: 'فهرست محصولات از سرور در حال دریافت است.',
            role: 'status' as const,
          }
        : productsQuery.isError && !productsQuery.data
          ? {
              title: 'دریافت محصولات ناموفق بود',
              message: 'اتصال به سرویس کاتالوگ برقرار نشد. دوباره تلاش کنید.',
              role: 'alert' as const,
            }
          : null;

  const setQuickFilter = () => {
    setQuickFilterActive((current) => !current);
  };

  return (
    <main className="min-h-svh bg-background text-foreground" dir="rtl">
      <div className="flex min-h-svh flex-row">
        <aside className="hidden w-[240px] flex-none flex-col bg-primary-hover px-4 py-7 text-primary-foreground lg:flex">
          <AdminOperationsLogo />
          <span className="mt-12 px-3 text-[10px] text-primary-foreground/55">فضای مدیریت</span>
          <nav className="mt-3 flex flex-col gap-1" aria-label="ناوبری مدیریت">
            {[
              ['admin', 'فضای مدیریت', 'home'],
              ['products', 'محصولات', 'bag'],
              ['inventory', 'موجودی کم', 'warning'],
              ['orders', 'سفارش‌ها', 'package'],
              ['customers', 'مشتریان', 'users'],
              ['promotions', 'تخفیف‌ها', 'tag'],
              ['audit', 'گزارش‌ها', 'eye'],
              ['operations', 'تنظیمات', 'settings'],
            ].map(([key, label, icon]) => (
              <a
                className={`flex min-h-11 items-center gap-3 rounded-control px-3 text-xs transition-colors ${key === 'products' ? 'bg-primary text-primary-foreground' : 'text-primary-foreground/85 hover:bg-primary/70'}`}
                href={`#admin${key === 'admin' ? '' : `/${key}`}`}
                key={key}
              >
                <Icon name={icon as IconName} size={18} />
                <span>{label}</span>
              </a>
            ))}
          </nav>
          <AdminLogoutButton
            label="خروج"
            className="mt-auto flex min-h-11 items-center gap-3 border-0 border-t border-primary-foreground/15 bg-transparent px-3 pt-5 text-xs text-primary-foreground/80 transition-colors hover:text-primary-foreground disabled:opacity-50"
          />
        </aside>

        <section className="min-w-0 flex-1">
          <header className="border-b border-border bg-surface px-4 py-4 sm:px-6 lg:px-8" dir="ltr">
            <div className="hidden items-center gap-3 lg:flex">
              <button
                className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                type="button"
                aria-label="اعلان‌ها"
              >
                <Icon name="bell" size={19} />
              </button>
              <img
                className="h-10 w-10 rounded-full object-cover"
                src="/assets/nova-hero-men.webp"
                alt=""
              />
              <div className="text-right" dir="rtl">
                <strong className="block text-xs font-medium">الهام احمدی</strong>
                <span className="mt-1 block text-[10px] text-muted-foreground">مدیر فروشگاه</span>
              </div>
            </div>

            <div className="hidden text-right lg:ml-auto lg:block" dir="rtl">
              <span className="text-lg font-medium">فضای مدیریت</span>
              <span className="mt-1 block text-[10px] text-muted-foreground">
                عملیات فروشگاه نوا
              </span>
            </div>

            <div className="flex items-center justify-between lg:hidden" dir="ltr">
              <AdminLogoutButton
                compact
                label="خروج"
                className="flex h-10 w-10 items-center justify-center rounded-full border-0 bg-transparent text-foreground transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
              />
              <a
                className="flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                href="#admin"
                aria-label="داشبورد مدیریت"
              >
                <Icon name="menu" size={20} />
              </a>
              <span className="text-base font-medium" dir="rtl">
                فضای مدیریت
              </span>
              <AdminOperationsLogo mobile />
            </div>
          </header>

          <div className="mx-auto max-w-[1220px] px-4 py-5 pb-24 sm:px-6 lg:px-8 lg:py-8 lg:pb-8">
            <section
              className="rounded-panel border border-border bg-surface p-3 shadow-card sm:p-4"
              aria-label="فیلتر محصولات"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <a
                  className="order-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary px-5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:order-5"
                  href="#admin/products/new"
                >
                  <Icon name="plus" size={17} />
                  محصول جدید
                </a>

                <label className="relative order-2 min-w-0 sm:order-4 sm:flex-1 sm:basis-[230px]">
                  <span className="sr-only">جست‌وجو در محصولات</span>
                  <Icon
                    name="search"
                    size={18}
                    className="pointer-events-none absolute inset-y-0 right-3 my-auto text-muted-foreground"
                  />
                  <input
                    className="min-h-11 w-full rounded-control border border-border bg-background px-10 text-xs outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-accent-soft"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="جست‌وجو در محصولات..."
                    type="search"
                  />
                </label>

                <button
                  className={`order-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-control border px-4 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:order-3 ${quickFilterActive ? 'border-primary bg-accent-soft text-primary' : 'border-border bg-background hover:border-primary hover:text-primary'}`}
                  type="button"
                  aria-pressed={quickFilterActive}
                  onClick={setQuickFilter}
                >
                  <Icon name="filter" size={17} />
                  فیلترها
                </button>

                <label className="relative order-4 min-w-0 sm:order-2 sm:min-w-[138px]">
                  <span className="sr-only">دسته‌بندی</span>
                  <select
                    className="min-h-11 w-full appearance-none rounded-control border border-border bg-background px-3 pl-9 text-xs outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-accent-soft"
                    value={category}
                    onChange={(event) => {
                      setCategory(event.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="all">همه دسته‌بندی‌ها</option>
                    {categoryOptions.map((item) => (
                      <option value={item.value} key={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <Icon
                    name="chevron-down"
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                </label>

                <label className="relative order-5 min-w-0 sm:order-1 sm:min-w-[138px]">
                  <span className="sr-only">وضعیت</span>
                  <select
                    className="min-h-11 w-full appearance-none rounded-control border border-border bg-background px-3 pl-9 text-xs outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-accent-soft"
                    value={status}
                    onChange={(event) => {
                      setStatus(event.target.value as AdminProductStatusFilter);
                      setPage(1);
                    }}
                  >
                    <option value="all">همه وضعیت‌ها</option>
                    <option value="PUBLISHED">فعال</option>
                    <option value="DRAFT">پیش‌نویس</option>
                    <option value="ARCHIVED">بایگانی شده</option>
                  </select>
                  <Icon
                    name="chevron-down"
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                </label>
              </div>
            </section>

            {isPreview ? (
              <p className="mt-3 text-right text-[10px] text-muted-foreground" role="status">
                پیش‌نمایش محلی · برای داده‌های واقعی، نشست مدیر را برقرار کنید.
              </p>
            ) : null}

            {dataState && !isPreview ? (
              <section
                className="mt-4 rounded-panel border border-border bg-surface p-8 text-center shadow-card"
                role={dataState.role}
              >
                <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary">
                  <Icon name={dataState.role === 'alert' ? 'warning' : 'refresh'} size={22} />
                </span>
                <h2 className="mt-4 text-lg font-semibold">{dataState.title}</h2>
                <p className="mx-auto mt-2 max-w-md text-xs leading-7 text-muted-foreground">
                  {dataState.message}
                </p>
                <button
                  className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary px-5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  type="button"
                  onClick={() =>
                    void (isStaffAuthenticated ? productsQuery.refetch() : staffQuery.refetch())
                  }
                >
                  <Icon name="refresh" size={16} />
                  دوباره تلاش کنید
                </button>
              </section>
            ) : (
              <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(300px,0.9fr)_minmax(0,1.45fr)]">
                <aside className="order-1 space-y-4">
                  <section
                    className="rounded-panel border border-border bg-surface p-4 shadow-card"
                    aria-labelledby="admin-low-stock-title"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
                      <div className="flex items-center gap-2">
                        <Icon name="warning" size={20} className="text-warning" />
                        <h2 className="text-base font-semibold" id="admin-low-stock-title">
                          موجودی کم
                        </h2>
                      </div>
                      <span className="rounded-full bg-warning-100 px-2 py-1 text-[10px] text-warning">
                        {formatPersianNumber(lowStockCount)} مورد
                      </span>
                    </div>
                    <div className="divide-y divide-border">
                      {lowStockItems.map((item) => (
                        <a
                          className="flex items-center gap-3 py-3 transition-colors first:pt-4 last:pb-1 hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                          href="#admin/inventory"
                          key={`${item.productId}-${item.slug}`}
                        >
                          {item.image ? (
                            <img
                              className="h-14 w-14 rounded-control border border-border bg-background object-cover"
                              src={item.image}
                              alt={item.alt}
                              loading="lazy"
                            />
                          ) : (
                            <span
                              className="flex h-14 w-14 items-center justify-center rounded-control border border-border bg-background text-muted-foreground"
                              aria-hidden="true"
                            >
                              <Icon name="shirt" size={20} />
                            </span>
                          )}
                          <span className="min-w-0 flex-1 text-right">
                            <strong className="block truncate text-xs font-medium">
                              {item.name}
                            </strong>
                            <small className="mt-1 block text-[10px] text-warning">
                              {formatPersianNumber(item.stock)} عدد باقی مانده
                            </small>
                          </span>
                          <Icon
                            name="arrow-left"
                            size={16}
                            className="shrink-0 text-muted-foreground"
                          />
                        </a>
                      ))}
                    </div>
                    <a
                      className="mt-3 inline-flex items-center gap-2 text-xs text-primary transition-colors hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      href="#admin/inventory"
                    >
                      مشاهده همه
                      <Icon name="arrow-left" size={15} />
                    </a>
                  </section>

                  <section
                    className="rounded-panel border border-border bg-surface p-4 shadow-card"
                    aria-labelledby="admin-orders-title"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
                      <div className="flex items-center gap-2">
                        <Icon name="package" size={19} className="text-muted-foreground" />
                        <h2 className="text-base font-semibold" id="admin-orders-title">
                          سفارش‌ها
                        </h2>
                      </div>
                      <a
                        className="text-[10px] text-primary transition-colors hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        href="#admin/orders"
                      >
                        مشاهده همه
                      </a>
                    </div>
                    <div className="divide-y divide-border">
                      {orderPreviews.map((order) => (
                        <a
                          className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 py-3 first:pt-4 last:pb-1 transition-colors hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                          href={`#admin/orders/${order.orderNumber}`}
                          key={order.id}
                        >
                          <span className="text-[10px] text-muted-foreground" dir="ltr">
                            {order.id}
                          </span>
                          <span className="min-w-0 text-right">
                            <strong className="block truncate text-[11px] font-medium">
                              {order.customer}
                            </strong>
                            <small className="mt-1 block text-[9px] text-muted-foreground">
                              {order.date}
                            </small>
                          </span>
                          <span className="text-left">
                            <strong className="block whitespace-nowrap text-[10px] font-medium">
                              {formatToman(order.amount)}
                            </strong>
                            <small
                              className={`mt-1 block whitespace-nowrap rounded px-1.5 py-1 text-[9px] ${order.statusTone === 'warning' ? 'bg-warning-100 text-warning' : order.statusTone === 'danger' ? 'bg-destructive-100 text-destructive' : 'bg-success-100 text-success'}`}
                            >
                              {order.status}
                            </small>
                          </span>
                        </a>
                      ))}
                    </div>
                  </section>
                </aside>

                <section
                  className="order-2 min-w-0 overflow-hidden rounded-panel border border-border bg-surface shadow-card"
                  aria-labelledby="admin-products-title"
                >
                  <div className="flex items-center justify-between gap-3 px-4 pb-4 pt-5 sm:px-5">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold" id="admin-products-title">
                        محصولات
                      </h2>
                      <span className="rounded-full bg-background px-2.5 py-1 text-[10px] text-muted-foreground">
                        {formatPersianNumber(resultCount)} محصول
                      </span>
                    </div>
                    <span className="hidden text-[10px] text-muted-foreground sm:inline">
                      {isPreview
                        ? 'پیش‌نمایش محلی'
                        : productsQuery.isFetching
                          ? 'در حال بروزرسانی...'
                          : 'همگام با سرور'}
                    </span>
                  </div>

                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[520px] table-fixed border-collapse text-right text-xs">
                      <caption className="sr-only">فهرست محصولات نوا</caption>
                      <thead className="bg-background text-[10px] text-muted-foreground">
                        <tr>
                          <th className="w-[32%] px-4 py-3 font-medium" scope="col">
                            محصول
                          </th>
                          <th className="w-[11%] px-3 py-3 font-medium" scope="col">
                            دسته‌بندی
                          </th>
                          <th className="w-[18%] px-3 py-3 font-medium" scope="col">
                            قیمت
                          </th>
                          <th className="w-[9%] px-3 py-3 font-medium" scope="col">
                            موجودی
                          </th>
                          <th className="w-[15%] px-3 py-3 font-medium" scope="col">
                            وضعیت
                          </th>
                          <th className="w-[15%] px-4 py-3 text-left font-medium" scope="col">
                            عملیات
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.map((product) => (
                          <tr
                            className="border-t border-border transition-colors hover:bg-background"
                            key={product.slug}
                          >
                            <th className="px-4 py-3 text-right font-normal" scope="row">
                              <a
                                className="flex min-w-0 items-center gap-2 rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                href={`#admin/products/${product.slug}/edit`}
                              >
                                {product.image ? (
                                  <img
                                    className="h-12 w-12 shrink-0 rounded-control border border-border bg-background object-cover"
                                    src={product.image}
                                    alt={product.alt}
                                    loading="lazy"
                                  />
                                ) : (
                                  <span
                                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control border border-border bg-background text-muted-foreground"
                                    aria-hidden="true"
                                  >
                                    <Icon name="shirt" size={18} />
                                  </span>
                                )}
                                <span className="min-w-0">
                                  <strong className="block truncate text-xs font-medium">
                                    {product.name}
                                  </strong>
                                  <small
                                    className="mt-1 block truncate text-[9px] text-muted-foreground"
                                    dir="ltr"
                                  >
                                    {product.slug}
                                  </small>
                                </span>
                              </a>
                            </th>
                            <td className="truncate whitespace-nowrap px-3 py-3 text-muted-foreground">
                              {product.category}
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 text-[10px]">
                              {formatToman(product.price)}
                            </td>
                            <td className="px-3 py-3 font-medium">
                              {formatPersianNumber(product.stock)}
                            </td>
                            <td className="px-3 py-3">
                              <span
                                className={`inline-flex rounded-control px-2.5 py-1.5 text-[10px] ${product.lifecycleStatus !== 'PUBLISHED' ? 'bg-secondary text-muted-foreground' : product.stockStatus === 'LOW_STOCK' ? 'bg-warning-100 text-warning' : product.stockStatus === 'OUT_OF_STOCK' ? 'bg-destructive-100 text-destructive' : 'bg-success-100 text-success'}`}
                              >
                                {product.lifecycleStatus !== 'PUBLISHED'
                                  ? adminLifecycleStatusLabel(product.lifecycleStatus)
                                  : adminStockStatusLabel(product.stockStatus)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="relative flex items-center justify-end gap-2">
                                <button
                                  className="flex h-9 w-9 items-center justify-center rounded-control text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                  type="button"
                                  aria-label={`گزینه‌های ${product.name}`}
                                  aria-expanded={openActionSlug === product.slug}
                                  aria-controls={`admin-product-actions-${product.slug}`}
                                  onClick={() =>
                                    setOpenActionSlug((current) =>
                                      current === product.slug ? null : product.slug,
                                    )
                                  }
                                >
                                  <Icon name="more-vertical" size={17} />
                                </button>
                                <a
                                  className="flex h-9 w-9 items-center justify-center rounded-control border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                  href={`#admin/products/${product.slug}/edit`}
                                  aria-label={`ویرایش ${product.name}`}
                                >
                                  <Icon name="edit" size={16} />
                                </a>
                                {openActionSlug === product.slug ? (
                                  <div
                                    className="absolute left-0 top-11 z-10 w-36 rounded-control border border-border bg-surface p-1 text-right shadow-float"
                                    id={`admin-product-actions-${product.slug}`}
                                  >
                                    <a
                                      className="block rounded px-2.5 py-2 text-[10px] hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                      href={`#admin/products/${product.slug}/edit`}
                                    >
                                      ویرایش محصول
                                    </a>
                                    <a
                                      className="block rounded px-2.5 py-2 text-[10px] hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                      href={`#product/${product.slug}`}
                                    >
                                      مشاهده در فروشگاه
                                    </a>
                                  </div>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="space-y-2 px-3 pb-3 md:hidden">
                    {filteredProducts.map((product) => (
                      <article
                        className="flex items-center gap-3 rounded-control border border-border bg-background p-3"
                        key={product.slug}
                      >
                        {product.image ? (
                          <img
                            className="h-14 w-14 shrink-0 rounded-control border border-border bg-surface object-cover"
                            src={product.image}
                            alt={product.alt}
                            loading="lazy"
                          />
                        ) : (
                          <span
                            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-control border border-border bg-surface text-muted-foreground"
                            aria-hidden="true"
                          >
                            <Icon name="shirt" size={20} />
                          </span>
                        )}
                        <div className="min-w-0 flex-1 text-right">
                          <a
                            className="block truncate text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            href={`#admin/products/${product.slug}/edit`}
                          >
                            {product.name}
                          </a>
                          <span className="mt-1 block text-[10px] text-muted-foreground">
                            {product.category} · {formatToman(product.price)}
                          </span>
                          <span
                            className={`mt-2 inline-flex rounded-control px-2 py-1 text-[9px] ${product.lifecycleStatus !== 'PUBLISHED' ? 'bg-secondary text-muted-foreground' : product.stockStatus === 'LOW_STOCK' ? 'bg-warning-100 text-warning' : product.stockStatus === 'OUT_OF_STOCK' ? 'bg-destructive-100 text-destructive' : 'bg-success-100 text-success'}`}
                          >
                            {formatPersianNumber(product.stock)} موجودی ·{' '}
                            {product.lifecycleStatus !== 'PUBLISHED'
                              ? adminLifecycleStatusLabel(product.lifecycleStatus)
                              : adminStockStatusLabel(product.stockStatus)}
                          </span>
                        </div>
                        <a
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-border text-muted-foreground hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                          href={`#admin/products/${product.slug}/edit`}
                          aria-label={`ویرایش ${product.name}`}
                        >
                          <Icon name="edit" size={16} />
                        </a>
                      </article>
                    ))}
                  </div>

                  {resultCount === 0 ? (
                    <p className="border-t border-border px-4 py-12 text-center text-xs text-muted-foreground">
                      محصولی با این فیلترها پیدا نشد.
                    </p>
                  ) : null}

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-4 text-[10px] text-muted-foreground sm:px-5">
                    <span>
                      نمایش {formatPersianNumber(visibleStart)} تا {formatPersianNumber(visibleEnd)}{' '}
                      از {formatPersianNumber(resultCount)} محصول
                    </span>
                    <nav className="flex items-center gap-1" aria-label="صفحه‌بندی محصولات">
                      <button
                        className="flex h-8 w-8 items-center justify-center rounded-control border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-45"
                        type="button"
                        aria-label="صفحه قبلی"
                        disabled={page <= 1 || !isStaffAuthenticated}
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                      >
                        <Icon name="arrow-right" size={15} />
                      </button>
                      <button
                        className="flex h-8 min-w-8 items-center justify-center rounded-control bg-primary px-2 text-[10px] text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        type="button"
                        aria-current="page"
                      >
                        {formatPersianNumber(page)}
                      </button>
                      <button
                        className="flex h-8 w-8 items-center justify-center rounded-control border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        type="button"
                        aria-label="صفحه بعدی"
                        disabled={page >= totalPages || !isStaffAuthenticated}
                        onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                      >
                        <Icon name="arrow-left" size={15} />
                      </button>
                    </nav>
                  </div>
                </section>
              </div>
            )}
          </div>
        </section>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex min-h-[66px] items-stretch justify-around border-t border-border bg-surface/95 px-1 pb-[max(7px,env(safe-area-inset-bottom))] pt-1 shadow-float backdrop-blur lg:hidden"
        aria-label="ناوبری مدیریت موبایل"
      >
        {[
          ['admin', 'خانه', 'home'],
          ['products', 'محصولات', 'bag'],
          ['inventory', 'موجودی کم', 'warning'],
          ['orders', 'سفارش‌ها', 'package'],
          ['operations', 'بیشتر', 'menu'],
        ].map(([key, label, icon]) => (
          <a
            className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-control text-[9px] transition-colors ${key === 'products' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-background hover:text-foreground'}`}
            href={`#admin${key === 'admin' ? '' : `/${key}`}`}
            key={key}
          >
            <Icon name={icon as IconName} size={18} />
            <span>{label}</span>
          </a>
        ))}
      </nav>
    </main>
  );
}

function AdminSessionLoading() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4" dir="rtl">
      <section className="w-full max-w-md bg-surface p-8 text-right shadow-float" role="status">
        <span className="section-heading__eyebrow">NOVA / ADMIN ACCESS</span>
        <h1 className="mt-2 text-2xl leading-relaxed">در حال بررسی دسترسی</h1>
        <p className="mt-3 text-sm leading-8 text-muted-foreground">
          نشست مدیریت شما در حال بررسی است.
        </p>
      </section>
    </main>
  );
}

function AdminPermissionDeniedPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4" dir="rtl">
      <section className="w-full max-w-md bg-surface p-8 text-right shadow-float" role="alert">
        <span className="section-heading__eyebrow">NOVA / ADMIN ACCESS</span>
        <h1 className="mt-2 text-2xl leading-relaxed">دسترسی کافی نیست</h1>
        <p className="mt-3 text-sm leading-8 text-muted-foreground">
          حساب کاربری شما برای مشاهده این بخش از فضای مدیریت مجوز لازم را ندارد.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a
            className="inline-flex min-h-11 items-center justify-center rounded-control bg-primary px-5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            href="#admin"
          >
            بازگشت به داشبورد
          </a>
          <AdminLogoutButton className="inline-flex min-h-11 items-center gap-2 border-0 bg-transparent px-2 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50" />
        </div>
      </section>
    </main>
  );
}

export function shouldShowAdminDashboardPreview({
  isDevelopment,
  hasStaffSession,
}: {
  isDevelopment: boolean;
  hasStaffSession: boolean;
}): boolean {
  return isDevelopment && !hasStaffSession;
}

export function AdminRouteUnavailablePage({ page }: { page: string }) {
  const titleMap: Record<string, string> = {
    admin: 'داشبورد',
    categories: 'دسته‌بندی‌ها',
    inventory: 'موجودی',
    orders: 'سفارش‌ها',
    payments: 'پرداخت‌ها',
    promotions: 'کدهای تخفیف',
    customers: 'مشتری‌ها',
    content: 'محتوا',
    audit: 'گزارش فعالیت',
    operations: 'عملیات',
  };
  const title = titleMap[page.split('/')[0] ?? page] ?? 'این بخش';

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4" dir="rtl">
      <section className="w-full max-w-md bg-surface p-8 text-right shadow-float" role="status">
        <span className="section-heading__eyebrow">NOVA / ADMIN</span>
        <h1 className="mt-2 text-2xl leading-relaxed">{title} هنوز آماده نیست</h1>
        <p className="mt-3 text-sm leading-8 text-muted-foreground">
          این مسیر هنوز به داده‌های واقعی پنل متصل نشده است و برای جلوگیری از نمایش اطلاعات نمونه،
          فعلاً غیرفعال است.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a
            className="inline-flex min-h-11 items-center justify-center rounded-control bg-primary px-5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            href="#admin"
          >
            بازگشت به داشبورد
          </a>
          <AdminLogoutButton className="inline-flex min-h-11 items-center gap-2 border-0 bg-transparent px-2 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50" />
        </div>
      </section>
    </main>
  );
}

export function AdminPage({ page, queryString = '' }: { page: string; queryString?: string }) {
  const isLoginPage = page === 'login';
  const sessionExpired = new URLSearchParams(queryString).get('expired') === '1';
  const staffQuery = useStaffUser(!isLoginPage);
  const authFailure = isStaffAuthFailure(staffQuery.error);
  const authorizationFailure = isStaffAuthorizationFailure(staffQuery.error);
  const hasStaffSession = Boolean(staffQuery.data) && !authFailure;
  const allowDevelopmentPreview = shouldShowAdminDashboardPreview({
    isDevelopment: import.meta.env.DEV,
    hasStaffSession: Boolean(staffQuery.data),
  });

  if (isLoginPage) return <AdminLoginPage sessionExpired={sessionExpired} />;
  if (authorizationFailure) return <AdminPermissionDeniedPage />;
  if (staffQuery.isPending && !allowDevelopmentPreview) return <AdminSessionLoading />;
  if (authFailure && staffQuery.data) return <AdminLoginPage sessionExpired />;
  if (!hasStaffSession && !allowDevelopmentPreview) return <AdminLoginPage />;
  const [adminSection, ...adminPathSegments] = page.split('/');
  const staffRoles = staffQuery.data?.roles;
  if (adminSection === 'orders') {
    const encodedOrderNumber = adminPathSegments.join('/');
    return encodedOrderNumber ? (
      <AdminOrderDetailPage
        orderNumber={decodeHashSegment(encodedOrderNumber)}
        staffRoles={staffRoles}
      />
    ) : (
      <AdminOrdersPage staffRoles={staffRoles} />
    );
  }
  if (
    adminSection === 'payments' ||
    adminSection === 'customers' ||
    adminSection === 'notifications' ||
    adminSection === 'audit'
  ) {
    return <AdminSupportFinancePage view={adminSection} />;
  }
  if (adminSection === 'catalog' || adminSection === 'inventory') {
    const [subsection, encodedId] = adminPathSegments;
    if (adminSection === 'catalog' && subsection === 'categories') {
      return <AdminCatalogInventoryPage view="categories" staffRoles={staffRoles} />;
    }
    if (adminSection === 'catalog' && subsection === 'products' && encodedId) {
      return (
        <AdminCatalogInventoryPage
          view="product"
          productId={decodeHashSegment(encodedId)}
          staffRoles={staffRoles}
        />
      );
    }
    if (adminSection === 'inventory') {
      return (
        <AdminCatalogInventoryPage
          view="inventory"
          variantId={encodedId ? decodeHashSegment(encodedId) : undefined}
          staffRoles={staffRoles}
        />
      );
    }
    return <AdminCatalogInventoryPage view="catalog" staffRoles={staffRoles} />;
  }
  if (adminSection === 'content') {
    const [subsection, encodedId] = adminPathSegments;
    if (subsection === 'seo' || subsection === 'redirects') {
      return <AdminContentSeoPage view={subsection} staffRoles={staffRoles} />;
    }
    if (subsection === 'pages' && encodedId) {
      return (
        <AdminContentSeoPage
          view="content"
          pageId={decodeHashSegment(encodedId)}
          staffRoles={staffRoles}
        />
      );
    }
    return <AdminContentSeoPage view="content" staffRoles={staffRoles} />;
  }
  if (page === 'products') return <AdminProductsPage />;
  if (page !== 'admin') {
    if (!allowDevelopmentPreview) return <AdminRouteUnavailablePage page={page} />;
    return <AdminLegacyPage page={page} />;
  }
  if (!allowDevelopmentPreview) return <AdminRouteUnavailablePage page="admin" />;

  const nav = [
    ['admin', 'داشبورد', 'home'],
    ['catalog', 'محصولات', 'bag'],
    ['catalog/categories', 'دسته‌بندی‌ها', 'layers'],
    ['orders', 'سفارش‌ها', 'package'],
    ['customers', 'مشتریان', 'users'],
    ['marketing', 'بازاریابی', 'send'],
    ['content', 'محتوا', 'book'],
    ['audit', 'گزارش‌ها', 'eye'],
    ['promotions', 'تخفیف‌ها', 'tag'],
    ['operations', 'تنظیمات', 'settings'],
  ].map(([key, label, icon]) => ({ key, label, icon: icon as IconName }));

  return (
    <main className="admin-shell min-h-svh bg-[#f6f6f4] text-foreground">
      <aside className="admin-sidebar flex-[0_0_194px] !bg-surface !text-foreground px-3 py-6">
        <Logo descriptor="ADMIN PANEL" />
        <span className="admin-sidebar__label !text-muted-foreground">فضای مدیریت</span>
        <nav className="flex flex-col gap-1" aria-label="ناوبری مدیریت">
          {nav.map((item) => (
            <a
              className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-xs !text-foreground/80 transition-colors ${page === item.key || page.startsWith(`${item.key}/`) ? '!bg-primary !text-primary-foreground' : 'hover:!bg-secondary'}`}
              href={`#admin${item.key === 'admin' ? '' : `/${item.key}`}`}
              key={item.key}
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </a>
          ))}
        </nav>
        <div className="mt-auto border-t !border-border pt-5">
          <div className="flex items-center gap-3 px-2">
            <img
              className="h-10 w-10 rounded-full object-cover"
              src="/assets/nova-hero-men.webp"
              alt=""
            />
            <div className="min-w-0 text-right">
              <strong className="block truncate text-xs !text-foreground">رضا سواری</strong>
              <small className="mt-1 block text-[9px] !text-muted-foreground">مدیر سیستم</small>
            </div>
          </div>
          <AdminLogoutButton className="mt-4 flex min-h-10 w-full items-center gap-2 border-0 bg-transparent px-2 text-right text-[10px] !text-muted-foreground transition-colors hover:!text-foreground disabled:opacity-50" />
        </div>
      </aside>
      <section className="admin-content min-h-svh w-full">
        <header
          className="admin-topbar !flex-row min-h-[68px] gap-3 bg-surface px-4 py-3 md:px-6"
          dir="ltr"
        >
          <div className="!flex !flex-row w-full items-center justify-between md:!hidden" dir="ltr">
            <AdminLogoutButton
              compact
              label="خروج"
              className="icon-button border-0 disabled:opacity-50"
            />
            <a className="icon-button" href="#admin" aria-label="داشبورد">
              <Icon name="menu" size={20} />
            </a>
            <Logo descriptor="ADMIN PANEL" />
            <a className="icon-button" href="#admin" aria-label="اعلان‌ها">
              <Icon name="bell" size={19} />
            </a>
          </div>
          <form
            className="hidden w-full max-w-[375px] items-center gap-2 rounded-md border border-border bg-background px-3 md:flex"
            dir="rtl"
            onSubmit={(event) => event.preventDefault()}
          >
            <Icon name="search" size={18} className="text-muted-foreground" />
            <input
              className="min-h-9 min-w-0 flex-1 bg-transparent text-xs outline-none"
              aria-label="جست‌وجو در پنل مدیریت"
              placeholder="جست‌وجو در محصولات، سفارش‌ها، مشتریان ..."
            />
            <kbd className="hidden rounded bg-secondary px-2 py-1 text-[9px] text-muted-foreground lg:inline-block">
              Ctrl K
            </kbd>
          </form>
          <div className="ml-auto hidden !flex-row items-center gap-4 md:flex" dir="rtl">
            <button
              className="relative flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-secondary"
              type="button"
              aria-label="اعلان‌ها"
            >
              <Icon name="bell" size={19} />
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-[8px] text-primary-foreground">
                ۱
              </span>
            </button>
            <img
              className="h-9 w-9 rounded-full bg-secondary object-cover"
              src="/assets/nova-hero-men.webp"
              alt="پروفایل رضا سواری"
            />
            <span className="hidden text-xs text-muted-foreground lg:inline">
              پنجشنبه ۲۵ شهریور ۱۴۰۵
            </span>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-primary transition-colors hover:bg-accent-soft"
              type="button"
              aria-label="تغییر پوسته"
            >
              <Icon name="sparkles" size={19} />
            </button>
          </div>
        </header>
        <div className="admin-page bg-[#f6f6f4] p-4 pb-24 md:p-6 md:pb-8 lg:p-8">
          <AdminDashboard />
        </div>
      </section>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex min-h-[66px] items-stretch justify-around border-t border-border bg-surface/95 px-2 pb-[max(7px,env(safe-area-inset-bottom))] pt-1 shadow-float backdrop-blur md:hidden"
        aria-label="ناوبری مدیریت موبایل"
      >
        {[
          ['admin', 'داشبورد', 'home'],
          ['catalog', 'محصولات', 'bag'],
          ['orders', 'سفارش‌ها', 'package'],
          ['operations', 'بیشتر', 'menu'],
        ].map(([key, label, icon]) => (
          <a
            className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-[10px] ${page === key ? 'text-primary' : 'text-muted-foreground'}`}
            href={`#admin${key === 'admin' ? '' : `/${key}`}`}
            key={key}
          >
            <Icon name={icon as IconName} size={19} />
            <span>{label}</span>
          </a>
        ))}
      </nav>
    </main>
  );
}

function EmptyState({
  title,
  description,
  action,
  href,
  onAction,
}: {
  title: string;
  description?: string;
  action: string;
  href?: string;
  onAction?: () => void;
}) {
  return (
    <section className="empty-state">
      <span className="empty-state__icon">
        <Icon name="layers" size={25} />
      </span>
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
      {onAction ? (
        <Button type="button" onClick={onAction}>
          {action}
        </Button>
      ) : (
        <Button asChild>
          <a href={href ?? '#home'}>{action}</a>
        </Button>
      )}
    </section>
  );
}

function NotFoundPage() {
  return (
    <main className="shell inner-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
      <EmptyState
        title="این صفحه پیدا نشد"
        description="به نظر می‌رسد مسیر تغییر کرده است؛ از خانه دوباره شروع کنید."
        action="بازگشت به خانه"
        href="#home"
      />
    </main>
  );
}

export function RouteView({
  route,
  cart,
  cartLoading,
  cartError,
  onRetryCart,
  customerId,
  isWishlisted,
  onToggleWishlist,
}: {
  route: string;
  cart: CartView | undefined;
  cartLoading: boolean;
  cartError: boolean;
  onRetryCart: () => void;
  customerId?: string;
  isWishlisted: (slug: string) => boolean;
  onToggleWishlist: (slug: string) => void;
}) {
  const resolved = parseHashRoute(route);

  switch (resolved.kind) {
    case 'home':
      return (
        <StorefrontDiscoveryPage
          view="home"
          isWishlisted={isWishlisted}
          onToggleWishlist={onToggleWishlist}
        />
      );
    case 'auth-request':
      return <AuthPage mode="request" />;
    case 'auth-verify':
      return <AuthPage mode="verify" queryString={resolved.queryString} />;
    case 'category':
      return (
        <StorefrontDiscoveryPage
          view="category"
          audience={resolved.audience}
          isWishlisted={isWishlisted}
          onToggleWishlist={onToggleWishlist}
        />
      );
    case 'products':
      return (
        <StorefrontDiscoveryPage
          view="listing"
          audience={resolved.audience}
          mode={
            resolved.mode === 'new' || resolved.mode === 'sale' || resolved.mode === 'accessories'
              ? resolved.mode
              : undefined
          }
          queryString={resolved.queryString}
          isWishlisted={isWishlisted}
          onToggleWishlist={onToggleWishlist}
        />
      );
    case 'product':
      return (
        <StorefrontDiscoveryPage
          view="product"
          slug={decodeHashSegment(resolved.slug)}
          isWishlisted={isWishlisted}
          onToggleWishlist={onToggleWishlist}
        />
      );
    case 'cart':
      return (
        <StorefrontCartPage
          cart={cart}
          isLoading={cartLoading}
          isError={cartError}
          onRetry={onRetryCart}
          customerId={customerId}
          isWishlisted={isWishlisted}
          onToggleWishlist={onToggleWishlist}
        />
      );
    case 'preview-state':
      if (resolved.state === 'payment-recovery') {
        return <CheckoutPaymentRecoveryPage queryString={resolved.queryString} />;
      }
      return <PreviewStatePage state={resolved.state} />;
    case 'checkout-confirmation':
      return <CheckoutConfirmationPage queryString={resolved.queryString} />;
    case 'checkout':
      return (
        <StorefrontCheckoutPage
          step={resolved.step}
          queryString={resolved.queryString}
          cart={cart}
          cartLoading={cartLoading}
          cartError={cartError}
          onRetryCart={onRetryCart}
        />
      );
    case 'account':
      return <CustomerAccountPage section={resolved.section} />;
    case 'address-list':
      return <CustomerAddressBookPage />;
    case 'address-create':
      return <CustomerAddressBookPage mode="create" />;
    case 'address-edit':
      return <CustomerAddressBookPage mode="edit" addressId={resolved.addressId} />;
    case 'order':
      return <CustomerOrderPage orderNumber={resolved.orderNumber} />;
    case 'return':
      return (
        <CustomerReturnPage
          mode={resolved.status ? 'status' : undefined}
          orderNumber={new URLSearchParams(resolved.queryString).get('orderNumber') ?? ''}
        />
      );
    case 'editorial':
      return <PublicContentSystemPage slug={resolved.page} />;
    case 'content':
      return <PublicContentSystemPage slug={resolved.slug} />;
    case 'admin':
      return <AdminPage page={resolved.page} queryString={resolved.queryString} />;
    case 'not-found':
      return <NotFoundPage />;
  }
}

export function App() {
  const route = useHashRoute();
  useScrollToTop(route);
  const cartQuery = useCart(!route.startsWith('#admin'));
  const customerQuery = useCurrentCustomer(!route.startsWith('#admin'));
  const cart = cartQuery.data;
  const cartCount = cart?.itemCount ?? 0;
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [wishlist, setWishlist] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const initial = readInitialRenderContext();
    const initialMatches =
      initial &&
      initial.hashRoute === route &&
      normalizeSeoPath(initial.path) === normalizeSeoPath(window.location.pathname);
    const isDataRoute = route.startsWith('#product/') || route.startsWith('#content/');
    const seo = initialMatches ? initial.seo : clientSeoForHashRoute(route, window.location.origin);
    if (isDataRoute && !initialMatches) return;
    applySeoDocument(document, seo);
  }, [route]);

  useEffect(() => {
    if (route === '#search') setSearchOpen(true);
  }, [route]);

  const toggleWishlist = (slug: string) => {
    setWishlist((current) => {
      const next = new Set(current);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  return (
    <div
      className={`app-root min-h-svh bg-background ${route.startsWith('#admin') ? 'app-root--admin' : ''}`}
      dir="rtl"
    >
      {!route.startsWith('#admin') ? (
        <Header
          cartCount={cartCount}
          onSearch={() => setSearchOpen(true)}
          onMenu={() => setMenuOpen(true)}
        />
      ) : null}
      <RouteView
        route={route}
        cart={cart}
        cartLoading={cartQuery.isPending}
        cartError={cartQuery.isError}
        onRetryCart={() => void cartQuery.refetch()}
        customerId={customerQuery.data?.id}
        isWishlisted={(slug) => wishlist.has(slug)}
        onToggleWishlist={toggleWishlist}
      />
      {!route.startsWith('#admin') ? <MobileBottomNav cartCount={cartCount} /> : null}
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
      <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
