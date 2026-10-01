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
