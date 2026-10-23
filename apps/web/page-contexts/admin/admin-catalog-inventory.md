# Page Context

## Page

**Path:** `src/features/catalog/components/catalog-inventory/CatalogInventoryView.tsx`

```tsx
import { useStaffUser } from '@/features/auth';

import { isStaffAuthFailure, isStaffAuthorizationFailure } from '@/features/auth/api/admin-auth';

import { AdminOperationsShell } from '@/features/catalog/components/catalog-inventory/admin-operations-shell';

import { AdminSessionState } from '@/features/catalog/components/catalog-inventory/admin-session-state';

import { CatalogView } from '@/features/catalog/components/catalog-inventory/catalog-view';

import { CategoriesView } from '@/features/catalog/components/catalog-inventory/categories-view';

import { InventoryView } from '@/features/catalog/components/catalog-inventory/inventory-view';

import { ProductEditor } from '@/features/catalog/components/catalog-inventory/product-editor';

import { adminInventoryViewKey } from '@/features/catalog/components/catalog-inventory/admin-inventory-view-key';

import { adminProductEditorKey } from '@/features/catalog/components/catalog-inventory/admin-product-editor-key';

import { hasAdminRole } from '@/features/catalog/components/catalog-inventory/has-admin-role';

import { normalizeAdminCatalogInventoryView } from '@/features/catalog/components/catalog-inventory/normalize-admin-catalog-inventory-view';

export function CatalogInventoryView({
  view,
  productId,
  variantId,
  staffRoles,
}: {
  view?: string;
  productId?: string;
  variantId?: string;
  staffRoles?: readonly string[];
}) {
  const activeView = normalizeAdminCatalogInventoryView(
    view ?? (variantId ? 'inventory' : productId ? 'product' : undefined),
  );
  const staffQuery = useStaffUser(staffRoles === undefined);
  if (staffQuery.isPending) return <AdminSessionState kind="loading" />;
  if (isStaffAuthFailure(staffQuery.error)) return <AdminSessionState kind="expired" />;
  if (isStaffAuthorizationFailure(staffQuery.error)) return <AdminSessionState kind="denied" />;
  if (staffRoles === undefined && !staffQuery.data) return <AdminSessionState kind="missing" />;
  const roles = staffRoles ?? staffQuery.data?.roles ?? [];
  const canView = hasAdminRole(roles, ['support', 'operations', 'admin']);
  if (!canView) return <AdminSessionState kind="denied" />;
  return (
    <AdminOperationsShell roles={roles} view={activeView}>
      {activeView === 'catalog' ? (
        <CatalogView roles={roles} />
      ) : activeView === 'categories' ? (
        <CategoriesView roles={roles} />
      ) : activeView === 'inventory' ? (
        <InventoryView
          key={adminInventoryViewKey(variantId)}
          initialVariantId={variantId}
          roles={roles}
        />
      ) : (
        <ProductEditor key={adminProductEditorKey(productId)} productId={productId} roles={roles} />
      )}
    </AdminOperationsShell>
  );
}

```

---

## Custom Components


### 1. Badge

**Path:** `../../packages/ui/src/badge.tsx`

```tsx
import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';

import { cn } from './cn';

export const badgeVariants = cva(
  'nova-badge inline-flex min-h-8 items-center justify-center rounded-control border px-2.5 py-1 text-[11px] font-semibold leading-4 transition-colors motion-reduce:transition-none',
  {
    variants: {
      variant: {
        default: 'border-primary bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-foreground',
        outline: 'border-border bg-transparent text-foreground',
        success: 'border-success-100 bg-success-100 text-success',
        warning: 'border-warning-100 bg-warning-100 text-warning',
        destructive: 'border-destructive-100 bg-destructive-100 text-destructive',
        info: 'border-info-100 bg-info-100 text-info',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
  ),
);

Badge.displayName = 'Badge';

```

---


### 2. Button

**Path:** `../../packages/ui/src/button.tsx`

```tsx
import { Slot, Slottable } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';

import { cn } from './cn';

export const buttonVariants = cva(
  'nova-button inline-flex min-h-11 items-center justify-center gap-2 rounded-pill border border-transparent px-4 text-center text-sm font-semibold leading-5 transition-[background-color,border-color,color,transform] duration-[140ms] ease-out hover:-translate-y-px focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:border-border disabled:bg-secondary disabled:text-muted-foreground disabled:opacity-100 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:translate-y-0',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-foreground',
        secondary: 'bg-secondary text-foreground hover:bg-accent-soft hover:text-primary-hover',
        outline:
          'border-primary bg-transparent text-primary hover:border-primary-hover hover:bg-accent-soft hover:text-primary-hover',
        ghost: 'bg-transparent text-foreground hover:bg-secondary',
        destructive: 'bg-destructive text-primary-foreground hover:bg-destructive-hover',
      },
      size: {
        sm: 'min-h-11 px-3 text-[13px]',
        md: 'min-h-12',
        lg: 'min-h-[52px] px-5',
        icon: 'h-11 min-h-11 w-11 px-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled = false,
      'aria-busy': ariaBusy,
      'aria-disabled': ariaDisabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Component = asChild ? Slot : 'button';
    const isDisabled = disabled || loading;

    return (
      <Component
        aria-busy={loading || ariaBusy || undefined}
        aria-disabled={isDisabled || ariaDisabled || undefined}
        className={cn(buttonVariants({ variant, size, className }))}
        data-loading={loading ? 'true' : undefined}
        disabled={asChild ? disabled : isDisabled}
        ref={ref}
        {...props}
      >
        {loading ? (
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-e-transparent motion-reduce:animate-none"
          />
        ) : null}
        {asChild ? <Slottable>{children}</Slottable> : children}
      </Component>
    );
  },
);

Button.displayName = 'Button';

```

---


### 3. Checkbox

**Path:** `../../packages/ui/src/checkbox.tsx`

```tsx
import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

import { cn } from './cn';

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => (
    <input
      {...props}
      ref={ref}
      type="checkbox"
      className={cn(
        'nova-checkbox h-5 w-5 shrink-0 accent-primary align-middle transition-[background-color,border-color,box-shadow] duration-[140ms] checked:border-primary checked:bg-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none',
        className,
      )}
    />
  ),
);

Checkbox.displayName = 'Checkbox';

```

---


### 4. Input

**Path:** `../../packages/ui/src/input.tsx`

```tsx
import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

import { cn } from './cn';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'nova-input flex min-h-12 w-full rounded-control border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-[border-color,box-shadow,background-color] duration-[140ms] placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-secondary disabled:opacity-70 motion-reduce:transition-none',
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = 'Input';

```

---


### 5. Select

**Path:** `../../packages/ui/src/select.tsx`

```tsx
import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';

import { cn } from './cn';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'nova-select flex min-h-12 w-full rounded-control border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-[border-color,box-shadow,background-color] duration-[140ms] focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-secondary disabled:opacity-70 motion-reduce:transition-none',
      className,
    )}
    {...props}
  />
));

Select.displayName = 'Select';

```

---


### 6. Textarea

**Path:** `../../packages/ui/src/textarea.tsx`

```tsx
import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';

import { cn } from './cn';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'nova-textarea min-h-28 w-full resize-y rounded-control border border-border bg-background px-3 py-3 text-sm leading-7 text-foreground outline-none transition-[border-color,box-shadow,background-color] duration-[140ms] placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-secondary disabled:opacity-70 motion-reduce:transition-none',
        className,
      )}
      {...props}
    />
  ),
);

Textarea.displayName = 'Textarea';

```

---


### 7. AdminOperationsShell

**Path:** `src/features/catalog/components/catalog-inventory/admin-operations-shell.tsx`

```tsx
import { type ReactNode } from 'react';

import { Icon, type IconName } from '@/shared/ui/icon';

import type { AdminCatalogInventoryView } from '@/features/catalog/pages/admin-catalog-inventory-page-shared';

export function AdminOperationsShell({
  view,
  roles,
  children,
}: {
  view: AdminCatalogInventoryView;
  roles: readonly string[];
  children: ReactNode;
}) {
  const navigation: Array<[AdminCatalogInventoryView, string, IconName, string]> = [
    ['catalog', 'محصولات', 'bag', '/admin/catalog'],
    ['categories', 'دسته‌بندی‌ها', 'layers', '/admin/catalog/categories'],
    ['inventory', 'موجودی کم', 'warning', '/admin/inventory'],
  ];
  return (
    <main
      className={`admin-reference-module admin-reference-catalog-shell is-${view} min-h-0 bg-transparent px-0 py-0 text-foreground`}
      dir="rtl"
    >
      <div className="admin-reference-module__inner mx-auto max-w-[1320px]">
        <header className="admin-reference-module__header admin-reference-catalog-shell__header flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="section-heading__eyebrow">ATELIER / ADMIN OPERATIONS</span>
            <h1 className="mt-2 text-2xl font-semibold leading-relaxed md:text-3xl">
              کاتالوگ و موجودی
            </h1>
            <p className="mt-1 max-w-2xl text-xs leading-7 text-muted-foreground">
              مدیریت محصول، طبقه‌بندی و موجودی بر پایه داده‌های واقعی سرویس مدیریت.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex min-h-10 items-center gap-2 border border-border bg-surface px-3">
              <Icon name="user" size={15} /> {roles.join('، ') || 'کاربر مدیریت'}
            </span>
            <span className="inline-flex min-h-10 items-center gap-2 border border-border bg-surface px-3">
              <Icon name="eye" size={15} /> داده زنده
            </span>
          </div>
        </header>
        <nav className="admin-reference-tabs mt-5 overflow-x-auto" aria-label="بخش‌های کاتالوگ و عملیات">
          <div className="flex min-w-max gap-2">
            {navigation.map(([key, label, icon, href]) => (
              <a
                className={`inline-flex min-h-11 items-center gap-2 rounded-control border px-4 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${view === key ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-surface hover:border-primary hover:text-primary'}`}
                href={href}
                aria-current={view === key ? 'page' : undefined}
                key={key}
              >
                <Icon name={icon} size={16} /> {label}
              </a>
            ))}
          </div>
        </nav>
        <div className="admin-reference-catalog-body mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_250px]">
          <div className="min-w-0">{children}</div>
          <aside
            className="admin-reference-operations-note hidden border border-border bg-surface p-5 shadow-card xl:block"
            aria-label="راهنمای عملیات"
          >
            <p className="text-[10px] font-semibold tracking-[0.16em] text-primary">
              OPERATIONS NOTE
            </p>
            <h2 className="mt-3 text-base font-semibold">ثبت مسئولانه</h2>
            <p className="mt-2 text-xs leading-7 text-muted-foreground">
              شناسه‌ها در مسیرهای لاتین جدا نگه داشته می‌شوند و هر تغییر موجودی با نسخه آخر داده
              ارسال می‌شود.
            </p>
            <div className="mt-5 border-t border-border pt-4 text-xs leading-7 text-muted-foreground">
              <p className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                پیش‌نویس تا زمان انتشار عمومی است.
              </p>
              <p className="mt-2 flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
                موجودی کم نیازمند بررسی عملیات است.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

```

---


### 8. AdminSessionState

**Path:** `src/features/catalog/components/catalog-inventory/admin-session-state.tsx`

```tsx
import { Button } from '@nova/ui';

import { type IconName } from '@/shared/ui/icon';

import { StatePanel } from '@/features/catalog/components/catalog-inventory/state-panel';

export function AdminSessionState({
  kind,
}: {
  kind: 'loading' | 'expired' | 'denied' | 'missing';
}) {
  const content = {
    loading: {
      icon: 'refresh' as IconName,
      title: 'در حال بررسی نشست مدیریت',
      description: 'دسترسی عملیاتی از سرویس مدیریت بررسی می‌شود.',
    },
    expired: {
      icon: 'refresh' as IconName,
      title: 'نشست مدیریت منقضی شده است',
      description: 'برای مشاهده کاتالوگ و موجودی دوباره وارد پنل شوید.',
    },
    denied: {
      icon: 'warning' as IconName,
      title: 'دسترسی مدیریت کافی نیست',
      description: 'نقش فعلی شما اجازه مشاهده این بخش عملیاتی را ندارد.',
    },
    missing: {
      icon: 'user' as IconName,
      title: 'ورود به پنل مدیریت لازم است',
      description: 'برای مشاهده اطلاعات واقعی کاتالوگ و موجودی ابتدا وارد شوید.',
    },
  }[kind];
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10" dir="rtl">
      <StatePanel
        icon={content.icon}
        title={content.title}
        description={content.description}
        tone={kind === 'denied' || kind === 'expired' ? 'danger' : 'neutral'}
        action={
          kind !== 'loading' && kind !== 'denied' ? (
            <Button asChild>
              <a href="/admin/login">ورود به پنل</a>
            </Button>
          ) : undefined
        }
      />
    </main>
  );
}

```

---


### 9. CatalogView

**Path:** `src/features/catalog/components/catalog-inventory/catalog-view.tsx`

```tsx
import { useState, type FormEvent } from 'react';
import { type AdminCatalogProductListQuery } from '@nova/api-client';
import { Button, Select as UiSelect } from '@nova/ui';
import {
  useAdminCatalogCategories,
  useAdminCatalogProducts,
} from '@/features/catalog/api/catalog/admin-catalog-api';
import { useAdminInventory } from '@/features/catalog/api/inventory/admin-inventory-api';

