import { useEffect, useState, type FormEvent } from 'react';
import { type AdminCustomerListQuery, type AdminCustomerPage } from '@nova/api-client';

import { useAdminCustomers } from '../../../lib/admin/admin-customers-api';

import type { QueryResult } from '../../../pages/admin/admin-support-finance-page-shared';
import { CUSTOMER_STATUSES } from '../../../pages/admin/admin-support-finance-page-shared';

import { FilterBar } from './filter-bar';

import { InspectionPanel } from './inspection-panel';

import { Pagination } from './pagination';

import { QueryState } from './query-state';

import { SelectFilter } from './select-filter';

import { StatusBadge } from './status-badge';

import { TextFilter } from './text-filter';

import { adminCustomerLookupHref } from './admin-customer-lookup-href';

import { adminOrderHref } from './admin-order-href';

import { formatDate } from './format-date';

import { formatNumber } from './format-number';

import { ltr } from './ltr';

import { statusLabel } from './status-label';

export function CustomerInspection({ initialQuery = '' }: { initialQuery?: string }) {
  const [draftQ, setDraftQ] = useState(initialQuery);
  const [draftStatus, setDraftStatus] = useState('');
  const [filters, setFilters] = useState<AdminCustomerListQuery>(() => ({
    page: 1,
    limit: 12,
    ...(initialQuery ? { q: initialQuery } : {}),
  }));
  const query = useAdminCustomers(filters);
  useEffect(() => {
    setDraftQ(initialQuery);
    setFilters({ page: 1, limit: 12, ...(initialQuery ? { q: initialQuery } : {}) });
  }, [initialQuery]);

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters({
      page: 1,
      limit: 12,
      q: draftQ || undefined,
      status: (draftStatus || undefined) as AdminCustomerListQuery['status'],
    });
  };

  return (
    <InspectionPanel title="جست‌وجوی مشتری" icon="users">
      <FilterBar onSubmit={applyFilters}>
        <TextFilter
          id="customer-query"
          label="ایمیل، تلفن یا شناسه مشتری"
          value={draftQ}
          onChange={setDraftQ}
          placeholder="برای جست‌وجو وارد کنید..."
          dir="ltr"
        />
        <SelectFilter
          id="customer-status"
          label="وضعیت مشتری"
          value={draftStatus}
          onChange={setDraftStatus}
          options={CUSTOMER_STATUSES}
        />
      </FilterBar>
      <div className="p-3 md:p-5">
        <QueryState
          query={query as QueryResult<AdminCustomerPage>}
          emptyTitle="مشتری پیدا نشد"
          emptyDescription="عبارت جست‌وجو یا وضعیت را تغییر دهید."
        >
          {(data) => (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-[820px] w-full border-collapse text-right text-xs">
                  <caption className="sr-only">فهرست مشتریان</caption>
                  <thead>
                    <tr className="border-b border-border text-[10px] text-muted-foreground">
                      <th className="px-3 py-3 font-normal">مشتری</th>
                      <th className="px-3 py-3 font-normal">وضعیت</th>
                      <th className="px-3 py-3 font-normal">سفارش‌ها</th>
                      <th className="px-3 py-3 font-normal">آخرین سفارش</th>
                      <th className="px-3 py-3 font-normal">به‌روزرسانی</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((customer) => (
                      <tr className="border-b border-border last:border-b-0" key={customer.id}>
                        <td className="max-w-[270px] px-3 py-3">
                          <a
                            className="inline-flex min-h-11 max-w-full flex-col justify-center rounded-control px-2 text-right hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            href={adminCustomerLookupHref(customer.email ?? customer.phone)}
                          >
                            <span className="truncate">
                              {ltr(customer.email ?? 'ایمیل ثبت نشده')}
                            </span>
                            <span className="mt-1 text-[10px] text-muted-foreground">
                              {ltr(customer.phone)}
                            </span>
                          </a>
                        </td>
                        <td className="px-3 py-3">
                          <StatusBadge status={customer.status} />
                        </td>
                        <td className="px-3 py-3">{formatNumber(customer.orderCount)}</td>
                        <td className="px-3 py-3">
                          {customer.lastOrderNumber ? (
                            <a
                              className="inline-flex min-h-11 items-center rounded-control px-2 text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                              href={adminOrderHref(customer.lastOrderNumber)}
                            >
                              {ltr(customer.lastOrderNumber)}
                              <span className="mr-2 text-[10px] text-muted-foreground">
                                {customer.lastOrderStatus
                                  ? statusLabel(customer.lastOrderStatus)
                                  : ''}
                              </span>
                            </a>
                          ) : (
                            <span className="text-muted-foreground">بدون سفارش</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">
                          {ltr(formatDate(customer.updatedAt))}
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
