# Page Context

## Page

**Path:** `src/features/account/pages/customer-address-book-page.tsx`

```tsx
import { useState } from 'react';

import { Button } from '@nova/ui';
import {
  useCustomerAddresses,
  useRemoveCustomerAddress,
  useSetCustomerAddressDefault,
} from '@/features/account/api/addresses-api';
import { useCurrentCustomer } from '@/features/auth/api/auth-api';

import { Icon } from '@/shared/ui/icon';
import {
  apiErrorMessage,
  isCustomerActive,
  isOfflineError,
  isPermissionError,
  isUnauthorizedError,
  useCustomerCacheBoundary,
  useOnlineStatus,
} from '@/features/account/state/account-state';

import { CustomerAddressForm } from '@/features/account/components/customer-address-form';

import { EmptyState } from '@/features/account/components/empty-state';

import { LoadingState } from '@/features/account/components/loading-state';

import { PageFrame } from '@/features/account/pages/page-frame';

import { SessionState } from '@/features/account/components/session-state';

import { findCustomerAddressByRouteId } from '@/features/account/components/find-customer-address-by-route-id';

import './customer-address-book.reference.css';

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
          href={isUnauthorizedError(addressesQuery.error) ? '/auth' : '/account/addresses'}
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
  const selected = mode === 'edit' ? findCustomerAddressByRouteId(addresses, addressId) : undefined;
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
          href="/account/addresses"
        />
      </PageFrame>
    );
  const profileName =
    addresses.find((address) => address.isDefault)?.recipientName ??
    addresses[0]?.recipientName ??
    'مشتری نوا';

  if (mode === 'create') {
    return (
      <PageFrame className="nova-address-create-page">
        <div className="nova-address-create-shell">
          <aside className="nova-address-create-art" aria-label="NOVA editorial">
            <img src="/assets/nova-materials.webp" alt="گل‌ها و فضای آرام آتلیه نوا" />
            <span aria-hidden="true" />
            <div>
              <strong>
                خانه،
                <br />
                جایی که سبک زندگی شما ادامه دارد.
              </strong>
              <small>NOVA</small>
            </div>
          </aside>

          <section className="nova-address-create-content">
            <header className="nova-address-create-header">
              <div>
                <span className="nova-address-create-header__icon" aria-hidden="true">
                  <Icon name="home" size={19} />
                </span>
                <div>
                  <h1>ایجاد آدرس جدید</h1>
                  <p>لطفاً اطلاعات آدرس خود را با دقت وارد کنید تا سفارش‌ها به‌درستی ارسال شوند.</p>
                </div>
              </div>
              <a href="/account/addresses">
                <Icon name="arrow-right" size={15} />
                بازگشت
              </a>
            </header>

            {actionError ? (
              <p className="nova-address-alert" role="alert">
                {actionError}
              </p>
            ) : null}

            <CustomerAddressForm mode="create" />
          </section>

          <aside className="nova-address-sidebar nova-address-sidebar--create" aria-label="حساب کاربری">
            <div className="nova-address-sidebar__profile">
              <img src="/assets/nova-women-lifestyle.webp" alt="" />
              <strong>{profileName}</strong>
              <span dir="ltr">{customerQuery.data.email ?? customerQuery.data.phone}</span>
            </div>

            <nav className="nova-address-sidebar__nav">
              <a href="/account">
                <Icon name="home" size={18} />
                داشبورد حساب
              </a>
              <a href="/account/profile">
                <Icon name="user" size={18} />
                اطلاعات شخصی
              </a>
              <a href="/account/addresses" className="is-active" aria-current="page">
                <Icon name="home" size={18} />
                آدرس‌های من
              </a>
              <a href="/account/orders">
                <Icon name="bag" size={18} />
                سفارش‌های من
              </a>
              <a href="/products">
                <Icon name="heart" size={18} />
                علاقه‌مندی‌ها
              </a>
              <a href="/return">
                <Icon name="rotate" size={18} />
                مرجوعی‌ها
              </a>
              <a href="/support">
                <Icon name="users" size={18} />
                پشتیبانی
              </a>
            </nav>

            <a className="nova-address-sidebar__promo" href="/campaign">
              <img src="/assets/nova-home-mobile-story.webp" alt="" />
              <span aria-hidden="true" />
              <div>
                <strong>به دنیای نوا بپیوندید</strong>
                <small>مجموعه‌ها و پیشنهادهای اختصاصی</small>
              </div>
            </a>
          </aside>
        </div>
      </PageFrame>
    );
  }

  if (mode === 'list') {
    return (
      <PageFrame className="nova-address-list-page">
        <div className="nova-address-shell">
          <aside className="nova-address-sidebar" aria-label="حساب کاربری">
            <div className="nova-address-sidebar__profile">
              <img src="/assets/nova-women-lifestyle.webp" alt="" />
              <strong>{profileName}</strong>
              <span dir="ltr">{customerQuery.data.email ?? customerQuery.data.phone}</span>
            </div>

            <nav className="nova-address-sidebar__nav">
              <a href="/account">
                <Icon name="home" size={18} />
                داشبورد حساب
              </a>
              <a href="/account/profile">
                <Icon name="user" size={18} />
                اطلاعات شخصی
              </a>
              <a href="/account/addresses" className="is-active" aria-current="page">
                <Icon name="home" size={18} />
                آدرس‌های من
              </a>
              <a href="/account/orders">
                <Icon name="bag" size={18} />
                سفارش‌های من
              </a>
              <a href="/products">
                <Icon name="heart" size={18} />
                علاقه‌مندی‌ها
              </a>
              <a href="/return">
                <Icon name="rotate" size={18} />
                مرجوعی‌ها
              </a>
              <a href="/support">
                <Icon name="users" size={18} />
                پشتیبانی
              </a>
            </nav>

            <a className="nova-address-sidebar__promo" href="/campaign">
              <img src="/assets/nova-home-mobile-story.webp" alt="" />
              <span aria-hidden="true" />
              <div>
                <strong>خانه؛ فراتر از یک مکان، یک حس است.</strong>
                <small>NOVA / ATELIER EDITORIAL</small>
              </div>
            </a>
          </aside>

          <section className="nova-address-content">
            <header className="nova-address-header">
              <div>
                <h1>آدرس‌های من</h1>
                <p>آدرس‌های خود را مدیریت کنید تا تجربه خرید سریع‌تر و آسان‌تری داشته باشید.</p>
              </div>
              {addresses.length > 0 ? (
                <a className="nova-address-add nova-address-add--desktop" href="/account/addresses/create">
                  <Icon name="plus" size={18} />
                  افزودن آدرس جدید
                </a>
              ) : null}
            </header>

            {actionError ? (
              <p className="nova-address-alert" role="alert">
                {actionError}
              </p>
            ) : null}

            {addresses.length === 0 ? (
              <EmptyState
                title="هنوز آدرسی ثبت نکرده‌اید"
                description="برای تحویل سریع‌تر سفارش، اولین آدرس خود را اضافه کنید."
                action="افزودن آدرس جدید"
                href="/account/addresses/create"
              />
            ) : (
              <div className="nova-address-list">
                {addresses.map((address) => (
                  <article
                    className={`nova-address-card ${address.isDefault ? 'is-default' : ''}`}
                    key={address.id}
                  >
                    <div className="nova-address-card__icon" aria-hidden="true">
                      <Icon name={address.label.includes('کار') ? 'bag' : 'home'} size={24} />
                    </div>

                    <div className="nova-address-card__body">
                      <div className="nova-address-card__title">
                        <h2>{address.label}</h2>
                        {address.isDefault ? (
                          <span>
                            <Icon name="sparkles" size={14} />
                            آدرس پیش‌فرض
                          </span>
                        ) : null}
                      </div>

                      <address>
                        <span>
                          <Icon name="user" size={16} />
                          {address.recipientName}
                        </span>
                        <span dir="ltr">
                          <Icon name="user" size={16} />
                          {address.phone}
                        </span>
                        <span>
                          <Icon name="home" size={16} />
                          {address.province}، {address.city}، {address.addressLine}
                        </span>
                        <span>
                          <Icon name="mail" size={16} />
                          کد پستی <b dir="ltr">{address.postalCode}</b>
                        </span>
                      </address>
                    </div>

                    <div className="nova-address-card__actions">
                      <a href={`/account/addresses/edit/${encodeURIComponent(address.id)}`}>
                        <Icon name="edit" size={16} />
                        ویرایش
                      </a>

                      {!address.isDefault ? (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isMutating}
                          onClick={() => void changeDefault(address.id)}
                        >
                          <Icon name="sparkles" size={15} />
                          قرار دادن به عنوان پیش‌فرض
                        </Button>
                      ) : null}

                      <Button
                        type="button"
                        variant="outline"
                        className="nova-address-card__delete"
                        disabled={isMutating}
                        onClick={() => {
                          if (window.confirm('آیا از حذف این آدرس مطمئن هستید؟')) void remove(address.id);
                        }}
                      >
                        <Icon name="close" size={15} />
                        حذف
                      </Button>

                    </div>
                  </article>
                ))}
              </div>
            )}

            <section className="nova-address-editorial" aria-label="پیام نوا">
              <img src="/assets/nova-materials.webp" alt="فضای آرام و مینیمال نوا" loading="lazy" />
              <div>
                <strong>
                  هر مقصدی
                  <br />
                  آغاز یک داستان زیباست.
                </strong>
                <span>NOVA</span>
              </div>
            </section>

            <a className="nova-address-add nova-address-add--mobile" href="/account/addresses/create">
              <Icon name="plus" size={18} />
              افزودن آدرس جدید
            </a>
          </section>
        </div>
      </PageFrame>
    );
  }

  return (
    <PageFrame className="nova-address-edit-page">
      <div className="nova-address-edit-shell">
        <aside className="nova-address-edit-art" aria-label="NOVA editorial">
          <img src="/assets/nova-materials.webp" alt="گلدان و شاخه‌های طبیعی در فضای نوا" />
          <span aria-hidden="true" />
          <div>
            <strong>
              مقصدهای زیباتر،
              <br />
              به خانه نزدیک‌ترند.
            </strong>
            <small>NOVA</small>
          </div>
        </aside>

        <section className="nova-address-edit-content">
          <header className="nova-address-edit-header">
            <div>
              <h1>ویرایش آدرس</h1>
              <p>اطلاعات آدرس خود را ویرایش کنید.</p>
            </div>
            <a href="/account/addresses">
              <Icon name="arrow-right" size={15} />
              بازگشت به آدرس‌ها
            </a>
          </header>

          {actionError ? (
            <p className="nova-address-alert" role="alert">
              {actionError}
            </p>
          ) : null}

          <CustomerAddressForm
            mode="edit"
            selectedAddress={selected}
            onDelete={() => {
              if (selected && window.confirm('آیا از حذف این آدرس مطمئن هستید؟')) {
                void remove(selected.id);
              }
            }}
          />
        </section>

        <aside className="nova-address-sidebar nova-address-sidebar--edit" aria-label="حساب کاربری">
          <div className="nova-address-sidebar__profile">
            <img src="/assets/nova-women-lifestyle.webp" alt="" />
            <strong>{profileName}</strong>
            <span dir="ltr">{customerQuery.data.email ?? customerQuery.data.phone}</span>
          </div>

          <nav className="nova-address-sidebar__nav">
            <a href="/account">
              <Icon name="home" size={18} />
              داشبورد حساب
            </a>
            <a href="/account/profile">
              <Icon name="user" size={18} />
              اطلاعات شخصی
            </a>
            <a href="/account/orders">
              <Icon name="bag" size={18} />
              سفارش‌های من
            </a>
            <a href="/account/addresses" className="is-active" aria-current="page">
              <Icon name="home" size={18} />
              آدرس‌ها
            </a>
            <a href="/products">
              <Icon name="heart" size={18} />
              علاقه‌مندی‌ها
            </a>
            <a href="/support">
              <Icon name="users" size={18} />
              پشتیبانی
            </a>
          </nav>

          <a className="nova-address-sidebar__promo" href="/campaign">
            <img src="/assets/nova-home-mobile-story.webp" alt="" />
            <span aria-hidden="true" />
            <div>
              <strong>خانه برای آدم‌هایی است که زیبایی را در جزئیات زندگی می‌بینند.</strong>
              <small>NOVA / ATELIER</small>
            </div>
          </a>
        </aside>
      </div>
    </PageFrame>
  );
}

```