import { Icon } from '@/shared/ui/icon';

import { FilterInput } from '@/features/catalog/components/catalog-inventory/filter-input';

import { LoadingState } from '@/features/catalog/components/catalog-inventory/loading-state';

import { LowStockCard } from '@/features/catalog/components/catalog-inventory/low-stock-card';

import { Pagination } from '@/features/catalog/components/catalog-inventory/pagination';

import { ProductCard } from '@/features/catalog/components/catalog-inventory/product-card';

import { ProductTableRow } from '@/features/catalog/components/catalog-inventory/product-table-row';

import { QueryState } from '@/features/catalog/components/catalog-inventory/query-state';

import { StatePanel } from '@/features/catalog/components/catalog-inventory/state-panel';

import { formatPersianNumber as formatNumber } from '@/shared/utils/format-persian-number';

import { hasAdminRole } from '@/features/catalog/components/catalog-inventory/has-admin-role';

export function CatalogView({ roles }: { roles: readonly string[] }) {
  const canWrite = hasAdminRole(roles, ['admin']);
  const [filters, setFilters] = useState<AdminCatalogProductListQuery>({ page: 1, limit: 8 });
  const [search, setSearch] = useState('');
  const productsQuery = useAdminCatalogProducts(filters);
  const categoriesQuery = useAdminCatalogCategories();
  const lowStockQuery = useAdminInventory({ page: 1, limit: 4, lowStock: true, status: 'ALL' });
  const products = productsQuery.data?.items ?? [];
  const lowStock = lowStockQuery.data?.items ?? [];

  function submitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters((current) => ({ ...current, q: search.trim() || undefined, page: 1 }));
  }

  if (productsQuery.isPending && !productsQuery.data)
    return <LoadingState label="در حال دریافت محصولات..." />;
  if (productsQuery.isError && !productsQuery.data)
    return (
      <QueryState
        pending={false}
        error={productsQuery.error}
        hasData={false}
        onRetry={() => void productsQuery.refetch()}
      >
        {null}
      </QueryState>
    );
  return (
    <div className="space-y-5">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.16em] text-primary">
            CATALOG / PRODUCT CONTROL
          </p>
          <h2 className="mt-2 text-2xl font-semibold">محصولات</h2>
          <p className="mt-1 text-xs leading-7 text-muted-foreground">
            ایجاد، ویرایش، انتشار و اتصال محصول به طبقه‌بندی و تنوع‌ها.
          </p>
        </div>
        {canWrite ? (
          <Button asChild>
            <a href="/admin/catalog/products/new">
              <Icon name="plus" size={17} /> محصول جدید
            </a>
          </Button>
        ) : (
          <span className="inline-flex min-h-11 items-center gap-2 border border-border bg-surface px-4 text-xs text-muted-foreground">
            <Icon name="eye" size={16} /> فقط مشاهده
          </span>
        )}
      </header>
      <form
        className="grid gap-3 border border-border bg-surface p-4 shadow-card md:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(160px,.7fr))_auto]"
        onSubmit={submitFilters}
      >
        <FilterInput
          label="جست‌وجو در محصولات"
          onChange={setSearch}
          placeholder="نام یا شناسه محصول..."
          value={search}
        />
        <label className="block text-xs text-muted-foreground">
          وضعیت
          <UiSelect
            aria-label="فیلتر وضعیت محصول"
            className="mt-2 min-h-12 w-full border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                page: 1,
                status: (event.target.value || undefined) as AdminCatalogProductListQuery['status'],
              }))
            }
            value={filters.status ?? ''}
          >
            <option value="">همه وضعیت‌ها</option>
            <option value="DRAFT">پیش‌نویس</option>
            <option value="PUBLISHED">منتشرشده</option>
            <option value="ARCHIVED">آرشیوشده</option>
          </UiSelect>
        </label>
        <label className="block text-xs text-muted-foreground">
          دسته‌بندی
          <UiSelect
            aria-label="فیلتر دسته‌بندی"
            className="mt-2 min-h-12 w-full border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                page: 1,
                category: event.target.value || undefined,
              }))
            }
            value={filters.category ?? ''}
          >
            <option value="">همه دسته‌ها</option>
            {(categoriesQuery.data ?? [])
              .filter((category) => !category.archivedAt)
              .map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
          </UiSelect>
        </label>
        <Button type="submit">
          <Icon name="search" size={16} /> اعمال فیلتر
        </Button>
      </form>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section
          className="border border-border bg-surface shadow-card"
          aria-labelledby="admin-catalog-list-title"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 md:px-5">
            <h3 className="font-semibold" id="admin-catalog-list-title">
              فهرست محصولات
            </h3>
            <span className="text-xs text-muted-foreground">
              {formatNumber(productsQuery.data?.total ?? 0)} محصول
            </span>
          </div>
          {products.length === 0 ? (
            <div className="p-5">
              <StatePanel
                icon="bag"
                title="محصولی با این فیلتر پیدا نشد"
                description="جست‌وجو یا وضعیت محصول را تغییر دهید."
              />
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[780px] border-collapse text-right text-xs">
                  <caption className="sr-only">محصولات واقعی کاتالوگ</caption>
                  <thead className="bg-background text-muted-foreground">
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 font-medium" scope="col">
                        محصول
                      </th>
                      <th className="px-4 py-3 font-medium" scope="col">
                        دسته‌بندی
                      </th>
                      <th className="px-4 py-3 font-medium" scope="col">
                        قیمت
                      </th>
                      <th className="px-4 py-3 font-medium" scope="col">
                        موجودی
                      </th>
                      <th className="px-4 py-3 font-medium" scope="col">
                        وضعیت
                      </th>
                      <th className="px-4 py-3 font-medium" scope="col">
                        <span className="sr-only">عملیات</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <ProductTableRow key={product.id} product={product} />
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="space-y-3 p-3 md:hidden">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <div className="p-4 md:p-5">
                <Pagination
                  limit={productsQuery.data?.limit ?? 8}
                  page={productsQuery.data?.page ?? 1}
                  total={productsQuery.data?.total ?? 0}
                  onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
                />
              </div>
            </>
          )}
        </section>
        <LowStockCard items={lowStock} query={lowStockQuery} />
      </div>
    </div>
  );
}

```

---


### 10. CategoriesView

**Path:** `src/features/catalog/components/catalog-inventory/categories-view.tsx`

```tsx
import { useState, type FormEvent } from 'react';
import { type AdminCatalogCategory } from '@nova/api-client';
import { Button, Input as UiInput, Select as UiSelect } from '@nova/ui';
import {
  useAdminCatalogCategories,
  useCreateAdminCatalogCategory,
  useUpdateAdminCatalogCategory,
  useUpdateAdminCatalogCategoryStatus,
} from '@/features/catalog/api/catalog/admin-catalog-api';

import { Icon } from '@/shared/ui/icon';

import { catalogKeyPattern } from '@/features/catalog/pages/admin-catalog-inventory-page-shared';

import { CategoryRow } from '@/features/catalog/components/catalog-inventory/category-row';

import { LoadingState } from '@/features/catalog/components/catalog-inventory/loading-state';

import { QueryState } from '@/features/catalog/components/catalog-inventory/query-state';

import { StatePanel } from '@/features/catalog/components/catalog-inventory/state-panel';

import { adminCatalogInventoryErrorMessage } from '@/features/catalog/components/catalog-inventory/admin-catalog-inventory-error-message';

import { formatPersianNumber as formatNumber } from '@/shared/utils/format-persian-number';

import { hasAdminRole } from '@/features/catalog/components/catalog-inventory/has-admin-role';

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

```

---


### 11. CategoryRow

**Path:** `src/features/catalog/components/catalog-inventory/category-row.tsx`

```tsx
import { type FormEvent } from 'react';
import { type AdminCatalogCategory } from '@nova/api-client';
import { Button, Input as UiInput, Select as UiSelect } from '@nova/ui';

import { Icon } from '@/shared/ui/icon';

import { StatusBadge } from '@/features/catalog/components/catalog-inventory/status-badge';

import { formatDate } from '@/features/catalog/components/catalog-inventory/format-date';

import { formatPersianNumber as formatNumber } from '@/shared/utils/format-persian-number';

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

```

---


### 12. FilterInput

**Path:** `src/features/catalog/components/catalog-inventory/filter-input.tsx`

```tsx
import { Input as UiInput } from '@nova/ui';

import { Icon } from '@/shared/ui/icon';

export function FilterInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block text-xs text-muted-foreground">
      {label}
      <span className="relative mt-2 block">
        <Icon
          className="pointer-events-none absolute inset-inline-end-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          name="search"
          size={17}
        />
        <UiInput
          aria-label={label}
          className="min-h-12 w-full border border-border bg-background px-3 pe-10 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          value={value}
        />
      </span>
    </label>
  );
}

```

---


### 13. InventoryDetail

**Path:** `src/features/catalog/components/catalog-inventory/inventory-detail.tsx`

```tsx
import { type FormEvent } from 'react';

import { Button, Input as UiInput, Textarea as UiTextarea } from '@nova/ui';

import type { useAdminInventoryItem } from '@/features/catalog/api/inventory/admin-inventory-api';

import { Icon } from '@/shared/ui/icon';

import { LoadingState } from '@/features/catalog/components/catalog-inventory/loading-state';

import { StatePanel } from '@/features/catalog/components/catalog-inventory/state-panel';

import { adminCatalogInventoryErrorMessage } from '@/features/catalog/components/catalog-inventory/admin-catalog-inventory-error-message';

import { formatDate } from '@/features/catalog/components/catalog-inventory/format-date';

import { formatPersianNumber as formatNumber } from '@/shared/utils/format-persian-number';

import { isInventoryDiscrepancy } from '@/features/catalog/components/catalog-inventory/is-inventory-discrepancy';

import { isOfflineError } from '@/features/catalog/components/catalog-inventory/is-offline-error';

import { ltr } from '@/features/catalog/components/catalog-inventory/ltr';

import { resolveInventoryDetailState } from '@/features/catalog/components/catalog-inventory/resolve-inventory-detail-state';

import { statusLabel } from '@/features/catalog/components/catalog-inventory/status-label';

