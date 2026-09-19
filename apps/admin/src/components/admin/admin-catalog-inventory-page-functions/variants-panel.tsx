import { useState, type FormEvent } from 'react';
import { type AdminCatalogProductOption } from '@nova/api-client';
import { Button, Input as UiInput } from '@nova/ui';
import type { useAdminProductVariants } from '../../../lib/admin/admin-catalog-api';
import {
  useCreateAdminProductVariant,
  useUpdateAdminProductVariant,
} from '../../../lib/admin/admin-catalog-api';

import { Icon } from '../../ui/icon';

import { LoadingState } from './loading-state';

import { StatePanel } from './state-panel';

import { VariantItem } from './variant-item';

import { adminCatalogInventoryErrorMessage } from './admin-catalog-inventory-error-message';

import { isOfflineError } from './is-offline-error';

export function VariantsPanel({
  productId,
  query,
  options,
  canWrite,
}: {
  productId: string;
  query: ReturnType<typeof useAdminProductVariants>;
  options: AdminCatalogProductOption[];
  canWrite: boolean;
}) {
  const createVariant = useCreateAdminProductVariant();
  const updateVariant = useUpdateAdminProductVariant();
  const [draft, setDraft] = useState({ sku: '', title: '', size: '', color: '', priceToman: '' });
  const [error, setError] = useState('');
  async function addVariant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/.test(draft.sku.trim())) {
      setError('SKU فقط با حروف لاتین، عدد و . _ - معتبر است.');
      return;
    }
    try {
      await createVariant.mutateAsync({
        productId,
        input: {
          sku: draft.sku.trim(),
          title: draft.title.trim() || null,
          size: draft.size.trim() || null,
          color: draft.color.trim() || null,
          priceToman: draft.priceToman.trim() ? Number(draft.priceToman) : null,
        },
      });
      setDraft({ sku: '', title: '', size: '', color: '', priceToman: '' });
    } catch (mutationError) {
      setError(adminCatalogInventoryErrorMessage(mutationError, 'تنوع محصول ثبت نشد.'));
    }
  }
  if (query.isPending && !query.data)
    return (
      <section className="border border-border bg-surface p-5">
        <LoadingState label="در حال دریافت تنوع‌ها..." />
      </section>
    );
  if (query.isError && !query.data)
    return (
      <section className="border border-border bg-surface p-5" role="alert">
        <StatePanel
          icon={isOfflineError(query.error) ? 'refresh' : 'warning'}
          title="تنوع‌های محصول در دسترس نیست"
          description={adminCatalogInventoryErrorMessage(query.error, 'دریافت تنوع‌ها انجام نشد.')}
          action={
            <Button onClick={() => void query.refetch()} variant="outline">
              <Icon name="refresh" size={16} /> تلاش دوباره
            </Button>
          }
          tone="danger"
        />
      </section>
    );
  return (
    <section className="border border-border bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.14em] text-primary">VARIANTS</p>
          <h3 className="mt-2 font-semibold">تنوع و SKU</h3>
        </div>
        <Icon name="grid" size={19} />
      </div>
      {error ? (
        <p className="mt-3 text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {canWrite ? (
        <form className="mt-4 grid gap-2 sm:grid-cols-2" onSubmit={addVariant}>
          <UiInput
            aria-label="SKU تنوع"
            className="min-h-11 border border-border bg-background px-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            dir="ltr"
            onChange={(event) => setDraft((current) => ({ ...current, sku: event.target.value }))}
            placeholder="SKU-001"
            value={draft.sku}
          />
          <UiInput
            aria-label="عنوان تنوع"
            className="min-h-11 border border-border bg-background px-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
            placeholder="عنوان تنوع"
            value={draft.title}
          />
          <UiInput
            aria-label="سایز تنوع"
            className="min-h-11 border border-border bg-background px-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            onChange={(event) => setDraft((current) => ({ ...current, size: event.target.value }))}
            placeholder="M"
            value={draft.size}
          />
          <UiInput
            aria-label="رنگ تنوع"
            className="min-h-11 border border-border bg-background px-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            onChange={(event) => setDraft((current) => ({ ...current, color: event.target.value }))}
            placeholder="مشکی"
            value={draft.color}
          />
          <UiInput
            aria-label="قیمت تنوع"
            className="min-h-11 border border-border bg-background px-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            dir="ltr"
            inputMode="numeric"
            onChange={(event) =>
              setDraft((current) => ({ ...current, priceToman: event.target.value }))
            }
            placeholder="قیمت اختیاری"
            value={draft.priceToman}
          />
          <Button loading={createVariant.isPending} type="submit">
            <Icon name="plus" size={15} /> افزودن تنوع
          </Button>
        </form>
      ) : null}
      <div className="mt-5 divide-y divide-border">
        {(query.data ?? []).length === 0 ? (
          <p className="py-3 text-xs text-muted-foreground">تنوعی ثبت نشده است.</p>
        ) : (
          (query.data ?? []).map((variant) => (
            <VariantItem
              canWrite={canWrite}
              key={variant.id}
              productId={productId}
              variant={variant}
              update={updateVariant}
            />
          ))
        )}
      </div>
      {options.length ? (
        <p className="mt-4 text-[10px] leading-6 text-muted-foreground">
          مقدارهای گزینه در سرویس ثبت شده‌اند؛ اتصال مقدار به تنوع از قرارداد optionValueIds
          پشتیبانی می‌کند.
        </p>
      ) : null}
    </section>
  );
}
