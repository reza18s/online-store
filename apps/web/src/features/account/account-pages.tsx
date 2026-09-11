import { useEffect, useState, type FormEvent, type ReactNode } from 'react';

import {
  type CheckoutOrderStatus,
  type CustomerAddress,
  type CustomerAddressCreateInput,
  type CustomerOrderDetail,
  type CustomerReturnReason,
} from '@nova/api-client';
import { Button } from '@nova/ui';

import {
  useCreateCustomerAddress,
  useCustomerAddresses,
  useRemoveCustomerAddress,
  useSetCustomerAddressDefault,
  useUpdateCustomerAddress,
} from '../addresses/addresses-api';
import { useCurrentCustomer, useLogoutCustomer } from '../auth/auth-api';
import {
  useCancelCustomerOrder,
  useCustomerOrder,
  useCustomerOrders,
  useRequestCustomerOrderReturn,
} from '../orders/orders-api';
import { Icon } from '../../shared/icon';
import {
  apiErrorMessage,
  canCancelCustomerOrder,
  formatPersianDate,
  formatPersianNumber,
  formatToman,
  getReturnEligibility,
  isCustomerActive,
  isOfflineError,
  isPermissionError,
  isUnauthorizedError,
  orderStatusCopy,
  returnReasonCopy,
  returnRequestStatusCopy,
  useCustomerCacheBoundary,
  useOnlineStatus,
} from './account-state';

type AccountSection = 'dashboard' | 'profile' | 'orders' | 'addresses';

const accountNavigation: Array<{
  key: AccountSection;
  label: string;
  icon: 'grid' | 'package' | 'home' | 'user';
}> = [
  { key: 'dashboard', label: 'نمای کلی', icon: 'grid' },
  { key: 'orders', label: 'سفارش‌های من', icon: 'package' },
  { key: 'addresses', label: 'آدرس‌ها', icon: 'home' },
  { key: 'profile', label: 'اطلاعات شخصی', icon: 'user' },
];

const accountTitles: Record<AccountSection, string> = {
  dashboard: 'حساب کاربری',
  profile: 'اطلاعات شخصی',
  orders: 'سفارش‌های من',
  addresses: 'آدرس‌ها',
};

function PageFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <main
      className={`shell inner-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background ${className}`}
    >
      {children}
    </main>
  );
}

function EmptyState({
  title,
  description,
  action,
  href = '#home',
  onAction,
  icon = 'layers',
}: {
  title: string;
  description: string;
  action: string;
  href?: string;
  onAction?: () => void;
  icon?: 'layers' | 'user' | 'warning' | 'refresh' | 'package';
}) {
  return (
    <section className="empty-state" role="status">
      <span className="empty-state__icon">
        <Icon name={icon} size={25} />
      </span>
      <h1>{title}</h1>
      <p>{description}</p>
      {onAction ? (
        <Button type="button" onClick={onAction}>
          {action}
        </Button>
      ) : (
        <Button asChild>
          <a href={href}>{action}</a>
        </Button>
      )}
    </section>
  );
}

function LoadingState({ label, rows = 2 }: { label: string; rows?: number }) {
  return (
    <section className="mx-auto max-w-4xl animate-pulse space-y-4" role="status" aria-label={label}>
      <div className="h-4 w-36 rounded bg-secondary" />
      <div className="h-8 w-64 rounded bg-secondary" />
      <div className="h-4 w-full max-w-md rounded bg-secondary" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: rows }, (_, index) => (
          <div className="h-36 rounded-editorial bg-secondary" key={index} />
        ))}
      </div>
    </section>
  );
}

function SessionState({
  title = 'حساب کاربری',
  description = 'اطلاعات خصوصی شما فقط پس از ورود به حساب نمایش داده می‌شود.',
  children,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
}) {
  const customerQuery = useCurrentCustomer();
  const online = useOnlineStatus();
  useCustomerCacheBoundary(customerQuery.data?.id, isUnauthorizedError(customerQuery.error));

  if (customerQuery.isPending) {
    return (
      <PageFrame>
        <LoadingState label="در حال بارگذاری حساب کاربری" />
      </PageFrame>
    );
  }
  if (customerQuery.isError) {
    const expired = isUnauthorizedError(customerQuery.error);
    const permission = isPermissionError(customerQuery.error);
    const offline = !online || isOfflineError(customerQuery.error);
    return (
      <PageFrame>
        <EmptyState
          title={
            expired
              ? 'نشست شما منقضی شده است'
              : permission
                ? 'دسترسی به حساب ممکن نیست'
                : offline
                  ? 'اتصال اینترنت برقرار نیست'
                  : 'حساب کاربری بارگذاری نشد'
          }
          description={
            expired
              ? 'برای حفاظت از اطلاعات سفارش‌ها و آدرس‌ها دوباره وارد حساب شوید.'
              : permission
                ? 'این حساب در حال حاضر اجازه استفاده از این بخش را ندارد.'
                : offline
                  ? 'اتصال را بررسی کنید و برای دریافت دوباره اطلاعات تلاش کنید.'
                  : apiErrorMessage(
                      customerQuery.error,
                      'دریافت اطلاعات حساب ممکن نشد؛ دوباره تلاش کنید.',
                    )
          }
          action={expired ? 'ورود دوباره' : 'تلاش دوباره'}
          href={expired ? '#auth' : '#account'}
          onAction={expired || permission ? undefined : () => void customerQuery.refetch()}
          icon={expired || permission ? 'user' : offline ? 'refresh' : 'warning'}
        />
      </PageFrame>
    );
  }
  if (!customerQuery.data || !isCustomerActive(customerQuery.data)) {
    return (
      <PageFrame>
        <EmptyState
          title={customerQuery.data ? 'حساب شما در دسترس نیست' : `برای دیدن ${title} وارد شوید`}
          description={
            customerQuery.data
              ? 'این حساب امکان استفاده از بخش‌های مشتری را ندارد. برای راهنمایی با پشتیبانی تماس بگیرید.'
              : description
          }
          action={customerQuery.data ? 'تماس با پشتیبانی' : 'ورود به حساب'}
          href={customerQuery.data ? '#support' : '#auth'}
          icon="user"
        />
      </PageFrame>
    );
  }
  return <>{children}</>;
}