export function InventoryDetail({
  detailQuery,
  enabled,
  canOperate,
  delta,
  reason,
  reorderPoint,
  setDelta,
  setReason,
  setReorderPoint,
  onAdjust,
  onReorder,
  adjusting,
  reordering,
}: {
  detailQuery: ReturnType<typeof useAdminInventoryItem>;
  enabled: boolean;
  canOperate: boolean;
  delta: string;
  reason: string;
  reorderPoint: string;
  setDelta: (value: string) => void;
  setReason: (value: string) => void;
  setReorderPoint: (value: string) => void;
  onAdjust: (event: FormEvent<HTMLFormElement>) => void;
  onReorder: (event: FormEvent<HTMLFormElement>) => void;
  adjusting: boolean;
  reordering: boolean;
}) {
  const item = detailQuery.data;
  const detailState = resolveInventoryDetailState({
    hasItem: Boolean(item),
    enabled,
    isPending: detailQuery.isPending,
    isError: detailQuery.isError,
  });
  if (detailState === 'loading')
    return (
      <div className="border border-border bg-surface p-5 shadow-card">
        <LoadingState label="در حال دریافت جزئیات موجودی..." />
      </div>
    );
  if (detailState === 'error')
    return (
      <StatePanel
        icon={isOfflineError(detailQuery.error) ? 'refresh' : 'warning'}
        title={
          isOfflineError(detailQuery.error)
            ? 'اتصال شبکه در دسترس نیست'
            : 'دریافت اطلاعات انجام نشد'
        }
        description={adminCatalogInventoryErrorMessage(
          detailQuery.error,
          'جزئیات موجودی در دسترس نیست.',
        )}
        action={
          <Button onClick={() => void detailQuery.refetch()} variant="outline">
            <Icon name="refresh" size={16} /> تلاش دوباره
          </Button>
        }
        tone="danger"
      />
    );
  if (!item)
    return (
      <StatePanel
        icon="warehouse"
        title="یک تنوع را انتخاب کنید"
        description="برای مشاهده جزئیات و ثبت عملیات، یک ردیف از فهرست موجودی را انتخاب کنید."
      />
    );
  const discrepancy = isInventoryDiscrepancy(item);
  return (
    <section
      className="border border-border bg-surface shadow-card"
      aria-labelledby="inventory-detail-title"
    >
      <div className="border-b border-border px-5 py-5">
        <p className="text-[10px] font-semibold tracking-[0.14em] text-warning">INVENTORY DETAIL</p>
        <h3 className="mt-2 text-lg font-semibold" id="inventory-detail-title">
          {item.productName}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {item.variantTitle ?? 'تنوع اصلی'} · {ltr(item.sku)}
        </p>
      </div>
      {detailQuery.isPending ? (
        <div className="p-5">
          <LoadingState label="در حال دریافت جزئیات موجودی..." />
        </div>
      ) : detailQuery.isError ? (
        <div className="p-5">
          <p className="text-xs text-destructive">
            {adminCatalogInventoryErrorMessage(detailQuery.error, 'جزئیات موجودی در دسترس نیست.')}
          </p>
          <Button className="mt-4" onClick={() => void detailQuery.refetch()} variant="outline">
            <Icon name="refresh" size={16} /> تلاش دوباره
          </Button>
        </div>
      ) : (
        <div className="space-y-5 p-5">
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ['فیزیکی', item.onHand],
                ['رزروشده', item.reserved],
                ['قابل فروش', item.available],
                ['نقطه سفارش', item.reorderPoint],
              ] as const
            ).map(([label, value]) => (
              <div className="border border-border bg-background p-3" key={label}>
                <p className="text-[10px] text-muted-foreground">{label}</p>
                <p className="mt-2 text-lg font-semibold">{formatNumber(value)}</p>
              </div>
            ))}
          </div>
          {discrepancy ? (
            <p
              className="flex gap-2 border border-warning/30 bg-warning-soft px-3 py-3 text-xs leading-6 text-warning"
              role="alert"
            >
              <Icon className="mt-1 shrink-0" name="warning" size={15} />
              مغایرت داده: فیزیکی منهای رزروشده با قابل فروش برابر نیست.
            </p>
          ) : null}
          <p className="text-[10px] text-muted-foreground">
            آخرین تغییر: {formatDate(item.updatedAt)}
          </p>
          {canOperate ? (
            <>
              <form className="border-t border-border pt-5" onSubmit={onAdjust}>
                <h4 className="text-sm font-semibold">اصلاح موجودی</h4>
                <div className="mt-3 grid gap-3">
                  <label className="text-xs text-muted-foreground">
                    مقدار تغییر
                    <UiInput
                      className="mt-2 min-h-11 w-full border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      dir="ltr"
                      inputMode="numeric"
                      onChange={(event) => setDelta(event.target.value)}
                      placeholder="مثلاً 5 یا -2"
                      value={delta}
                    />
                  </label>
                  <label className="text-xs text-muted-foreground">
                    دلیل ثبت
                    <UiTextarea
                      className="mt-2 min-h-20 w-full border border-border bg-background px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      onChange={(event) => setReason(event.target.value)}
                      placeholder="دلیل عملیاتی تغییر..."
                      value={reason}
                    />
                  </label>
                  <Button loading={adjusting} type="submit">
                    <Icon name="rotate" size={16} /> ثبت اصلاح
                  </Button>
                </div>
              </form>
              <form className="border-t border-border pt-5" onSubmit={onReorder}>
                <h4 className="text-sm font-semibold">نقطه سفارش مجدد</h4>
                <label className="mt-3 block text-xs text-muted-foreground">
                  حداقل قابل سفارش
                  <UiInput
                    className="mt-2 min-h-11 w-full border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    dir="ltr"
                    inputMode="numeric"
                    onChange={(event) => setReorderPoint(event.target.value)}
                    value={reorderPoint}
                  />
                </label>
                <Button className="mt-3" loading={reordering} type="submit">
                  ذخیره نقطه سفارش
                </Button>
              </form>
            </>
          ) : (
            <p className="border border-border bg-background px-3 py-3 text-xs leading-6 text-muted-foreground">
              نقش فعلی فقط اجازه مشاهده دارد؛ ثبت اصلاح و نقطه سفارش برای عملیات یا مدیر فعال است.
            </p>
          )}
          <div className="border-t border-border pt-5">
            <h4 className="text-sm font-semibold">حرکت‌های اخیر</h4>
            {item.recentMovements?.length ? (
              <div className="mt-3 divide-y divide-border">
                {item.recentMovements.map((movement) => (
                  <div
                    className="flex items-center justify-between gap-3 py-3 text-xs"
                    key={movement.id}
                  >
                    <span>
                      <span className="block font-medium">{statusLabel(movement.type)}</span>
                      <span className="mt-1 block text-[10px] text-muted-foreground">
                        {formatDate(movement.createdAt)}
                      </span>
                    </span>
                    <span
                      className={movement.quantity > 0 ? 'text-success' : 'text-destructive'}
                      dir="ltr"
                    >
                      {movement.quantity > 0 ? '+' : ''}
                      {formatNumber(movement.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">حرکت اخیری ثبت نشده است.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

```

---


### 14. InventoryRow

**Path:** `src/features/catalog/components/catalog-inventory/inventory-row.tsx`

```tsx
import { type AdminInventoryItem } from '@nova/api-client';
import { Button } from '@nova/ui';

import { Icon } from '@/shared/ui/icon';

import { StatusBadge } from '@/features/catalog/components/catalog-inventory/status-badge';

import { formatPersianNumber as formatNumber } from '@/shared/utils/format-persian-number';

export function InventoryRow({
  item,
  selected,
  onSelect,
}: {
  item: AdminInventoryItem;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <Button
      className={`admin-reference-inventory-row ${selected ? 'is-selected' : ''}`}
      onClick={() => onSelect(item.variantId)}
      type="button"
      variant="ghost"
    >
      <span className="admin-reference-inventory-row__product">
        <span
          className={`admin-reference-inventory-row__thumb ${item.stockStatus === 'LOW_STOCK' ? 'is-low' : item.stockStatus === 'OUT_OF_STOCK' ? 'is-out' : 'is-ok'}`}
        >
          <Icon name="shirt" size={20} />
        </span>
        <span>
          <strong>{item.productName}</strong>
          <small>{item.variantTitle ?? 'تنوع اصلی'}</small>
        </span>
      </span>
      <span dir="ltr" className="admin-reference-inventory-row__sku">{item.sku}</span>
      <span>{formatNumber(item.available)}</span>
      <span>{formatNumber(item.reserved)}</span>
      <span>{formatNumber(item.onHand)}</span>
      <span>{formatNumber(item.reorderPoint)}</span>
      <StatusBadge status={item.stockStatus} />
      <span className="admin-reference-inventory-row__more" aria-hidden="true">
        <Icon name="more-vertical" size={17} />
      </span>
    </Button>
  );
}

```

---


### 15. InventoryView

**Path:** `src/features/catalog/components/catalog-inventory/inventory-view.tsx`

```tsx
import { useEffect, useState, type FormEvent } from 'react';
import { type AdminInventoryListQuery } from '@nova/api-client';
import { Button, Checkbox, Select as UiSelect } from '@nova/ui';

import {
  useAdminInventory,
  useAdminInventoryItem,
  useAdjustAdminInventory,
  useUpdateAdminInventoryReorderPoint,
} from '@/features/catalog/api/inventory/admin-inventory-api';

import { Icon } from '@/shared/ui/icon';

import { FilterInput } from '@/features/catalog/components/catalog-inventory/filter-input';

import { InventoryDetail } from '@/features/catalog/components/catalog-inventory/inventory-detail';

import { InventoryRow } from '@/features/catalog/components/catalog-inventory/inventory-row';

import { LoadingState } from '@/features/catalog/components/catalog-inventory/loading-state';

import { Pagination } from '@/features/catalog/components/catalog-inventory/pagination';

import { QueryState } from '@/features/catalog/components/catalog-inventory/query-state';

import { StatePanel } from '@/features/catalog/components/catalog-inventory/state-panel';

import { adminCatalogInventoryErrorMessage } from '@/features/catalog/components/catalog-inventory/admin-catalog-inventory-error-message';

import { formatPersianNumber as formatNumber } from '@/shared/utils/format-persian-number';

import { hasAdminRole } from '@/features/catalog/components/catalog-inventory/has-admin-role';

import { validateInventoryAdjustment } from '@/features/catalog/components/catalog-inventory/validate-inventory-adjustment';

export function InventoryView({
  roles,
  initialVariantId,
}: {
  roles: readonly string[];
  initialVariantId?: string;
}) {
  const canOperate = hasAdminRole(roles, ['operations', 'admin']);
  const [filters, setFilters] = useState<AdminInventoryListQuery>({
    page: 1,
    limit: 8,
    status: 'ALL',
  });
  const [search, setSearch] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState(initialVariantId ?? '');
  const query = useAdminInventory(filters);
  const detailQuery = useAdminInventoryItem(selectedVariantId);
  const adjustMutation = useAdjustAdminInventory();
  const reorderMutation = useUpdateAdminInventoryReorderPoint();
  const [delta, setDelta] = useState('');
  const [reason, setReason] = useState('');
  const [reorderPoint, setReorderPoint] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const items = query.data?.items ?? [];

  useEffect(() => {
    if (detailQuery.data) setReorderPoint(String(detailQuery.data.reorderPoint));
  }, [detailQuery.data?.updatedAt, detailQuery.data?.variantId]);
  function submitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters((current) => ({ ...current, q: search.trim() || undefined, page: 1 }));
  }
  async function adjust(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const issues = validateInventoryAdjustment(delta, reason);
    if (issues.length || !detailQuery.data) {
      setError(issues.join(' '));
      return;
    }
    setError('');
    setSuccess('');
    try {
      await adjustMutation.mutateAsync({
        variantId: detailQuery.data.variantId,
        input: {
          delta: Number(delta),
          reason: reason.trim(),
          expectedUpdatedAt: detailQuery.data.updatedAt,
        },
      });
      setDelta('');
      setReason('');
      setSuccess('تغییر موجودی ثبت شد و نسخه تازه بارگیری شد.');
    } catch (mutationError) {
      setError(adminCatalogInventoryErrorMessage(mutationError, 'تغییر موجودی ثبت نشد.'));
    }
  }
  async function saveReorder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !detailQuery.data ||
      !Number.isSafeInteger(Number(reorderPoint)) ||
      Number(reorderPoint) < 0
    ) {
      setError('نقطه سفارش مجدد باید عدد صحیح نامنفی باشد.');
      return;
    }
    setError('');
    setSuccess('');
    try {
      await reorderMutation.mutateAsync({
        variantId: detailQuery.data.variantId,
        input: {
          reorderPoint: Number(reorderPoint),
          expectedUpdatedAt: detailQuery.data.updatedAt,
        },
      });
      setSuccess('نقطه سفارش مجدد ذخیره شد.');
    } catch (mutationError) {
      setError(adminCatalogInventoryErrorMessage(mutationError, 'نقطه سفارش مجدد ذخیره نشد.'));
    }
  }

  if (query.isPending && !query.data) return <LoadingState label="در حال دریافت موجودی..." />;
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
  const totalOnHand = items.reduce((sum, item) => sum + item.onHand, 0);
  const totalReserved = items.reduce((sum, item) => sum + item.reserved, 0);
  const lowStockCount = items.filter((item) => item.stockStatus === 'LOW_STOCK').length;
  const outOfStockCount = items.filter((item) => item.stockStatus === 'OUT_OF_STOCK').length;

  return (
    <div className="admin-reference-inventory">
      <header className="admin-reference-inventory__header">
        <div>
          <span className="section-heading__eyebrow">NOVA / INVENTORY</span>
          <h2>موجودی</h2>
          <p>نمای کلی موجودی محصولات و مدیریت انبار بر اساس داده‌های واقعی سرویس مدیریت.</p>
        </div>
        {canOperate ? (
          <a className="admin-reference-inventory__add" href="/admin/catalog/products/new">
            <Icon name="plus" size={17} /> محصول جدید
          </a>
        ) : null}
      </header>

      <section className="admin-reference-inventory-metrics" aria-label="خلاصه موجودی">
        <article>
          <span className="is-green"><Icon name="warehouse" size={21} /></span>
          <div><strong>{formatNumber(totalOnHand)}</strong><small>مجموع موجودی این صفحه</small></div>
        </article>
        <article>
          <span className="is-amber"><Icon name="warning" size={21} /></span>
          <div><strong>{formatNumber(lowStockCount)}</strong><small>موجودی کم</small></div>
        </article>
        <article>
          <span className="is-red"><Icon name="close" size={21} /></span>
          <div><strong>{formatNumber(outOfStockCount)}</strong><small>ناموجود</small></div>
        </article>
        <article>
          <span className="is-gold"><Icon name="package" size={21} /></span>
          <div><strong>{formatNumber(totalReserved)}</strong><small>رزرو شده</small></div>
        </article>
      </section>

      <form className="admin-reference-inventory-filters" onSubmit={submitFilters}>
        <FilterInput
          label="جست‌وجو"
          onChange={setSearch}
          placeholder="جست‌وجوی محصول یا SKU..."
          value={search}
        />
        <label>
          <span>وضعیت تنوع</span>
          <UiSelect
            aria-label="فیلتر وضعیت تنوع"
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                page: 1,
                status: (event.target.value || 'ALL') as AdminInventoryListQuery['status'],
              }))
            }
            value={filters.status ?? 'ALL'}
          >
            <option value="ALL">همه تنوع‌ها</option>
            <option value="ACTIVE">فعال</option>
            <option value="INACTIVE">غیرفعال</option>
          </UiSelect>
        </label>
        <label className="admin-reference-inventory-filters__check">
          <Checkbox
            checked={filters.lowStock === true}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                page: 1,
                lowStock: event.target.checked || undefined,
              }))
            }
          />
          فقط موجودی کم
        </label>
        <Button type="submit" variant="outline">
          <Icon name="filter" size={16} /> فیلترها
        </Button>
      </form>

      {error ? <p className="admin-reference-message is-error" role="alert">{error}</p> : null}
      {success ? <p className="admin-reference-message is-success" role="status">{success}</p> : null}

      <section className="admin-reference-inventory-table">
        <div className="admin-reference-inventory-table__head" aria-hidden="true">
          <span>محصول</span>
          <span>SKU</span>
          <span>قابل فروش</span>
          <span>رزرو</span>
          <span>فیزیکی</span>
          <span>حد سفارش</span>
          <span>وضعیت</span>
          <span />
        </div>

        {items.length === 0 ? (
          <div className="admin-reference-inventory-table__empty">
            <StatePanel
              icon="warehouse"
              title="موجودی‌ای با این فیلتر پیدا نشد"
              description="فیلتر موجودی کم یا عبارت جست‌وجو را تغییر دهید."
            />
          </div>
        ) : (
          <div className="admin-reference-inventory-table__rows">
            {items.map((item) => (
              <InventoryRow
                item={item}
                selected={item.variantId === selectedVariantId}
                onSelect={setSelectedVariantId}
                key={item.id}
              />
            ))}
          </div>
        )}

        <div className="admin-reference-inventory-table__footer">
          <span>{formatNumber(query.data?.total ?? 0)} تنوع</span>
          <Pagination
            limit={query.data?.limit ?? 8}
            page={query.data?.page ?? 1}
            total={query.data?.total ?? 0}
            onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
          />
        </div>
      </section>

      {selectedVariantId ? (
        <div className="admin-reference-inventory-detail">
          <InventoryDetail
            detailQuery={detailQuery}
            enabled={Boolean(selectedVariantId)}
            canOperate={canOperate}
            delta={delta}
            reason={reason}
            reorderPoint={reorderPoint}
            setDelta={setDelta}
            setReason={setReason}
            setReorderPoint={setReorderPoint}
            onAdjust={adjust}
            onReorder={saveReorder}
            adjusting={adjustMutation.isPending}
            reordering={reorderMutation.isPending}
          />
        </div>
      ) : null}
    </div>
  );
}

