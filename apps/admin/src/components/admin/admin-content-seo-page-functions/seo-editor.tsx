import { useEffect, useState, type FormEvent } from 'react';
import { type AdminSeoMetadata } from '@nova/api-client';
import { Button, Checkbox } from '@nova/ui';

import {
  useCreateAdminSeoMetadata,
  useDeleteAdminSeoMetadata,
  useUpdateAdminSeoMetadata,
} from '../../../lib/content/content-api';

import type { SeoDraft } from '../../../pages/admin/admin-content-seo-page-shared';

import { ErrorMessage } from './error-message';

import { Input } from './input';

import { Panel } from './panel';

import { Textarea } from './textarea';

import { isAdminContentSeoEditorInputDisabled } from './is-admin-content-seo-editor-input-disabled';

import { validateSeoDraft } from './validate-seo-draft';

export function SeoEditor({
  item,
  canEdit,
  onSaved,
}: {
  item: AdminSeoMetadata | null;
  canEdit: boolean;
  onSaved: (item: AdminSeoMetadata) => void;
}) {
  const createMutation = useCreateAdminSeoMetadata();
  const updateMutation = useUpdateAdminSeoMetadata();
  const deleteMutation = useDeleteAdminSeoMetadata();
  const [draft, setDraft] = useState<SeoDraft>({
    path: '/',
    title: '',
    description: '',
    canonicalUrl: '',
    noIndex: false,
    structuredDataJson: '',
  });
  const [dirty, setDirty] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [saved, setSaved] = useState(false);
  const isNew = !item;
  useEffect(() => {
    if (item && !dirty) {
      setDraft({
        path: item.path,
        title: item.title,
        description: item.description,
        canonicalUrl: item.canonicalUrl ?? '',
        noIndex: item.noIndex,
        structuredDataJson: item.structuredData ? JSON.stringify(item.structuredData, null, 2) : '',
      });
      setValidationError('');
    }
  }, [item, dirty]);
  const update = (next: Partial<SeoDraft>) => {
    setDraft((current) => ({ ...current, ...next }));
    setDirty(true);
    setSaved(false);
    setValidationError('');
  };
  const busy = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!canEdit) return;
    const result = validateSeoDraft(draft);
    if (result.error || !result.input || !result.update) {
      setValidationError(result.error ?? 'فرم معتبر نیست.');
      return;
    }
    setValidationError('');
    if (isNew)
      createMutation.mutate(result.input, {
        onSuccess: (next) => {
          setDirty(false);
          setSaved(true);
          onSaved(next);
        },
        onError: () => undefined,
      });
    else
      updateMutation.mutate(
        { metadataId: item.id, input: { ...result.update, expectedUpdatedAt: item.updatedAt } },
        {
          onSuccess: (next) => {
            setDirty(false);
            setSaved(true);
            onSaved(next);
          },
          onError: () => undefined,
        },
      );
  };
  const remove = () => {
    if (!item || typeof window === 'undefined' || !window.confirm('این متادیتا حذف شود؟')) return;
    deleteMutation.mutate(item.id, {
      onSuccess: () => {
        setDirty(false);
        setSaved(false);
        onSaved(item);
      },
      onError: () => undefined,
    });
  };
  return (
    <Panel
      title={isNew ? 'SEO جدید' : 'ویرایش SEO'}
      eyebrow={isNew ? 'SEO / CREATE' : 'SEO / DETAIL'}
    >
      <form className="space-y-4" onSubmit={submit}>
        <Input
          label="مسیر صفحه"
          value={draft.path}
          onChange={(value) => update({ path: value })}
          dir="ltr"
          disabled={!isNew || busy || !canEdit}
          placeholder="/shipping"
        />
        <Input
          label="عنوان SEO"
          value={draft.title}
          onChange={(value) => update({ title: value })}
          disabled={busy || !canEdit}
        />
        <Textarea
          label="توضیح SEO"
          value={draft.description}
          onChange={(value) => update({ description: value })}
          disabled={isAdminContentSeoEditorInputDisabled(canEdit, busy)}
          rows={4}
        />
        <Input
          label="canonical اختیاری"
          value={draft.canonicalUrl}
          onChange={(value) => update({ canonicalUrl: value })}
          dir="ltr"
          disabled={busy || !canEdit}
          placeholder="/shipping یا https://example.com/shipping"
        />
        <Textarea
          label="داده ساختاریافته JSON-LD"
          value={draft.structuredDataJson}
          onChange={(value) => update({ structuredDataJson: value })}
          dir="ltr"
          disabled={isAdminContentSeoEditorInputDisabled(canEdit, busy)}
          hint="JSON محدود و بدون HTML؛ برای داده ساختاریافته استفاده می‌شود."
          rows={6}
        />
        <label className="flex min-h-11 cursor-pointer items-center justify-end gap-3 rounded-control border border-border bg-background px-3 text-xs">
          <Checkbox
            checked={draft.noIndex}
            onChange={(event) => update({ noIndex: event.target.checked })}
            disabled={busy || !canEdit}
            className="h-5 w-5 accent-primary"
          />
          <span>این مسیر noindex باشد</span>
        </label>
        {validationError ? (
          <div
            className="rounded-control border border-destructive/30 bg-error-soft px-3 py-2 text-xs leading-7 text-destructive"
            role="alert"
          >
            {validationError}
          </div>
        ) : null}
        {createMutation.error ? <ErrorMessage error={createMutation.error} /> : null}
        {updateMutation.error ? <ErrorMessage error={updateMutation.error} /> : null}
        {deleteMutation.error ? <ErrorMessage error={deleteMutation.error} /> : null}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <span className="text-xs text-muted-foreground" role="status">
            {busy
              ? 'در حال ذخیره…'
              : saved
                ? 'ذخیره شد'
                : dirty
                  ? 'تغییرات ذخیره‌نشده'
                  : 'همگام با سرور'}
          </span>
          <div className="flex gap-2">
            <Button type="submit" loading={busy} disabled={!canEdit || !dirty}>
              {isNew ? 'ذخیره SEO' : 'ذخیره تغییرات'}
            </Button>
            {item ? (
              <Button
                type="button"
                variant="destructive"
                disabled={!canEdit || busy}
                onClick={remove}
              >
                حذف
              </Button>
            ) : null}
          </div>
        </div>
      </form>
    </Panel>
  );
}
