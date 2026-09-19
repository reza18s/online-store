import { type AdminDashboardSummary } from '@nova/api-client';
import { Card } from '@nova/ui';
import { Icon } from '../../ui/icon';

import { ORDER_STATUS_LABELS } from '../../../pages/admin/admin-dashboard-page-shared';

import { formatPersianNumber } from './format-persian-number';

export function OrderStatusCounts({ summary }: { summary: AdminDashboardSummary }) {
  const entries = Object.entries(summary.orderStatusCounts);

  return (
    <Card asChild className="border border-border bg-surface p-5 text-right shadow-card" dir="rtl">
      <section>
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="section-heading__eyebrow">SUMMARY FIELD ۶ / ۶</span>
            <h2 className="mt-1 text-lg leading-relaxed">تعداد سفارش‌ها بر اساس وضعیت</h2>
          </div>
          <Icon name="layers" size={20} className="text-primary" aria-hidden="true" />
        </div>
        {entries.length > 0 ? (
          <dl className="mt-4 grid gap-2 sm:grid-cols-2">
            {entries.map(([status, count]) => (
              <div
                className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-b-0"
                key={status}
              >
                <dt className="text-sm text-muted-foreground">
                  {ORDER_STATUS_LABELS[status] ?? status}
                </dt>
                <dd className="text-sm font-semibold tabular-nums">{formatPersianNumber(count)}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">وضعیتی برای این بازه ثبت نشده است.</p>
        )}
      </section>
    </Card>
  );
}