function AccountLayout({
  customer,
  section,
  onLogout,
  logoutPending,
  logoutError,
  children,
}: {
  customer: NonNullable<ReturnType<typeof useCurrentCustomer>['data']>;
  section: AccountSection;
  onLogout: () => void;
  logoutPending: boolean;
  logoutError: string;
  children: ReactNode;
}) {
  return (
    <PageFrame className="account-page">
      <div className="breadcrumb">
        <a href="#home">خانه</a>
        <span>/</span>
        <span>حساب کاربری</span>
      </div>
      <div className="account-layout lg:grid">
        <aside className="account-nav" aria-label="بخش‌های حساب کاربری">
          <div className="account-nav__profile">
            <span aria-hidden="true">ن</span>
            <div>
              <strong>{customer.email ?? 'مشتری نوا'}</strong>
              <small dir="ltr">{customer.phone}</small>
            </div>
          </div>
          {accountNavigation.map((item) => (
            <a
              className={section === item.key ? 'is-active' : ''}
              href={`#account${item.key === 'dashboard' ? '' : `/${item.key}`}`}
              key={item.key}
              aria-current={section === item.key ? 'page' : undefined}
            >
              <Icon name={item.icon} size={17} />
              {item.label}
            </a>
          ))}
          {logoutError ? (
            <p className="mt-3 px-3 text-sm leading-6 text-destructive" role="alert">
              {logoutError}
            </p>
          ) : null}
          <button
            className="mt-3 flex min-h-11 items-center gap-2 px-3 text-sm text-destructive transition-colors hover:text-destructive-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
            disabled={logoutPending}
            onClick={onLogout}
            type="button"
          >
            <Icon name="close" size={17} />
            {logoutPending ? 'در حال خروج...' : 'خروج از حساب'}
          </button>
        </aside>
        <section className="account-content">{children}</section>
      </div>
    </PageFrame>
  );
}

export function CustomerAccountPage({ section = 'dashboard' }: { section?: string }) {
  const customerQuery = useCurrentCustomer();
  const customer = customerQuery.data;
  const activeSection: AccountSection =
    section in accountTitles ? (section as AccountSection) : 'dashboard';
  const ordersQuery = useCustomerOrders({ page: 1, limit: 10 }, isCustomerActive(customer));
  const logoutMutation = useLogoutCustomer();
  const [logoutError, setLogoutError] = useState('');
  const online = useOnlineStatus();
  useCustomerCacheBoundary(customer?.id, isUnauthorizedError(customerQuery.error));

  if (customerQuery.isPending)
    return (
      <PageFrame>
        <LoadingState label="در حال بارگذاری حساب کاربری" />
      </PageFrame>
    );
  if (customerQuery.isError) {
    const expired = isUnauthorizedError(customerQuery.error);
    const offline = !online || isOfflineError(customerQuery.error);
    return (
      <PageFrame>
        <EmptyState
          title={
            expired
              ? 'نشست شما منقضی شده است'
              : offline
                ? 'اتصال اینترنت برقرار نیست'
                : 'حساب کاربری بارگذاری نشد'
          }
          description={
            expired
              ? 'برای مشاهده امن سفارش‌ها و آدرس‌ها دوباره وارد حساب شوید.'
              : offline
                ? 'اتصال را بررسی کنید و دوباره تلاش کنید.'
                : apiErrorMessage(customerQuery.error, 'دریافت اطلاعات حساب ممکن نشد.')
          }
          action={expired ? 'ورود دوباره' : 'تلاش دوباره'}
          href={expired ? '#auth' : '#account'}
          onAction={expired ? undefined : () => void customerQuery.refetch()}
          icon={expired ? 'user' : offline ? 'refresh' : 'warning'}
        />
      </PageFrame>
    );
  }
  if (!customer || !isCustomerActive(customer)) {
    return (
      <SessionState>
        <span />
      </SessionState>
    );
  }

  const latestOrder = ordersQuery.data?.items[0];
  const signOut = async () => {
    setLogoutError('');
    try {
      await logoutMutation.mutateAsync();
      window.location.hash = '#home';
    } catch (error) {
      setLogoutError(apiErrorMessage(error, 'خروج از حساب انجام نشد؛ دوباره تلاش کنید.'));
    }
  };

  return (
    <AccountLayout
      customer={customer}
      section={activeSection}
      onLogout={() => void signOut()}
      logoutPending={logoutMutation.isPending}
      logoutError={logoutError}
    >
      <header className="simple-page-header">
        <span className="section-heading__eyebrow">MY NOVA / ۰۱</span>
        <h1>{accountTitles[activeSection]}</h1>
        <p>اطلاعات و سفارش‌های شما در یک نگاه.</p>
      </header>
      {activeSection === 'profile' ? (
        <ProfilePanel customer={customer} />
      ) : activeSection === 'orders' ? (
        <CustomerOrderListContent query={ordersQuery} />
      ) : (
        <div className="account-panels md:grid-cols-2">
          <div className="account-panel">
            <span className="section-heading__eyebrow">آخرین سفارش</span>
            {ordersQuery.isPending ? (
              <div
                className="mt-4 animate-pulse space-y-3"
                role="status"
                aria-label="در حال بارگذاری آخرین سفارش"
              >
                <div className="h-6 w-48 rounded bg-secondary" />
                <div className="h-4 w-64 rounded bg-secondary" />
              </div>
            ) : latestOrder ? (
              <>
                <h2>
                  سفارش <span dir="ltr">{latestOrder.orderNumber}</span>
                </h2>
                <p>
                  {orderStatusCopy[latestOrder.status]} · {formatToman(latestOrder.totalToman)}
                </p>
                <a
                  className="text-link"
                  href={`#order/${encodeURIComponent(latestOrder.orderNumber)}`}
                >
                  مشاهده جزئیات <Icon name="arrow-left" size={15} />
                </a>
              </>
            ) : (
              <>
                <h2>هنوز سفارشی ندارید</h2>
                <p>اولین انتخاب خود را از مجموعه نوا شروع کنید.</p>
                <a className="text-link" href="#products">
                  مشاهده فروشگاه <Icon name="arrow-left" size={15} />
                </a>
              </>
            )}
            {ordersQuery.isError ? (
              <InlineQueryError
                error={ordersQuery.error}
                onRetry={() => void ordersQuery.refetch()}
              />
            ) : null}
          </div>
          <div className="account-panel">
            <span className="section-heading__eyebrow">دسترسی سریع</span>
            <a href="#account/addresses">
              مدیریت آدرس‌ها <Icon name="arrow-left" size={15} />
            </a>
            <a href="#account/orders">
              همه سفارش‌ها <Icon name="arrow-left" size={15} />
            </a>
            <a href="#support">
              پرسش‌های متداول <Icon name="arrow-left" size={15} />
            </a>
          </div>
        </div>
      )}
    </AccountLayout>
  );
}