```

---


### 16. LoadingState

**Path:** `src/features/catalog/components/catalog-inventory/loading-state.tsx`

```tsx
export function LoadingState({ label = 'در حال بارگذاری اطلاعات...' }: { label?: string }) {
  return (
    <div className="space-y-3" aria-label={label} role="status">
      {[1, 2, 3].map((row) => (
        <div
          className="motion-safe:animate-pulse motion-reduce:animate-none border border-border bg-surface p-5"
          key={row}
        >
          <div className="h-3 w-1/4 rounded bg-secondary" />
          <div className="mt-3 h-3 w-2/3 rounded bg-secondary" />
        </div>
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}

```

---


### 17. LowStockCard

**Path:** `src/features/catalog/components/catalog-inventory/low-stock-card.tsx`

```tsx
import { type AdminInventoryItem } from '@nova/api-client';
import { Button } from '@nova/ui';

import { Icon } from '@/shared/ui/icon';

import { LoadingState } from '@/features/catalog/components/catalog-inventory/loading-state';

import { formatPersianNumber as formatNumber } from '@/shared/utils/format-persian-number';

export function LowStockCard({
  items,
  query,
}: {
  items: AdminInventoryItem[];
  query: { isPending: boolean; isError: boolean; refetch: () => Promise<unknown> };
}) {
  return (
    <section
      className="border border-border bg-surface shadow-card"
      aria-labelledby="admin-low-stock-title"
    >
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.14em] text-warning">
            INVENTORY WATCH
          </p>
          <h3 className="mt-1 font-semibold" id="admin-low-stock-title">
            موجودی کم
          </h3>
        </div>
        <Icon className="text-warning" name="warning" size={20} />
      </div>
      {query.isPending ? (
        <div className="p-4">
          <LoadingState label="در حال دریافت هشدارهای موجودی..." />
        </div>
      ) : query.isError ? (
        <div className="p-4">
          <Button
            className="min-h-11 text-xs text-primary underline focus-visible:outline-2 focus-visible:outline-primary"
            onClick={() => void query.refetch()}
            type="button"
          >
            دریافت دوباره
          </Button>
        </div>
      ) : items.length === 0 ? (
        <p className="p-5 text-xs leading-7 text-muted-foreground">
          هشدار موجودی فعالی ثبت نشده است.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {items.map((item) => (
            <a
              className="flex min-h-[76px] items-center gap-3 px-4 py-3 transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              href={`/admin/inventory/${encodeURIComponent(item.variantId)}`}
              key={item.id}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-warning-soft text-warning">
                <Icon name="package" size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold">{item.productName}</span>
                <span className="mt-1 block truncate text-[10px] text-muted-foreground">
                  {item.variantTitle ?? 'تنوع اصلی'} · {formatNumber(item.available)} قابل فروش
                </span>
              </span>
              <Icon name="arrow-left" size={15} />
            </a>
          ))}
        </div>
      )}
      <a
        className="flex min-h-11 items-center justify-center gap-2 border-t border-border text-xs text-primary hover:bg-background focus-visible:outline-2 focus-visible:outline-primary"
        href="/admin/inventory"
      >
        مشاهده همه <Icon name="arrow-left" size={15} />
      </a>
    </section>
  );
}

```

---


### 18. MediaItem

**Path:** `src/features/catalog/components/catalog-inventory/media-item.tsx`

```tsx
import { useState } from 'react';

import { Button, Input as UiInput } from '@nova/ui';
import type {
  useDeleteAdminProductMedia,
  useUpdateAdminProductMedia,
} from '@/features/catalog/api/catalog/admin-catalog-api';

import { Icon } from '@/shared/ui/icon';

import { statusLabel } from '@/features/catalog/components/catalog-inventory/status-label';

export function MediaItem({
  media,
  productId,
  canWrite,
  canDelete,
  updateMedia,
  deleteMedia,
}: {
  media: { id: string; url: string; altText: string; kind: string };
  productId: string;
  canWrite: boolean;
  canDelete: boolean;
  updateMedia: ReturnType<typeof useUpdateAdminProductMedia>;
  deleteMedia: ReturnType<typeof useDeleteAdminProductMedia>;
}) {
  const [altText, setAltText] = useState(media.altText);
  return (
    <div className="flex items-center gap-3 py-3">
      <img
        className="h-12 w-12 shrink-0 rounded-control border border-border object-cover"
        src={media.url}
        alt={media.altText}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs" dir="ltr">
          {media.url}
        </p>
        <p className="mt-1 text-[10px] text-muted-foreground">{statusLabel(media.kind)}</p>
        {!canDelete ? (
          <p className="mt-1 text-[10px] text-warning" role="note">
            تصویر اصلی محصول منتشرشده قابل حذف نیست.
          </p>
        ) : null}
        <UiInput
          aria-label={`متن جایگزین ${media.url}`}
          className="mt-2 min-h-9 w-full border border-border bg-background px-2 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          disabled={!canWrite}
          onChange={(event) => setAltText(event.target.value)}
          value={altText}
        />
      </div>
      {canWrite ? (
        <div className="flex shrink-0 gap-1">
          <Button
            aria-label="ذخیره متن جایگزین"
            loading={updateMedia.isPending}
            onClick={() =>
              void updateMedia.mutateAsync({
                productId,
                mediaId: media.id,
                input: { altText: altText.trim() },
              })
            }
            size="icon"
            variant="outline"
          >
            <Icon name="check" size={14} />
          </Button>
          <Button
            aria-label="حذف رسانه"
            disabled={deleteMedia.isPending || !canDelete}
            onClick={() => void deleteMedia.mutateAsync({ productId, mediaId: media.id })}
            size="icon"
            variant="ghost"
          >
            <Icon name="close" size={14} />
          </Button>
        </div>
      ) : null}
    </div>
  );
}

```

---


### 19. MediaPanel

**Path:** `src/features/catalog/components/catalog-inventory/media-panel.tsx`

```tsx
import { useState, type ChangeEvent, type FormEvent } from 'react';
import type { AdminCatalogProductStatus } from '@nova/api-client';

import { Button, Input as UiInput, Select as UiSelect } from '@nova/ui';
import type { useAdminProductMedia } from '@/features/catalog/api/catalog/admin-catalog-api';
import {
  useCreateAdminProductMedia,
  useDeleteAdminProductMedia,
  useUploadAdminProductMedia,
  useUpdateAdminProductMedia,
} from '@/features/catalog/api/catalog/admin-catalog-api';

import { Icon } from '@/shared/ui/icon';

import { LoadingState } from '@/features/catalog/components/catalog-inventory/loading-state';

import { MediaItem } from '@/features/catalog/components/catalog-inventory/media-item';

import { StatePanel } from '@/features/catalog/components/catalog-inventory/state-panel';

import { adminCatalogInventoryErrorMessage } from '@/features/catalog/components/catalog-inventory/admin-catalog-inventory-error-message';

import {
  catalogMediaContentType,
  readCatalogMediaDimensions,
  validateCatalogMediaFile,
} from '@/features/catalog/components/catalog-inventory/catalog-media-upload';

import { canDeleteAdminProductMedia } from '@/features/catalog/components/catalog-inventory/can-delete-admin-product-media';

import { isOfflineError } from '@/features/catalog/components/catalog-inventory/is-offline-error';

import { validateMediaDraft } from '@/features/catalog/components/catalog-inventory/validate-media-draft';

export function MediaPanel({
  productId,
  productStatus,
  query,
  canWrite,
}: {
  productId: string;
  productStatus: AdminCatalogProductStatus;
  query: ReturnType<typeof useAdminProductMedia>;
  canWrite: boolean;
}) {
  const createMedia = useCreateAdminProductMedia();
  const uploadMedia = useUploadAdminProductMedia();
  const updateMedia = useUpdateAdminProductMedia();
  const deleteMedia = useDeleteAdminProductMedia();
  const [draft, setDraft] = useState({
    url: '',
    altText: '',
    kind: 'PRODUCT' as 'PRODUCT' | 'DETAIL' | 'SWATCH',
  });
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  async function addMedia(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const issues = validateMediaDraft(draft.url, draft.altText);
    if (issues.length) {
      setError(issues.join(' '));
      return;
    }
    try {
      await createMedia.mutateAsync({
        productId,
        input: { url: draft.url.trim(), altText: draft.altText.trim(), kind: draft.kind },
      });
      setDraft({ url: '', altText: '', kind: 'PRODUCT' });
    } catch (mutationError) {
      setError(adminCatalogInventoryErrorMessage(mutationError, 'رسانه ثبت نشد.'));
    }
  }
  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    const issues = validateCatalogMediaFile(file);
    setError(issues.join(' '));
    setSelectedFile(issues.length ? null : file);
  }
  async function uploadSelectedMedia(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const issues = validateCatalogMediaFile(selectedFile);
    if (issues.length) {
      setError(issues.join(' '));
      return;
    }
    if (!selectedFile) return;
    if (!draft.altText.trim()) {
      setError('متن جایگزین رسانه را وارد کنید.');
      return;
    }
    try {
      const dimensions = await readCatalogMediaDimensions(selectedFile);
      await uploadMedia.mutateAsync({
        productId,
        file: selectedFile,
        input: {
          contentType: catalogMediaContentType(selectedFile),
          sizeBytes: selectedFile.size,
          ...dimensions,
        },
        completeInput: {
          altText: draft.altText.trim(),
          kind: draft.kind,
        },
      });
      setSelectedFile(null);
      setFileInputKey((current) => current + 1);
      setDraft((current) => ({ ...current, altText: '' }));
      setError('');
    } catch (mutationError) {
      setError(adminCatalogInventoryErrorMessage(mutationError, 'بارگذاری رسانه انجام نشد.'));
    }
  }
  if (query.isPending && !query.data)
    return (
      <section className="border border-border bg-surface p-5">
        <LoadingState label="در حال دریافت رسانه‌ها..." />
      </section>
    );
  if (query.isError && !query.data)
    return (
      <section className="border border-border bg-surface p-5" role="alert">
        <StatePanel
          icon={isOfflineError(query.error) ? 'refresh' : 'warning'}
          title="رسانه‌های محصول در دسترس نیست"
          description={adminCatalogInventoryErrorMessage(query.error, 'دریافت رسانه‌ها انجام نشد.')}
          action={
            <Button onClick={() => void query.refetch()} variant="outline">
              <Icon name="refresh" size={16} /> تلاش دوباره
            </Button>
          }
          tone="danger"
        />
      </section>
    );
  return (
    <section className="border border-border bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.14em] text-primary">MEDIA</p>
          <h3 className="mt-2 font-semibold">رسانه محصول</h3>
        </div>
        <Icon name="layers" size={19} />
      </div>
      <p className="mt-2 text-[10px] leading-6 text-muted-foreground">
        فایل تصویر ابتدا با لینک امن در فضای ذخیره‌سازی بارگذاری و سپس با کنترل نوع، اندازه و ابعاد
        ثبت می‌شود.
      </p>
      {error ? (
        <p className="mt-3 text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {canWrite ? (
        <>
          <form className="mt-4 grid gap-2" onSubmit={uploadSelectedMedia}>
            <UiInput
              key={fileInputKey}
              accept="image/avif,image/gif,image/jpeg,image/png,image/webp"
              aria-label="فایل تصویر"
              className="min-h-11 border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              onChange={chooseFile}
              type="file"
            />
            <div className="grid gap-2 sm:grid-cols-[1fr_130px_auto]">
              <UiInput
                aria-label="متن جایگزین"
                className="min-h-11 border border-border bg-background px-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                onChange={(event) =>
                  setDraft((current) => ({ ...current, altText: event.target.value }))
                }
                placeholder="متن جایگزین"
                value={draft.altText}
              />
              <UiSelect
                aria-label="نوع رسانه"
                className="min-h-11 border border-border bg-background px-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    kind: event.target.value as typeof draft.kind,
                  }))
                }
                value={draft.kind}
              >
                <option value="PRODUCT">محصول</option>
                <option value="DETAIL">جزئیات</option>
                <option value="SWATCH">نمونه رنگ</option>
              </UiSelect>
              <Button loading={uploadMedia.isPending} type="submit">
                <Icon name="package" size={15} /> بارگذاری فایل
              </Button>
            </div>
          </form>
          <div className="my-4 flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            یا افزودن نشانی موجود
            <span className="h-px flex-1 bg-border" />
          </div>
          <form className="grid gap-2" onSubmit={addMedia}>
            <UiInput
              aria-label="نشانی رسانه"
              className="min-h-11 border border-border bg-background px-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              dir="ltr"
              onChange={(event) => setDraft((current) => ({ ...current, url: event.target.value }))}
              placeholder="https://..."
              value={draft.url}
            />
            <div className="grid gap-2 sm:grid-cols-[1fr_130px_auto]">
              <UiInput
                aria-label="متن جایگزین"
                className="min-h-11 border border-border bg-background px-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                onChange={(event) =>
                  setDraft((current) => ({ ...current, altText: event.target.value }))
                }
                placeholder="متن جایگزین"
                value={draft.altText}
              />
              <UiSelect
                aria-label="نوع رسانه"
                className="min-h-11 border border-border bg-background px-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    kind: event.target.value as typeof draft.kind,
                  }))
                }
                value={draft.kind}
              >
                <option value="PRODUCT">محصول</option>
                <option value="DETAIL">جزئیات</option>
                <option value="SWATCH">نمونه رنگ</option>
              </UiSelect>
              <Button loading={createMedia.isPending} type="submit">
                <Icon name="plus" size={15} /> افزودن
              </Button>
            </div>
          </form>
        </>
      ) : null}
      <div className="mt-5 divide-y divide-border">
        {(query.data ?? []).length === 0 ? (
          <p className="py-3 text-xs text-muted-foreground">رسانه‌ای ثبت نشده است.</p>
        ) : (
          (query.data ?? []).map((media) => (
            <MediaItem
              canDelete={canDeleteAdminProductMedia(productStatus, media, query.data ?? [])}
              canWrite={canWrite}
              deleteMedia={deleteMedia}
              key={media.id}
              media={media}
              productId={productId}
              updateMedia={updateMedia}
            />
          ))
        )}
      </div>
    </section>
  );
}

