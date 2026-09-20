import { Button, Input as UiInput, Select as UiSelect } from '@nova/ui';

import type { AdminProductStatusFilter } from '../../app/app-shared';

import { Icon } from '../../ui/icon';

type CategoryOption = { value: string; label: string };

type AdminProductsFiltersProps = {
  query: string;
  onQueryChange: (value: string) => void;
  quickFilterActive: boolean;
  onQuickFilter: () => void;
  category: string;
  categoryOptions: CategoryOption[];
  onCategoryChange: (value: string) => void;
  status: AdminProductStatusFilter;
  onStatusChange: (value: AdminProductStatusFilter) => void;
};

export function AdminProductsFilters({
  query,
  onQueryChange,
  quickFilterActive,
  onQuickFilter,
  category,
  categoryOptions,
  onCategoryChange,
  status,
  onStatusChange,
}: AdminProductsFiltersProps) {
  return (
    <section
      className="rounded-panel border border-border bg-surface p-3 shadow-card sm:p-4"
      aria-label="فیلتر محصولات"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <a
          className="order-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary px-5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:order-5"
          href="#admin/products/new"
        >
          <Icon name="plus" size={17} />
          محصول جدید
        </a>

        <label className="relative order-2 min-w-0 sm:order-4 sm:flex-1 sm:basis-[230px]">
          <span className="sr-only">جست‌وجو در محصولات</span>
          <Icon
            name="search"
            size={18}
            className="pointer-events-none absolute inset-y-0 right-3 my-auto text-muted-foreground"
          />
          <UiInput
            className="min-h-11 w-full rounded-control border border-border bg-background px-10 text-xs outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-accent-soft"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="جست‌وجو در محصولات..."
            type="search"
          />
        </label>

        <Button
          className={`order-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-control border px-4 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:order-3 ${quickFilterActive ? 'border-primary bg-accent-soft text-primary' : 'border-border bg-background hover:border-primary hover:text-primary'}`}
          type="button"
          aria-pressed={quickFilterActive}
          onClick={onQuickFilter}
        >
          <Icon name="filter" size={17} />
          فیلترها
        </Button>

        <label className="relative order-4 min-w-0 sm:order-2 sm:min-w-[138px]">
          <span className="sr-only">دسته‌بندی</span>
          <UiSelect
            className="min-h-11 w-full appearance-none rounded-control border border-border bg-background px-3 pl-9 text-xs outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-accent-soft"
            value={category}
            onChange={(event) => onCategoryChange(event.target.value)}
          >
            <option value="all">همه دسته‌بندی‌ها</option>
            {categoryOptions.map((item) => (
              <option value={item.value} key={item.value}>
                {item.label}
              </option>
            ))}
          </UiSelect>
          <Icon
            name="chevron-down"
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
        </label>

        <label className="relative order-5 min-w-0 sm:order-1 sm:min-w-[138px]">
          <span className="sr-only">وضعیت</span>
          <UiSelect
            className="min-h-11 w-full appearance-none rounded-control border border-border bg-background px-3 pl-9 text-xs outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-accent-soft"
            value={status}
            onChange={(event) => onStatusChange(event.target.value as AdminProductStatusFilter)}
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="PUBLISHED">فعال</option>
            <option value="DRAFT">پیش‌نویس</option>
            <option value="ARCHIVED">بایگانی شده</option>
          </UiSelect>
          <Icon
            name="chevron-down"
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
        </label>
      </div>
    </section>
  );
}
