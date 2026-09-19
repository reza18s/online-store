import { useState, type FormEvent } from 'react';
import {
  type AdminPaymentAttempt,
  type AdminPaymentListQuery,
  type AdminPaymentPage,
} from '@nova/api-client';
import { Button } from '@nova/ui';
import { useAdminPayment, useAdminPayments } from '../../../lib/admin/admin-payments-api';

import type { QueryResult } from '../../../pages/admin/admin-support-finance-page-shared';
import { PAYMENT_STATUSES } from '../../../pages/admin/admin-support-finance-page-shared';

import { FilterBar } from './filter-bar';

import { InspectionPanel } from './inspection-panel';

import { Pagination } from './pagination';

import { PaymentDetail } from './payment-detail';

import { QueryState } from './query-state';

import { SelectFilter } from './select-filter';

import { StatusBadge } from './status-badge';

import { TextFilter } from './text-filter';

import { adminOrderHref } from './admin-order-href';

import { formatDate } from './format-date';

import { formatToman } from './format-toman';

import { ltr } from './ltr';

export function PaymentInspection() {
  const [draftStatus, setDraftStatus] = useState('');
  const [draftProvider, setDraftProvider] = useState('');
  const [draftOrderNumber, setDraftOrderNumber] = useState('');
  const [filters, setFilters] = useState<AdminPaymentListQuery>({ page: 1, limit: 12 });
  const [selectedId, setSelectedId] = useState('');
  const query = useAdminPayments(filters);
  const detailQuery = useAdminPayment(selectedId, Boolean(selectedId));

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSelectedId('');
    setFilters({
      page: 1,
      limit: 12,
      status: (draftStatus || undefined) as AdminPaymentListQuery['status'],
      provider: draftProvider || undefined,
      orderNumber: draftOrderNumber || undefined,
    });
  };

  return (
    <InspectionPanel title="تلاش‌های پرداخت" icon="bag">
      <FilterBar onSubmit={applyFilters}>
        <TextFilter
          id="payment-provider"
          label="درگاه"
          value={draftProvider}
          onChange={setDraftProvider}
          placeholder="مثلاً fake-gateway"
          dir="ltr"
        />
        <TextFilter
          id="payment-order"
          label="شماره سفارش"
          value={draftOrderNumber}
          onChange={setDraftOrderNumber}
          placeholder="NV-..."
          dir="ltr"
        />
        <SelectFilter
          id="payment-status"
          label="وضعیت پرداخت"
          value={draftStatus}
          onChange={setDraftStatus}
          options={PAYMENT_STATUSES}
        />
      </FilterBar>
      <div className="p-3 md:p-5">
        <QueryState
          query={query as QueryResult<AdminPaymentPage>}
          emptyTitle="تلاش پرداختی پیدا نشد"
          emptyDescription="با فیلترهای دیگری جست‌وجو کنید یا بعداً دوباره بررسی کنید."
        >
          {(data) => (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-[780px] w-full border-collapse text-right text-xs">
                  <caption className="sr-only">فهرست تلاش‌های پرداخت</caption>
                  <thead>
                    <tr className="border-b border-border text-[10px] text-muted-foreground">
                      <th className="px-3 py-3 font-normal">شناسه تلاش</th>
                      <th className="px-3 py-3 font-normal">سفارش</th>
                      <th className="px-3 py-3 font-normal">درگاه</th>
                      <th className="px-3 py-3 font-normal">مبلغ</th>
                      <th className="px-3 py-3 font-normal">وضعیت</th>
                      <th className="px-3 py-3 font-normal">ثبت</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((payment) => (
                      <tr
                        className={`border-b border-border last:border-b-0 ${selectedId === payment.id ? 'bg-accent-soft/40' : ''}`}
                        key={payment.id}
                      >
                        <td className="px-3 py-3">
                          <Button
                            className="min-h-11 rounded-control px-2 text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            type="button"
                            onClick={() => setSelectedId(payment.id)}
                          >
                            {ltr(payment.id, 'max-w-[150px] truncate')}
                          </Button>
                        </td>
                        <td className="px-3 py-3">
                          <a
                            className="inline-flex min-h-11 items-center rounded-control px-2 text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            href={adminOrderHref(payment.orderNumber)}
                          >
                            {ltr(payment.orderNumber)}
                          </a>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">{payment.provider}</td>
                        <td className="px-3 py-3">{formatToman(payment.amountToman)}</td>
                        <td className="px-3 py-3">
                          <StatusBadge status={payment.status} />
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">
                          {ltr(formatDate(payment.createdAt))}
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
        {selectedId ? (
          <PaymentDetail query={detailQuery as QueryResult<AdminPaymentAttempt>} />
        ) : null}
      </div>
    </InspectionPanel>
  );
}