```

---


### 20. MediaThumb

**Path:** `src/features/catalog/components/catalog-inventory/media-thumb.tsx`

```tsx
import { Icon } from '@/shared/ui/icon';

export function MediaThumb({ src, alt }: { src?: string | null; alt: string }) {
  return src ? (
    <img
      className="h-12 w-12 shrink-0 rounded-control border border-border bg-secondary object-cover"
      src={src}
      alt={alt}
    />
  ) : (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control border border-border bg-secondary text-muted-foreground">
      <Icon name="bag" size={19} />
    </span>
  );
}

```

---


### 21. MutationStateBadge

**Path:** `src/features/catalog/components/catalog-inventory/mutation-state-badge.tsx`

```tsx
import { Badge } from '@nova/ui';

import type { AdminMutationState } from '@/features/catalog/pages/admin-catalog-inventory-page-shared';

import { mutationStateLabel } from '@/features/catalog/components/catalog-inventory/mutation-state-label';

export function MutationStateBadge({ state }: { state: AdminMutationState }) {
  const variant =
    state === 'saved'
      ? 'success'
      : state === 'saving'
        ? 'info'
        : state === 'invalid' || state === 'publish-blocked'
          ? 'destructive'
          : 'warning';
  return <Badge variant={variant}>{mutationStateLabel(state)}</Badge>;
}

```

---


### 22. OptionItem

**Path:** `src/features/catalog/components/catalog-inventory/option-item.tsx`

```tsx
import { useState } from 'react';
import { type AdminCatalogProductOption } from '@nova/api-client';
import { Button, Input as UiInput } from '@nova/ui';

import { Icon } from '@/shared/ui/icon';

import { OptionValue } from '@/features/catalog/components/catalog-inventory/option-value';

export function OptionItem({
  option,
  canWrite,
  newValue,
  onNewValue,
  onAddValue,
  createValue,
  onUpdate,
  onUpdateValue,
}: {
  option: AdminCatalogProductOption;
  canWrite: boolean;
  newValue: string;
  onNewValue: (value: string) => void;
  onAddValue: () => void;
  createValue: boolean;
  onUpdate: (name: string) => Promise<void>;
  onUpdateValue: (value: { id: string; label: string }) => Promise<void>;
}) {
  const [name, setName] = useState(option.name);
  return (
    <div className="py-4">
      <div className="flex items-center gap-2">
        <UiInput
          aria-label={`نام گزینه ${option.key}`}
          className="min-h-10 min-w-0 flex-1 border border-border bg-background px-3 text-xs font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          disabled={!canWrite}
          onChange={(event) => setName(event.target.value)}
          value={name}
        />
        {canWrite ? (
          <Button
            aria-label={`ذخیره گزینه ${option.name}`}
            onClick={() => void onUpdate(name.trim())}
            size="icon"
            variant="outline"
          >
            <Icon name="check" size={15} />
          </Button>
        ) : null}
        <span className="text-[10px] text-muted-foreground" dir="ltr">
          {option.key}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {option.values.map((value) => (
          <OptionValue key={value.id} value={value} canWrite={canWrite} onSave={onUpdateValue} />
        ))}
      </div>
      {canWrite ? (
        <div className="mt-3 flex gap-2">
          <UiInput
            aria-label={`مقدار جدید برای ${option.name}`}
            className="min-h-10 min-w-0 flex-1 border border-border bg-background px-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            dir="ltr"
            onChange={(event) => onNewValue(event.target.value)}
            placeholder="new-value"
            value={newValue}
          />
          <Button loading={createValue} onClick={onAddValue} size="sm" type="button">
            <Icon name="plus" size={15} /> مقدار
          </Button>
        </div>
      ) : null}
    </div>
  );
}

```

---


### 23. OptionValue

**Path:** `src/features/catalog/components/catalog-inventory/option-value.tsx`

```tsx
import { useState } from 'react';

import { Button, Input as UiInput } from '@nova/ui';

import { Icon } from '@/shared/ui/icon';

export function OptionValue({
  value,
  canWrite,
  onSave,
}: {
  value: { id: string; label: string };
  canWrite: boolean;
  onSave: (value: { id: string; label: string }) => Promise<void>;
}) {
  const [label, setLabel] = useState(value.label);
  return (
    <span className="inline-flex min-h-9 items-center gap-1 border border-border bg-background px-2">
      <UiInput
        aria-label={`ویرایش مقدار ${value.label}`}
        className="w-20 bg-transparent text-xs outline-none"
        disabled={!canWrite}
        onChange={(event) => setLabel(event.target.value)}
        value={label}
      />
      {canWrite ? (
        <Button
          aria-label={`ذخیره مقدار ${value.label}`}
          className="flex h-7 w-7 items-center justify-center text-primary focus-visible:outline-2 focus-visible:outline-primary"
          onClick={() => void onSave({ id: value.id, label: label.trim() })}
          type="button"
        >
          <Icon name="check" size={13} />
        </Button>
      ) : null}
    </span>
  );
}

```

---


### 24. OptionsPanel

**Path:** `src/features/catalog/components/catalog-inventory/options-panel.tsx`

```tsx
import { useState, type FormEvent } from 'react';
import { type AdminCatalogProductOption } from '@nova/api-client';
import { Button, Input as UiInput } from '@nova/ui';
import type { useAdminProductOptions } from '@/features/catalog/api/catalog/admin-catalog-api';
import {
  useCreateAdminProductOption,
  useCreateAdminProductOptionValue,
  useUpdateAdminProductOption,
  useUpdateAdminProductOptionValue,
} from '@/features/catalog/api/catalog/admin-catalog-api';

import { Icon } from '@/shared/ui/icon';

import { catalogKeyPattern } from '@/features/catalog/pages/admin-catalog-inventory-page-shared';

import { LoadingState } from '@/features/catalog/components/catalog-inventory/loading-state';

import { OptionItem } from '@/features/catalog/components/catalog-inventory/option-item';

import { StatePanel } from '@/features/catalog/components/catalog-inventory/state-panel';

import { adminCatalogInventoryErrorMessage } from '@/features/catalog/components/catalog-inventory/admin-catalog-inventory-error-message';

import { isOfflineError } from '@/features/catalog/components/catalog-inventory/is-offline-error';

export function OptionsPanel({
  productId,
  query,
  canWrite,
}: {
  productId: string;
  query: ReturnType<typeof useAdminProductOptions>;
  canWrite: boolean;
}) {
  const createOption = useCreateAdminProductOption();
  const updateOption = useUpdateAdminProductOption();
  const createValue = useCreateAdminProductOptionValue();
  const updateValue = useUpdateAdminProductOptionValue();
  const [newOption, setNewOption] = useState({ key: '', name: '' });
  const [newValues, setNewValues] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  async function addOption(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!catalogKeyPattern.test(newOption.key.trim()) || !newOption.name.trim()) {
      setError('کلید لاتین و نام گزینه معتبر لازم است.');
      return;
    }
    try {
      await createOption.mutateAsync({
        productId,
        input: { key: newOption.key.trim(), name: newOption.name.trim() },
      });
      setNewOption({ key: '', name: '' });
    } catch (mutationError) {
      setError(adminCatalogInventoryErrorMessage(mutationError, 'گزینه ثبت نشد.'));
    }
  }
  async function addValue(option: AdminCatalogProductOption) {
    const value = newValues[option.id]?.trim() ?? '';
    if (!catalogKeyPattern.test(value)) {
      setError('کلید مقدار باید با حروف لاتین کوچک، عدد و خط تیره باشد.');
      return;
    }
    try {
      await createValue.mutateAsync({
        productId,
        optionId: option.id,
        input: { key: value, label: value },
      });
      setNewValues((current) => ({ ...current, [option.id]: '' }));
    } catch (mutationError) {
      setError(adminCatalogInventoryErrorMessage(mutationError, 'مقدار گزینه ثبت نشد.'));
    }
  }
  if (query.isPending && !query.data)
    return (
      <section className="border border-border bg-surface p-5">
        <LoadingState label="در حال دریافت گزینه‌ها..." />
      </section>
    );
  if (query.isError && !query.data)
    return (
      <section className="border border-border bg-surface p-5" role="alert">
        <StatePanel
          icon={isOfflineError(query.error) ? 'refresh' : 'warning'}
          title="گزینه‌های محصول در دسترس نیست"
          description={adminCatalogInventoryErrorMessage(query.error, 'دریافت گزینه‌ها انجام نشد.')}
          action={
            <Button onClick={() => void query.refetch()} variant="outline">
              <Icon name="refresh" size={16} /> تلاش دوباره
            </Button>
          }
          tone="danger"
        />
      </section>
    );
  return (
    <section className="border border-border bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.14em] text-primary">OPTIONS</p>
          <h3 className="mt-2 font-semibold">گزینه‌ها و مقدارها</h3>
        </div>
        <Icon name="tag" size={19} />
      </div>
      {error ? (
        <p className="mt-3 text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {canWrite ? (
        <form className="mt-4 grid gap-2 sm:grid-cols-[.7fr_1fr_auto]" onSubmit={addOption}>
          <UiInput
            aria-label="کلید گزینه"
            className="min-h-11 border border-border bg-background px-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            dir="ltr"
            onChange={(event) =>
              setNewOption((current) => ({ ...current, key: event.target.value }))
            }
            placeholder="size"
            value={newOption.key}
          />
          <UiInput
            aria-label="نام گزینه"
            className="min-h-11 border border-border bg-background px-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            onChange={(event) =>
              setNewOption((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="سایز"
            value={newOption.name}
          />
          <Button loading={createOption.isPending} size="sm" type="submit">
            <Icon name="plus" size={15} /> افزودن
          </Button>
        </form>
      ) : null}
      <div className="mt-4 divide-y divide-border">
        {(query.data ?? []).length === 0 ? (
          <p className="py-3 text-xs text-muted-foreground">گزینه‌ای ثبت نشده است.</p>
        ) : (
          (query.data ?? []).map((option) => (
            <OptionItem
              canWrite={canWrite}
              createValue={createValue.isPending}
              key={option.id}
              option={option}
              newValue={newValues[option.id] ?? ''}
              onNewValue={(value) =>
                setNewValues((current) => ({ ...current, [option.id]: value }))
              }
              onAddValue={() => void addValue(option)}
              onUpdate={async (name) => {
                try {
                  await updateOption.mutateAsync({
                    productId,
                    optionId: option.id,
                    input: { name },
                  });
                } catch (mutationError) {
                  setError(adminCatalogInventoryErrorMessage(mutationError, 'گزینه ویرایش نشد.'));
                }
              }}
              onUpdateValue={async (value) => {
                try {
                  await updateValue.mutateAsync({
                    productId,
                    optionId: option.id,
                    valueId: value.id,
                    input: { label: value.label },
                  });
                } catch (mutationError) {
                  setError(
                    adminCatalogInventoryErrorMessage(mutationError, 'مقدار گزینه ویرایش نشد.'),
                  );
                }
              }}
            />
          ))
        )}
      </div>
    </section>
  );
}

```

---


### 25. Pagination

**Path:** `src/features/catalog/components/catalog-inventory/pagination.tsx`

```tsx
import { Button } from '@nova/ui';

import { Icon } from '@/shared/ui/icon';

import { formatPersianNumber as formatNumber } from '@/shared/utils/format-persian-number';

import { pageCount } from '@/features/catalog/components/catalog-inventory/page-count';

export function Pagination({
  page,
  total,
  limit,
  onPageChange,
}: {
  page: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}) {
  const pages = pageCount(total, limit);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-[11px] text-muted-foreground">
      <span>
        صفحه {formatNumber(page)} از {formatNumber(pages)} · {formatNumber(total)} نتیجه
      </span>
      <div className="flex items-center gap-2" dir="ltr">
        <Button
          aria-label="صفحه قبل"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-control border border-border bg-background transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          type="button"
        >
          <Icon name="arrow-left" size={16} />
        </Button>
        <span className="min-w-11 text-center" dir="rtl">
          {formatNumber(page)}
        </span>
        <Button
          aria-label="صفحه بعد"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-control border border-border bg-background transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
          type="button"
        >
          <Icon name="arrow-right" size={16} />
        </Button>
      </div>
    </div>
  );
}