function ProfilePanel({
  customer,
}: {
  customer: { email: string | null; phone: string; status: string };
}) {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <div className="account-panel">
        <span className="section-heading__eyebrow">اطلاعات تماس</span>
        <h2>شماره موبایل</h2>
        <p dir="ltr">{customer.phone}</p>
        <h2 className="mt-5">ایمیل</h2>
        <p dir="ltr">{customer.email ?? 'ثبت نشده'}</p>
      </div>
      <div className="account-panel">
        <span className="section-heading__eyebrow">وضعیت حساب</span>
        <h2>{customer.status === 'ACTIVE' ? 'حساب فعال' : 'حساب محدود'}</h2>
        <p>برای تغییر اطلاعات ورود یا کمک درباره حساب، با پشتیبانی نوا در تماس باشید.</p>
        <a className="text-link" href="#support">
          ارتباط با پشتیبانی <Icon name="arrow-left" size={15} />
        </a>
      </div>
    </section>
  );
}

function InlineQueryError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const offline = isOfflineError(error);
  return (
    <div className="inline-message inline-message--error" role="alert">
      <Icon name={offline ? 'refresh' : 'warning'} size={16} />
      <span>
        {offline
          ? 'اتصال برقرار نیست؛ اطلاعات خصوصی شما پس از اتصال دوباره بارگذاری می‌شود.'
          : isPermissionError(error)
            ? 'دسترسی به این اطلاعات ممکن نیست.'
            : apiErrorMessage(error, 'دریافت اطلاعات انجام نشد.')}
      </span>
      {!isPermissionError(error) && !isUnauthorizedError(error) ? (
        <button
          className="mr-auto min-h-8 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          onClick={onRetry}
          type="button"
        >
          تلاش دوباره
        </button>
      ) : null}
    </div>
  );
}

function CustomerOrderListContent({ query }: { query: ReturnType<typeof useCustomerOrders> }) {
  const [status, setStatus] = useState<'ALL' | CheckoutOrderStatus>('ALL');
  const online = useOnlineStatus();
  const filteredQuery = useCustomerOrders(
    { page: 1, limit: 10, status: status === 'ALL' ? undefined : status },
    status !== 'ALL',
  );
  const activeQuery = status === 'ALL' ? query : filteredQuery;
  const orders = activeQuery.data?.items ?? [];
  const statuses: Array<'ALL' | CheckoutOrderStatus> = [
    'ALL',
    'PENDING_PAYMENT',
    'CONFIRMED',
    'PREPARING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'RETURNED',
  ];
  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-2" aria-label="فیلتر سفارش‌ها">
        {statuses.map((item) => (
          <button
            className={`min-h-11 border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${status === item ? 'border-primary bg-accent-soft text-primary' : 'border-border bg-surface hover:border-primary'}`}
            key={item}
            onClick={() => setStatus(item)}
            type="button"
          >
            {item === 'ALL' ? 'همه' : orderStatusCopy[item]}
          </button>
        ))}
      </div>
      {activeQuery.isPending ? (
        <div
          className="account-order-list animate-pulse"
          role="status"
          aria-label="در حال بارگذاری سفارش‌ها"
        >
          {[1, 2, 3].map((item) => (
            <div className="h-20 rounded bg-secondary" key={item} />
          ))}
        </div>
      ) : null}
      {activeQuery.isError ? (
        <InlineQueryError error={activeQuery.error} onRetry={() => void activeQuery.refetch()} />
      ) : null}
      {!activeQuery.isPending && !activeQuery.isError && orders.length === 0 ? (
        <EmptyState
          title="هنوز سفارشی ثبت نکرده‌اید"
          description="وقتی اولین خرید خود را انجام دهید، وضعیت آن را همین‌جا دنبال می‌کنید."
          action="مشاهده فروشگاه"
          href="#products"
          icon="package"
        />
      ) : null}
      {!activeQuery.isPending && !activeQuery.isError && orders.length > 0 ? (
        <div className="account-order-list">
          {orders.map((order) => (
            <a
              className="order-card"
              href={`#order/${encodeURIComponent(order.orderNumber)}`}
              key={order.orderId}
            >
              <div>
                <span dir="ltr">{order.orderNumber}</span>
                <small>
                  {formatPersianDate(order.createdAt)} · {formatToman(order.totalToman)}
                </small>
              </div>
              <strong>{orderStatusCopy[order.status]}</strong>
              <Icon name="arrow-left" size={17} />
            </a>
          ))}
        </div>
      ) : null}
      {!online ? (
        <p className="mt-4 text-sm text-muted-foreground" role="status">
          اتصال فعلی قطع است؛ اقدام‌های سفارش فقط پس از اتصال انجام می‌شوند.
        </p>
      ) : null}
    </>
  );
}

type AddressFormState = Required<CustomerAddressCreateInput>;
const emptyAddressForm: AddressFormState = {
  label: '',
  recipientName: '',
  phone: '',
  province: '',
  city: '',
  addressLine: '',
  postalCode: '',
  isDefault: false,
};

function toAddressForm(address: CustomerAddress): AddressFormState {
  return {
    label: address.label,
    recipientName: address.recipientName,
    phone: address.phone,
    province: address.province,
    city: address.city,
    addressLine: address.addressLine,
    postalCode: address.postalCode,
    isDefault: address.isDefault,
  };
}

export function addressFormIsComplete(form: AddressFormState): boolean {
  return [
    form.label,
    form.recipientName,
    form.phone,
    form.province,
    form.city,
    form.addressLine,
    form.postalCode,
  ].every((value) => value.trim().length > 0);
}

