import { useEffect, useState, type FormEvent } from 'react';
import { type AdminCustomerListQuery, type AdminCustomerPage } from '@nova/api-client';

import { useAdminCustomers } from '@/features/support/api/customers/admin-customers-api';

import { Icon } from '@/shared/ui/icon';

import type { QueryResult } from '@/features/support/pages/admin-support-finance-page-shared';
import { CUSTOMER_STATUSES } from '@/features/support/pages/admin-support-finance-page-shared';

import { FilterBar } from '@/features/support/components/support-finance/filter-bar';

import { InspectionPanel } from '@/features/support/components/support-finance/inspection-panel';

import { Pagination } from '@/features/support/components/support-finance/pagination';

import { QueryState } from '@/features/support/components/support-finance/query-state';

import { SelectFilter } from '@/features/support/components/support-finance/select-filter';

import { StatusBadge } from '@/features/support/components/support-finance/status-badge';

import { TextFilter } from '@/features/support/components/support-finance/text-filter';

import { adminCustomerLookupHref } from '@/features/support/components/support-finance/admin-customer-lookup-href';

import { adminOrderHref } from '@/features/support/components/support-finance/admin-order-href';

import { formatDate } from '@/features/support/components/support-finance/format-date';

import { formatPersianNumber as formatNumber } from '@/shared/utils/format-persian-number';

import { ltr } from '@/features/support/components/support-finance/ltr';

import { statusLabel } from '@/features/support/components/support-finance/status-label';