```

---


### 26. PermissionPanel

**Path:** `src/features/catalog/components/catalog-inventory/permission-panel.tsx`

```tsx
import { StatePanel } from '@/features/catalog/components/catalog-inventory/state-panel';

export function PermissionPanel({ title = 'دسترسی کافی ندارید' }: { title?: string }) {
  return (
    <StatePanel
      icon="warning"
      title={title}
      description="این بخش برای نقش فعلی شما فعال نیست."
      tone="danger"
    />
  );
}

```

---


### 27. ProductCard

**Path:** `src/features/catalog/components/catalog-inventory/product-card.tsx`

```tsx
import { type AdminCatalogProductListItem } from '@nova/api-client';

import { MediaThumb } from '@/features/catalog/components/catalog-inventory/media-thumb';

import { StatusBadge } from '@/features/catalog/components/catalog-inventory/status-badge';

import { formatToman } from '@/shared/utils/format-toman';

export function ProductCard({ product }: { product: AdminCatalogProductListItem }) {
  return (
    <article className="grid grid-cols-[48px_minmax(0,1fr)] items-center gap-2 border border-border bg-background p-2">
      <MediaThumb
        src={product.primaryMedia?.url}
        alt={product.primaryMedia?.altText ?? product.name}
      />
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <a
            className="font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            href={`/admin/catalog/products/${encodeURIComponent(product.id)}`}
          >
            {product.name}
          </a>
          <StatusBadge status={product.status} />
        </div>
        <p className="mt-1 truncate text-[10px] text-muted-foreground" dir="ltr">
          {product.slug}
        </p>
        <dl className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
          <div className="flex items-center gap-1">
            <dt className="text-muted-foreground">قیمت:</dt>
            <dd>{formatToman(product.basePriceToman)}</dd>
          </div>
          <div className="flex items-center gap-1">
            <dt className="text-muted-foreground">موجودی:</dt>
            <dd>
              <StatusBadge status={product.inventory.status} />
            </dd>
          </div>
        </dl>
      </div>
    </article>
  );
}

```

---


### 28. ProductEditor

**Path:** `src/features/catalog/components/catalog-inventory/product-editor.tsx`

```tsx
import { useEffect, useState, type FormEvent } from 'react';
import {
  type AdminCatalogProductCreateInput,
  type AdminCatalogProductDetail,
} from '@nova/api-client';
import { Button, Input as UiInput, Textarea as UiTextarea } from '@nova/ui';
import {
  useAdminCatalogCategories,
  useAdminCatalogProduct,
  useAdminProductCategories,
  useAdminProductMedia,
  useAdminProductOptions,
  useAdminProductVariants,
  useCreateAdminCatalogProduct,
  useReplaceAdminProductCategories,
  useUpdateAdminCatalogProduct,
  useUpdateAdminCatalogProductStatus,
} from '@/features/catalog/api/catalog/admin-catalog-api';

import { Icon } from '@/shared/ui/icon';

import type { ProductDraftValues } from '@/features/catalog/pages/admin-catalog-inventory-page-shared';

import { LoadingState } from '@/features/catalog/components/catalog-inventory/loading-state';

import { MediaPanel } from '@/features/catalog/components/catalog-inventory/media-panel';

import { MutationStateBadge } from '@/features/catalog/components/catalog-inventory/mutation-state-badge';

import { OptionsPanel } from '@/features/catalog/components/catalog-inventory/options-panel';

import { PermissionPanel } from '@/features/catalog/components/catalog-inventory/permission-panel';

import { QueryState } from '@/features/catalog/components/catalog-inventory/query-state';

import { StatePanel } from '@/features/catalog/components/catalog-inventory/state-panel';

import { StatusBadge } from '@/features/catalog/components/catalog-inventory/status-badge';

import { TaxonomyPanel } from '@/features/catalog/components/catalog-inventory/taxonomy-panel';

import { VariantsPanel } from '@/features/catalog/components/catalog-inventory/variants-panel';

import { adminCatalogInventoryErrorMessage } from '@/features/catalog/components/catalog-inventory/admin-catalog-inventory-error-message';

import { adminProductStatusAction } from '@/features/catalog/components/catalog-inventory/admin-product-status-action';

import { buildAdminCatalogProductUpdateInput } from '@/features/catalog/components/catalog-inventory/build-admin-catalog-product-update-input';

import { formatDate } from '@/features/catalog/components/catalog-inventory/format-date';

import { hasAdminRole } from '@/features/catalog/components/catalog-inventory/has-admin-role';

import { ltr } from '@/features/catalog/components/catalog-inventory/ltr';

import { mutationStateLabel } from '@/features/catalog/components/catalog-inventory/mutation-state-label';

import { resolveAdminMutationState } from '@/features/catalog/components/catalog-inventory/resolve-admin-mutation-state';

import { validateProductDraft } from '@/features/catalog/components/catalog-inventory/validate-product-draft';

export function ProductEditor({
  roles,
  productId,
}: {
  roles: readonly string[];
  productId?: string;
}) {
  const canWrite = hasAdminRole(roles, ['admin']);
  const [localProductId, setLocalProductId] = useState(productId ?? '');
  const [createdProduct, setCreatedProduct] = useState<AdminCatalogProductDetail | null>(null);
  const effectiveProductId = createdProduct?.id ?? localProductId;
  const productQuery = useAdminCatalogProduct(productId ?? '', Boolean(productId));
  const product = createdProduct ?? productQuery.data;
  const categoriesQuery = useAdminCatalogCategories();
  const productCategoriesQuery = useAdminProductCategories(effectiveProductId);
  const optionsQuery = useAdminProductOptions(effectiveProductId);
  const variantsQuery = useAdminProductVariants(effectiveProductId);
  const mediaQuery = useAdminProductMedia(effectiveProductId);
  const createProductMutation = useCreateAdminCatalogProduct();
  const updateProductMutation = useUpdateAdminCatalogProduct();
  const statusMutation = useUpdateAdminCatalogProductStatus();
  const replaceCategoriesMutation = useReplaceAdminProductCategories();
  const [draft, setDraft] = useState<ProductDraftValues>({
    slug: '',
    name: '',
    shortDescription: '',
    description: '',
    brand: '',
    basePriceToman: '',
    compareAtPriceToman: '',
  });
  const [loadedKey, setLoadedKey] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const isCreate = !effectiveProductId;
  const validationIssues = validateProductDraft(draft, isCreate ? 'create' : 'edit');
  const publishBlockers = validationIssues;
  const isProductDirty =
    isCreate ||
    !product ||
    draft.name.trim() !== product.name ||
    draft.shortDescription.trim() !== (product.shortDescription ?? '') ||
    draft.description.trim() !== (product.description ?? '') ||
    draft.brand.trim() !== (product.brand ?? '') ||
    Number(draft.basePriceToman) !== product.basePriceToman ||
    draft.compareAtPriceToman.trim() !==
      (product.compareAtPriceToman === null ? '' : String(product.compareAtPriceToman));
  const mutationState = resolveAdminMutationState({
    isDirty: isProductDirty,
    isPending: createProductMutation.isPending || updateProductMutation.isPending,
    isError: createProductMutation.isError || updateProductMutation.isError,
    isSuccess: createProductMutation.isSuccess || updateProductMutation.isSuccess,
    hasInvalidFields: validationIssues.length > 0,
    hasPublishBlockers: !isCreate && publishBlockers.length > 0,
  });

  useEffect(() => {
    if (!product) return;
    const key = `${product.id}:${product.updatedAt}`;
    if (key === loadedKey) return;
    setDraft({
      slug: product.slug,
      name: product.name,
      shortDescription: product.shortDescription ?? '',
      description: product.description ?? '',
      brand: product.brand ?? '',
      basePriceToman: String(product.basePriceToman),
      compareAtPriceToman:
        product.compareAtPriceToman === null ? '' : String(product.compareAtPriceToman),
    });
    setLoadedKey(key);
  }, [loadedKey, product]);
  useEffect(() => {
    if (productCategoriesQuery.data)
      setSelectedCategoryIds(productCategoriesQuery.data.map((category) => category.id));
  }, [productCategoriesQuery.data]);

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (validationIssues.length) {
      setError(validationIssues.join(' '));
      return;
    }
    setError('');
    try {
      if (isCreate) {
        const input: AdminCatalogProductCreateInput = {
          slug: draft.slug.trim(),
          name: draft.name.trim(),
          shortDescription: draft.shortDescription.trim() || null,
          description: draft.description.trim() || null,
          brand: draft.brand.trim() || null,
          basePriceToman: Number(draft.basePriceToman),
          compareAtPriceToman: draft.compareAtPriceToman.trim()
            ? Number(draft.compareAtPriceToman)
            : null,
        };
        const created = await createProductMutation.mutateAsync(input);
        setCreatedProduct(created);
        setLocalProductId(created.id);
      } else {
        if (!product) return;
        await updateProductMutation.mutateAsync({
          productId: product.id,
          input: buildAdminCatalogProductUpdateInput(draft, product),
        });
      }
    } catch (mutationError) {
      setError(adminCatalogInventoryErrorMessage(mutationError, 'محصول ذخیره نشد.'));
    }
  }
  async function setProductStatus(status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') {
    if (!product) return;
    if (status === 'PUBLISHED' && publishBlockers.length) {
      setError('انتشار تا رفع خطاهای فرم مسدود است.');
      return;
    }
    setError('');
    try {
      await statusMutation.mutateAsync({ productId: product.id, input: { status } });
    } catch (mutationError) {
      setError(adminCatalogInventoryErrorMessage(mutationError, 'وضعیت محصول تغییر نکرد.'));
    }
  }
  async function saveCategories() {
    if (!effectiveProductId) return;
    setError('');
    try {
      await replaceCategoriesMutation.mutateAsync({
        productId: effectiveProductId,
        input: { categoryIds: selectedCategoryIds },
      });
    } catch (mutationError) {
      setError(adminCatalogInventoryErrorMessage(mutationError, 'دسته‌بندی محصول ذخیره نشد.'));
    }
  }

  if (!canWrite && !hasAdminRole(roles, ['support', 'operations', 'admin']))
    return <PermissionPanel title="دسترسی مشاهده کاتالوگ ندارید" />;
  if (!isCreate && productQuery.isPending && !product)
    return <LoadingState label="در حال دریافت محصول..." />;
  if (!isCreate && productQuery.isError && !product)
    return (
      <QueryState
        pending={false}
        error={productQuery.error}
        hasData={false}
        onRetry={() => void productQuery.refetch()}
      >
        {null}
      </QueryState>
    );
  if (!isCreate && !product)
    return (
      <StatePanel
        icon="bag"
        title="محصول پیدا نشد"
        description="شناسه محصول در سرویس مدیریت وجود ندارد یا دسترسی مشاهده آن محدود شده است."
        tone="danger"
      />
    );
  return (
    <div className="space-y-5">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <a
            className="inline-flex min-h-11 items-center gap-2 text-xs text-primary focus-visible:outline-2 focus-visible:outline-primary"
            href="/admin/catalog"
          >
            <Icon name="arrow-right" size={16} /> بازگشت به محصولات
          </a>
          <p className="mt-3 text-[10px] font-semibold tracking-[0.16em] text-primary">
            CATALOG / PRODUCT EDITOR
          </p>
          <h2 className="mt-2 text-2xl font-semibold">{isCreate ? 'محصول جدید' : product?.name}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {isCreate ? (
              'اطلاعات پایه را ثبت کنید؛ تنوع و رسانه پس از ذخیره فعال می‌شود.'
            ) : (
              <>
                آخرین تغییر: {formatDate(product?.updatedAt)} ·{' '}
                {ltr(product?.id ?? effectiveProductId)}
              </>
            )}
          </p>
        </div>
        {product ? (
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={product.status} />
            {canWrite ? (
              <>
                <Button
                  disabled={
                    statusMutation.isPending ||
                    (product.status !== 'ARCHIVED' && publishBlockers.length > 0)
                  }
                  loading={statusMutation.isPending}
                  onClick={() =>
                    void setProductStatus(adminProductStatusAction(product.status).targetStatus)
                  }
                  variant="outline"
                >
                  {adminProductStatusAction(product.status).label}
                </Button>
                {product.status !== 'ARCHIVED' ? (
                  <Button
                    disabled={statusMutation.isPending}
                    onClick={() => void setProductStatus('ARCHIVED')}
                    variant="ghost"
                  >
                    آرشیو
                  </Button>
                ) : null}
              </>
            ) : null}
          </div>
        ) : null}
      </header>
      {error ? (
        <p
          className="border border-destructive/30 bg-error-soft px-4 py-3 text-xs text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <form
        className="border border-border bg-surface p-4 shadow-card md:p-5"
        onSubmit={saveProduct}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <h3 className="font-semibold">اطلاعات پایه</h3>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {mutationStateLabel(mutationState)}
            </p>
          </div>
          <MutationStateBadge state={mutationState} />
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-xs text-muted-foreground">
            شناسه محصول
            <span className="relative mt-2 block">
              <UiInput
                className="min-h-12 w-full border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-secondary"
                dir="ltr"
                disabled={!isCreate || !canWrite}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, slug: event.target.value }))
                }
                value={draft.slug}
              />
            </span>
          </label>
          <label className="text-xs text-muted-foreground">
            نام محصول
            <UiInput
              className="mt-2 min-h-12 w-full border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              disabled={!canWrite}
              onChange={(event) =>
                setDraft((current) => ({ ...current, name: event.target.value }))
              }
              value={draft.name}
            />
          </label>
          <label className="text-xs text-muted-foreground">
            قیمت پایه (تومان)
            <UiInput
              className="mt-2 min-h-12 w-full border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              dir="ltr"
              disabled={!canWrite}
              inputMode="numeric"
              onChange={(event) =>
                setDraft((current) => ({ ...current, basePriceToman: event.target.value }))
              }
              value={draft.basePriceToman}
            />
          </label>
          <label className="text-xs text-muted-foreground">
            قیمت قبل (اختیاری)
            <UiInput
              className="mt-2 min-h-12 w-full border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              dir="ltr"
              disabled={!canWrite}
              inputMode="numeric"
              onChange={(event) =>
                setDraft((current) => ({ ...current, compareAtPriceToman: event.target.value }))
              }
              value={draft.compareAtPriceToman}
            />
          </label>
          <label className="text-xs text-muted-foreground">
            برند
            <UiInput
              className="mt-2 min-h-12 w-full border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              disabled={!canWrite}
              onChange={(event) =>
                setDraft((current) => ({ ...current, brand: event.target.value }))
              }
              value={draft.brand}
            />
          </label>
          <label className="text-xs text-muted-foreground md:col-span-2">
            توضیح کوتاه
            <UiTextarea
              className="mt-2 min-h-20 w-full border border-border bg-background px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              disabled={!canWrite}
              onChange={(event) =>
                setDraft((current) => ({ ...current, shortDescription: event.target.value }))
              }
              value={draft.shortDescription}
            />
          </label>
          <label className="text-xs text-muted-foreground md:col-span-2">
            توضیحات
            <UiTextarea
              className="mt-2 min-h-28 w-full border border-border bg-background px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              disabled={!canWrite}
              onChange={(event) =>
                setDraft((current) => ({ ...current, description: event.target.value }))
              }
              value={draft.description}
            />
          </label>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {canWrite ? (
            <Button
              loading={createProductMutation.isPending || updateProductMutation.isPending}
              type="submit"
            >
              <Icon name="check" size={16} /> ذخیره محصول
            </Button>
          ) : null}
          {validationIssues.length ? (
            <span className="text-xs text-destructive">{validationIssues[0]}</span>
          ) : null}
        </div>
      </form>
      {effectiveProductId ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <TaxonomyPanel
            categories={categoriesQuery.data ?? []}
            selectedIds={selectedCategoryIds}
            canWrite={canWrite}
            onToggle={(id) =>
              setSelectedCategoryIds((current) =>
                current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
              )
            }
            onSave={saveCategories}
            saving={replaceCategoriesMutation.isPending}
          />
          <OptionsPanel productId={effectiveProductId} query={optionsQuery} canWrite={canWrite} />
        </div>
      ) : null}
      {effectiveProductId ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <VariantsPanel
            productId={effectiveProductId}
            query={variantsQuery}
            options={optionsQuery.data ?? []}
            canWrite={canWrite}
          />
          <MediaPanel
            productId={effectiveProductId}
            productStatus={product?.status ?? 'DRAFT'}
            query={mediaQuery}
            canWrite={canWrite}
          />
        </div>
      ) : null}
    </div>
  );
}