function CustomerAddressForm({
  mode,
  selectedAddress,
  onSaved,
}: {
  mode: 'create' | 'edit';
  selectedAddress?: CustomerAddress;
  onSaved?: (address: CustomerAddress) => void;
}) {
  const createMutation = useCreateCustomerAddress();
  const updateMutation = useUpdateCustomerAddress();
  const [form, setForm] = useState<AddressFormState>(() =>
    selectedAddress ? toAddressForm(selectedAddress) : { ...emptyAddressForm },
  );
  const [savedForm, setSavedForm] = useState(form);
  const [formError, setFormError] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const dirty = JSON.stringify(form) !== JSON.stringify(savedForm);
  const mutationError = createMutation.error ?? updateMutation.error;
  const saving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    const next = selectedAddress ? toAddressForm(selectedAddress) : { ...emptyAddressForm };
    setForm(next);
    setSavedForm(next);
    setFormError('');
    setSaveState('idle');
  }, [selectedAddress?.id, mode]);

  const updateField = (field: keyof AddressFormState, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormError('');
    setSaveState('idle');
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    if (!addressFormIsComplete(form)) {
      setFormError('لطفاً همه بخش‌های آدرس را کامل کنید.');
      setSaveState('error');
      return;
    }
    if (mode === 'edit' && !selectedAddress) {
      setFormError('آدرس انتخاب‌شده در حساب شما پیدا نشد.');
      setSaveState('error');
      return;
    }
    const input: CustomerAddressCreateInput = {
      label: form.label.trim(),
      recipientName: form.recipientName.trim(),
      phone: form.phone.trim(),
      province: form.province.trim(),
      city: form.city.trim(),
      addressLine: form.addressLine.trim(),
      postalCode: form.postalCode.trim(),
      isDefault: form.isDefault,
    };
    setSaveState('saving');
    try {
      const address =
        mode === 'edit' && selectedAddress
          ? await updateMutation.mutateAsync({ addressId: selectedAddress.id, input })
          : await createMutation.mutateAsync(input);
      const next = toAddressForm(address);
      setForm(next);
      setSavedForm(next);
      setSaveState('saved');
      onSaved?.(address);
    } catch (error) {
      setFormError(apiErrorMessage(error, 'ذخیره آدرس انجام نشد؛ دوباره تلاش کنید.'));
      setSaveState('error');
    }
  };
  return (
    <form
      className="mx-auto max-w-3xl border border-border bg-surface p-6 shadow-card md:p-8"
      onSubmit={(event) => void submit(event)}
      noValidate
    >
      <div className="grid gap-4 md:grid-cols-2">
        <AddressField
          label="عنوان آدرس"
          value={form.label}
          onChange={(value) => updateField('label', value)}
          placeholder="مثلاً خانه"
          autoComplete="address-line1"
        />
        <AddressField
          label="نام تحویل‌گیرنده"
          value={form.recipientName}
          onChange={(value) => updateField('recipientName', value)}
          autoComplete="name"
        />
        <AddressField
          label="شماره تماس"
          value={form.phone}
          onChange={(value) => updateField('phone', value)}
          autoComplete="tel"
          inputMode="tel"
          dir="ltr"
        />
        <AddressField
          label="کد پستی"
          value={form.postalCode}
          onChange={(value) => updateField('postalCode', value)}
          placeholder="۱۰ رقمی"
          autoComplete="postal-code"
          inputMode="numeric"
          dir="ltr"
        />
        <AddressField
          label="استان"
          value={form.province}
          onChange={(value) => updateField('province', value)}
          autoComplete="address-level1"
        />
        <AddressField
          label="شهر"
          value={form.city}
          onChange={(value) => updateField('city', value)}
          autoComplete="address-level2"
        />
      </div>
      <label className="mt-4 flex flex-col gap-2 text-sm font-medium">
        نشانی کامل
        <textarea
          className="border border-border bg-background px-3 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft"
          rows={4}
          value={form.addressLine}
          onChange={(event) => updateField('addressLine', event.target.value)}
          placeholder="خیابان، کوچه، پلاک و واحد"
          autoComplete="street-address"
        />
      </label>
      <label className="mt-4 flex min-h-11 items-center gap-2 text-sm text-muted-foreground">
        <input
          className="h-4 w-4 accent-primary"
          type="checkbox"
          checked={form.isDefault}
          onChange={(event) => updateField('isDefault', event.target.checked)}
        />
        این آدرس، آدرس اصلی من باشد
      </label>
      {formError || mutationError ? (
        <p
          className="mt-4 border border-warning bg-warning-100 px-4 py-3 text-sm text-warning"
          role="alert"
        >
          {formError || apiErrorMessage(mutationError, 'عملیات آدرس انجام نشد.')}
        </p>
      ) : null}
      {saveState === 'saved' ? (
        <p
          className="mt-4 border border-success bg-success-100 px-4 py-3 text-sm text-success"
          role="status"
        >
          آدرس با موفقیت ذخیره شد.
        </p>
      ) : null}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={saving || !dirty} loading={saving}>
          {saving ? 'در حال ذخیره...' : 'ذخیره آدرس'}
        </Button>
        <Button asChild variant="outline">
          <a href="#account/addresses">بازگشت به آدرس‌ها</a>
        </Button>
        {dirty ? (
          <span className="text-xs text-muted-foreground" role="status">
            تغییرات ذخیره‌نشده دارید.
          </span>
        ) : null}
      </div>
    </form>
  );
}

function AddressField({
  label,
  value,
  onChange,
  ...props
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: 'text' | 'tel' | 'numeric';
  dir?: 'ltr' | 'rtl';
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium">
      {label}
      <input
        className="min-h-12 border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        {...props}
      />
    </label>
  );
}

