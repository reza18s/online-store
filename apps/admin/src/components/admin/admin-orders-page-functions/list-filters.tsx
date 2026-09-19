import { useEffect, useState, type FormEvent } from 'react';
import { type AdminOrderListQuery, type CheckoutOrderStatus } from '@nova/api-client';
import { Button, Input as UiInput, Select as UiSelect } from '@nova/ui';

import { Icon } from '../../ui/icon';

import {
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
} from '../../../pages/admin/admin-orders-page-shared';

export function ListFilters({
  value,
  onChange,
}: {
  value: AdminOrderListQuery;
  onChange: (next: AdminOrderListQuery) => void;
}) {
  const [search, setSearch] = useState(value.q ?? '');

  useEffect(() => {
    setSearch(value.q ?? '');
  }, [value.q]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onChange({ ...value, page: 1, q: search.trim() || undefined });
  }

  return (
    <form className="border border-border bg-surface p-4 shadow-card md:p-5" onSubmit={submit}>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1.7fr)_repeat(2,minmax(150px,0.8fr))_auto] md:items-end">
        <label className="block text-xs text-muted-foreground">
          جست‌وجو در سفارش‌ها
          <span className="relative mt-2 block">
            <Icon
              className="pointer-events-none absolute inset-inline-end-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              name="search"
              size={18}
            />
            <UiInput
              aria-label="جست‌وجو در سفارش‌ها"
              className="min-h-12 w-full border border-border bg-background px-3 pe-10 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="شماره سفارش یا شناسه مشتری"
              value={search}
            />
          </span>
        </label>
        <label className="block text-xs text-muted-foreground">
          وضعیت سفارش
          <UiSelect
            aria-label="فیلتر وضعیت سفارش"
            className="mt-2 min-h-12 w-full border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            onChange={(event) =>
              onChange({
                ...value,
                page: 1,
                status: (event.target.value || undefined) as CheckoutOrderStatus | undefined,
              })
            }
            value={value.status ?? ''}
          >
            <option value="">همه وضعیت‌ها</option>
            {ORDER_STATUS_OPTIONS.map(([status, label]) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </UiSelect>
        </label>
        <label className="block text-xs text-muted-foreground">
          وضعیت پرداخت
          <UiSelect
            aria-label="فیلتر وضعیت پرداخت"
            className="mt-2 min-h-12 w-full border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            onChange={(event) =>
              onChange({
                ...value,
                page: 1,
                paymentStatus: (event.target.value ||
                  undefined) as AdminOrderListQuery['paymentStatus'],
              })
            }
            value={value.paymentStatus ?? ''}
          >
            {PAYMENT_STATUS_OPTIONS.map(([status, label]) => (
              <option key={status || 'all'} value={status}>
                {label}
              </option>
            ))}
          </UiSelect>
        </label>
        <Button size="md" type="submit">
          <Icon name="search" size={17} />
          اعمال فیلتر
        </Button>
      </div>
    </form>
  );
}