```

---


### 29. ProductTableRow

**Path:** `src/features/catalog/components/catalog-inventory/product-table-row.tsx`

```tsx
import { type AdminCatalogProductListItem } from '@nova/api-client';

import { Icon } from '@/shared/ui/icon';

import { MediaThumb } from '@/features/catalog/components/catalog-inventory/media-thumb';

import { StatusBadge } from '@/features/catalog/components/catalog-inventory/status-badge';

import { formatPersianNumber as formatNumber } from '@/shared/utils/format-persian-number';

import { formatToman } from '@/shared/utils/format-toman';

export function ProductTableRow({ product }: { product: AdminCatalogProductListItem }) {
  return (
    <tr className="border-b border-border last:border-b-0 hover:bg-background">
      <td className="px-4 py-4 align-top">
        <a
          className="flex min-h-11 items-center gap-3 rounded-control focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          href={`/admin/catalog/products/${encodeURIComponent(product.id)}`}
        >
          <MediaThumb
            src={product.primaryMedia?.url}
            alt={product.primaryMedia?.altText ?? product.name}
          />
          <span>
            <span className="block font-semibold">{product.name}</span>
            <span className="mt-1 block text-[10px] text-muted-foreground" dir="ltr">
              {product.slug}
            </span>
          </span>
        </a>
      </td>
      <td className="px-4 py-4 align-top text-muted-foreground">
        {product.categories.length
          ? product.categories.map((category) => category.name).join('، ')
          : 'بدون دسته'}
      </td>
      <td className="px-4 py-4 align-top whitespace-nowrap">
        {formatToman(product.basePriceToman)}
      </td>
      <td className="px-4 py-4 align-top">
        <StatusBadge status={product.inventory.status} />
        <span className="mt-1 block text-[10px] text-muted-foreground">
          {formatNumber(product.inventory.available)} قابل فروش
        </span>
      </td>
      <td className="px-4 py-4 align-top">
        <StatusBadge status={product.status} />
      </td>
      <td className="px-4 py-4 align-top">
        <a
          aria-label={`ویرایش ${product.name}`}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-primary hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          href={`/admin/catalog/products/${encodeURIComponent(product.id)}`}
        >
          <Icon name="edit" size={17} />
        </a>
      </td>
    </tr>
  );
}

```

---


### 30. QueryState

**Path:** `src/features/catalog/components/catalog-inventory/query-state.tsx`

```tsx
import { type ReactNode } from 'react';

import { Button } from '@nova/ui';

import { Icon } from '@/shared/ui/icon';

import { LoadingState } from '@/features/catalog/components/catalog-inventory/loading-state';

import { StatePanel } from '@/features/catalog/components/catalog-inventory/state-panel';

import { adminCatalogInventoryErrorMessage } from '@/features/catalog/components/catalog-inventory/admin-catalog-inventory-error-message';

import { isOfflineError } from '@/features/catalog/components/catalog-inventory/is-offline-error';

export function QueryState({
  pending,
  error,
  hasData,
  empty,
  onRetry,
  children,
}: {
  pending: boolean;
  error: unknown;
  hasData: boolean;
  empty?: boolean;
  onRetry: () => void;
  children: ReactNode;
}) {
  if (pending && !hasData) return <LoadingState />;
  if (error && !hasData) {
    const offline = isOfflineError(error);
    return (
      <StatePanel
        icon={offline ? 'refresh' : 'warning'}
        title={offline ? 'اتصال شبکه در دسترس نیست' : 'دریافت اطلاعات انجام نشد'}
        description={
          offline
            ? 'اتصال را بررسی کنید و دوباره تلاش کنید.'
            : adminCatalogInventoryErrorMessage(error, 'اطلاعات فعلاً در دسترس نیست.')
        }
        action={
          <Button onClick={onRetry} variant="outline">
            <Icon name="refresh" size={16} /> تلاش دوباره
          </Button>
        }
        tone="danger"
      />
    );
  }
  if (empty) {
    return (
      <StatePanel
        icon="layers"
        title="موردی پیدا نشد"
        description="فیلترها را تغییر دهید یا اولین مورد را از همین نما ثبت کنید."
      />
    );
  }
  return <>{children}</>;
}

```

---


### 31. StatePanel

**Path:** `src/features/catalog/components/catalog-inventory/state-panel.tsx`

```tsx
import { type ReactNode } from 'react';

import { Icon, type IconName } from '@/shared/ui/icon';

