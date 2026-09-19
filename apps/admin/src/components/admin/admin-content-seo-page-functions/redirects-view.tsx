import { useMemo, useState } from 'react';
import { type AdminRedirect } from '@nova/api-client';
import { Button } from '@nova/ui';

import { useAdminRedirects } from '../../../lib/content/content-api';
import { Icon } from '../../ui/icon';

import { REDIRECT_LIMIT } from '../../../pages/admin/admin-content-seo-page-shared';

import { RedirectEditor } from './redirect-editor';

import { RedirectList } from './redirect-list';

import { SearchBar } from './search-bar';

import { StatePanel } from './state-panel';

import { adminContentSeoErrorMessage } from './admin-content-seo-error-message';

import { isOfflineError } from './is-offline-error';

export function RedirectsView({ canEdit }: { canEdit: boolean }) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const queryInput = useMemo(
    () => ({ page: 1, limit: REDIRECT_LIMIT, ...(search.trim() ? { q: search.trim() } : {}) }),
    [search],
  );
  const query = useAdminRedirects(queryInput, canEdit);
  const items = query.data?.items ?? [];
  const selected = creating
    ? null
    : (items.find((item) => item.id === selectedId) ?? items[0] ?? null);
  const save = (item: AdminRedirect) => {
    setCreating(false);
    setSelectedId(item.id);
    void query.refetch();
  };
  if (query.isPending)
    return (
      <StatePanel
        kind="loading"
        title="در حال بارگیری redirectها"
        description="قواعد انتقال در حال دریافت هستند."
      />
    );
  if (query.error)
    return (
      <StatePanel
        kind={isOfflineError(query.error) ? 'offline' : 'error'}
        title="بارگیری redirectها انجام نشد"
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
        <SearchBar value={search} onChange={setSearch} placeholder="جست‌وجو در مسیرهای داخلی…" />
      </div>
      {!items.length && !creating ? (
        <StatePanel
          kind="empty"
          title="redirectی ثبت نشده است"
          description="انتقال‌های قدیمی به مسیرهای جدید را به‌صورت داخلی و قابل بررسی ثبت کنید."
          action={
            canEdit ? (
              <Button onClick={() => setCreating(true)}>
                <Icon name="plus" size={17} />
                redirect جدید
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)]">
          <RedirectList
            items={items}
            selectedId={selected?.id ?? null}
            onSelect={(id) => {
              setCreating(false);
              setSelectedId(id);
            }}
            onCreate={() => setCreating(true)}
            canEdit={canEdit}
          />
          <RedirectEditor
            key={creating ? 'new' : (selected?.id ?? 'empty')}
            item={selected}
            redirects={items}
            canEdit={canEdit}
            onSaved={save}
          />
        </div>
      )}
    </div>
  );
}