export function CustomerAddressBookPage({
  mode = 'list',
  addressId,
}: {
  mode?: 'list' | 'create' | 'edit';
  addressId?: string;
}) {
  const customerQuery = useCurrentCustomer();
  const active = isCustomerActive(customerQuery.data);
  const addressesQuery = useCustomerAddresses(active);
  const setDefaultMutation = useSetCustomerAddressDefault();
  const removeMutation = useRemoveCustomerAddress();
  const [actionError, setActionError] = useState('');
  const online = useOnlineStatus();
  useCustomerCacheBoundary(customerQuery.data?.id, isUnauthorizedError(customerQuery.error));

  if (customerQuery.isPending || (active && addressesQuery.isPending))
    return (
      <PageFrame>
        <LoadingState label="در حال بارگذاری آدرس‌ها" />
      </PageFrame>
    );
  if (customerQuery.isError || !customerQuery.data || !active)
    return (
      <SessionState
        title="آدرس‌های من"
        description="برای مدیریت آدرس‌های تحویل ابتدا وارد حساب شوید."
      >
        <span />
      </SessionState>
    );
  if (addressesQuery.isError)
    return (
      <PageFrame>
        <EmptyState
          title={
            isUnauthorizedError(addressesQuery.error)
              ? 'نشست شما منقضی شده است'
              : isPermissionError(addressesQuery.error)
                ? 'دسترسی به آدرس‌ها ممکن نیست'
                : !online || isOfflineError(addressesQuery.error)
                  ? 'اتصال اینترنت برقرار نیست'
                  : 'بارگذاری آدرس‌ها ممکن نشد'
          }
          description={
            isUnauthorizedError(addressesQuery.error)
              ? 'برای حفاظت از آدرس‌ها دوباره وارد حساب شوید.'
              : isPermissionError(addressesQuery.error)
                ? 'این حساب اجازه مدیریت آدرس‌ها را ندارد.'
                : !online || isOfflineError(addressesQuery.error)
                  ? 'پس از اتصال دوباره تلاش کنید؛ اطلاعات فرم خصوصی شما ارسال نشده است.'
                  : apiErrorMessage(addressesQuery.error, 'دریافت آدرس‌ها ممکن نشد.')
          }
          action={isUnauthorizedError(addressesQuery.error) ? 'ورود دوباره' : 'تلاش دوباره'}
          href={isUnauthorizedError(addressesQuery.error) ? '#auth' : '#account/addresses'}
          onAction={
            isUnauthorizedError(addressesQuery.error)
              ? undefined
              : () => void addressesQuery.refetch()
          }
          icon={!online || isOfflineError(addressesQuery.error) ? 'refresh' : 'warning'}
        />
      </PageFrame>
    );

  const addresses = addressesQuery.data ?? [];
  const selected =
    mode === 'edit'
      ? addressId
        ? addresses.find((item) => item.id === addressId)
        : (addresses.find((item) => item.isDefault) ?? addresses[0])
      : undefined;
  const isMutating = setDefaultMutation.isPending || removeMutation.isPending;
  const changeDefault = async (id: string) => {
    setActionError('');
    try {
      await setDefaultMutation.mutateAsync(id);
    } catch (error) {
      setActionError(apiErrorMessage(error, 'تغییر آدرس اصلی انجام نشد.'));
    }
  };
  const remove = async (id: string) => {
    setActionError('');
    try {
      await removeMutation.mutateAsync(id);
    } catch (error) {
      setActionError(apiErrorMessage(error, 'حذف آدرس انجام نشد.'));
    }
  };
  if (mode === 'edit' && !selected)
    return (
      <PageFrame>
        <EmptyState
          title="آدرس پیدا نشد"
          description="این آدرس دیگر در حساب شما وجود ندارد یا به این حساب تعلق ندارد."
          action="بازگشت به آدرس‌ها"
          href="#account/addresses"
        />
      </PageFrame>
    );
  return (
    <PageFrame>
      <div className="breadcrumb">
        <a href="#account">حساب کاربری</a>
        <span>/</span>
        <span>آدرس‌ها</span>
      </div>
      <header className="simple-page-header">
        <span className="section-heading__eyebrow">MY NOVA / ADDRESSES</span>
        <h1>
          {mode === 'create' ? 'افزودن آدرس جدید' : mode === 'edit' ? 'ویرایش آدرس' : 'آدرس‌های من'}
        </h1>
        <p>آدرس تحویل سفارش‌های شما، جدا و امن نگهداری می‌شود.</p>
      </header>
      {actionError ? (
        <p
          className="mb-4 border border-warning bg-warning-100 px-4 py-3 text-sm text-warning"
          role="alert"
        >
          {actionError}
        </p>
      ) : null}
      {mode !== 'list' ? (
        <CustomerAddressForm mode={mode} selectedAddress={selected} />
      ) : addresses.length === 0 ? (
        <EmptyState
          title="هنوز آدرسی ثبت نکرده‌اید"
          description="برای تحویل سریع‌تر سفارش، اولین آدرس خود را اضافه کنید."
          action="افزودن آدرس جدید"
          href="#account/addresses/create"
        />
      ) : (
        <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <article
              className={`border bg-surface p-5 shadow-card ${address.isDefault ? 'border-primary' : 'border-border'}`}
              key={address.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  {address.isDefault ? (
                    <span className="section-heading__eyebrow">پیش‌فرض</span>
                  ) : null}
                  <h2 className="mt-2 text-lg">{address.label}</h2>
                </div>
                {address.isDefault ? (
                  <span className="rounded-pill bg-accent-soft px-3 py-1 text-xs text-primary">
                    آدرس اصلی
                  </span>
                ) : null}
              </div>
              <address className="mt-4 not-italic text-sm leading-8 text-muted-foreground">
                <span className="block font-medium text-foreground">{address.recipientName}</span>
                <span className="block" dir="ltr">
                  {address.phone}
                </span>
                <span className="block">
                  {address.province}، {address.city}، {address.addressLine}
                </span>
                <span className="block">
                  کد پستی: <b dir="ltr">{address.postalCode}</b>
                </span>
              </address>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                <a
                  className="text-link"
                  href={`#account/addresses/edit/${encodeURIComponent(address.id)}`}
                >
                  ویرایش <Icon name="edit" size={15} />
                </a>
                {!address.isDefault ? (
                  <button
                    className="min-h-9 text-muted-foreground underline underline-offset-4 transition-colors hover:text-primary disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    type="button"
                    disabled={isMutating}
                    onClick={() => void changeDefault(address.id)}
                  >
                    انتخاب به عنوان اصلی
                  </button>
                ) : null}
                <button
                  className="min-h-9 text-destructive underline underline-offset-4 transition-colors hover:text-destructive/80 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  type="button"
                  disabled={isMutating}
                  onClick={() => {
                    if (window.confirm('آیا از حذف این آدرس مطمئن هستید؟')) void remove(address.id);
                  }}
                >
                  حذف
                </button>
              </div>
            </article>
          ))}
          <a
            className="flex min-h-48 flex-col items-center justify-center gap-3 border border-dashed border-border bg-surface text-center text-primary transition-colors hover:border-primary hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            href="#account/addresses/create"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <Icon name="plus" size={21} />
            </span>
            <strong>افزودن آدرس جدید</strong>
            <span className="text-xs text-muted-foreground">برای تحویل سریع‌تر سفارش</span>
          </a>
        </div>
      )}
    </PageFrame>
  );
}