---

## Custom Components


### 1. Button

**Path:** `../../packages/ui/src/button.tsx`

```tsx
import { Slot, Slottable } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';

import { cn } from './cn';

export const buttonVariants = cva(
  'nova-button inline-flex min-h-11 items-center justify-center gap-2 rounded-pill border border-transparent px-4 text-center text-sm font-semibold leading-5 transition-[background-color,border-color,color,transform] duration-[140ms] ease-out hover:-translate-y-px focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:border-border disabled:bg-secondary disabled:text-muted-foreground disabled:opacity-100 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:translate-y-0',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-foreground',
        secondary: 'bg-secondary text-foreground hover:bg-accent-soft hover:text-primary-hover',
        outline:
          'border-primary bg-transparent text-primary hover:border-primary-hover hover:bg-accent-soft hover:text-primary-hover',
        ghost: 'bg-transparent text-foreground hover:bg-secondary',
        destructive: 'bg-destructive text-primary-foreground hover:bg-destructive-hover',
      },
      size: {
        sm: 'min-h-11 px-3 text-[13px]',
        md: 'min-h-12',
        lg: 'min-h-[52px] px-5',
        icon: 'h-11 min-h-11 w-11 px-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled = false,
      'aria-busy': ariaBusy,
      'aria-disabled': ariaDisabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Component = asChild ? Slot : 'button';
    const isDisabled = disabled || loading;

    return (
      <Component
        aria-busy={loading || ariaBusy || undefined}
        aria-disabled={isDisabled || ariaDisabled || undefined}
        className={cn(buttonVariants({ variant, size, className }))}
        data-loading={loading ? 'true' : undefined}
        disabled={asChild ? disabled : isDisabled}
        ref={ref}
        {...props}
      >
        {loading ? (
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-e-transparent motion-reduce:animate-none"
          />
        ) : null}
        {asChild ? <Slottable>{children}</Slottable> : children}
      </Component>
    );
  },
);

Button.displayName = 'Button';

```

