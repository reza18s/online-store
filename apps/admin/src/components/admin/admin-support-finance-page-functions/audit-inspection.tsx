import { useState, type FormEvent } from 'react';
import { type AdminAuditListQuery, type AdminAuditPage } from '@nova/api-client';

import { useAdminAuditEvents } from '../../../lib/admin/admin-audit-api';

import type { QueryResult } from '../../../pages/admin/admin-support-finance-page-shared';
import { ACTOR_TYPES } from '../../../pages/admin/admin-support-finance-page-shared';

import { FilterBar } from './filter-bar';

import { InspectionPanel } from './inspection-panel';

import { Pagination } from './pagination';

import { QueryState } from './query-state';

import { SelectFilter } from './select-filter';

import { StatusBadge } from './status-badge';

import { TextFilter } from './text-filter';

import { formatDate } from './format-date';

import { ltr } from './ltr';

import { safeAuditMetadataLabel } from './safe-audit-metadata-label';

export function AuditInspection() {
  const [draftAction, setDraftAction] = useState('');
  const [draftResourceType, setDraftResourceType] = useState('');
  const [draftResourceId, setDraftResourceId] = useState('');
  const [draftActorType, setDraftActorType] = useState('');
  const [filters, setFilters] = useState<AdminAuditListQuery>({ page: 1, limit: 12 });
  const query = useAdminAuditEvents(filters);
  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters({
      page: 1,
      limit: 12,
      action: draftAction || undefined,
      resourceType: draftResourceType || undefined,
      resourceId: draftResourceId || undefined,
      actorType: (draftActorType || undefined) as AdminAuditListQuery['actorType'],
    });
  };

  return (
    <InspectionPanel title="گزارش رویدادها" icon="eye">
      <FilterBar onSubmit={applyFilters}>
        <TextFilter
          id="audit-action"
          label="عملیات"
          value={draftAction}
          onChange={setDraftAction}
          placeholder="مثلاً order.cancelled"
          dir="ltr"
        />
        <TextFilter
          id="audit-resource"
          label="نوع منبع"
          value={draftResourceType}
          onChange={setDraftResourceType}
          placeholder="Order"
          dir="ltr"
        />
        <TextFilter
          id="audit-resource-id"
          label="شناسه منبع"
          value={draftResourceId}
          onChange={setDraftResourceId}
          placeholder="شناسه"
          dir="ltr"
        />
        <SelectFilter
          id="audit-actor"
          label="ثبت‌کننده"
          value={draftActorType}
          onChange={setDraftActorType}
          options={ACTOR_TYPES}
        />
      </FilterBar>
      <div className="p-3 md:p-5">
        <QueryState
          query={query as QueryResult<AdminAuditPage>}
          emptyTitle="رویدادی پیدا نشد"
          emptyDescription="فیلترهای گزارش را تغییر دهید یا دوباره تلاش کنید."
        >
          {(data) => (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-[850px] w-full border-collapse text-right text-xs">
                  <caption className="sr-only">فهرست رویدادهای حسابرسی</caption>
                  <thead>
                    <tr className="border-b border-border text-[10px] text-muted-foreground">
                      <th className="px-3 py-3 font-normal">عملیات</th>
                      <th className="px-3 py-3 font-normal">منبع</th>
                      <th className="px-3 py-3 font-normal">ثبت‌کننده</th>
                      <th className="px-3 py-3 font-normal">جزئیات</th>
                      <th className="px-3 py-3 font-normal">زمان</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((event) => (
                      <tr className="border-b border-border last:border-b-0" key={event.id}>
                        <td className="px-3 py-3">{ltr(event.action)}</td>
                        <td className="px-3 py-3">
                          <span>{event.resourceType}</span>
                          {event.resourceId ? (
                            <span className="mr-2 text-muted-foreground">
                              {ltr(event.resourceId)}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-3 py-3">
                          <StatusBadge status={event.actorType} />
                        </td>
                        <td className="max-w-[230px] px-3 py-3 text-muted-foreground">
                          {safeAuditMetadataLabel(event.metadata)}
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">
                          {ltr(formatDate(event.createdAt))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4">
                <Pagination
                  page={data.page}
                  total={data.total}
                  limit={data.limit}
                  onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
                />
              </div>
            </>
          )}
        </QueryState>
      </div>
    </InspectionPanel>
  );
}
