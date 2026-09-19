import { type AdminCatalogCategory } from '@nova/api-client';
import { Button, Checkbox } from '@nova/ui';

import { Icon } from '../../ui/icon';

export function TaxonomyPanel({
  categories,
  selectedIds,
  canWrite,
  onToggle,
  onSave,
  saving,
}: {
  categories: AdminCatalogCategory[];
  selectedIds: string[];
  canWrite: boolean;
  onToggle: (id: string) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <section className="border border-border bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.14em] text-primary">TAXONOMY</p>
          <h3 className="mt-2 font-semibold">دسته‌بندی محصول</h3>
        </div>
        <Icon name="layers" size={19} />
      </div>
      {categories.length === 0 ? (
        <p className="mt-4 text-xs text-muted-foreground">دسته‌بندی‌ای از سرویس دریافت نشد.</p>
      ) : (
        <div className="mt-4 grid gap-2">
          {categories
            .filter((category) => !category.archivedAt)
            .map((category) => (
              <label
                className="flex min-h-11 items-center gap-3 border border-border bg-background px-3 text-xs"
                key={category.id}
              >
                <Checkbox
                  checked={selectedIds.includes(category.id)}
                  disabled={!canWrite}
                  onChange={() => onToggle(category.id)}
                />
                {category.name}
                <span className="ms-auto text-[10px] text-muted-foreground" dir="ltr">
                  {category.slug}
                </span>
              </label>
            ))}
        </div>
      )}
      {canWrite ? (
        <Button className="mt-4" loading={saving} onClick={onSave} type="button">
          ذخیره دسته‌بندی
        </Button>
      ) : null}
    </section>
  );
}
