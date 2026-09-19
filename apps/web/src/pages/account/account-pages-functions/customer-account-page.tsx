import { useState } from 'react';

import { useCurrentCustomer, useLogoutCustomer } from '../../../lib/auth/auth-api';
import { useCustomerOrders } from '../../../lib/orders/orders-api';
import { Icon } from '../../../components/ui/icon';
import {
  apiErrorMessage,
  formatToman,
  isCustomerActive,
  isOfflineError,
  isUnauthorizedError,
  orderStatusCopy,
  useCustomerCacheBoundary,
  useOnlineStatus,
} from '../../../lib/account/account-state';

import type { AccountSection } from '../account-pages-shared';
import { accountTitles } from '../account-pages-shared';

import { AccountLayout } from '../../../components/account/account-pages-functions/account-layout';

import { CustomerOrderListContent } from '../../../components/account/account-pages-functions/customer-order-list-content';

import { EmptyState } from '../../../components/account/account-pages-functions/empty-state';

import { InlineQueryError } from '../../../components/account/account-pages-functions/inline-query-error';

import { LoadingState } from '../../../components/account/account-pages-functions/loading-state';

import { PageFrame } from './page-frame';

import { ProfilePanel } from '../../../components/account/account-pages-functions/profile-panel';

import { SessionState } from '../../../components/account/account-pages-functions/session-state';

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
      {activeSection === 'dashboard' ? (
        <section className="account-welcome" aria-labelledby="account-welcome-title">
          <img src="/assets/nova-women-lifestyle.webp" alt="استایل آرام و روزمره نوا" />
          <div>
            <span className="section-heading__eyebrow">NOVA / ATELIER</span>
            <h2 id="account-welcome-title">خوش آمدید به دنیای نوا</h2>
            <p>انتخاب‌های شما، سفارش‌ها و پیشنهادهای شخصی‌سازی‌شده در یک نگاه.</p>
            <a href="#products/new">
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
