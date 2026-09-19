import { type FormEvent } from 'react';
import { type AdminCatalogCategory } from '@nova/api-client';
import { Button, Input as UiInput, Select as UiSelect } from '@nova/ui';

import { Icon } from '../../ui/icon';

import { StatusBadge } from './status-badge';

import { formatDate } from './format-date';

import { formatNumber } from './format-number';

export function CategoryRow({
  category,
  categories,
  canWrite,
  editingId,
  draft,
  onEdit,
  onDraftChange,
  onSave,
  onCancel,
  onToggle,
  saving,
}: {
  category: AdminCatalogCategory;
  categories: AdminCatalogCategory[];
  canWrite: boolean;
  editingId: string | null;
  draft: { slug: string; name: string; description: string; parentId: string };
  onEdit: (category: AdminCatalogCategory) => void;
  onDraftChange: (draft: {
    slug: string;
    name: string;
    description: string;
    parentId: string;
  }) => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  onToggle: (category: AdminCatalogCategory) => void;
  saving: boolean;
}) {
  const parent = categories.find((candidate) => candidate.id === category.parentId);
  if (editingId === category.id)
    return (
      <form
        className="grid gap-3 bg-background p-4 md:grid-cols-[minmax(0,1fr)_minmax(150px,.7fr)_auto]"
        onSubmit={onSave}
      >
        <label className="text-xs text-muted-foreground">
          نام دسته
          <UiInput
            className="mt-2 min-h-11 w-full border border-border bg-surface px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            onChange={(event) => onDraftChange({ ...draft, name: event.target.value })}
            value={draft.name}
          />
        </label>
        <label className="text-xs text-muted-foreground">
          والد
          <UiSelect
            className="mt-2 min-h-11 w-full border border-border bg-surface px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            onChange={(event) => onDraftChange({ ...draft, parentId: event.target.value })}
            value={draft.parentId}
          >
            <option value="">بدون والد</option>
            {categories
              .filter((candidate) => candidate.id !== category.id && !candidate.archivedAt)
              .map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name}
                </option>
              ))}
          </UiSelect>
        </label>
        <div className="flex items-end gap-2">
          <Button loading={saving} type="submit">
            ذخیره
          </Button>
          <Button disabled={saving} onClick={onCancel} type="button" variant="outline">
            لغو
          </Button>
        </div>
      </form>
    );
  return (
    <div className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{category.name}</span>
          <StatusBadge status={category.archivedAt ? 'ARCHIVED' : 'ACTIVE'} />
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
          <span dir="ltr">{category.slug}</span>
          <span>{parent ? `والد: ${parent.name}` : 'ریشه'}</span>
          <span>
            {formatNumber(category.productCount)} محصول · {formatNumber(category.childCount)}{' '}
            زیرمجموعه
          </span>
          <span>آخرین تغییر: {formatDate(category.updatedAt)}</span>
        </div>
      </div>
      {canWrite ? (
        <div className="flex items-center gap-2">
          <Button
            aria-label={`ویرایش ${category.name}`}
            onClick={() => onEdit(category)}
            size="icon"
            variant="outline"
          >
            <Icon name="edit" size={16} />
          </Button>
          <Button
            disabled={saving}
            onClick={() => void onToggle(category)}
            size="sm"
            variant="ghost"
          >
            {category.archivedAt ? 'فعال‌سازی' : 'آرشیو'}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