export function StatePanel({
  icon,
  title,
  description,
  action,
  tone = 'neutral',
}: {
  icon: IconName;
  title: string;
  description: string;
  action?: ReactNode;
  tone?: 'neutral' | 'danger';
}) {
  return (
    <section
      className={`border bg-surface p-8 text-center shadow-card ${tone === 'danger' ? 'border-destructive/40' : 'border-border'}`}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      <div
        className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${tone === 'danger' ? 'bg-error-soft text-destructive' : 'bg-accent-soft text-primary'}`}
      >
        <Icon name={icon} size={22} />
      </div>
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-muted-foreground">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </section>
  );
}

```

---


### 32. StatusBadge

**Path:** `src/features/catalog/components/catalog-inventory/status-badge.tsx`

```tsx
import { Badge } from '@nova/ui';

import { statusBadgeVariant } from '@/features/catalog/components/catalog-inventory/status-badge-variant';

import { statusLabel } from '@/features/catalog/components/catalog-inventory/status-label';

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={statusBadgeVariant(status)}>{statusLabel(status)}</Badge>;
}

```

---


### 33. TaxonomyPanel

**Path:** `src/features/catalog/components/catalog-inventory/taxonomy-panel.tsx`

```tsx
import { type AdminCatalogCategory } from '@nova/api-client';
import { Button, Checkbox } from '@nova/ui';

import { Icon } from '@/shared/ui/icon';

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

```

---


### 34. VariantItem

**Path:** `src/features/catalog/components/catalog-inventory/variant-item.tsx`

```tsx
import { useState } from 'react';
import { type AdminCatalogProductVariant } from '@nova/api-client';
import { Button, Input as UiInput } from '@nova/ui';
import type { useUpdateAdminProductVariant } from '@/features/catalog/api/catalog/admin-catalog-api';

import { Icon } from '@/shared/ui/icon';

import { StatusBadge } from '@/features/catalog/components/catalog-inventory/status-badge';

import { formatDate } from '@/features/catalog/components/catalog-inventory/format-date';

export function VariantItem({
  variant,
  productId,
  canWrite,
  update,
}: {
  variant: AdminCatalogProductVariant;
  productId: string;
  canWrite: boolean;
  update: ReturnType<typeof useUpdateAdminProductVariant>;
}) {
  const [title, setTitle] = useState(variant.title ?? '');
  const [size, setSize] = useState(variant.size ?? '');
  const [color, setColor] = useState(variant.color ?? '');
  const [price, setPrice] = useState(variant.priceToman === null ? '' : String(variant.priceToman));
  return (
    <div className="py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-xs font-semibold" dir="ltr">
            {variant.sku}
          </span>
          <span className="ms-2">
            <StatusBadge status={variant.isActive ? 'ACTIVE' : 'INACTIVE'} />
          </span>
        </div>
        <a
          className="inline-flex min-h-10 items-center gap-1 text-[11px] text-primary focus-visible:outline-2 focus-visible:outline-primary"
          href={`/admin/inventory/${encodeURIComponent(variant.id)}`}
        >
          موجودی <Icon name="arrow-left" size={13} />
        </a>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <UiInput
          aria-label={`عنوان ${variant.sku}`}
          className="min-h-10 border border-border bg-background px-2 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          disabled={!canWrite}
          onChange={(event) => setTitle(event.target.value)}
          value={title}
        />
        <UiInput
          aria-label={`سایز ${variant.sku}`}
          className="min-h-10 border border-border bg-background px-2 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          disabled={!canWrite}
          onChange={(event) => setSize(event.target.value)}
          value={size}
        />
        <UiInput
          aria-label={`رنگ ${variant.sku}`}
          className="min-h-10 border border-border bg-background px-2 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          disabled={!canWrite}
          onChange={(event) => setColor(event.target.value)}
          value={color}
        />
        <UiInput
          aria-label={`قیمت ${variant.sku}`}
          className="min-h-10 border border-border bg-background px-2 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          dir="ltr"
          disabled={!canWrite}
          inputMode="numeric"
          onChange={(event) => setPrice(event.target.value)}
          value={price}
        />
      </div>
      {canWrite ? (
        <Button
          className="mt-2"
          loading={update.isPending}
          onClick={() =>
            void update.mutateAsync({
              productId,
              variantId: variant.id,
              input: {
                title: title.trim() || null,
                size: size.trim() || null,
                color: color.trim() || null,
                priceToman: price.trim() ? Number(price) : null,
              },
            })
          }
          size="sm"
          variant="outline"
        >
          <Icon name="check" size={14} /> ذخیره تنوع
        </Button>
      ) : null}
      <p className="mt-2 text-[10px] text-muted-foreground">
        آخرین تغییر: {formatDate(variant.updatedAt)} · موجودی از نمای موجودی کنترل می‌شود.
      </p>
    </div>
  );
}

```

---


### 35. VariantsPanel

**Path:** `src/features/catalog/components/catalog-inventory/variants-panel.tsx`

```tsx
import { useState, type FormEvent } from 'react';
import { type AdminCatalogProductOption } from '@nova/api-client';
import { Button, Input as UiInput } from '@nova/ui';
import type { useAdminProductVariants } from '@/features/catalog/api/catalog/admin-catalog-api';
import {
  useCreateAdminProductVariant,
  useUpdateAdminProductVariant,
} from '@/features/catalog/api/catalog/admin-catalog-api';

import { Icon } from '@/shared/ui/icon';

import { LoadingState } from '@/features/catalog/components/catalog-inventory/loading-state';

import { StatePanel } from '@/features/catalog/components/catalog-inventory/state-panel';

import { VariantItem } from '@/features/catalog/components/catalog-inventory/variant-item';

import { adminCatalogInventoryErrorMessage } from '@/features/catalog/components/catalog-inventory/admin-catalog-inventory-error-message';

import { isOfflineError } from '@/features/catalog/components/catalog-inventory/is-offline-error';

export function VariantsPanel({
  productId,
  query,
  options,
  canWrite,
}: {
  productId: string;
  query: ReturnType<typeof useAdminProductVariants>;
  options: AdminCatalogProductOption[];
  canWrite: boolean;
}) {
  const createVariant = useCreateAdminProductVariant();
  const updateVariant = useUpdateAdminProductVariant();
  const [draft, setDraft] = useState({ sku: '', title: '', size: '', color: '', priceToman: '' });
  const [error, setError] = useState('');
  async function addVariant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/.test(draft.sku.trim())) {
      setError('SKU فقط با حروف لاتین، عدد و . _ - معتبر است.');
      return;
    }
    try {
      await createVariant.mutateAsync({
        productId,
        input: {
          sku: draft.sku.trim(),
          title: draft.title.trim() || null,
          size: draft.size.trim() || null,
          color: draft.color.trim() || null,
          priceToman: draft.priceToman.trim() ? Number(draft.priceToman) : null,
        },
      });
      setDraft({ sku: '', title: '', size: '', color: '', priceToman: '' });
    } catch (mutationError) {
      setError(adminCatalogInventoryErrorMessage(mutationError, 'تنوع محصول ثبت نشد.'));
    }
  }
  if (query.isPending && !query.data)
    return (
      <section className="border border-border bg-surface p-5">
        <LoadingState label="در حال دریافت تنوع‌ها..." />
      </section>
    );
  if (query.isError && !query.data)
    return (
      <section className="border border-border bg-surface p-5" role="alert">
        <StatePanel
          icon={isOfflineError(query.error) ? 'refresh' : 'warning'}
          title="تنوع‌های محصول در دسترس نیست"
          description={adminCatalogInventoryErrorMessage(query.error, 'دریافت تنوع‌ها انجام نشد.')}
          action={
            <Button onClick={() => void query.refetch()} variant="outline">
              <Icon name="refresh" size={16} /> تلاش دوباره
            </Button>
          }
          tone="danger"
        />
      </section>
    );
  return (
    <section className="border border-border bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.14em] text-primary">VARIANTS</p>
          <h3 className="mt-2 font-semibold">تنوع و SKU</h3>
        </div>
        <Icon name="grid" size={19} />
      </div>
      {error ? (
        <p className="mt-3 text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {canWrite ? (
        <form className="mt-4 grid gap-2 sm:grid-cols-2" onSubmit={addVariant}>
          <UiInput
            aria-label="SKU تنوع"
            className="min-h-11 border border-border bg-background px-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            dir="ltr"
            onChange={(event) => setDraft((current) => ({ ...current, sku: event.target.value }))}
            placeholder="SKU-001"
            value={draft.sku}
          />
          <UiInput
            aria-label="عنوان تنوع"
            className="min-h-11 border border-border bg-background px-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
            placeholder="عنوان تنوع"
            value={draft.title}
          />
          <UiInput
            aria-label="سایز تنوع"
            className="min-h-11 border border-border bg-background px-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            onChange={(event) => setDraft((current) => ({ ...current, size: event.target.value }))}
            placeholder="M"
            value={draft.size}
          />
          <UiInput
            aria-label="رنگ تنوع"
            className="min-h-11 border border-border bg-background px-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            onChange={(event) => setDraft((current) => ({ ...current, color: event.target.value }))}
            placeholder="مشکی"
            value={draft.color}
          />
          <UiInput
            aria-label="قیمت تنوع"
            className="min-h-11 border border-border bg-background px-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            dir="ltr"
            inputMode="numeric"
            onChange={(event) =>
              setDraft((current) => ({ ...current, priceToman: event.target.value }))
            }
            placeholder="قیمت اختیاری"
            value={draft.priceToman}
          />
          <Button loading={createVariant.isPending} type="submit">
            <Icon name="plus" size={15} /> افزودن تنوع
          </Button>
        </form>
      ) : null}
      <div className="mt-5 divide-y divide-border">
        {(query.data ?? []).length === 0 ? (
          <p className="py-3 text-xs text-muted-foreground">تنوعی ثبت نشده است.</p>
        ) : (
          (query.data ?? []).map((variant) => (
            <VariantItem
              canWrite={canWrite}
              key={variant.id}
              productId={productId}
              variant={variant}
              update={updateVariant}
            />
          ))
        )}
      </div>
      {options.length ? (
        <p className="mt-4 text-[10px] leading-6 text-muted-foreground">
          مقدارهای گزینه در سرویس ثبت شده‌اند؛ اتصال مقدار به تنوع از قرارداد optionValueIds
          پشتیبانی می‌کند.
        </p>
      ) : null}
    </section>
  );
}

```

---


### 36. Icon

**Path:** `src/shared/ui/icon.tsx`

```tsx
import type { ReactNode, SVGProps } from 'react';

export type IconName =
  | 'arrow-left'
  | 'arrow-right'
  | 'bag'
  | 'bell'
  | 'book'
  | 'calendar'
  | 'check'
  | 'chevron-down'
  | 'close'
  | 'dress'
  | 'edit'
  | 'eye'
  | 'filter'
  | 'grid'
  | 'heart'
  | 'home'
  | 'info'
  | 'instagram'
  | 'layers'
  | 'mail'
  | 'menu'
  | 'more-vertical'
  | 'package'
  | 'plus'
  | 'refresh'
  | 'rotate'
  | 'search'
  | 'send'
  | 'settings'
  | 'shield'
  | 'shirt'
  | 'sparkles'
  | 'tag'
  | 'truck'
  | 'user'
  | 'users'
  | 'warehouse'
  | 'warning';

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number;
};

const iconPaths: Record<IconName, ReactNode> = {
  'arrow-left': <path d="m9 5 7 7-7 7" />,
  'arrow-right': <path d="m15 5-7 7 7 7" />,
  bag: (
    <>
      <path d="M5 8.5h14l-1 11H6l-1-11Z" />
      <path d="M8.5 8.5V6a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  bell: (
    <>
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 8.5h18C21 16 18 16 18 9Z" />
      <path d="M10 21h4" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" />
      <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M7 3v4M17 3v4M3.5 9h17" />
    </>
  ),
  check: <path d="m5 12 4.5 4.5L19 7" />,
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  dress: (
    <>
      <path d="M9 4.5a3 3 0 0 0 6 0" />
      <path d="m9 6-2 4 2 1-3 8h8l-3-8 2-1-2-4" />
      <path d="m15 6 2 4-2 1 3 8h-8" />
    </>
  ),
  edit: (
    <>
      <path d="m4 16.5-.7 4.2 4.2-.7L19 8.5 15.5 5 4 16.5Z" />
      <path d="m13.5 7 3.5 3.5M4 20.5l3.5-3.5" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  filter: (
    <>
      <path d="M4 5h16" />
      <path d="M7 12h10" />
      <path d="M10 19h4" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </>
  ),
  heart: (
    <path d="M20.8 8.8c0 5.2-8.8 10.4-8.8 10.4S3.2 14 3.2 8.8A4.7 4.7 0 0 1 12 6.5a4.7 4.7 0 0 1 8.8 2.3Z" />
  ),
  home: (
    <>
      <path d="m3.5 10.5 8.5-7 8.5 7" />
      <path d="M5.5 9.5v10h13v-10M9 19.5v-5h6v5" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10.5v5M12 7.5h.01" />
    </>
  ),
  instagram: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M17.5 6.5h.01" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z" />
      <path d="m4 12 8 4.5 8-4.5M4 16.5 12 21l8-4.5" />
    </>
  ),
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4.5 7 7.5 5.5L19.5 7" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  'more-vertical': (
    <>
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </>
  ),
  package: (
    <>
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="m4.5 7.8 7.5 4.2 7.5-4.2M12 12v9" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-13.6-5.7L4 7.5" />
      <path d="M4 4v3.5h3.5M4 13a8 8 0 0 0 13.6 5.7l2.4-2.2" />
      <path d="M20 20v-3.5h-3.5" />
    </>
  ),
  rotate: (
    <>
      <path d="M4 12a8 8 0 0 1 13.6-5.7L20 8.5" />
      <path d="M20 5v3.5h-3.5M20 12a8 8 0 0 1-13.6 5.7L4 15.5" />
      <path d="M4 19v-3.5h3.5" />
    </>
  ),
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  send: <path d="m4 4 16 8-16 8 3-8-3-8Zm3 8h13" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-2.6V20a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H6v-2.6h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V5h2.6v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v2.6H21a1.7 1.7 0 0 0-1.6 1Z" />
    </>
  ),
  shield: <path d="M12 3.5 19 6v5.5c0 4.3-2.7 7.7-7 9-4.3-1.3-7-4.7-7-9V6l7-2.5Z" />,
  shirt: (
    <>
      <path d="m8 5 4 2 4-2 4 3-2.5 4-2-1v9h-7v-9l-2 1L4 8l4-3Z" />
      <path d="M10 6.5a2.2 2.2 0 0 0 4 0" />
    </>
  ),
  sparkles: (
    <>
      <path d="m8 3 1.2 3.8L13 8l-3.8 1.2L8 13l-1.2-3.8L3 8l3.8-1.2L8 3Z" />
      <path d="m17 12 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3ZM17 3v3M18.5 4.5h-3" />
    </>
  ),
  tag: (
    <>
      <path d="M4 4h7l9 9-7 7-9-9V4Z" />
      <circle cx="8" cy="8" r="1" />
    </>
  ),
  truck: (
    <>
      <path d="M3 6h11v10H3zM14 9h4l3 3v4h-7V9Z" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19a6 6 0 0 1 12 0M16 5.5a3 3 0 0 1 0 5.8M17 14a5 5 0 0 1 4 5" />
    </>
  ),
  warehouse: (
    <>
      <path d="m3 9 9-5 9 5v11H3V9Z" />
      <path d="M7 20v-6h10v6M7 10h.01M12 10h.01M17 10h.01" />
    </>
  ),
  warning: (
    <>
      <path d="m12 3 9 16H3l9-16Z" />
      <path d="M12 9v4M12 16h.01" />
    </>
  ),
};

export function Icon({ name, size = 20, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      {iconPaths[name]}
    </svg>
  );
}

```

---


## Summary

- Page: `src/features/catalog/components/catalog-inventory/CatalogInventoryView.tsx`
- Custom component files: 36
- Total files included: 37
