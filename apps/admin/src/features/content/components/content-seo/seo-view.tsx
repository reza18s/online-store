import { useMemo, useState } from 'react';
import { type AdminSeoMetadata } from '@nova/api-client';
import { Button } from '@nova/ui';

import { useAdminSeoMetadata } from '@/features/content/api/content/content-api';
import { Icon } from '@/shared/ui/icon';

import { SEO_LIMIT } from '@/features/content/pages/admin-content-seo-page-shared';

import { SearchBar } from '@/features/content/components/content-seo/search-bar';

import { SeoEditor } from '@/features/content/components/content-seo/seo-editor';

import { StatePanel } from '@/features/content/components/content-seo/state-panel';

import { adminContentSeoErrorMessage } from '@/features/content/components/content-seo/admin-content-seo-error-message';

import { isOfflineError } from '@/features/content/components/content-seo/is-offline-error';

import { formatDate } from '@/features/content/components/content-seo/format-date';

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
  const selected = creating ? null : (items.find((item) => item.id === selectedId) ?? null);
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
    <div className="admin-reference-seo">
      <div className="admin-reference-seo__toolbar">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="جست‌وجوی صفحات..."
        />
        <div className="admin-reference-seo__filters" aria-label="فیلترهای سریع">
          <button className="is-active" type="button">همه</button>
          <button type="button">برگه‌ها</button>
          <button type="button">محصولات</button>
          <button type="button">دسته‌ها</button>
        </div>
        {canEdit ? (
          <Button className="admin-reference-seo__add" onClick={() => setCreating(true)}>
            <Icon name="plus" size={17} />
            افزودن دستی
          </Button>
        ) : null}
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
        <>
          {items.length ? (
            <section className="admin-reference-seo-table" aria-label="فهرست متادیتای SEO">
              <div className="admin-reference-seo-table__head" aria-hidden="true">
                <span>صفحه</span>
                <span>عنوان SEO</span>
                <span>توضیحات متا</span>
                <span>Canonical</span>
                <span>وضعیت</span>
                <span>آخرین بروزرسانی</span>
                <span />
              </div>

              <div className="admin-reference-seo-table__rows">
                {items.map((item) => (
                  <button
                    className={`admin-reference-seo-row ${selectedId === item.id ? 'is-selected' : ''}`}
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setCreating(false);
                      setSelectedId(item.id);
                    }}
                  >
                    <span className="admin-reference-seo-row__page">
                      <span className="admin-reference-seo-row__thumb">
                        <Icon name="book" size={18} />
                      </span>
                      <span>
                        <strong>{item.path === '/' ? 'صفحه اصلی' : item.path}</strong>
                        <small dir="ltr">{item.path}</small>
                      </span>
                    </span>
                    <span>{item.title}</span>
                    <span>{item.description}</span>
                    <span dir="ltr">{item.canonicalUrl ?? '—'}</span>
                    <span>
                      <em className={item.noIndex ? 'is-warning' : 'is-good'}>
                        {item.noIndex ? 'نیاز به بررسی' : 'بهینه'}
                      </em>
                    </span>
                    <span dir="ltr">{formatDate(item.updatedAt)}</span>
                    <span className="admin-reference-more"><Icon name="more-vertical" size={17} /></span>
                  </button>
                ))}
              </div>

              <div className="admin-reference-seo-mobile">
                {items.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => {
                      setCreating(false);
                      setSelectedId(item.id);
                    }}
                  >
                    <span className="admin-reference-seo-row__thumb"><Icon name="book" size={17} /></span>
                    <span>
                      <strong>{item.path === '/' ? 'صفحه اصلی' : item.path}</strong>
                      <small>{item.title}</small>
                      <em className={item.noIndex ? 'is-warning' : 'is-good'}>
                        {item.noIndex ? 'نیاز به بررسی' : 'بهینه'}
                      </em>
                    </span>
                    <Icon name="more-vertical" size={17} />
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {creating || selected ? (
            <div className="admin-reference-seo-editor">
              <SeoEditor
                key={creating ? 'new' : (selected?.id ?? 'empty')}
                item={selected}
                canEdit={canEdit}
                onSaved={save}
              />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
