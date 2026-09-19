import { useEffect, useState, type FormEvent } from 'react';
import { type AdminContentPage } from '@nova/api-client';
import { Button } from '@nova/ui';

import {
  useCreateAdminContentPage,
  useUpdateAdminContentPage,
  useUpdateAdminContentPageStatus,
} from '../../../lib/content/content-api';

import type { ContentDraft } from '../../../pages/admin/admin-content-seo-page-shared';
import { MAX_BLOCKS, MAX_JSON_LENGTH } from '../../../pages/admin/admin-content-seo-page-shared';

import { DraftNotice } from './draft-notice';

import { ErrorMessage } from './error-message';

import { Input } from './input';

import { Panel } from './panel';

import { StatePanel } from './state-panel';

import { StatusChip } from './status-chip';

import { Textarea } from './textarea';

import { formatDate } from './format-date';

import { isAdminContentSeoEditorInputDisabled } from './is-admin-content-seo-editor-input-disabled';

import { isContentPublishActionDisabled } from './is-content-publish-action-disabled';

import { validateContentDraft } from './validate-content-draft';

export function ContentEditor({
  page,
  pageId,
  canEdit,
  onCreated,
  onSaved,
}: {
  page: AdminContentPage | null;
  pageId: string;
  canEdit: boolean;
  onCreated: (page: AdminContentPage) => void;
  onSaved: (page: AdminContentPage) => void;
}) {
  const isNew = !pageId;
  const createMutation = useCreateAdminContentPage();
  const updateMutation = useUpdateAdminContentPage();
  const statusMutation = useUpdateAdminContentPageStatus();
  const [draft, setDraft] = useState<ContentDraft>({
    slug: '',
    title: '',
    body: '',
    blocksJson: '[]',
  });
  const [dirty, setDirty] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!page || dirty) return;
    setDraft({
      slug: page.slug,
      title: page.title,
      body: page.body ?? '',
      blocksJson: JSON.stringify(
        page.blocks.map((block) => ({
          kind: block.kind,
          payload: block.payload,
          sortOrder: block.sortOrder,
        })),
        null,
        2,
      ),
    });
    setValidationError('');
  }, [page, dirty]);

  const update = (next: Partial<ContentDraft>) => {
    setDraft((current) => ({ ...current, ...next }));
    setDirty(true);
    setSaved(false);
    setValidationError('');
  };
  const busy = createMutation.isPending || updateMutation.isPending || statusMutation.isPending;
  const handleSaved = (next: AdminContentPage) => {
    setDirty(false);
    setSaved(true);
    onSaved(next);
  };
  const handleCreated = (next: AdminContentPage) => {
    setDirty(false);
    setSaved(true);
    onCreated(next);
  };
  const queryLoading = Boolean(pageId) && !page;
  const save = (event?: FormEvent, publish = false) => {
    event?.preventDefault();
    if (!canEdit) return;
    const result = validateContentDraft(draft, { requireUsableContent: publish });
    if (result.error || !result.input || !result.update) {
      setValidationError(result.error ?? 'فرم معتبر نیست.');
      return;
    }
    setValidationError('');
    if (isNew) {
      createMutation.mutate(result.input, { onSuccess: handleCreated, onError: () => undefined });
      return;
    }
    if (publish) {
      statusMutation.mutate(
        { pageId, input: { status: 'PUBLISHED', expectedUpdatedAt: page?.updatedAt } },
        { onSuccess: handleSaved, onError: () => undefined },
      );
      return;
    }
    updateMutation.mutate(
      { pageId, input: { ...result.update, expectedUpdatedAt: page?.updatedAt } },
      { onSuccess: handleSaved, onError: () => undefined },
    );
  };
  if (queryLoading)
    return (
      <StatePanel
        kind="loading"
        title="در حال بارگیری صفحه"
        description="جزئیات صفحه از سرویس محتوا دریافت می‌شود."
      />
    );
  return (
    <Panel
      title={isNew ? 'صفحه محتوای جدید' : 'ویرایش صفحه محتوا'}
      eyebrow={isNew ? 'CONTENT / CREATE' : 'CONTENT / DETAIL'}
    >
      <form className="space-y-4" onSubmit={(event) => save(event)}>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="اسلاگ عمومی"
            value={draft.slug}
            onChange={(value) => update({ slug: value })}
            dir="ltr"
            placeholder="shipping-policy"
            disabled={!isNew || busy || !canEdit}
          />
          <Input
            label="عنوان صفحه"
            value={draft.title}
            onChange={(value) => update({ title: value })}
            disabled={busy || !canEdit}
            placeholder="راهنمای ارسال"
          />
        </div>
        <Textarea
          label="متن صفحه"
          value={draft.body}
          onChange={(value) => update({ body: value })}
          disabled={isAdminContentSeoEditorInputDisabled(canEdit, busy)}
          hint="متن به‌صورت امن و بدون HTML ذخیره می‌شود."
          rows={7}
        />
        <Textarea
          label="بلوک‌های typed JSON"
          value={draft.blocksJson}
          onChange={(value) => update({ blocksJson: value })}
          dir="ltr"
          disabled={isAdminContentSeoEditorInputDisabled(canEdit, busy)}
          hint={`حداکثر ${MAX_BLOCKS} بلوک و ${MAX_JSON_LENGTH.toLocaleString('fa-IR')} نویسه؛ HTML پذیرفته نمی‌شود.`}
          rows={8}
        />
        {page ? (
          <div className="grid gap-3 rounded-control border border-border bg-background p-3 text-xs md:grid-cols-3">
            <span>
              وضعیت: <StatusChip status={page.status} />
            </span>
            <span>
              آخرین تغییر: <b dir="ltr">{formatDate(page.updatedAt)}</b>
            </span>
            <span className="text-muted-foreground">اسلاگ پس از ایجاد ثابت می‌ماند.</span>
          </div>
        ) : (
          <DraftNotice text="این صفحه ابتدا به‌عنوان پیش‌نویس ذخیره می‌شود؛ انتشار یک اقدام جداگانه است." />
        )}
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
        {statusMutation.error ? <ErrorMessage error={statusMutation.error} /> : null}
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
          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={busy} disabled={!canEdit || !dirty}>
              {isNew ? 'ذخیره پیش‌نویس' : 'ذخیره تغییرات'}
            </Button>
            {page && page.status === 'DRAFT' ? (
              <Button
                type="button"
                variant="outline"
                disabled={isContentPublishActionDisabled(canEdit, busy, dirty)}
                onClick={() => save(undefined, true)}
              >
                بررسی و انتشار
              </Button>
            ) : null}
          </div>
        </div>
      </form>
    </Panel>
  );
}