---


### 2. Checkbox

**Path:** `../../packages/ui/src/checkbox.tsx`

```tsx
import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

import { cn } from './cn';

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => (
    <input
      {...props}
      ref={ref}
      type="checkbox"
      className={cn(
        'nova-checkbox h-5 w-5 shrink-0 accent-primary align-middle transition-[background-color,border-color,box-shadow] duration-[140ms] checked:border-primary checked:bg-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none',
        className,
      )}
    />
  ),
);

Checkbox.displayName = 'Checkbox';

```

---


### 3. Input

**Path:** `../../packages/ui/src/input.tsx`

```tsx
import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

import { cn } from './cn';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'nova-input flex min-h-12 w-full rounded-control border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-[border-color,box-shadow,background-color] duration-[140ms] placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-secondary disabled:opacity-70 motion-reduce:transition-none',
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = 'Input';

```

---


### 4. Textarea

**Path:** `../../packages/ui/src/textarea.tsx`

```tsx
import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';

import { cn } from './cn';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'nova-textarea min-h-28 w-full resize-y rounded-control border border-border bg-background px-3 py-3 text-sm leading-7 text-foreground outline-none transition-[border-color,box-shadow,background-color] duration-[140ms] placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-secondary disabled:opacity-70 motion-reduce:transition-none',
        className,
      )}
      {...props}
    />
  ),
);

Textarea.displayName = 'Textarea';

```

