import { type AdminDashboardSummary } from '@nova/api-client';
import { Card } from '@nova/ui';
import { Icon } from '@/shared/ui/icon';

import { ORDER_STATUS_LABELS } from '@/features/dashboard/pages/admin-dashboard-page-shared';

import { formatPersianNumber } from '@/shared/utils/format-persian-number';

export function OrderStatusCounts({ summary }: { summary: AdminDashboardSummary }) {
  const entries = Object.entries(summary.orderStatusCounts);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <Card asChild className="admin-reference-order-status" dir="rtl">
      <section>
        <div className="admin-reference-panel-heading">
          <div>
            <span>ORDER STATUS</span>
            <h2>وضعیت سفارش‌ها</h2>
          </div>
          <Icon name="package" size={19} aria-hidden="true" />
        </div>

        <div className="admin-reference-order-status__body">
          <div className="admin-reference-order-status__ring" aria-label={`مجموع ${formatPersianNumber(total)} سفارش`}>
            <strong>{formatPersianNumber(total)}</strong>
            <small>مجموع سفارش‌ها</small>
          </div>

          {entries.length > 0 ? (
            <dl>
              {entries.map(([status, count], index) => (
                <div key={status}>
                  <dt>
                    <span className={`admin-reference-dot dot-${(index % 5) + 1}`} />
                    {ORDER_STATUS_LABELS[status] ?? status}
                  </dt>
                  <dd>{formatPersianNumber(count)}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="admin-reference-empty-copy">وضعیتی برای این بازه ثبت نشده است.</p>
          )}
        </div>
      </section>
    </Card>
  );
}
