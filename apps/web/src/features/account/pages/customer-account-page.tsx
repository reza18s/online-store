import { useState } from 'react';

import { useCurrentCustomer, useLogoutCustomer } from '@/features/auth/api/auth-api';
import { useCustomerOrders } from '@/features/orders/api/orders-api';
import { useCustomerAddresses } from '@/features/account/api/addresses-api';
import { Icon } from '@/shared/ui/icon';
import {
  apiErrorMessage,
  formatPersianDate,
  formatToman,
  isCustomerActive,
  isOfflineError,
  isUnauthorizedError,
  orderStatusCopy,
  useCustomerCacheBoundary,
  useOnlineStatus,
} from '@/features/account/state/account-state';

import type { AccountSection } from '@/features/account/pages/account-pages-shared';
import { accountTitles } from '@/features/account/pages/account-pages-shared';

import { AccountLayout } from '@/features/account/components/account-layout';

import { CustomerOrderListContent } from '@/features/account/components/customer-order-list-content';

import { EmptyState } from '@/features/account/components/empty-state';

import { InlineQueryError } from '@/features/account/components/inline-query-error';

import { LoadingState } from '@/features/account/components/loading-state';

import { PageFrame } from '@/features/account/pages/page-frame';

import { ProfilePanel } from '@/features/account/components/profile-panel';

import { SessionState } from '@/features/account/components/session-state';

import { navigateToRoute } from '@/app/routing/route';

