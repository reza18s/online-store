import { useState, type FormEvent } from 'react';
import { type AdminCatalogCategory } from '@nova/api-client';
import { Button, Input as UiInput, Select as UiSelect } from '@nova/ui';
import {
  useAdminCatalogCategories,
  useCreateAdminCatalogCategory,
  useUpdateAdminCatalogCategory,
  useUpdateAdminCatalogCategoryStatus,
} from '../../../lib/admin/admin-catalog-api';

import { Icon } from '../../ui/icon';

import { catalogKeyPattern } from '../../../pages/admin/admin-catalog-inventory-page-shared';

import { CategoryRow } from './category-row';

import { LoadingState } from './loading-state';

import { QueryState } from './query-state';

import { StatePanel } from './state-panel';

import { adminCatalogInventoryErrorMessage } from './admin-catalog-inventory-error-message';

import { formatNumber } from './format-number';

import { hasAdminRole } from './has-admin-role';

export function CategoriesView({ roles }: { roles: readonly string[] }) {
  const canWrite = hasAdminRole(roles, ['admin']);
  const query = useAdminCatalogCategories();
  const createMutation = useCreateAdminCatalogCategory();
  const updateMutation = useUpdateAdminCatalogCategory();
  const statusMutation = useUpdateAdminCatalogCategoryStatus();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ slug: '', name: '', description: '', parentId: '' });
  const [newCategory, setNewCategory] = useState({
    slug: '',
    name: '',
    description: '',
    parentId: '',
  });
  const [error, setError] = useState('');
  const categories = query.data ?? [];

  function startEdit(category: AdminCatalogCategory) {
    setEditingId(category.id);
    setDraft({
      slug: category.slug,
      name: category.name,
      description: category.description ?? '',
      parentId: category.parentId ?? '',
    });
    setError('');
  }
  async function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const slug = newCategory.slug.trim();
    const name = newCategory.name.trim();
    if (!catalogKeyPattern.test(slug) || !name) {
      setError('شناسه دسته‌بندی و نام معتبر لازم است.');
      return;
    }
    setError('');
    try {
      await createMutation.mutateAsync({
        slug,
        name,
        description: newCategory.description.trim() || null,
        parentId: newCategory.parentId || null,
      });
      setNewCategory({ slug: '', name: '', description: '', parentId: '' });
    } catch (mutationError) {
      setError(adminCatalogInventoryErrorMessage(mutationError, 'دسته‌بندی ثبت نشد.'));
    }
  }
  async function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId || !draft.name.trim()) {
      setError('نام دسته‌بندی را وارد کنید.');
      return;
    }
    setError('');
    try {
      await updateMutation.mutateAsync({
        categoryId: editingId,
        input: {
          name: draft.name.trim(),
          description: draft.description.trim() || null,
          parentId: draft.parentId || null,
        },
      });
      setEditingId(null);
    } catch (mutationError) {
      setError(adminCatalogInventoryErrorMessage(mutationError, 'دسته‌بندی ویرایش نشد.'));
    }
  }
  async function toggleCategory(category: AdminCatalogCategory) {
    setError('');
    try {
      await statusMutation.mutateAsync({
        categoryId: category.id,
        input: { archived: !category.archivedAt },
      });
    } catch (mutationError) {
      setError(adminCatalogInventoryErrorMessage(mutationError, 'وضعیت دسته‌بندی تغییر نکرد.'));
    }
  }

  if (query.isPending && !query.data) return <LoadingState label="در حال دریافت taxonomy..." />;
  if (query.isError && !query.data)
    return (
      <QueryState
        pending={false}
        error={query.error}
        hasData={false}
        onRetry={() => void query.refetch()}
      >
        {null}
      </QueryState>
    );
  return (
    <div className="space-y-5">
      <header>
        <p className="text-[10px] font-semibold tracking-[0.16em] text-primary">
          CATALOG / TAXONOMY
        </p>
        <h2 className="mt-2 text-2xl font-semibold">دسته‌بندی‌ها</h2>
        <p className="mt-1 text-xs leading-7 text-muted-foreground">
          ساختار طبقه‌بندی با parent واقعی سرویس مدیریت نگهداری می‌شود.
        </p>
      </header>
      {error ? (
        <p
          className="border border-destructive/30 bg-error-soft px-4 py-3 text-xs text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {canWrite ? (
        <form
          className="grid gap-3 border border-border bg-surface p-4 shadow-card md:grid-cols-2 xl:grid-cols-[minmax(150px,.8fr)_minmax(180px,1fr)_minmax(180px,1fr)_auto]"
          onSubmit={createCategory}
        >
          <label className="text-xs text-muted-foreground">
            شناسه لاتین
            <UiInput
              className="mt-2 min-h-12 w-full border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              dir="ltr"
              onChange={(event) =>
                setNewCategory((current) => ({ ...current, slug: event.target.value }))
              }
              placeholder="outerwear"
              value={newCategory.slug}
            />
          </label>
          <label className="text-xs text-muted-foreground">
            نام دسته
            <UiInput
              className="mt-2 min-h-12 w-full border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              onChange={(event) =>
                setNewCategory((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="لباس رویی"
              value={newCategory.name}
            />
          </label>
          <label className="text-xs text-muted-foreground">
            والد
            <UiSelect
              className="mt-2 min-h-12 w-full border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              onChange={(event) =>
                setNewCategory((current) => ({ ...current, parentId: event.target.value }))
              }
              value={newCategory.parentId}
            >
              <option value="">بدون والد</option>
              {categories
                .filter((category) => !category.archivedAt)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </UiSelect>
          </label>
          <Button loading={createMutation.isPending} type="submit">
            <Icon name="plus" size={16} /> افزودن
          </Button>
        </form>
      ) : null}
      <section className="border border-border bg-surface shadow-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <h3 className="font-semibold">فهرست taxonomy</h3>
          <span className="text-xs text-muted-foreground">
            {formatNumber(categories.length)} دسته
          </span>
        </div>
        {categories.length === 0 ? (
          <div className="p-5">
            <StatePanel
              icon="layers"
              title="هنوز دسته‌ای ثبت نشده است"
              description="پس از دریافت واقعی از سرویس، دسته‌ها در اینجا نمایش داده می‌شوند."
            />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {categories.map((category) => (
              <CategoryRow
                category={category}
                categories={categories}
                canWrite={canWrite}
                editingId={editingId}
                draft={draft}
                onEdit={startEdit}
                onDraftChange={setDraft}
                onSave={saveCategory}
                onCancel={() => setEditingId(null)}
                onToggle={toggleCategory}
                saving={updateMutation.isPending || statusMutation.isPending}
                key={category.id}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
