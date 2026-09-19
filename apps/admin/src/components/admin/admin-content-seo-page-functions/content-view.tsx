import { useEffect, useMemo, useState } from 'react';
import { type AdminContentPage, type AdminContentStatus } from '@nova/api-client';
import { Button } from '@nova/ui';

import { useAdminContentPage, useAdminContentPages } from '../../../lib/content/content-api';
import { Icon } from '../../ui/icon';

import { CONTENT_LIMIT } from '../../../pages/admin/admin-content-seo-page-shared';

import { ContentEditor } from './content-editor';

import { ContentList } from './content-list';

import { SearchBar } from './search-bar';

import { Select } from './select';

import { StatePanel } from './state-panel';

import { adminContentSeoErrorMessage } from './admin-content-seo-error-message';

import { isOfflineError } from './is-offline-error';

export function ContentView({ canEdit, pageId }: { canEdit: boolean; pageId?: string }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<AdminContentStatus | ''>('');
  const [selectedId, setSelectedId] = useState(pageId ?? '');
  const queryInput = useMemo(
    () => ({
      page: 1,
      limit: CONTENT_LIMIT,
      ...(search.trim() ? { q: search.trim() } : {}),
      ...(status ? { status } : {}),
    }),
    [search, status],
  );
  const listQuery = useAdminContentPages(queryInput, canEdit);
  const detailQuery = useAdminContentPage(selectedId, canEdit && Boolean(selectedId));
  const [editorKey, setEditorKey] = useState(0);
  useEffect(() => {
    setSelectedId(pageId ?? '');
    setEditorKey((key) => key + 1);
  }, [pageId]);
  const select = (id: string) => {
    setSelectedId(id);
    setEditorKey((key) => key + 1);
  };
  const create = () => {
    setSelectedId('');
    setEditorKey((key) => key + 1);
  };
  const onSaved = (page: AdminContentPage) => {
    setSelectedId(page.id);
  };
  const onCreated = (page: AdminContentPage) => {
    setSelectedId(page.id);
    setEditorKey((key) => key + 1);
  };
  if (listQuery.isPending)
    return (
      <StatePanel
        kind="loading"
        title="در حال بارگیری صفحه‌ها"
        description="فهرست محتوای مدیریت در حال دریافت است."
      />
    );
  if (listQuery.error)
    return (
      <StatePanel
        kind={isOfflineError(listQuery.error) ? 'offline' : 'error'}
        title={isOfflineError(listQuery.error) ? 'اتصال برقرار نیست' : 'بارگیری صفحه‌ها انجام نشد'}
        description={adminContentSeoErrorMessage(listQuery.error)}
        action={
          <Button variant="outline" onClick={() => void listQuery.refetch()}>
            <Icon name="refresh" size={17} />
            تلاش دوباره
          </Button>
        }
      />
    );
  if (selectedId && detailQuery.error)
    return (
      <StatePanel
        kind={isOfflineError(detailQuery.error) ? 'offline' : 'error'}
        title={isOfflineError(detailQuery.error) ? 'اتصال برقرار نیست' : 'جزئیات صفحه بارگیری نشد'}
        description={adminContentSeoErrorMessage(detailQuery.error)}
        action={
          <Button variant="outline" onClick={() => void detailQuery.refetch()}>
            <Icon name="refresh" size={17} />
            تلاش دوباره
          </Button>
        }
      />
    );
  const items = listQuery.data?.items ?? [];
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-editorial border border-border bg-surface p-3 md:flex-row">
        <SearchBar value={search} onChange={setSearch} placeholder="جست‌وجو در عنوان و اسلاگ…" />
        <Select
          label="وضعیت"
          value={status}
          onChange={(value) => setStatus(value as AdminContentStatus | '')}
        >
          <option value="">همه وضعیت‌ها</option>
          <option value="DRAFT">پیش‌نویس</option>
          <option value="PUBLISHED">منتشر شده</option>
          <option value="ARCHIVED">بایگانی شده</option>
        </Select>
      </div>
      {!items.length && !selectedId ? (
        <StatePanel
          kind="empty"
          title="هنوز صفحه‌ای ندارید"
          description="یک صفحه را به‌عنوان پیش‌نویس بسازید و بعد از بررسی منتشر کنید."
          action={
            canEdit ? (
              <Button onClick={create}>
                <Icon name="plus" size={17} />
                صفحه جدید
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)]">
          <ContentList
            items={items}
            selectedId={selectedId}
            onSelect={select}
            onCreate={create}
            canEdit={canEdit}
          />
          <ContentEditor
            key={editorKey}
            page={detailQuery.data ?? null}
            pageId={selectedId}
            canEdit={canEdit}
            onCreated={onCreated}
            onSaved={onSaved}
          />
        </div>
      )}
    </div>
  );
}