export function CustomerAccountPage({ section = 'dashboard' }: { section?: string }) {
  const customerQuery = useCurrentCustomer();
  const customer = customerQuery.data;
  const activeSection: AccountSection =
    section in accountTitles ? (section as AccountSection) : 'dashboard';
  const ordersQuery = useCustomerOrders({ page: 1, limit: 10 }, isCustomerActive(customer));
  const addressesQuery = useCustomerAddresses(
    activeSection === 'dashboard' && isCustomerActive(customer),
  );
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
          href={expired ? '/auth' : '/account'}
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

  const signOut = async () => {
    setLogoutError('');
    try {
      await logoutMutation.mutateAsync();
      navigateToRoute('/');
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
      {activeSection === 'dashboard' ? (
        <section className="account-welcome" aria-labelledby="account-welcome-title">
          <img src="/assets/nova-women-lifestyle.webp" alt="استایل آرام و روزمره نوا" />
          <div>
            <span className="section-heading__eyebrow">NOVA / ATELIER</span>
            <h2 id="account-welcome-title">خوش آمدید به دنیای نوا</h2>
            <p>انتخاب‌های شما، سفارش‌ها و پیشنهادهای شخصی‌سازی‌شده در یک نگاه.</p>
            <a href="/products/new">
              دیدن انتخاب‌های تازه <Icon name="arrow-left" size={15} />
            </a>
          </div>
        </section>
      ) : null}
      {activeSection === 'profile' ? (
        <ProfilePanel customer={customer} />
      ) : activeSection === 'orders' ? (
        <CustomerOrderListContent query={ordersQuery} />
      ) : (
        <div className="nova-account-dashboard">
          <section className="account-panel nova-account-dashboard__orders">
            <header className="nova-account-dashboard__header">
              <div>
                <span className="section-heading__eyebrow">مرور سفارش‌ها</span>
                <h2>سفارش‌های اخیر</h2>
              </div>
              <a className="text-link" href="/account/orders">
                مشاهده همه <Icon name="arrow-left" size={15} />
              </a>
            </header>
            {ordersQuery.isPending ? (
              <div
                className="nova-account-dashboard__loading"
                role="status"
                aria-label="در حال بارگذاری سفارش‌ها"
              >
                <div />
                <div />
                <div />
              </div>
            ) : ordersQuery.isError ? (
              <InlineQueryError
                error={ordersQuery.error}
                onRetry={() => void ordersQuery.refetch()}
              />
            ) : ordersQuery.data?.items.length ? (
              <ul className="nova-account-dashboard__order-list">
                {ordersQuery.data.items.slice(0, 3).map((order) => (
                  <li className="nova-account-dashboard__order" key={order.orderNumber}>
                    <div className="nova-account-dashboard__order-id">
                      <span aria-hidden="true">
                        <Icon name="package" size={18} />
                      </span>
                      <div>
                        <strong>سفارش</strong>
                        <bdi dir="ltr">{order.orderNumber}</bdi>
                      </div>
                    </div>
                    <small>{formatPersianDate(order.createdAt)}</small>
                    <div className="nova-account-dashboard__order-status">
                      <strong>{formatToman(order.totalToman)}</strong>
                      <span>{orderStatusCopy[order.status]}</span>
                    </div>
                    <a
                      href={`/order/${encodeURIComponent(order.orderNumber)}`}
                      aria-label={`مشاهده جزئیات سفارش ${order.orderNumber}`}
                    >
                      <Icon name="arrow-left" size={16} />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="nova-account-dashboard__empty">
                <p>هنوز سفارشی ندارید. اولین انتخاب خود را از مجموعه نوا شروع کنید.</p>
                <a className="text-link" href="/products">
                  مشاهده فروشگاه <Icon name="arrow-left" size={15} />
                </a>
              </div>
            )}
          </section>

          <section className="account-panel nova-account-dashboard__addresses">
            <header className="nova-account-dashboard__header">
              <div>
                <span className="section-heading__eyebrow">تحویل سفارش‌ها</span>
                <h2>آدرس‌های ذخیره‌شده</h2>
              </div>
              <a className="text-link" href="/account/addresses">
                مدیریت آدرس‌ها <Icon name="arrow-left" size={15} />
              </a>
            </header>
            {addressesQuery.isPending ? (
              <div
                className="nova-account-dashboard__loading"
                role="status"
                aria-label="در حال بارگذاری آدرس‌ها"
              >
                <div />
                <div />
              </div>
            ) : addressesQuery.isError ? (
              <InlineQueryError
                error={addressesQuery.error}
                onRetry={() => void addressesQuery.refetch()}
              />
            ) : addressesQuery.data?.length ? (
              <ul className="nova-account-dashboard__address-list">
                {addressesQuery.data.slice(0, 2).map((address) => (
                  <li key={address.id}>
                    <a
                      className="nova-account-dashboard__address"
                      href={`/account/addresses/edit/${encodeURIComponent(address.id)}`}
                    >
                      <span aria-hidden="true">
                        <Icon name="home" size={18} />
                      </span>
                      <div>
                        <strong>{address.label}</strong>
                        <small>
                          {address.recipientName} · {address.city}، {address.province}
                        </small>
                        <small className="nova-account-dashboard__address-line">
                          {address.addressLine}
                        </small>
                      </div>
                      {address.isDefault ? <b>پیش‌فرض</b> : null}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="nova-account-dashboard__empty">
                <p>هنوز نشانی‌ای ثبت نکرده‌اید.</p>
                <a className="text-link" href="/account/addresses/create">
                  ثبت آدرس جدید <Icon name="arrow-left" size={15} />
                </a>
              </div>
            )}
          </section>

          <section className="account-panel nova-account-dashboard__shortcuts">
            <a href="/account/profile">
              <Icon name="user" size={19} />
              <span>اطلاعات شخصی</span>
              <Icon name="arrow-left" size={15} />
            </a>
            <a href="/account/orders">
              <Icon name="package" size={19} />
              <span>پیگیری سفارش‌ها</span>
              <Icon name="arrow-left" size={15} />
            </a>
            <a href="/support">
              <Icon name="users" size={19} />
              <span>پشتیبانی نوا</span>
              <Icon name="arrow-left" size={15} />
            </a>
          </section>
        </div>
      )}
    </AccountLayout>
  );
}