---


### 5. AddressField

**Path:** `src/features/account/components/address-field.tsx`

```tsx
import { Input as UiInput } from '@nova/ui';

import { Icon, type IconName } from '@/shared/ui/icon';

export function AddressField({
  label,
  value,
  onChange,
  icon,
  hint,
  required = false,
  className = '',
  ...props
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon?: IconName;
  hint?: string;
  required?: boolean;
  className?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: 'text' | 'tel' | 'numeric';
  dir?: 'ltr' | 'rtl';
}) {
  return (
    <label className={`address-field flex flex-col gap-2 text-sm font-medium ${className}`}>
      <span className="address-field__label">
        {label}
        {required ? <b aria-hidden="true">*</b> : null}
      </span>
      <span className="address-field__control">
        <UiInput
          className="min-h-12 border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          {...props}
        />
        {icon ? <Icon name={icon} size={17} aria-hidden="true" /> : null}
      </span>
      {hint ? <small className="address-field__hint">{hint}</small> : null}
    </label>
  );
}

```

---


### 6. CustomerAddressForm

**Path:** `src/features/account/components/customer-address-form.tsx`

```tsx
import { useEffect, useState, type FormEvent } from 'react';
import { type CustomerAddress, type CustomerAddressCreateInput } from '@nova/api-client';
import { Button, Checkbox, Textarea as UiTextarea } from '@nova/ui';
import { Icon } from '@/shared/ui/icon';
import {
  useCreateCustomerAddress,
  useUpdateCustomerAddress,
} from '@/features/account/api/addresses-api';

import { apiErrorMessage } from '@/features/account/state/account-state';

import type { AddressFormState } from '@/features/account/pages/account-pages-shared';
import { emptyAddressForm } from '@/features/account/pages/account-pages-shared';

import { AddressField } from '@/features/account/components/address-field';

import { addressFormIsComplete } from '@/features/account/components/address-form-is-complete';

import { toAddressForm } from '@/features/account/components/to-address-form';

export function CustomerAddressForm({
  mode,
  selectedAddress,
  onSaved,
  onDelete,
}: {
  mode: 'create' | 'edit';
  selectedAddress?: CustomerAddress;
  onSaved?: (address: CustomerAddress) => void;
  onDelete?: () => void;
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
  if (mode === 'create') {
    return (
      <form
        className="nova-address-create-form"
        onSubmit={(event) => void submit(event)}
        noValidate
      >
        <div className="nova-address-create-form__grid">
          <AddressField
            className="nova-address-create-form__recipient"
            label="نام و نام خانوادگی گیرنده"
            value={form.recipientName}
            onChange={(value) => updateField('recipientName', value)}
            placeholder="مثال: مهسا کریمی"
            autoComplete="name"
            icon="user"
            required
          />
          <AddressField
            className="nova-address-create-form__phone"
            label="شماره تماس"
            value={form.phone}
            onChange={(value) => updateField('phone', value)}
            placeholder="مثال: ۰۹۱۲۱۲۳۴۵۶۷"
            autoComplete="tel"
            inputMode="tel"
            dir="ltr"
            icon="user"
            hint="برای هماهنگی ارسال سفارش"
            required
          />
          <AddressField
            label="استان"
            value={form.province}
            onChange={(value) => updateField('province', value)}
            placeholder="مثال: تهران"
            autoComplete="address-level1"
            icon="chevron-down"
            required
          />
          <AddressField
            label="شهر"
            value={form.city}
            onChange={(value) => updateField('city', value)}
            placeholder="مثال: تهران"
            autoComplete="address-level2"
            icon="chevron-down"
            required
          />

          <label className="nova-address-create-form__address">
            <span className="nova-address-create-form__label">
              نشانی کامل <b aria-hidden="true">*</b>
            </span>
            <span className="nova-address-create-form__textarea">
              <UiTextarea
                rows={3}
                value={form.addressLine}
                onChange={(event) => updateField('addressLine', event.target.value)}
                placeholder="مثال: خیابان ولیعصر، بالاتر از میدان ونک، کوچه نسترن، پلاک ۱۲، واحد ۳"
                autoComplete="street-address"
              />
              <Icon name="home" size={17} aria-hidden="true" />
            </span>
            <small>لطفاً نشانی را به‌صورت کامل و دقیق وارد کنید.</small>
          </label>

          <AddressField
            label="عنوان آدرس"
            value={form.label}
            onChange={(value) => updateField('label', value)}
            placeholder="مثال: خانه یا محل کار"
            autoComplete="address-line1"
            icon="home"
            hint="برای شناسایی سریع این آدرس در حساب شما"
            required
          />
          <AddressField
            label="کد پستی"
            value={form.postalCode}
            onChange={(value) => updateField('postalCode', value)}
            placeholder="مثال: ۱۴۳۴۵۶۷۸۹۰"
            autoComplete="postal-code"
            inputMode="numeric"
            dir="ltr"
            icon="mail"
            hint="کد پستی ۱۰ رقمی"
            required
          />
        </div>

        <label className="nova-address-create-form__default">
          <Checkbox
            checked={form.isDefault}
            onChange={(event) => updateField('isDefault', event.target.checked)}
          />
          <span>
            <strong>به عنوان آدرس پیش‌فرض ذخیره شود</strong>
            <small>این آدرس به صورت پیش‌فرض در هنگام ثبت سفارش انتخاب خواهد شد.</small>
          </span>
        </label>

        {formError || mutationError ? (
          <p className="nova-address-create-form__message is-error" role="alert">
            {formError || apiErrorMessage(mutationError, 'عملیات آدرس انجام نشد.')}
          </p>
        ) : null}

        {saveState === 'saved' ? (
          <p className="nova-address-create-form__message is-success" role="status">
            آدرس با موفقیت ذخیره شد.
          </p>
        ) : null}

        <div className="nova-address-create-form__actions">
          <Button
            className="nova-address-create-form__submit"
            type="submit"
            disabled={saving || !dirty}
            loading={saving}
          >
            {saving ? 'در حال ذخیره...' : 'ذخیره آدرس جدید'}
            <Icon name="arrow-left" size={16} />
          </Button>
          <Button className="nova-address-create-form__back" asChild variant="outline">
            <a href="/account/addresses">بازگشت به آدرس‌ها</a>
          </Button>
          {dirty ? (
            <span className="nova-address-create-form__dirty" role="status">
              تغییرات ذخیره‌نشده دارید.
            </span>
          ) : null}
        </div>
      </form>
    );
  }

  if (mode === 'edit') {
    return (
      <form className="nova-address-edit-form" onSubmit={(event) => void submit(event)} noValidate>
        <div className="nova-address-edit-form__heading">
          <h2>اطلاعات آدرس</h2>
        </div>

        <div className="nova-address-edit-form__grid">
          <AddressField
            className="nova-address-edit-form__wide"
            label="عنوان آدرس"
            value={form.label}
            onChange={(value) => updateField('label', value)}
            placeholder="خانه"
            autoComplete="address-line1"
            icon="home"
          />
          <AddressField
            className="nova-address-edit-form__wide"
            label="نام گیرنده"
            value={form.recipientName}
            onChange={(value) => updateField('recipientName', value)}
            autoComplete="name"
          />
          <AddressField
            className="nova-address-edit-form__wide"
            label="شماره تماس"
            value={form.phone}
            onChange={(value) => updateField('phone', value)}
            autoComplete="tel"
            inputMode="tel"
            dir="ltr"
          />
          <AddressField
            label="استان"
            value={form.province}
            onChange={(value) => updateField('province', value)}
            autoComplete="address-level1"
            icon="chevron-down"
          />
          <AddressField
            label="شهر"
            value={form.city}
            onChange={(value) => updateField('city', value)}
            autoComplete="address-level2"
            icon="chevron-down"
          />

          <label className="nova-address-edit-form__address">
            <span>آدرس کامل</span>
            <UiTextarea
              rows={3}
              value={form.addressLine}
              onChange={(event) => updateField('addressLine', event.target.value)}
              placeholder="خیابان، کوچه، پلاک و واحد"
              autoComplete="street-address"
            />
          </label>

          <AddressField
            className="nova-address-edit-form__wide"
            label="کد پستی"
            value={form.postalCode}
            onChange={(value) => updateField('postalCode', value)}
            autoComplete="postal-code"
            inputMode="numeric"
            dir="ltr"
          />
        </div>

        <label className="nova-address-edit-form__default">
          <Checkbox
            checked={form.isDefault}
            onChange={(event) => updateField('isDefault', event.target.checked)}
          />
          این آدرس به عنوان آدرس پیش‌فرض من باشد
        </label>

        {formError || mutationError ? (
          <p className="nova-address-create-form__message is-error" role="alert">
            {formError || apiErrorMessage(mutationError, 'عملیات آدرس انجام نشد.')}
          </p>
        ) : null}

        {saveState === 'saved' ? (
          <p className="nova-address-create-form__message is-success" role="status">
            آدرس با موفقیت ذخیره شد.
          </p>
        ) : null}

        <div className="nova-address-edit-form__actions">
          <Button className="nova-address-edit-form__save" type="submit" disabled={saving || !dirty} loading={saving}>
            {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
          </Button>
          {onDelete ? (
            <Button
              className="nova-address-edit-form__delete"
              type="button"
              variant="outline"
              onClick={onDelete}
              disabled={saving}
            >
              <Icon name="close" size={16} />
              حذف آدرس
            </Button>
          ) : null}
        </div>
      </form>
    );
  }

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
        <UiTextarea
          className="border border-border bg-background px-3 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft"
          rows={4}
          value={form.addressLine}
          onChange={(event) => updateField('addressLine', event.target.value)}
          placeholder="خیابان، کوچه، پلاک و واحد"
          autoComplete="street-address"
        />
      </label>
      <label className="mt-4 flex min-h-11 items-center gap-2 text-sm text-muted-foreground">
        <Checkbox
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
          <a href="/account/addresses">بازگشت به آدرس‌ها</a>
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

```

