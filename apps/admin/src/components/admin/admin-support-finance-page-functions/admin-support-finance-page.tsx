import { isStaffAuthFailure, isStaffAuthorizationFailure } from '../../../lib/admin/admin-auth';
import { useStaffUser } from '../../../lib/admin/admin-catalog-api';
import { Icon } from '../../ui/icon';

import type { AdminSupportFinanceView } from '../../../pages/admin/admin-support-finance-page-shared';
import { VIEW_ACCESS } from '../../../pages/admin/admin-support-finance-page-shared';

import { AdminSessionState } from './admin-session-state';

import { AuditInspection } from './audit-inspection';

import { CustomerInspection } from './customer-inspection';

import { NotificationInspection } from './notification-inspection';

import { PaymentInspection } from './payment-inspection';

import { adminCustomerLookupQuery } from './admin-customer-lookup-query';

import { canStaffInspectView } from './can-staff-inspect-view';

import { normalizeAdminSupportFinanceView } from './normalize-admin-support-finance-view';

export function AdminSupportFinancePage({
  view = 'payments',
  queryString = '',
}: {
  view?: string;
  queryString?: string;
}) {
  const activeView = normalizeAdminSupportFinanceView(view);
  const staffQuery = useStaffUser();
  const roles = staffQuery.data?.roles ?? [];

  if (staffQuery.isPending) return <AdminSessionState kind="loading" />;
  if (isStaffAuthFailure(staffQuery.error)) return <AdminSessionState kind="expired" />;
  if (isStaffAuthorizationFailure(staffQuery.error)) return <AdminSessionState kind="denied" />;
  if (!staffQuery.data) return <AdminSessionState kind="missing" />;

  const accessibleViews = (Object.keys(VIEW_ACCESS) as AdminSupportFinanceView[]).filter(
    (candidate) => canStaffInspectView(candidate, roles),
  );
  if (!canStaffInspectView(activeView, roles)) return <AdminSessionState kind="denied" />;

  const config = VIEW_ACCESS[activeView];
  return (
    <main
      className="min-h-svh bg-[#f6f6f4] px-4 py-5 text-foreground md:px-6 md:py-8 lg:px-8"
      dir="rtl"
    >
      <div className="mx-auto max-w-[1120px]">
        <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
          <div className="text-right">
            <span className="section-heading__eyebrow">{config.eyebrow}</span>
            <h1 className="mt-1 text-2xl leading-relaxed md:text-3xl">{config.label}</h1>
            <p className="mt-1 max-w-2xl text-xs leading-7 text-muted-foreground">
              {config.description}
            </p>
          </div>
          <span className="inline-flex min-h-10 items-center gap-2 rounded-control border border-border bg-surface px-3 text-[11px] text-muted-foreground">
            <Icon name="eye" size={15} />
            داده‌های محدودشده
          </span>
        </header>
        <nav className="mt-5 overflow-x-auto" aria-label="بخش‌های پشتیبانی و مالی">
          <div className="flex min-w-max gap-2">
            {accessibleViews.map((candidate) => {
              const item = VIEW_ACCESS[candidate];
              const selected = candidate === activeView;
              return (
                <a
                  className={`inline-flex min-h-11 items-center gap-2 rounded-control border px-4 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-surface text-foreground hover:border-primary hover:text-primary'}`}
                  href={`#admin/${candidate}`}
                  aria-current={selected ? 'page' : undefined}
                  key={candidate}
                >
                  <Icon name={item.icon} size={16} />
                  {item.label}
                </a>
              );
            })}
          </div>
        </nav>
        <div className="mt-5">
          {activeView === 'payments' ? <PaymentInspection /> : null}
          {activeView === 'customers' ? (
            <CustomerInspection initialQuery={adminCustomerLookupQuery(queryString)} />
          ) : null}
          {activeView === 'notifications' ? <NotificationInspection /> : null}
          {activeView === 'audit' ? <AuditInspection /> : null}
        </div>
      </div>
    </main>
  );
}