function OrderDetailError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const needsLogin = isUnauthorizedError(error);
  const offline = isOfflineError(error);
  return (
    <PageFrame>
      <EmptyState
        title={
          needsLogin
            ? 'نشست شما منقضی شده است'
            : offline
              ? 'اتصال اینترنت برقرار نیست'
              : isPermissionError(error)
                ? 'این سفارش قابل مشاهده نیست'
                : 'سفارش بارگذاری نشد'
        }
        description={
          needsLogin
            ? 'برای دیدن اطلاعات سفارش دوباره وارد حساب شوید.'
            : offline
              ? 'پس از اتصال دوباره، جزئیات سفارش را دریافت کنید.'
              : apiErrorMessage(error, 'این سفارش پیدا نشد یا دیگر در حساب شما قابل مشاهده نیست.')
        }
        action={needsLogin ? 'ورود دوباره' : 'تلاش دوباره'}
        href={needsLogin ? '#auth' : '#account/orders'}
        onAction={needsLogin || isPermissionError(error) ? undefined : onRetry}
        icon={offline ? 'refresh' : needsLogin ? 'user' : 'warning'}
      />
    </PageFrame>
  );
}

export function CustomerOrderPage({ orderNumber }: { orderNumber: string }) {
  const customerQuery = useCurrentCustomer();
  const orderQuery = useCustomerOrder(
    orderNumber,
    isCustomerActive(customerQuery.data) && Boolean(orderNumber),
  );
  const cancelMutation = useCancelCustomerOrder();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [cancelSuccess, setCancelSuccess] = useState(false);
  useCustomerCacheBoundary(customerQuery.data?.id, isUnauthorizedError(customerQuery.error));

  if (customerQuery.isPending || orderQuery.isPending)
    return (
      <PageFrame>
        <LoadingState label="در حال بارگذاری سفارش" rows={2} />
      </PageFrame>
    );
  if (customerQuery.isError)
    return (
      <OrderDetailError error={customerQuery.error} onRetry={() => void customerQuery.refetch()} />
    );
  if (!customerQuery.data || !isCustomerActive(customerQuery.data))
    return (
      <SessionState
        title="جزئیات سفارش"
        description="برای مشاهده جزئیات سفارش ابتدا وارد حساب شوید."
      >
        <span />
      </SessionState>
    );
  if (orderQuery.isError || !orderQuery.data)
    return <OrderDetailError error={orderQuery.error} onRetry={() => void orderQuery.refetch()} />;
  const order = orderQuery.data;
  const events = order.events.length
    ? order.events
    : [{ fromStatus: null, toStatus: order.status, createdAt: order.updatedAt }];
  const eligibility = getReturnEligibility(order);
  const submitCancel = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCancelError('');
    if (!cancelReason.trim()) {
      setCancelError('دلیل لغو را وارد کنید.');
      return;
    }
    try {
      await cancelMutation.mutateAsync({
        orderNumber: order.orderNumber,
        input: { reason: cancelReason.trim() },
      });
      setCancelOpen(false);
      setCancelSuccess(true);
    } catch (error) {
      setCancelError(
        apiErrorMessage(error, 'لغو سفارش انجام نشد؛ وضعیت سفارش را دوباره بررسی کنید.'),
      );
    }
  };
  return (
    <PageFrame className="order-page">
      <div className="breadcrumb">
        <a href="#account/orders">سفارش‌ها</a>
        <span>/</span>
        <span dir="ltr">{order.orderNumber}</span>
      </div>
      <header className="simple-page-header">
        <span className="section-heading__eyebrow">
          ORDER / <span dir="ltr">{order.orderNumber}</span>
        </span>
        <h1>پیگیری سفارش</h1>
        <p>
          {orderStatusCopy[order.status]} · ثبت‌شده در {formatPersianDate(order.createdAt)}
        </p>
      </header>
      {cancelSuccess ? (
        <p
          className="mb-4 border border-success bg-success-100 px-4 py-3 text-sm text-success"
          role="status"
        >
          درخواست لغو سفارش ثبت شد؛ وضعیت و بازپرداخت فقط از پاسخ سرور پیروی می‌کند.
        </p>
      ) : null}
      <div className="order-layout lg:grid">
        <section className="timeline-card">
          <h2>مسیر سفارش</h2>
          {events.map((event, index) => (
            <div className="timeline-event is-done" key={`${event.createdAt}-${index}`}>
              <span className="timeline-event__dot">
                <Icon name="check" size={14} />
              </span>
              <div>
                <strong>
                  {index === 0
                    ? 'سفارش ثبت شد'
                    : event.toStatus
                      ? orderStatusCopy[event.toStatus]
                      : 'به‌روزرسانی سفارش'}
                </strong>
                <small>{formatPersianDate(event.createdAt)}</small>
              </div>
            </div>
          ))}
          {order.shipment ? (
            <div className="timeline-event is-done">
              <span className="timeline-event__dot">
                <Icon name="truck" size={14} />
              </span>
              <div>
                <strong>
                  وضعیت ارسال:{' '}
                  {order.shipment.status === 'DELIVERED'
                    ? 'تحویل شده'
                    : order.shipment.status === 'SHIPPED'
                      ? 'ارسال شده'
                      : 'در حال آماده‌سازی'}
                </strong>
                <small>
                  {order.shipment.trackingReference ? (
                    <span dir="ltr">{order.shipment.trackingReference}</span>
                  ) : (
                    'کد رهگیری هنوز ثبت نشده است'
                  )}
                </small>
              </div>
            </div>
          ) : null}
        </section>
        <aside className="summary-card">
          <span className="section-heading__eyebrow">تحویل به</span>
          <h2>{order.address?.recipientName ?? 'آدرس ثبت نشده'}</h2>
          <p>
            {order.address
              ? `${order.address.province}، ${order.address.city}، ${order.address.addressLine}`
              : 'آدرس تحویل برای این سفارش ثبت نشده است.'}
          </p>
          {order.address ? <p dir="ltr">{order.address.phone}</p> : null}
          {order.shipment?.trackingReference ? (
            <p>
              کد رهگیری: <span dir="ltr">{order.shipment.trackingReference}</span>
            </p>
          ) : null}
          <div className="summary-card__total">
            <span>مبلغ سفارش</span>
            <strong>{formatToman(order.totalToman)}</strong>
          </div>
          <p className="text-sm text-muted-foreground">
            وضعیت پرداخت:{' '}
            {order.paymentStatus === 'PAID'
              ? 'پرداخت شده'
              : order.paymentStatus === 'REFUNDED'
                ? 'بازپرداخت شده'
                : order.paymentStatus === 'FAILED'
                  ? 'ناموفق'
                  : 'در انتظار'}
          </p>
          {canCancelCustomerOrder(order) ? (
            <button
              className="mt-4 min-h-11 text-sm text-destructive underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              type="button"
              onClick={() => {
                setCancelOpen((current) => !current);
                setCancelError('');
              }}
            >
              لغو سفارش
            </button>
          ) : null}
          {eligibility.eligible ? (
            <a
              className="text-link"
              href={`#return/request?orderNumber=${encodeURIComponent(order.orderNumber)}`}
            >
              درخواست بازگشت کالا <Icon name="arrow-left" size={15} />
            </a>
          ) : order.status === 'DELIVERED' ? (
            <p className="mt-4 text-xs leading-6 text-muted-foreground">
              {eligibility.reason === 'expired'
                ? 'مهلت هفت‌روزه بازگشت این سفارش تمام شده است.'
                : 'این سفارش در حال حاضر شرایط بازگشت را ندارد.'}
            </p>
          ) : null}
        </aside>
      </div>
      {cancelOpen && canCancelCustomerOrder(order) ? (
        <form
          className="mx-auto mt-5 max-w-2xl border border-warning bg-surface p-5 shadow-card"
          onSubmit={(event) => void submitCancel(event)}
        >
          <h2>لغو سفارش</h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            این درخواست توسط سرور بررسی می‌شود. اگر پرداخت انجام شده باشد، بازپرداخت نیز از همان
            مسیر پیگیری خواهد شد.
          </p>
          <label className="mt-4 flex flex-col gap-2 text-sm font-medium">
            دلیل لغو
            <textarea
              className="border border-border bg-background px-3 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft"
              rows={3}
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              maxLength={500}
            />
          </label>
          {cancelError ? (
            <p className="mt-3 text-sm text-destructive" role="alert">
              {cancelError}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              type="submit"
              variant="destructive"
              disabled={cancelMutation.isPending}
              loading={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? 'در حال ثبت...' : 'تأیید لغو سفارش'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setCancelOpen(false)}>
              انصراف
            </Button>
          </div>
        </form>
      ) : null}
    </PageFrame>
  );
}

function ReturnOrderState({
  order,
  orderNumber,
}: {
  order: CustomerOrderDetail;
  orderNumber: string;
}) {
  const eligibility = getReturnEligibility(order);
  if (order.returnRequest)
    return (
      <PageFrame>
        <EmptyState
          title="درخواست بازگشت این سفارش ثبت شده است"
          description={`وضعیت فعلی درخواست: ${returnRequestStatusCopy[order.returnRequest.status]}`}
          action="مشاهده سفارش"
          href={`#order/${encodeURIComponent(order.orderNumber)}`}
        />
      </PageFrame>
    );
  if (!eligibility.eligible)
    return (
      <PageFrame>
        <EmptyState
          title={
            eligibility.reason === 'expired'
              ? 'مهلت بازگشت تمام شده است'
              : 'این سفارش قابل بازگشت نیست'
          }
          description={
            eligibility.reason === 'not-delivered'
              ? 'درخواست بازگشت فقط پس از تحویل سفارش امکان‌پذیر است.'
              : eligibility.reason === 'payment-unconfirmed' ||
                  eligibility.reason === 'shipment-unconfirmed'
                ? 'وضعیت پرداخت و تحویل باید توسط سرور تأیید شود.'
                : eligibility.reason === 'missing-delivery-date' ||
                    eligibility.reason === 'delivery-date-in-future'
                  ? 'تاریخ تحویل معتبر نیست؛ برای بررسی با پشتیبانی تماس بگیرید.'
                  : `مهلت بازگشت این سفارش ${formatPersianNumber(7)} روز پس از تحویل است.`
          }
          action="مشاهده سفارش"
          href={`#order/${encodeURIComponent(orderNumber)}`}
        />
      </PageFrame>
    );
  return null;
}

export function CustomerReturnPage({
  mode = 'request',
  orderNumber = '',
}: {
  mode?: 'request' | 'status';
  orderNumber?: string;
}) {
  const customerQuery = useCurrentCustomer();
  const active = isCustomerActive(customerQuery.data);
  const orderQuery = useCustomerOrder(orderNumber, active && Boolean(orderNumber));
  const returnMutation = useRequestCustomerOrderReturn();
  const [reason, setReason] = useState<CustomerReturnReason>('SIZE_PREFERENCE');
  const [note, setNote] = useState('');
  const [confirmed, setConfirmed] = useState({ unused: false, unwashed: false, tags: false });
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [formError, setFormError] = useState('');
  const [submittedOrder, setSubmittedOrder] = useState<CustomerOrderDetail>();
  const online = useOnlineStatus();
  useCustomerCacheBoundary(customerQuery.data?.id, isUnauthorizedError(customerQuery.error));

  if (customerQuery.isPending || (active && Boolean(orderNumber) && orderQuery.isPending))
    return (
      <PageFrame>
        <LoadingState label="در حال بارگذاری درخواست بازگشت" rows={1} />
      </PageFrame>
    );
  if (customerQuery.isError)
    return (
      <OrderDetailError error={customerQuery.error} onRetry={() => void customerQuery.refetch()} />
    );
  if (!customerQuery.data || !active)
    return (
      <SessionState
        title="بازگشت کالا"
        description="برای پیگیری یا ثبت درخواست بازگشت ابتدا وارد حساب شوید."
      >
        <span />
      </SessionState>
    );
  if (!orderNumber)
    return (
      <PageFrame>
        <EmptyState
          title="یک سفارش را انتخاب کنید"
          description="درخواست بازگشت را از صفحه جزئیات همان سفارش شروع کنید تا اطلاعات واقعی سفارش بررسی شود."
          action="مشاهده سفارش‌ها"
          href="#account/orders"
        />
      </PageFrame>
    );
  if (orderQuery.isError || !orderQuery.data)
    return <OrderDetailError error={orderQuery.error} onRetry={() => void orderQuery.refetch()} />;
  const order = submittedOrder ?? orderQuery.data;
  if (mode === 'status')
    return order.returnRequest ? (
      <PageFrame>
        <section className="mx-auto max-w-2xl border border-border bg-surface p-8 shadow-card">
          <span className="section-heading__eyebrow">
            RETURNS / <span dir="ltr">{order.orderNumber}</span>
          </span>
          <h1 className="mt-3 text-2xl">وضعیت درخواست بازگشت</h1>
          <p className="mt-3 text-sm leading-8 text-muted-foreground">
            وضعیت فعلی درخواست شما:{' '}
            <strong className="text-foreground">
              {returnRequestStatusCopy[order.returnRequest.status]}
            </strong>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            ثبت درخواست: {formatPersianDate(order.returnRequest.requestedAt)}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <a href={`#order/${encodeURIComponent(order.orderNumber)}`}>مشاهده سفارش</a>
            </Button>
            <Button asChild variant="outline">
              <a href="#support">تماس با پشتیبانی</a>
            </Button>
          </div>
        </section>
      </PageFrame>
    ) : (
      <ReturnOrderState order={order} orderNumber={orderNumber} />
    );
  const eligibility = getReturnEligibility(order);
  if (!eligibility.eligible) return <ReturnOrderState order={order} orderNumber={orderNumber} />;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    if (selectedItemIds.length === 0) {
      setFormError('حداقل یک کالا را برای بازگشت انتخاب کنید.');
      return;
    }
    if (!confirmed.unused || !confirmed.unwashed || !confirmed.tags) {
      setFormError('برای ثبت درخواست، شرایط سلامت و برچسب کالا را تأیید کنید.');
      return;
    }
    try {
      const result = await returnMutation.mutateAsync({
        orderNumber: order.orderNumber,
        input: {
          reason,
          note: note.trim() || null,
          unusedConfirmed: confirmed.unused,
          unwashedConfirmed: confirmed.unwashed,
          tagsAttachedConfirmed: confirmed.tags,
          items: order.items
            .filter((item) => selectedItemIds.includes(item.id))
            .map((item) => ({ orderItemId: item.id, quantity: item.quantity })),
        },
      });
      setSubmittedOrder(result);
    } catch (error) {
      setFormError(
        !online || isOfflineError(error)
          ? 'اتصال برقرار نیست؛ درخواست بازگشت ثبت نشد.'
          : apiErrorMessage(
              error,
              'ثبت درخواست بازگشت انجام نشد؛ وضعیت سفارش را دوباره بررسی کنید.',
            ),
      );
    }
  };
  return (
    <PageFrame>
      <div className="breadcrumb">
        <a href="#account/orders">سفارش‌ها</a>
        <span>/</span>
        <span>درخواست بازگشت</span>
      </div>
      <header className="simple-page-header">
        <span className="section-heading__eyebrow">NOVA / RETURNS</span>
        <h1>درخواست بازگشت کالا</h1>
        <p>
          سفارش <span dir="ltr">{order.orderNumber}</span> · مهلت بازگشت از تاریخ تحویل توسط سرور
          بررسی می‌شود.
        </p>
      </header>
      <form
        className="mx-auto max-w-3xl border border-border bg-surface p-6 shadow-card md:p-8"
        onSubmit={(event) => void submit(event)}
      >
        <fieldset className="grid gap-3">
          <legend className="text-sm font-medium">کالاهای موردنظر</legend>
          {order.items.map((item) => {
            const selected = selectedItemIds.includes(item.id);
            return (
              <label className={`option-card ${selected ? 'is-selected' : ''}`} key={item.id}>
                <input
                  checked={selected}
                  onChange={(event) =>
                    setSelectedItemIds((current) =>
                      event.target.checked
                        ? [...current, item.id]
                        : current.filter((id) => id !== item.id),
                    )
                  }
                  type="checkbox"
                />
                <span>
                  <strong>{item.productName}</strong>
                  <small>
                    <span dir="ltr">{item.sku}</span> · {formatPersianNumber(item.quantity)} عدد
                  </small>
                </span>
                <span className="text-xs text-muted-foreground">کل این قلم</span>
              </label>
            );
          })}
        </fieldset>
        <label className="mt-4 flex flex-col gap-2 text-sm font-medium">
          دلیل بازگشت
          <select
            className="min-h-12 border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft"
            value={reason}
            onChange={(event) => setReason(event.target.value as CustomerReturnReason)}
          >
            {(Object.entries(returnReasonCopy) as Array<[CustomerReturnReason, string]>).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ),
            )}
          </select>
        </label>
        <label className="mt-4 flex flex-col gap-2 text-sm font-medium">
          توضیحات تکمیلی
          <textarea
            className="border border-border bg-background px-3 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft"
            rows={4}
            maxLength={500}
            placeholder="اگر نکته‌ای درباره درخواست خود دارید، اینجا بنویسید."
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
        <fieldset className="mt-4 grid gap-2 text-sm text-muted-foreground">
          <legend className="font-medium text-foreground">تأیید شرایط بازگشت</legend>
          {(
            [
              ['unused', 'کالا استفاده نشده است.'],
              ['unwashed', 'کالا شسته نشده است.'],
              ['tags', 'برچسب کالا متصل است.'],
            ] as const
          ).map(([key, label]) => (
            <label className="flex min-h-11 items-center gap-2" key={key}>
              <input
                checked={confirmed[key]}
                onChange={(event) =>
                  setConfirmed((current) => ({ ...current, [key]: event.target.checked }))
                }
                type="checkbox"
              />
              {label}
            </label>
          ))}
        </fieldset>
        {formError ? (
          <p
            className="mt-4 border border-warning bg-warning-100 px-4 py-3 text-sm text-warning"
            role="alert"
          >
            {formError}
          </p>
        ) : null}
        {submittedOrder?.returnRequest ? (
          <p
            className="mt-4 border border-success bg-success-100 px-4 py-3 text-sm text-success"
            role="status"
          >
            درخواست بازگشت ثبت شد و اکنون در وضعیت «
            {returnRequestStatusCopy[submittedOrder.returnRequest.status]}» قرار دارد.
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            disabled={returnMutation.isPending || Boolean(submittedOrder?.returnRequest)}
            loading={returnMutation.isPending}
            size="lg"
            type="submit"
          >
            {returnMutation.isPending ? 'در حال ثبت...' : 'ثبت درخواست بازگشت'}
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href={`#order/${encodeURIComponent(order.orderNumber)}`}>انصراف</a>
          </Button>
        </div>
      </form>
    </PageFrame>
  );
}