---


### 7. EmptyState

**Path:** `src/features/account/components/empty-state.tsx`

```tsx
import { Button } from '@nova/ui';

import { Icon } from '@/shared/ui/icon';

export function EmptyState({
  title,
  description,
  action,
  href = '/',
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

```

---


### 8. LoadingState

**Path:** `src/features/account/components/loading-state.tsx`

```tsx
export function LoadingState({ label, rows = 2 }: { label: string; rows?: number }) {
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

```

---


### 9. SessionState

**Path:** `src/features/account/components/session-state.tsx`

```tsx
import { type ReactNode } from 'react';

import { useCurrentCustomer } from '@/features/auth/api/auth-api';

import {
  apiErrorMessage,
  isCustomerActive,
  isOfflineError,
  isPermissionError,
  isUnauthorizedError,
  useCustomerCacheBoundary,
  useOnlineStatus,
} from '@/features/account/state/account-state';

import { EmptyState } from '@/features/account/components/empty-state';

import { LoadingState } from '@/features/account/components/loading-state';

import { PageFrame } from '@/features/account/pages/page-frame';

export function SessionState({
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
          href={expired ? '/auth' : '/account'}
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
          href={customerQuery.data ? '/support' : '/auth'}
          icon="user"
        />
      </PageFrame>
    );
  }
  return <>{children}</>;
}

```

