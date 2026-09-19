import { useState, type FormEvent } from 'react';
import { type AdminNotificationListQuery, type AdminNotificationPage } from '@nova/api-client';

import { useAdminNotifications } from '../../../lib/admin/admin-notifications-api';

import type { QueryResult } from '../../../pages/admin/admin-support-finance-page-shared';
import { NOTIFICATION_STATUSES } from '../../../pages/admin/admin-support-finance-page-shared';

import { FilterBar } from './filter-bar';

import { InspectionPanel } from './inspection-panel';

import { Pagination } from './pagination';

import { QueryState } from './query-state';

import { SelectFilter } from './select-filter';

import { StatusBadge } from './status-badge';

import { TextFilter } from './text-filter';

import { formatDate } from './format-date';

import { formatNumber } from './format-number';

import { ltr } from './ltr';

export function NotificationInspection() {
  const [draftKind, setDraftKind] = useState('');
  const [draftStatus, setDraftStatus] = useState('');
  const [filters, setFilters] = useState<AdminNotificationListQuery>({ page: 1, limit: 12 });
  const query = useAdminNotifications(filters);
  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters({
      page: 1,
      limit: 12,
      kind: draftKind || undefined,
      status: (draftStatus || undefined) as AdminNotificationListQuery['status'],
    });
  };

  return (
    <InspectionPanel title="تحویل اعلان‌ها" icon="bell">
      <FilterBar onSubmit={applyFilters}>
        <TextFilter
          id="notification-kind"
          label="نوع اعلان"
          value={draftKind}
          onChange={setDraftKind}
          placeholder="مثلاً PAYMENT_SUCCEEDED"
          dir="ltr"
        />
        <SelectFilter
          id="notification-status"
          label="وضعیت تحویل"
          value={draftStatus}
          onChange={setDraftStatus}
          options={NOTIFICATION_STATUSES}
        />
      </FilterBar>
      <div className="p-3 md:p-5">
        <QueryState
          query={query as QueryResult<AdminNotificationPage>}
          emptyTitle="اعلانی پیدا نشد"
          emptyDescription="فیلترها را تغییر دهید یا بازه دیگری را بررسی کنید."
        >
          {(data) => (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-[780px] w-full border-collapse text-right text-xs">
                  <caption className="sr-only">فهرست وضعیت تحویل اعلان‌ها</caption>
                  <thead>
                    <tr className="border-b border-border text-[10px] text-muted-foreground">
                      <th className="px-3 py-3 font-normal">نوع اعلان</th>
                      <th className="px-3 py-3 font-normal">وضعیت</th>
                      <th className="px-3 py-3 font-normal">تلاش</th>
                      <th className="px-3 py-3 font-normal">زمان آماده‌سازی</th>
                      <th className="px-3 py-3 font-normal">آخرین وضعیت</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((notification) => (
                      <tr className="border-b border-border last:border-b-0" key={notification.id}>
                        <td className="px-3 py-3">{ltr(notification.kind)}</td>
                        <td className="px-3 py-3">
                          <StatusBadge status={notification.status} />
                        </td>
                        <td className="px-3 py-3">{formatNumber(notification.attempts)}</td>
                        <td className="px-3 py-3 text-muted-foreground">
                          {ltr(formatDate(notification.availableAt))}
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">
                          {notification.processedAt
                            ? ltr(formatDate(notification.processedAt))
                            : notification.lastError
                              ? 'خطای تحویل ثبت شده'
                              : 'در انتظار نتیجه'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4">
                <Pagination
                  page={data.page}
                  total={data.total}
                  limit={data.limit}
                  onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
                />
              </div>
            </>
          )}
        </QueryState>
      </div>
    </InspectionPanel>
  );
}
