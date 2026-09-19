import { type ReactNode } from 'react';

import { useCurrentCustomer } from '../../../lib/auth/auth-api';

import {
  apiErrorMessage,
  isCustomerActive,
  isOfflineError,
  isPermissionError,
  isUnauthorizedError,
  useCustomerCacheBoundary,
  useOnlineStatus,
} from '../../../lib/account/account-state';

import { EmptyState } from './empty-state';

import { LoadingState } from './loading-state';

import { PageFrame } from '../../../pages/account/account-pages-functions/page-frame';

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
