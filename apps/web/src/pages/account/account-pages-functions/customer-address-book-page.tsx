import { useState } from 'react';

import { Button } from '@nova/ui';
import {
  useCustomerAddresses,
  useRemoveCustomerAddress,
  useSetCustomerAddressDefault,
} from '../../../lib/addresses/addresses-api';
import { useCurrentCustomer } from '../../../lib/auth/auth-api';

import { Icon } from '../../../components/ui/icon';
import {
  apiErrorMessage,
  isCustomerActive,
  isOfflineError,
  isPermissionError,
  isUnauthorizedError,
  useCustomerCacheBoundary,
  useOnlineStatus,
} from '../../../lib/account/account-state';

import { CustomerAddressForm } from '../../../components/account/account-pages-functions/customer-address-form';

import { EmptyState } from '../../../components/account/account-pages-functions/empty-state';

import { LoadingState } from '../../../components/account/account-pages-functions/loading-state';

import { PageFrame } from './page-frame';

import { SessionState } from '../../../components/account/account-pages-functions/session-state';

import { findCustomerAddressByRouteId } from '../../../components/account/account-pages-functions/find-customer-address-by-route-id';

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
                  <Button
                    className="min-h-9 text-muted-foreground underline underline-offset-4 transition-colors hover:text-primary disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    type="button"
                    disabled={isMutating}
                    onClick={() => void changeDefault(address.id)}
                  >
                    انتخاب به عنوان اصلی
                  </Button>
                ) : null}
                <Button
                  className="min-h-9 text-destructive underline underline-offset-4 transition-colors hover:text-destructive/80 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  type="button"
                  disabled={isMutating}
                  onClick={() => {
                    if (window.confirm('آیا از حذف این آدرس مطمئن هستید؟')) void remove(address.id);
                  }}
                >
                  حذف
                </Button>
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
