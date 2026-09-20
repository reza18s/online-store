import { useState, type ChangeEvent, type FormEvent } from 'react';
import type { AdminCatalogProductStatus } from '@nova/api-client';

import { Button, Input as UiInput, Select as UiSelect } from '@nova/ui';
import type { useAdminProductMedia } from '@/features/catalog/api/catalog/admin-catalog-api';
import {
  useCreateAdminProductMedia,
  useDeleteAdminProductMedia,
  useUploadAdminProductMedia,
  useUpdateAdminProductMedia,
} from '@/features/catalog/api/catalog/admin-catalog-api';

import { Icon } from '@/shared/ui/icon';

import { LoadingState } from '@/features/catalog/components/catalog-inventory/loading-state';

import { MediaItem } from '@/features/catalog/components/catalog-inventory/media-item';

import { StatePanel } from '@/features/catalog/components/catalog-inventory/state-panel';

import { adminCatalogInventoryErrorMessage } from '@/features/catalog/components/catalog-inventory/admin-catalog-inventory-error-message';

import {
  catalogMediaContentType,
  readCatalogMediaDimensions,
  validateCatalogMediaFile,
} from '@/features/catalog/components/catalog-inventory/catalog-media-upload';

import { canDeleteAdminProductMedia } from '@/features/catalog/components/catalog-inventory/can-delete-admin-product-media';

import { isOfflineError } from '@/features/catalog/components/catalog-inventory/is-offline-error';

import { validateMediaDraft } from '@/features/catalog/components/catalog-inventory/validate-media-draft';

export function MediaPanel({
  productId,
  productStatus,
  query,
  canWrite,
}: {
  productId: string;
  productStatus: AdminCatalogProductStatus;
  query: ReturnType<typeof useAdminProductMedia>;
  canWrite: boolean;
}) {
  const createMedia = useCreateAdminProductMedia();
  const uploadMedia = useUploadAdminProductMedia();
  const updateMedia = useUpdateAdminProductMedia();
  const deleteMedia = useDeleteAdminProductMedia();
  const [draft, setDraft] = useState({
    url: '',
    altText: '',
    kind: 'PRODUCT' as 'PRODUCT' | 'DETAIL' | 'SWATCH',
  });
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
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
  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    const issues = validateCatalogMediaFile(file);
    setError(issues.join(' '));
    setSelectedFile(issues.length ? null : file);
  }
  async function uploadSelectedMedia(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const issues = validateCatalogMediaFile(selectedFile);
    if (issues.length) {
      setError(issues.join(' '));
      return;
    }
    if (!selectedFile) return;
    if (!draft.altText.trim()) {
      setError('متن جایگزین رسانه را وارد کنید.');
      return;
    }
    try {
      const dimensions = await readCatalogMediaDimensions(selectedFile);
      await uploadMedia.mutateAsync({
        productId,
        file: selectedFile,
        input: {
          contentType: catalogMediaContentType(selectedFile),
          sizeBytes: selectedFile.size,
          ...dimensions,
        },
        completeInput: {
          altText: draft.altText.trim(),
          kind: draft.kind,
        },
      });
      setSelectedFile(null);
      setFileInputKey((current) => current + 1);
      setDraft((current) => ({ ...current, altText: '' }));
      setError('');
    } catch (mutationError) {
      setError(adminCatalogInventoryErrorMessage(mutationError, 'بارگذاری رسانه انجام نشد.'));
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
        فایل تصویر ابتدا با لینک امن در فضای ذخیره‌سازی بارگذاری و سپس با کنترل نوع، اندازه و ابعاد
        ثبت می‌شود.
      </p>
      {error ? (
        <p className="mt-3 text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {canWrite ? (
        <>
          <form className="mt-4 grid gap-2" onSubmit={uploadSelectedMedia}>
            <UiInput
              key={fileInputKey}
              accept="image/avif,image/gif,image/jpeg,image/png,image/webp"
              aria-label="فایل تصویر"
              className="min-h-11 border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              onChange={chooseFile}
              type="file"
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
              <Button loading={uploadMedia.isPending} type="submit">
                <Icon name="package" size={15} /> بارگذاری فایل
              </Button>
            </div>
          </form>
          <div className="my-4 flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            یا افزودن نشانی موجود
            <span className="h-px flex-1 bg-border" />
          </div>
          <form className="grid gap-2" onSubmit={addMedia}>
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
        </>
      ) : null}
      <div className="mt-5 divide-y divide-border">
        {(query.data ?? []).length === 0 ? (
          <p className="py-3 text-xs text-muted-foreground">رسانه‌ای ثبت نشده است.</p>
        ) : (
          (query.data ?? []).map((media) => (
            <MediaItem
              canDelete={canDeleteAdminProductMedia(productStatus, media, query.data ?? [])}
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
