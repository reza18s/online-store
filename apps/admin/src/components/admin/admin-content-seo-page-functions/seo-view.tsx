import { useMemo, useState } from 'react';
import { type AdminSeoMetadata } from '@nova/api-client';
import { Button } from '@nova/ui';

import { useAdminSeoMetadata } from '../../../lib/content/content-api';
import { Icon } from '../../ui/icon';

import { SEO_LIMIT } from '../../../pages/admin/admin-content-seo-page-shared';

import { SearchBar } from './search-bar';

import { SeoEditor } from './seo-editor';

import { SeoList } from './seo-list';

import { StatePanel } from './state-panel';

import { adminContentSeoErrorMessage } from './admin-content-seo-error-message';

import { isOfflineError } from './is-offline-error';

export function SeoView({ canEdit }: { canEdit: boolean }) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const queryInput = useMemo(
    () => ({ page: 1, limit: SEO_LIMIT, ...(search.trim() ? { q: search.trim() } : {}) }),
    [search],
  );
  const query = useAdminSeoMetadata(queryInput, canEdit);
  const items = query.data?.items ?? [];
  const selected = creating
    ? null
    : (items.find((item) => item.id === selectedId) ?? items[0] ?? null);
  const save = (item: AdminSeoMetadata) => {
    setCreating(false);
    setSelectedId(item.id);
    void query.refetch();
  };
  if (query.isPending)
    return (
      <StatePanel
        kind="loading"
        title="در حال بارگیری متادیتا"
        description="رکوردهای SEO در حال دریافت هستند."
      />
    );
  if (query.error)
    return (
      <StatePanel
        kind={isOfflineError(query.error) ? 'offline' : 'error'}
        title="بارگیری SEO انجام نشد"
        description={adminContentSeoErrorMessage(query.error)}
        action={
          <Button variant="outline" onClick={() => void query.refetch()}>
            <Icon name="refresh" size={17} />
            تلاش دوباره
          </Button>
        }
      />
    );
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-editorial border border-border bg-surface p-3 md:flex-row">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="جست‌وجو بر اساس مسیر یا عنوان…"
        />
      </div>
      {!items.length && !creating ? (
        <StatePanel
          kind="empty"
          title="متادیتای SEO خالی است"
          description="برای کنترل عنوان، توضیح و canonical مسیرهای مهم، اولین رکورد را ایجاد کنید."
          action={
            canEdit ? (
              <Button onClick={() => setCreating(true)}>
                <Icon name="plus" size={17} />
                رکورد جدید
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)]">
          <SeoList
            items={items}
            selectedId={selected?.id ?? null}
            onSelect={(id) => {
              setCreating(false);
              setSelectedId(id);
            }}
            onCreate={() => setCreating(true)}
            canEdit={canEdit}
          />
          <SeoEditor
            key={creating ? 'new' : (selected?.id ?? 'empty')}
            item={selected}
            canEdit={canEdit}
            onSaved={save}
          />
        </div>
      )}
    </div>
  );
}
