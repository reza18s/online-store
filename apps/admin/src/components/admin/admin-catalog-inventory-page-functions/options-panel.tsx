import { useState, type FormEvent } from 'react';
import { type AdminCatalogProductOption } from '@nova/api-client';
import { Button, Input as UiInput } from '@nova/ui';
import type { useAdminProductOptions } from '../../../lib/admin/admin-catalog-api';
import {
  useCreateAdminProductOption,
  useCreateAdminProductOptionValue,
  useUpdateAdminProductOption,
  useUpdateAdminProductOptionValue,
} from '../../../lib/admin/admin-catalog-api';

import { Icon } from '../../ui/icon';

import { catalogKeyPattern } from '../../../pages/admin/admin-catalog-inventory-page-shared';

import { LoadingState } from './loading-state';

import { OptionItem } from './option-item';

import { StatePanel } from './state-panel';

import { adminCatalogInventoryErrorMessage } from './admin-catalog-inventory-error-message';

import { isOfflineError } from './is-offline-error';

export function OptionsPanel({
  productId,
  query,
  canWrite,
}: {
  productId: string;
  query: ReturnType<typeof useAdminProductOptions>;
  canWrite: boolean;
}) {
  const createOption = useCreateAdminProductOption();
  const updateOption = useUpdateAdminProductOption();
  const createValue = useCreateAdminProductOptionValue();
  const updateValue = useUpdateAdminProductOptionValue();
  const [newOption, setNewOption] = useState({ key: '', name: '' });
  const [newValues, setNewValues] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  async function addOption(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!catalogKeyPattern.test(newOption.key.trim()) || !newOption.name.trim()) {
      setError('کلید لاتین و نام گزینه معتبر لازم است.');
      return;
    }
    try {
      await createOption.mutateAsync({
        productId,
        input: { key: newOption.key.trim(), name: newOption.name.trim() },
      });
      setNewOption({ key: '', name: '' });
    } catch (mutationError) {
      setError(adminCatalogInventoryErrorMessage(mutationError, 'گزینه ثبت نشد.'));
    }
  }
  async function addValue(option: AdminCatalogProductOption) {
    const value = newValues[option.id]?.trim() ?? '';
    if (!catalogKeyPattern.test(value)) {
      setError('کلید مقدار باید با حروف لاتین کوچک، عدد و خط تیره باشد.');
      return;
    }
    try {
      await createValue.mutateAsync({
        productId,
        optionId: option.id,
        input: { key: value, label: value },
      });
      setNewValues((current) => ({ ...current, [option.id]: '' }));
    } catch (mutationError) {
      setError(adminCatalogInventoryErrorMessage(mutationError, 'مقدار گزینه ثبت نشد.'));
    }
  }
  if (query.isPending && !query.data)
    return (
      <section className="border border-border bg-surface p-5">
        <LoadingState label="در حال دریافت گزینه‌ها..." />
      </section>
    );
  if (query.isError && !query.data)
    return (
      <section className="border border-border bg-surface p-5" role="alert">
        <StatePanel
          icon={isOfflineError(query.error) ? 'refresh' : 'warning'}
          title="گزینه‌های محصول در دسترس نیست"
          description={adminCatalogInventoryErrorMessage(query.error, 'دریافت گزینه‌ها انجام نشد.')}
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
          <p className="text-[10px] font-semibold tracking-[0.14em] text-primary">OPTIONS</p>
          <h3 className="mt-2 font-semibold">گزینه‌ها و مقدارها</h3>
        </div>
        <Icon name="tag" size={19} />
      </div>
      {error ? (
        <p className="mt-3 text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {canWrite ? (
        <form className="mt-4 grid gap-2 sm:grid-cols-[.7fr_1fr_auto]" onSubmit={addOption}>
          <UiInput
            aria-label="کلید گزینه"
            className="min-h-11 border border-border bg-background px-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            dir="ltr"
            onChange={(event) =>
              setNewOption((current) => ({ ...current, key: event.target.value }))
            }
            placeholder="size"
            value={newOption.key}
          />
          <UiInput
            aria-label="نام گزینه"
            className="min-h-11 border border-border bg-background px-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            onChange={(event) =>
              setNewOption((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="سایز"
            value={newOption.name}
          />
          <Button loading={createOption.isPending} size="sm" type="submit">
            <Icon name="plus" size={15} /> افزودن
          </Button>
        </form>
      ) : null}
      <div className="mt-4 divide-y divide-border">
        {(query.data ?? []).length === 0 ? (
          <p className="py-3 text-xs text-muted-foreground">گزینه‌ای ثبت نشده است.</p>
        ) : (
          (query.data ?? []).map((option) => (
            <OptionItem
              canWrite={canWrite}
              createValue={createValue.isPending}
              key={option.id}
              option={option}
              newValue={newValues[option.id] ?? ''}
              onNewValue={(value) =>
                setNewValues((current) => ({ ...current, [option.id]: value }))
              }
              onAddValue={() => void addValue(option)}
              onUpdate={async (name) => {
                try {
                  await updateOption.mutateAsync({
                    productId,
                    optionId: option.id,
                    input: { name },
                  });
                } catch (mutationError) {
                  setError(adminCatalogInventoryErrorMessage(mutationError, 'گزینه ویرایش نشد.'));
                }
              }}
              onUpdateValue={async (value) => {
                try {
                  await updateValue.mutateAsync({
                    productId,
                    optionId: option.id,
                    valueId: value.id,
                    input: { label: value.label },
                  });
                } catch (mutationError) {
                  setError(
                    adminCatalogInventoryErrorMessage(mutationError, 'مقدار گزینه ویرایش نشد.'),
                  );
                }
              }}
            />
          ))
        )}
      </div>
    </section>
  );
}
