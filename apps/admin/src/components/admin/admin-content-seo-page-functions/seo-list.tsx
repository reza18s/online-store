import { type AdminSeoMetadata } from '@nova/api-client';
import { Button } from '@nova/ui';

import { Icon } from '../../ui/icon';

import { Panel } from './panel';

import { formatDate } from './format-date';

export function SeoList({
  items,
  selectedId,
  onSelect,
  onCreate,
  canEdit,
}: {
  items: AdminSeoMetadata[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  canEdit: boolean;
}) {
  return (
    <Panel title="متادیتای SEO" eyebrow="SEO / METADATA">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          {items.length.toLocaleString('fa-IR')} مسیر
        </span>
        {canEdit ? (
          <Button size="sm" onClick={onCreate}>
            <Icon name="plus" size={17} />
            رکورد جدید
          </Button>
        ) : null}
      </div>
      {items.length ? (
        <div className="divide-y divide-border overflow-hidden rounded-control border border-border">
          {items.map((item) => (
            <Button
              type="button"
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`flex min-h-16 w-full items-center justify-between gap-3 px-3 text-right transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${selectedId === item.id ? 'bg-accent-soft' : 'bg-background'}`}
            >
              <span className="min-w-0">
                <strong className="block truncate text-sm">{item.title}</strong>
                <span
                  dir="ltr"
                  className="mt-1 block truncate text-left text-[11px] text-muted-foreground"
                >
                  {item.path}
                </span>
              </span>
              <span dir="ltr" className="shrink-0 text-[10px] text-muted-foreground">
                {formatDate(item.updatedAt)}
              </span>
            </Button>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-xs text-muted-foreground">
          برای هیچ مسیری متادیتا ثبت نشده است.
        </div>
      )}
    </Panel>
  );
}
