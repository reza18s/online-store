import { useEffect, useState, type FormEvent } from 'react';
import { type AdminRedirect, type SeoRedirectStatusCode } from '@nova/api-client';
import { Button } from '@nova/ui';

import {
  useCreateAdminRedirect,
  useDeleteAdminRedirect,
  useUpdateAdminRedirect,
} from '../../../lib/content/content-api';

import type { RedirectDraft } from '../../../pages/admin/admin-content-seo-page-shared';

import { DraftNotice } from './draft-notice';

import { ErrorMessage } from './error-message';

import { Input } from './input';

import { Panel } from './panel';

import { Select } from './select';

import { isAdminContentSeoEditorInputDisabled } from './is-admin-content-seo-editor-input-disabled';

import { validateRedirectDraft } from './validate-redirect-draft';

export function RedirectEditor({
  item,
  redirects,
  canEdit,
  onSaved,
}: {
  item: AdminRedirect | null;
  redirects: AdminRedirect[];
  canEdit: boolean;
  onSaved: (item: AdminRedirect) => void;
}) {
  const createMutation = useCreateAdminRedirect();
  const updateMutation = useUpdateAdminRedirect();
  const deleteMutation = useDeleteAdminRedirect();
  const [draft, setDraft] = useState<RedirectDraft>({
    fromPath: '/',
    toPath: '/',
    statusCode: 301,
  });
  const [dirty, setDirty] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [saved, setSaved] = useState(false);
  const isNew = !item;
  useEffect(() => {
    if (item && !dirty) {
      setDraft({ fromPath: item.fromPath, toPath: item.toPath, statusCode: item.statusCode });
      setValidationError('');
    }
  }, [item, dirty]);
  const update = (next: Partial<RedirectDraft>) => {
    setDraft((current) => ({ ...current, ...next }));
    setDirty(true);
    setSaved(false);
    setValidationError('');
  };
  const busy = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!canEdit) return;
    const result = validateRedirectDraft(draft, redirects, item?.id);
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
        { redirectId: item.id, input: result.update },
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
    if (!item || typeof window === 'undefined' || !window.confirm('این redirect حذف شود؟')) return;
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
      title={isNew ? 'redirect جدید' : 'ویرایش redirect'}
      eyebrow={isNew ? 'REDIRECT / CREATE' : 'REDIRECT / DETAIL'}
    >
      <form className="space-y-4" onSubmit={submit}>
        <Input
          label="مسیر قدیمی"
          value={draft.fromPath}
          onChange={(value) => update({ fromPath: value })}
          dir="ltr"
          disabled={!isNew || busy || !canEdit}
          placeholder="/old-path"
        />
        <Input
          label="مسیر مقصد"
          value={draft.toPath}
          onChange={(value) => update({ toPath: value })}
          dir="ltr"
          disabled={busy || !canEdit}
          placeholder="/new-path"
        />
        <Select
          label="کد وضعیت"
          value={String(draft.statusCode)}
          onChange={(value) => update({ statusCode: Number(value) as SeoRedirectStatusCode })}
          disabled={isAdminContentSeoEditorInputDisabled(canEdit, busy)}
        >
          <option value="301">301 — انتقال دائمی</option>
          <option value="302">302 — انتقال موقت</option>
          <option value="307">307 — موقت با حفظ روش</option>
          <option value="308">308 — دائمی با حفظ روش</option>
        </Select>
        <DraftNotice text="مبدأ و مقصد فقط می‌توانند مسیر داخلی سایت باشند؛ مقصدهای خارجی و چرخه‌های redirect رد می‌شوند." />
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
              {isNew ? 'ذخیره redirect' : 'ذخیره تغییرات'}
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
