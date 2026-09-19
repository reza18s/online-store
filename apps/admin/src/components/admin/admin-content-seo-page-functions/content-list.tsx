import { type AdminContentPageListItem } from '@nova/api-client';
import { Button } from '@nova/ui';

import { Icon } from '../../ui/icon';

import { Panel } from './panel';

import { StatusChip } from './status-chip';

import { formatDate } from './format-date';

import { safeContentHref } from './safe-content-href';

export function ContentList({
  items,
  selectedId,
  onSelect,
  onCreate,
  canEdit,
}: {
  items: AdminContentPageListItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
  canEdit: boolean;
}) {
  return (
    <Panel title="صفحه‌های محتوا" eyebrow="CONTENT / PAGES">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          {items.length.toLocaleString('fa-IR')} نتیجه در این صفحه
        </span>
        {canEdit ? (
          <Button size="sm" onClick={onCreate}>
            <Icon name="plus" size={17} />
            صفحه جدید
          </Button>
        ) : null}
      </div>
      {items.length ? (
        <div className="divide-y divide-border overflow-hidden rounded-control border border-border">
          {items.map((item) => (
            <div className="relative" key={item.id}>
              <Button
                type="button"
                onClick={() => onSelect(item.id)}
                className={`flex min-h-16 w-full items-center justify-between gap-3 px-3 text-right transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${selectedId === item.id ? 'bg-accent-soft' : 'bg-background'}`}
              >
                <span className="min-w-0">
                  <strong className="block truncate text-sm">{item.title}</strong>
                  <span
                    dir="ltr"
                    className="mt-1 block truncate text-left text-[11px] text-muted-foreground"
                  >
                    /{item.slug}
                  </span>
                </span>
                <span className="shrink-0 text-left">
                  <StatusChip status={item.status} />
                  <span dir="ltr" className="mt-1 block text-[10px] text-muted-foreground">
                    {formatDate(item.updatedAt)}
                  </span>
                </span>
              </Button>
              <a
                href={safeContentHref(item.slug)}
                aria-label={'مشاهده ' + item.title}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-muted-foreground transition-colors hover:bg-surface hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
              >
                <Icon name="eye" size={17} />
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-xs text-muted-foreground">
          هنوز صفحه‌ای ثبت نشده است.
        </div>
      )}
    </Panel>
  );
}