---


### 10. PageFrame

**Path:** `src/features/account/pages/page-frame.tsx`

```tsx
import { type ReactNode } from 'react';

export function PageFrame({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main
      className={`shell inner-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background ${className}`}
    >
      {children}
    </main>
  );
}

```

---


### 11. Icon

**Path:** `src/shared/ui/icon.tsx`

```tsx
import type { ReactNode, SVGProps } from 'react';

export type IconName =
  | 'arrow-left'
  | 'arrow-right'
  | 'bag'
  | 'bell'
  | 'book'
  | 'calendar'
  | 'check'
  | 'chevron-down'
  | 'close'
  | 'dress'
  | 'edit'
  | 'eye'
  | 'filter'
  | 'grid'
  | 'heart'
  | 'home'
  | 'info'
  | 'instagram'
  | 'layers'
  | 'mail'
  | 'menu'
  | 'more-vertical'
  | 'package'
  | 'plus'
  | 'refresh'
  | 'rotate'
  | 'search'
  | 'send'
  | 'settings'
  | 'shield'
  | 'shirt'
  | 'sparkles'
  | 'tag'
  | 'truck'
  | 'user'
  | 'users'
  | 'warehouse'
  | 'warning';

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number;
};

const iconPaths: Record<IconName, ReactNode> = {
  'arrow-left': <path d="m9 5 7 7-7 7" />,
  'arrow-right': <path d="m15 5-7 7 7 7" />,
  bag: (
    <>
      <path d="M5 8.5h14l-1 11H6l-1-11Z" />
      <path d="M8.5 8.5V6a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  bell: (
    <>
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 8.5h18C21 16 18 16 18 9Z" />
      <path d="M10 21h4" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" />
      <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M7 3v4M17 3v4M3.5 9h17" />
    </>
  ),
  check: <path d="m5 12 4.5 4.5L19 7" />,
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  dress: (
    <>
      <path d="M9 4.5a3 3 0 0 0 6 0" />
      <path d="m9 6-2 4 2 1-3 8h8l-3-8 2-1-2-4" />
      <path d="m15 6 2 4-2 1 3 8h-8" />
    </>
  ),
  edit: (
    <>
      <path d="m4 16.5-.7 4.2 4.2-.7L19 8.5 15.5 5 4 16.5Z" />
      <path d="m13.5 7 3.5 3.5M4 20.5l3.5-3.5" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  filter: (
    <>
      <path d="M4 5h16" />
      <path d="M7 12h10" />
      <path d="M10 19h4" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </>
  ),
  heart: (
    <path d="M20.8 8.8c0 5.2-8.8 10.4-8.8 10.4S3.2 14 3.2 8.8A4.7 4.7 0 0 1 12 6.5a4.7 4.7 0 0 1 8.8 2.3Z" />
  ),
  home: (
    <>
      <path d="m3.5 10.5 8.5-7 8.5 7" />
      <path d="M5.5 9.5v10h13v-10M9 19.5v-5h6v5" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10.5v5M12 7.5h.01" />
    </>
  ),
  instagram: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M17.5 6.5h.01" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z" />
      <path d="m4 12 8 4.5 8-4.5M4 16.5 12 21l8-4.5" />
    </>
  ),
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4.5 7 7.5 5.5L19.5 7" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  'more-vertical': (
    <>
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </>
  ),
  package: (
    <>
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="m4.5 7.8 7.5 4.2 7.5-4.2M12 12v9" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-13.6-5.7L4 7.5" />
      <path d="M4 4v3.5h3.5M4 13a8 8 0 0 0 13.6 5.7l2.4-2.2" />
      <path d="M20 20v-3.5h-3.5" />
    </>
  ),
  rotate: (
    <>
      <path d="M4 12a8 8 0 0 1 13.6-5.7L20 8.5" />
      <path d="M20 5v3.5h-3.5M20 12a8 8 0 0 1-13.6 5.7L4 15.5" />
      <path d="M4 19v-3.5h3.5" />
    </>
  ),
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  send: <path d="m4 4 16 8-16 8 3-8-3-8Zm3 8h13" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-2.6V20a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H6v-2.6h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V5h2.6v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v2.6H21a1.7 1.7 0 0 0-1.6 1Z" />
    </>
  ),
  shield: <path d="M12 3.5 19 6v5.5c0 4.3-2.7 7.7-7 9-4.3-1.3-7-4.7-7-9V6l7-2.5Z" />,
  shirt: (
    <>
      <path d="m8 5 4 2 4-2 4 3-2.5 4-2-1v9h-7v-9l-2 1L4 8l4-3Z" />
      <path d="M10 6.5a2.2 2.2 0 0 0 4 0" />
    </>
  ),
  sparkles: (
    <>
      <path d="m8 3 1.2 3.8L13 8l-3.8 1.2L8 13l-1.2-3.8L3 8l3.8-1.2L8 3Z" />
      <path d="m17 12 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3ZM17 3v3M18.5 4.5h-3" />
    </>
  ),
  tag: (
    <>
      <path d="M4 4h7l9 9-7 7-9-9V4Z" />
      <circle cx="8" cy="8" r="1" />
    </>
  ),
  truck: (
    <>
      <path d="M3 6h11v10H3zM14 9h4l3 3v4h-7V9Z" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19a6 6 0 0 1 12 0M16 5.5a3 3 0 0 1 0 5.8M17 14a5 5 0 0 1 4 5" />
    </>
  ),
  warehouse: (
    <>
      <path d="m3 9 9-5 9 5v11H3V9Z" />
      <path d="M7 20v-6h10v6M7 10h.01M12 10h.01M17 10h.01" />
    </>
  ),
  warning: (
    <>
      <path d="m12 3 9 16H3l9-16Z" />
      <path d="M12 9v4M12 16h.01" />
    </>
  ),
};

export function Icon({ name, size = 20, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      {iconPaths[name]}
    </svg>
  );
}

```

---


## Summary

- Page: `src/features/account/pages/customer-address-book-page.tsx`
- Custom component files: 11
- Total files included: 12