export function CustomerInspection({ initialQuery = '' }: { initialQuery?: string }) {
  const [draftQ, setDraftQ] = useState(initialQuery);
  const [draftStatus, setDraftStatus] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [filters, setFilters] = useState<AdminCustomerListQuery>(() => ({
    page: 1,
    limit: 12,
    ...(initialQuery ? { q: initialQuery } : {}),
  }));
  const query = useAdminCustomers(filters);

  useEffect(() => {
    setDraftQ(initialQuery);
    setSelectedCustomerId(null);
    setFilters({ page: 1, limit: 12, ...(initialQuery ? { q: initialQuery } : {}) });
  }, [initialQuery]);

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSelectedCustomerId(null);
    setFilters({
      page: 1,
      limit: 12,
      q: draftQ || undefined,
      status: (draftStatus || undefined) as AdminCustomerListQuery['status'],
    });
  };

  return (
    <InspectionPanel title="مدیریت مشتریان" icon="users">
      <div className="admin-reference-customer-filters">
        <FilterBar onSubmit={applyFilters}>
          <TextFilter
            id="customer-query"
            label="جست‌وجو"
            value={draftQ}
            onChange={setDraftQ}
            placeholder="ایمیل، تلفن یا شناسه مشتری..."
            dir="ltr"
          />
          <SelectFilter
            id="customer-status"
            label="وضعیت"
            value={draftStatus}
            onChange={setDraftStatus}
            options={CUSTOMER_STATUSES}
          />
        </FilterBar>
      </div>

      <div className="admin-reference-customers">
        <QueryState
          query={query as QueryResult<AdminCustomerPage>}
          emptyTitle="مشتری پیدا نشد"
          emptyDescription="عبارت جست‌وجو یا وضعیت را تغییر دهید."
        >
          {(data) => {
            const activeCount = data.items.filter((customer) => customer.status === 'ACTIVE').length;
            const inactiveCount = data.items.filter((customer) => customer.status !== 'ACTIVE').length;
            const orderedCount = data.items.filter((customer) => customer.orderCount > 0).length;
            const selected =
              data.items.find((customer) => customer.id === selectedCustomerId) ?? null;

            return (
              <>
                <section className="admin-reference-customer-metrics" aria-label="خلاصه مشتریان">
                  <article>
                    <span><Icon name="users" size={20} /></span>
                    <div><strong>{formatNumber(data.total)}</strong><small>کل مشتریان</small></div>
                  </article>
                  <article>
                    <span><Icon name="check" size={20} /></span>
                    <div><strong>{formatNumber(activeCount)}</strong><small>فعال در این صفحه</small></div>
                  </article>
                  <article>
                    <span><Icon name="bag" size={20} /></span>
                    <div><strong>{formatNumber(orderedCount)}</strong><small>دارای سفارش</small></div>
                  </article>
                  <article>
                    <span><Icon name="warning" size={20} /></span>
                    <div><strong>{formatNumber(inactiveCount)}</strong><small>غیرفعال در این صفحه</small></div>
                  </article>
                </section>

                <div className="admin-reference-customer-layout">
                  <section className="admin-reference-customer-table">
                    <div className="overflow-x-auto">
                      <table>
                        <caption className="sr-only">فهرست مشتریان</caption>
                        <thead>
                          <tr>
                            <th>مشتری</th>
                            <th>وضعیت</th>
                            <th>سفارش‌ها</th>
                            <th>آخرین سفارش</th>
                            <th>به‌روزرسانی</th>
                            <th><span className="sr-only">عملیات</span></th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.items.map((customer) => (
                            <tr
                              className={selected?.id === customer.id ? 'is-selected' : ''}
                              key={customer.id}
                              onClick={() => setSelectedCustomerId(customer.id)}
                            >
                              <td>
                                <button
                                  type="button"
                                  className="admin-reference-customer-name"
                                  onClick={() => setSelectedCustomerId(customer.id)}
                                >
                                  <span className="admin-reference-avatar">
                                    <Icon name="user" size={17} />
                                  </span>
                                  <span>
                                    <strong>{ltr(customer.email ?? customer.phone)}</strong>
                                    <small>{ltr(customer.phone)}</small>
                                  </span>
                                </button>
                              </td>
                              <td><StatusBadge status={customer.status} /></td>
                              <td>{formatNumber(customer.orderCount)}</td>
                              <td>
                                {customer.lastOrderNumber ? (
                                  <a href={adminOrderHref(customer.lastOrderNumber)}>
                                    {ltr(customer.lastOrderNumber)}
                                    <small>{customer.lastOrderStatus ? statusLabel(customer.lastOrderStatus) : ''}</small>
                                  </a>
                                ) : (
                                  <span className="text-muted-foreground">بدون سفارش</span>
                                )}
                              </td>
                              <td>{ltr(formatDate(customer.updatedAt))}</td>
                              <td>
                                <a
                                  className="admin-reference-more"
                                  href={adminCustomerLookupHref(customer.email ?? customer.phone)}
                                  aria-label="مشاهده مشتری"
                                >
                                  <Icon name="more-vertical" size={17} />
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="admin-reference-customer-mobile">
                      {data.items.map((customer) => (
                        <article
                          className={selected?.id === customer.id ? 'is-selected' : ''}
                          key={customer.id}
                        >
                          <button type="button" onClick={() => setSelectedCustomerId(customer.id)}>
                            <span className="admin-reference-avatar"><Icon name="user" size={16} /></span>
                            <span>
                              <strong>{ltr(customer.email ?? customer.phone)}</strong>
                              <small>{ltr(customer.phone)}</small>
                            </span>
                          </button>
                          <StatusBadge status={customer.status} />
                          <a href={adminCustomerLookupHref(customer.email ?? customer.phone)}>
                            <Icon name="more-vertical" size={17} />
                          </a>
                        </article>
                      ))}
                    </div>

                    <Pagination
                      page={data.page}
                      total={data.total}
                      limit={data.limit}
                      onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
                    />
                  </section>

                  {selected ? (
                    <aside className="admin-reference-customer-detail">
                      <button
                        type="button"
                        className="admin-reference-customer-detail__close"
                        aria-label="بستن جزئیات"
                        onClick={() => setSelectedCustomerId(null)}
                      >
                        <Icon name="close" size={16} />
                      </button>
                      <span className="admin-reference-customer-detail__avatar">
                        <Icon name="user" size={28} />
                      </span>
                      <h3>{ltr(selected.email ?? 'مشتری نوا')}</h3>
                      <p>{ltr(selected.phone)}</p>
                      <StatusBadge status={selected.status} />
                      <dl>
                        <div><dt>تعداد سفارش</dt><dd>{formatNumber(selected.orderCount)}</dd></div>
                        <div><dt>آخرین سفارش</dt><dd>{selected.lastOrderNumber ? ltr(selected.lastOrderNumber) : '—'}</dd></div>
                        <div><dt>آخرین به‌روزرسانی</dt><dd>{ltr(formatDate(selected.updatedAt))}</dd></div>
                      </dl>
                      <div className="admin-reference-customer-detail__actions">
                        <a href={adminCustomerLookupHref(selected.email ?? selected.phone)}>
                          مشاهده پروفایل
                        </a>
                        {selected.lastOrderNumber ? (
                          <a href={adminOrderHref(selected.lastOrderNumber)}>مشاهده سفارش</a>
                        ) : null}
                      </div>
                    </aside>
                  ) : null}
                </div>
              </>
            );
          }}
        </QueryState>
      </div>
    </InspectionPanel>
  );
}
