import { type ReactNode } from 'react';

import { Button } from '@nova/ui';

import type { useCurrentCustomer } from '../../../lib/auth/auth-api';

import { Icon } from '../../../components/ui/icon';

import type { AccountSection } from '../../../pages/account/account-pages-shared';
import { accountNavigation } from '../../../pages/account/account-pages-shared';

import { PageFrame } from '../../../pages/account/account-pages-functions/page-frame';

export function AccountLayout({
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
          <Button
            className="mt-3 flex min-h-11 items-center gap-2 px-3 text-sm text-destructive transition-colors hover:text-destructive-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
            disabled={logoutPending}
            onClick={onLogout}
            type="button"
          >
            <Icon name="close" size={17} />
            {logoutPending ? 'در حال خروج...' : 'خروج از حساب'}
          </Button>
          <div className="account-nav__promo">
            <img src="/assets/nova-materials.webp" alt="بافت‌های طبیعی آتلیه نوا" />
            <div>
              <span>NOVA / ATELIER</span>
              <strong>به دنیای نوا بپیوندید</strong>
              <a href="#campaign">مشاهده کالکشن</a>
            </div>
          </div>
        </aside>
        <section className="account-content">{children}</section>
      </div>
    </PageFrame>
  );
}
