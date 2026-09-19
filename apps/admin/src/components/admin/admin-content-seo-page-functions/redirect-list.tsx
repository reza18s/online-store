import { type AdminRedirect } from '@nova/api-client';
import { Button } from '@nova/ui';

import { Icon } from '../../ui/icon';

import { Panel } from './panel';

export function RedirectList({
  items,
  selectedId,
  onSelect,
  onCreate,
  canEdit,
}: {
  items: AdminRedirect[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  canEdit: boolean;
}) {
  return (
    <Panel title="redirectها" eyebrow="SEO / REDIRECTS">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          {items.length.toLocaleString('fa-IR')} مسیر بارگیری‌شده
        </span>
        {canEdit ? (
          <Button size="sm" onClick={onCreate}>
            <Icon name="plus" size={17} />
            redirect جدید
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
                <strong dir="ltr" className="block truncate text-left text-sm">
                  {item.fromPath}
                </strong>
                <span
                  dir="ltr"
                  className="mt-1 block truncate text-left text-[11px] text-muted-foreground"
                >
                  → {item.toPath}
                </span>
              </span>
              <span className="shrink-0 rounded-md border border-info/30 bg-info-soft px-2 py-1 text-[10px] text-info">
                {item.statusCode}
              </span>
            </Button>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-xs text-muted-foreground">
          redirectی ثبت نشده است.
        </div>
      )}
    </Panel>
  );
}
