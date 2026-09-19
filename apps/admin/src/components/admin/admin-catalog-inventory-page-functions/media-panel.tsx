import { useState, type FormEvent } from 'react';

import { Button, Input as UiInput, Select as UiSelect } from '@nova/ui';
import type { useAdminProductMedia } from '../../../lib/admin/admin-catalog-api';
import {
  useCreateAdminProductMedia,
  useDeleteAdminProductMedia,
  useUpdateAdminProductMedia,
} from '../../../lib/admin/admin-catalog-api';

import { Icon } from '../../ui/icon';

import { LoadingState } from './loading-state';

import { MediaItem } from './media-item';

import { StatePanel } from './state-panel';

import { adminCatalogInventoryErrorMessage } from './admin-catalog-inventory-error-message';

import { isOfflineError } from './is-offline-error';

import { validateMediaDraft } from './validate-media-draft';

export function MediaPanel({
  productId,
  query,
  canWrite,
}: {
  productId: string;
  query: ReturnType<typeof useAdminProductMedia>;
  canWrite: boolean;
}) {
  const createMedia = useCreateAdminProductMedia();
  const updateMedia = useUpdateAdminProductMedia();
  const deleteMedia = useDeleteAdminProductMedia();
  const [draft, setDraft] = useState({
    url: '',
    altText: '',
    kind: 'PRODUCT' as 'PRODUCT' | 'DETAIL' | 'SWATCH',
  });
  const [error, setError] = useState('');
  async function addMedia(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const issues = validateMediaDraft(draft.url, draft.altText);
    if (issues.length) {
      setError(issues.join(' '));
      return;
    }
    try {
      await createMedia.mutateAsync({
        productId,
        input: { url: draft.url.trim(), altText: draft.altText.trim(), kind: draft.kind },
      });
      setDraft({ url: '', altText: '', kind: 'PRODUCT' });
    } catch (mutationError) {
      setError(adminCatalogInventoryErrorMessage(mutationError, 'رسانه ثبت نشد.'));
    }
  }
  if (query.isPending && !query.data)
    return (
      <section className="border border-border bg-surface p-5">
        <LoadingState label="در حال دریافت رسانه‌ها..." />
      </section>
    );
  if (query.isError && !query.data)
    return (
      <section className="border border-border bg-surface p-5" role="alert">
        <StatePanel
          icon={isOfflineError(query.error) ? 'refresh' : 'warning'}
          title="رسانه‌های محصول در دسترس نیست"
          description={adminCatalogInventoryErrorMessage(query.error, 'دریافت رسانه‌ها انجام نشد.')}
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
          <p className="text-[10px] font-semibold tracking-[0.14em] text-primary">MEDIA</p>
          <h3 className="mt-2 font-semibold">رسانه محصول</h3>
        </div>
        <Icon name="layers" size={19} />
      </div>
      <p className="mt-2 text-[10px] leading-6 text-muted-foreground">
        قرارداد فعلی نشانی رسانه را می‌پذیرد؛ بارگذاری مستقیم فایل در این slice وجود ندارد.
      </p>
      {error ? (
        <p className="mt-3 text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {canWrite ? (
        <form className="mt-4 grid gap-2" onSubmit={addMedia}>
          <UiInput
            aria-label="نشانی رسانه"
            className="min-h-11 border border-border bg-background px-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            dir="ltr"
            onChange={(event) => setDraft((current) => ({ ...current, url: event.target.value }))}
            placeholder="https://..."
            value={draft.url}
          />
          <div className="grid gap-2 sm:grid-cols-[1fr_130px_auto]">
            <UiInput
              aria-label="متن جایگزین"
              className="min-h-11 border border-border bg-background px-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              onChange={(event) =>
                setDraft((current) => ({ ...current, altText: event.target.value }))
              }
              placeholder="متن جایگزین"
              value={draft.altText}
            />
            <UiSelect
              aria-label="نوع رسانه"
              className="min-h-11 border border-border bg-background px-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  kind: event.target.value as typeof draft.kind,
                }))
              }
              value={draft.kind}
            >
              <option value="PRODUCT">محصول</option>
              <option value="DETAIL">جزئیات</option>
              <option value="SWATCH">نمونه رنگ</option>
            </UiSelect>
            <Button loading={createMedia.isPending} type="submit">
              <Icon name="plus" size={15} /> افزودن
            </Button>
          </div>
        </form>
      ) : null}
      <div className="mt-5 divide-y divide-border">
        {(query.data ?? []).length === 0 ? (
          <p className="py-3 text-xs text-muted-foreground">رسانه‌ای ثبت نشده است.</p>
        ) : (
          (query.data ?? []).map((media) => (
            <MediaItem
              canWrite={canWrite}
              deleteMedia={deleteMedia}
              key={media.id}
              media={media}
              productId={productId}
              updateMedia={updateMedia}
            />
          ))
        )}
      </div>
    </section>
  );
}
