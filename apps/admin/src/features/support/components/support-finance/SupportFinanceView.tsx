import { Icon } from '@/shared/ui/icon';

import type { AdminSupportFinanceView } from '@/features/support/pages/admin-support-finance-page-shared';
import { VIEW_ACCESS } from '@/features/support/pages/admin-support-finance-page-shared';

import { AuditInspection } from '@/features/support/components/support-finance/audit-inspection';

import { CustomerInspection } from '@/features/support/components/support-finance/customer-inspection';

import { AdminSessionState } from '@/features/support/components/support-finance/admin-session-state';

import { NotificationInspection } from '@/features/support/components/support-finance/notification-inspection';

import { PaymentInspection } from '@/features/support/components/support-finance/payment-inspection';

import { adminCustomerLookupQuery } from '@/features/support/components/support-finance/admin-customer-lookup-query';

import { canStaffInspectView } from '@/features/support/components/support-finance/can-staff-inspect-view';

import { normalizeAdminSupportFinanceView } from '@/features/support/components/support-finance/normalize-admin-support-finance-view';

export function SupportFinanceView({
  view = 'payments',
  queryString = '',
  staffRoles = [],
}: {
  view?: string;
  queryString?: string;
  staffRoles?: readonly string[];
}) {
  const activeView = normalizeAdminSupportFinanceView(view);

  const accessibleViews = (Object.keys(VIEW_ACCESS) as AdminSupportFinanceView[]).filter(
    (candidate) => canStaffInspectView(candidate, staffRoles),
  );
  if (!canStaffInspectView(activeView, staffRoles)) return <AdminSessionState kind="denied" />;

  const config = VIEW_ACCESS[activeView];
  return (
    <main
      className="admin-reference-module admin-reference-support min-h-0 bg-transparent px-0 py-0 text-foreground"
      dir="rtl"
    >
      <div className="admin-reference-module__inner mx-auto max-w-[1120px]">
        <header className="admin-reference-module__header flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
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
        <nav className="admin-reference-tabs mt-5 overflow-x-auto" aria-label="بخش‌های پشتیبانی و مالی">
          <div className="flex min-w-max gap-2">
            {accessibleViews.map((candidate) => {
              const item = VIEW_ACCESS[candidate];
              const selected = candidate === activeView;
              return (
                <a
                  className={`inline-flex min-h-11 items-center gap-2 rounded-control border px-4 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-surface text-foreground hover:border-primary hover:text-primary'}`}
                  href={`/admin/${candidate}`}
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
