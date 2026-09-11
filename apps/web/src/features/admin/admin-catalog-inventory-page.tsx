import { useEffect, useState, type FormEvent, type ReactNode } from 'react';

import {
  ApiClientError,
  type AdminCatalogCategory,
  type AdminCatalogProductCreateInput,
  type AdminCatalogProductListItem,
  type AdminCatalogProductOption,
  type AdminCatalogProductVariant,
  type AdminInventoryItem,
  type AdminInventoryListQuery,
  type AdminCatalogProductListQuery,
} from '@nova/api-client';
import { Button } from '@nova/ui';

import {
  useAdminCatalogCategories,
  useAdminCatalogProducts,
  useAdminProductCategories,
  useAdminProductMedia,
  useAdminProductOptions,
  useAdminProductVariants,
  useCreateAdminCatalogCategory,
  useCreateAdminCatalogProduct,
  useCreateAdminProductMedia,
  useCreateAdminProductOption,
  useCreateAdminProductOptionValue,
  useCreateAdminProductVariant,
  useDeleteAdminProductMedia,
  useReplaceAdminProductCategories,
  useUpdateAdminCatalogCategory,
  useUpdateAdminCatalogCategoryStatus,
  useUpdateAdminCatalogProduct,
  useUpdateAdminCatalogProductStatus,
  useUpdateAdminProductMedia,
  useUpdateAdminProductOption,
  useUpdateAdminProductOptionValue,
  useUpdateAdminProductVariant,
  useStaffUser,
} from './admin-catalog-api';
import {
  useAdminInventory,
  useAdminInventoryItem,
  useAdjustAdminInventory,
  useUpdateAdminInventoryReorderPoint,
} from './admin-inventory-api';
import { isStaffAuthFailure, isStaffAuthorizationFailure } from './admin-auth';
import { Icon, type IconName } from '../../shared/icon';

export type AdminCatalogInventoryView = 'catalog' | 'categories' | 'inventory' | 'product';
export type AdminMutationState = 'draft' | 'invalid' | 'saving' | 'saved' | 'publish-blocked';

export interface ProductDraftValues {
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  brand: string;
  basePriceToman: string;
  compareAtPriceToman: string;
}

const faNumber = new Intl.NumberFormat('fa-IR');
const faDate = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' });
const productSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const catalogKeyPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeAdminCatalogInventoryView(value?: string): AdminCatalogInventoryView {
  if (value === 'categories' || value === 'inventory' || value === 'product') return value;
  return 'catalog';
}

export function pageCount(total: number, limit: number): number {
  if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(limit) || limit <= 0) return 1;
  return Math.max(1, Math.ceil(total / limit));
}

export function hasAdminRole(roles: readonly string[] | undefined, required: string[]): boolean {
  if (!roles) return false;
  const available = new Set(roles.map((role) => role.toLowerCase()));
  return required.some((role) => available.has(role));
}

export function validateProductDraft(
  draft: ProductDraftValues,
  mode: 'create' | 'edit' = 'create',
): string[] {
  const issues: string[] = [];
  if (mode === 'create' && !productSlugPattern.test(draft.slug.trim())) {
    issues.push('شناسه محصول باید با حروف لاتین کوچک، عدد و خط تیره نوشته شود.');
  }
  if (!draft.name.trim()) issues.push('نام محصول را وارد کنید.');
  const price = Number(draft.basePriceToman);
  if (!Number.isSafeInteger(price) || price < 0)
    issues.push('قیمت پایه باید عدد صحیح نامنفی باشد.');
  if (draft.compareAtPriceToman.trim()) {
    const compareAt = Number(draft.compareAtPriceToman);
    if (!Number.isSafeInteger(compareAt) || compareAt < 0) {
      issues.push('قیمت قبل باید عدد صحیح نامنفی باشد.');
    } else if (Number.isSafeInteger(price) && compareAt < price) {
      issues.push('قیمت قبل نباید کمتر از قیمت پایه باشد.');
    }
  }
  return issues;
}

export function validateInventoryAdjustment(delta: string, reason: string): string[] {
  const issues: string[] = [];
  const numericDelta = Number(delta);
  if (!Number.isSafeInteger(numericDelta) || numericDelta === 0) {
    issues.push('مقدار تغییر باید عدد صحیح غیرصفر باشد.');
  }
  if (!reason.trim()) issues.push('دلیل تغییر موجودی را وارد کنید.');
  if (reason.trim().length > 500) issues.push('دلیل تغییر موجودی نباید بیشتر از ۵۰۰ نویسه باشد.');
  return issues;
}

export function validateMediaDraft(url: string, altText: string): string[] {
  const issues: string[] = [];
  if (!url.trim()) issues.push('نشانی رسانه را وارد کنید.');
  if (!altText.trim()) issues.push('متن جایگزین رسانه را وارد کنید.');
  return issues;
}

export function resolveAdminMutationState(input: {
  isDirty: boolean;
  isPending: boolean;
  isError: boolean;
  isSuccess: boolean;
  hasInvalidFields: boolean;
  hasPublishBlockers?: boolean;
}): AdminMutationState {
  if (input.isPending) return 'saving';
  if (input.hasPublishBlockers) return 'publish-blocked';
  if (input.hasInvalidFields || input.isError) return 'invalid';
  if (input.isSuccess) return 'saved';
  return input.isDirty ? 'draft' : 'saved';
}

export function isInventoryDiscrepancy(
  item: Pick<AdminInventoryItem, 'onHand' | 'reserved' | 'available'>,
): boolean {
  return item.onHand - item.reserved !== item.available;
}

export function adminCatalogInventoryErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiClientError) {
    if (error.status === 401) return 'نشست کاربری منقضی شده است؛ دوباره وارد شوید.';
    if (error.status === 403) return 'شما اجازه انجام این عملیات را ندارید.';
    if (error.status === 409) return 'اطلاعات هم‌زمان تغییر کرده است؛ نسخه تازه را بارگیری کنید.';
    if (error.payload?.error.message) return error.payload.error.message;
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return 'اتصال شبکه برقرار نیست؛ پس از اتصال دوباره تلاش کنید.';
  }
  return error instanceof Error && error.message ? error.message : fallback;
}

function formatNumber(value: number): string {
  return faNumber.format(value);
}

function formatToman(value: number): string {
  return `${formatNumber(value)} تومان`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return 'ثبت نشده';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'تاریخ نامشخص' : faDate.format(date);
}

function ltr(value: ReactNode, className = ''): ReactNode {
  return (
    <span className={`inline-block text-left ${className}`} dir="ltr">
      {value}
    </span>
  );
}

function isOfflineError(error: unknown): boolean {
  return (
    (typeof navigator !== 'undefined' && navigator.onLine === false) ||
    (error instanceof TypeError && /fetch|network|load/i.test(error.message))
  );
}

function statusLabel(status: string): string {
  return (
    {
      DRAFT: 'پیش‌نویس',
      PUBLISHED: 'منتشرشده',
      ARCHIVED: 'آرشیوشده',
      IN_STOCK: 'موجود',
      LOW_STOCK: 'موجودی کم',
      OUT_OF_STOCK: 'ناموجود',
      ACTIVE: 'فعال',
      INACTIVE: 'غیرفعال',
      ALL: 'همه',
      RECEIPT: 'رسید انبار',
      ADJUSTMENT: 'اصلاح دستی',
      RESERVATION: 'رزرو',
      RELEASE: 'آزادسازی رزرو',
      SALE: 'فروش',
      RETURN: 'مرجوعی',
    }[status] ?? status
  );
}

function statusTone(status: string): string {
  if (['PUBLISHED', 'IN_STOCK', 'ACTIVE', 'RECEIPT', 'RELEASE', 'RETURN'].includes(status)) {
    return 'border-success/30 bg-success-soft text-success';
  }
  if (['LOW_STOCK', 'DRAFT', 'RESERVATION'].includes(status)) {
    return 'border-warning/30 bg-warning-soft text-warning';
  }
  if (['OUT_OF_STOCK', 'ARCHIVED', 'INACTIVE'].includes(status)) {
    return 'border-destructive/30 bg-error-soft text-destructive';
  }
  return 'border-border bg-secondary text-muted-foreground';
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex min-h-8 items-center rounded-control border px-2.5 text-[11px] ${statusTone(status)}`}
    >
      {statusLabel(status)}
    </span>
  );
}

function MutationStateBadge({ state }: { state: AdminMutationState }) {
  const tone =
    state === 'saved'
      ? 'border-success/30 bg-success-soft text-success'
      : state === 'saving'
        ? 'border-info/30 bg-info-soft text-info'
        : state === 'invalid' || state === 'publish-blocked'
          ? 'border-destructive/30 bg-error-soft text-destructive'
          : 'border-warning/30 bg-warning-soft text-warning';
  return (
    <span
      className={`inline-flex min-h-8 items-center rounded-control border px-2.5 text-[11px] ${tone}`}
    >
      {mutationStateLabel(state)}
    </span>
  );
}

function StatePanel({
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

function LoadingState({ label = 'در حال بارگذاری اطلاعات...' }: { label?: string }) {
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

function QueryState({
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

function PermissionPanel({ title = 'دسترسی کافی ندارید' }: { title?: string }) {
  return (
    <StatePanel
      icon="warning"
      title={title}
      description="این بخش برای نقش فعلی شما فعال نیست."
      tone="danger"
    />
  );
}

function AdminSessionState({ kind }: { kind: 'loading' | 'expired' | 'denied' | 'missing' }) {
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
              <a href="#admin/login">ورود به پنل</a>
            </Button>
          ) : undefined
        }
      />
    </main>
  );
}

function AdminOperationsShell({
  view,
  roles,
  children,
}: {
  view: AdminCatalogInventoryView;
  roles: readonly string[];
  children: ReactNode;
}) {
  const navigation: Array<[AdminCatalogInventoryView, string, IconName, string]> = [
    ['catalog', 'محصولات', 'bag', '#admin/catalog'],
    ['categories', 'دسته‌بندی‌ها', 'layers', '#admin/catalog/categories'],
    ['inventory', 'موجودی کم', 'warning', '#admin/inventory'],
  ];
  return (
    <main
      className="min-h-svh bg-background px-3 py-4 text-foreground md:px-6 md:py-7 lg:px-8"
      dir="rtl"
    >
      <div className="mx-auto max-w-[1320px]">
        <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
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
        <nav className="mt-5 overflow-x-auto" aria-label="بخش‌های کاتالوگ و عملیات">
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
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_250px]">
          <div className="min-w-0">{children}</div>
          <aside
            className="hidden border border-border bg-surface p-5 shadow-card xl:block"
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

function FilterInput({
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
        <input
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

function Pagination({
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
        <button
          aria-label="صفحه قبل"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-control border border-border bg-background transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          type="button"
        >
          <Icon name="arrow-left" size={16} />
        </button>
        <span className="min-w-11 text-center" dir="rtl">
          {formatNumber(page)}
        </span>
        <button
          aria-label="صفحه بعد"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-control border border-border bg-background transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
          type="button"
        >
          <Icon name="arrow-right" size={16} />
        </button>
      </div>
    </div>
  );
}

function CatalogView({ roles }: { roles: readonly string[] }) {
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
            <a href="#admin/catalog/products/new">
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
          <select
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
          </select>
        </label>
        <label className="block text-xs text-muted-foreground">
          دسته‌بندی
          <select
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
          </select>
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

function ProductTableRow({ product }: { product: AdminCatalogProductListItem }) {
  return (
    <tr className="border-b border-border last:border-b-0 hover:bg-background">
      <td className="px-4 py-4 align-top">
        <a
          className="flex min-h-11 items-center gap-3 rounded-control focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          href={`#admin/catalog/products/${encodeURIComponent(product.id)}`}
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
          href={`#admin/catalog/products/${encodeURIComponent(product.id)}`}
        >
          <Icon name="edit" size={17} />
        </a>
      </td>
    </tr>
  );
}

function ProductCard({ product }: { product: AdminCatalogProductListItem }) {
  return (
    <article className="border border-border bg-background p-4">
      <div className="flex items-start gap-3">
        <MediaThumb
          src={product.primaryMedia?.url}
          alt={product.primaryMedia?.altText ?? product.name}
        />
        <div className="min-w-0 flex-1">
          <a
            className="font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            href={`#admin/catalog/products/${encodeURIComponent(product.id)}`}
          >
            {product.name}
          </a>
          <p className="mt-1 truncate text-[10px] text-muted-foreground" dir="ltr">
            {product.slug}
          </p>
        </div>
        <StatusBadge status={product.status} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs">
        <div>
          <dt className="text-muted-foreground">قیمت</dt>
          <dd className="mt-1">{formatToman(product.basePriceToman)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">موجودی</dt>
          <dd className="mt-1">
            <StatusBadge status={product.inventory.status} />
          </dd>
        </div>
      </dl>
    </article>
  );
}

function MediaThumb({ src, alt }: { src?: string | null; alt: string }) {
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

function LowStockCard({
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
          <button
            className="min-h-11 text-xs text-primary underline focus-visible:outline-2 focus-visible:outline-primary"
            onClick={() => void query.refetch()}
            type="button"
          >
            دریافت دوباره
          </button>
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
              href={`#admin/inventory/${encodeURIComponent(item.variantId)}`}
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
        href="#admin/inventory"
      >
        مشاهده همه <Icon name="arrow-left" size={15} />
      </a>
    </section>
  );
}

function CategoriesView({ roles }: { roles: readonly string[] }) {
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
            <input
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
            <input
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
            <select
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
            </select>
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

function CategoryRow({
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
          <input
            className="mt-2 min-h-11 w-full border border-border bg-surface px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            onChange={(event) => onDraftChange({ ...draft, name: event.target.value })}
            value={draft.name}
          />
        </label>
        <label className="text-xs text-muted-foreground">
          والد
          <select
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
          </select>
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

function InventoryView({
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
  return (
    <div className="space-y-5">
      <header>
        <p className="text-[10px] font-semibold tracking-[0.16em] text-warning">
          INVENTORY / CONTROL ROOM
        </p>
        <h2 className="mt-2 text-2xl font-semibold">موجودی</h2>
        <p className="mt-1 text-xs leading-7 text-muted-foreground">
          موجودی فیزیکی، رزروشده، قابل فروش و نقطه سفارش مجدد را از سرویس مدیریت بررسی کنید.
        </p>
      </header>
      <form
        className="grid gap-3 border border-border bg-surface p-4 shadow-card md:grid-cols-2 xl:grid-cols-[minmax(0,1.5fr)_repeat(2,minmax(150px,.7fr))_auto]"
        onSubmit={submitFilters}
      >
        <FilterInput
          label="جست‌وجوی کالا یا SKU"
          onChange={setSearch}
          placeholder="نام محصول یا SKU..."
          value={search}
        />
        <label className="block text-xs text-muted-foreground">
          وضعیت تنوع
          <select
            aria-label="فیلتر وضعیت تنوع"
            className="mt-2 min-h-12 w-full border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
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
          </select>
        </label>
        <label className="flex min-h-12 items-center gap-3 border border-border bg-background px-3 text-xs">
          <input
            checked={filters.lowStock === true}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                page: 1,
                lowStock: event.target.checked || undefined,
              }))
            }
            type="checkbox"
          />{' '}
          فقط موجودی کم
        </label>
        <Button type="submit">
          <Icon name="search" size={16} /> اعمال فیلتر
        </Button>
      </form>
      {error ? (
        <p
          className="border border-destructive/30 bg-error-soft px-4 py-3 text-xs text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {success ? (
        <p
          className="border border-success/30 bg-success-soft px-4 py-3 text-xs text-success"
          role="status"
        >
          {success}
        </p>
      ) : null}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="border border-border bg-surface shadow-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-4">
            <h3 className="font-semibold">فهرست موجودی</h3>
            <span className="text-xs text-muted-foreground">
              {formatNumber(query.data?.total ?? 0)} تنوع
            </span>
          </div>
          {items.length === 0 ? (
            <div className="p-5">
              <StatePanel
                icon="warehouse"
                title="موجودی‌ای با این فیلتر پیدا نشد"
                description="فیلتر موجودی کم یا عبارت جست‌وجو را تغییر دهید."
              />
            </div>
          ) : (
            <div className="divide-y divide-border">
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
          <div className="p-4 md:p-5">
            <Pagination
              limit={query.data?.limit ?? 8}
              page={query.data?.page ?? 1}
              total={query.data?.total ?? 0}
              onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
            />
          </div>
        </section>
        <InventoryDetail
          detailQuery={detailQuery}
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
    </div>
  );
}

function InventoryRow({
  item,
  selected,
  onSelect,
}: {
  item: AdminInventoryItem;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      className={`flex min-h-[92px] w-full items-center gap-3 px-4 py-4 text-right transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${selected ? 'bg-accent-soft' : ''}`}
      onClick={() => onSelect(item.variantId)}
      type="button"
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-control ${item.stockStatus === 'LOW_STOCK' ? 'bg-warning-soft text-warning' : item.stockStatus === 'OUT_OF_STOCK' ? 'bg-error-soft text-destructive' : 'bg-success-soft text-success'}`}
      >
        <Icon name="warehouse" size={19} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-semibold">{item.productName}</span>
        <span className="mt-1 block truncate text-[10px] text-muted-foreground">
          {item.variantTitle ?? 'تنوع اصلی'} · <span dir="ltr">{item.sku}</span>
        </span>
      </span>
      <span className="hidden text-left text-xs sm:block">
        <span className="block">{formatNumber(item.available)} قابل فروش</span>
        <span className="mt-1 block text-[10px] text-muted-foreground">
          نقطه سفارش {formatNumber(item.reorderPoint)}
        </span>
      </span>
      <StatusBadge status={item.stockStatus} />
    </button>
  );
}

function InventoryDetail({
  detailQuery,
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
                    <input
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
                    <textarea
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
                  <input
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

function ProductEditor({ roles, productId }: { roles: readonly string[]; productId?: string }) {
  const canWrite = hasAdminRole(roles, ['admin']);
  const [localProductId, setLocalProductId] = useState(productId ?? '');
  const [createdProduct, setCreatedProduct] = useState<AdminCatalogProductListItem | null>(null);
  const effectiveProductId = createdProduct?.id ?? localProductId;
  const listQuery = useAdminCatalogProducts({ page: 1, limit: 100 });
  const product =
    createdProduct ?? listQuery.data?.items.find((item) => item.id === effectiveProductId);
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
      shortDescription: '',
      description: '',
      brand: '',
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
        setCreatedProduct({
          ...created,
          categories: [],
          primaryMedia: null,
          inventory: {
            available: 0,
            lowStockVariantCount: 0,
            outOfStockVariantCount: 0,
            status: 'OUT_OF_STOCK',
          },
          variantCount: 0,
          mediaCount: 0,
        });
        setLocalProductId(created.id);
      } else {
        if (!product) return;
        await updateProductMutation.mutateAsync({
          productId: product.id,
          input: {
            ...(draft.name.trim() !== product.name ? { name: draft.name.trim() } : {}),
            ...(Number(draft.basePriceToman) !== product.basePriceToman
              ? { basePriceToman: Number(draft.basePriceToman) }
              : {}),
            ...(draft.compareAtPriceToman.trim() !==
            (product.compareAtPriceToman === null ? '' : String(product.compareAtPriceToman))
              ? {
                  compareAtPriceToman: draft.compareAtPriceToman.trim()
                    ? Number(draft.compareAtPriceToman)
                    : null,
                }
              : {}),
          },
        });
      }
    } catch (mutationError) {
      setError(adminCatalogInventoryErrorMessage(mutationError, 'محصول ذخیره نشد.'));
    }
  }
  async function setProductStatus(status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') {
    if (!product || publishBlockers.length) {
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
  if (!isCreate && listQuery.isPending && !product)
    return <LoadingState label="در حال دریافت محصول..." />;
  if (!isCreate && listQuery.isError && !product)
    return (
      <QueryState
        pending={false}
        error={listQuery.error}
        hasData={false}
        onRetry={() => void listQuery.refetch()}
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
            href="#admin/catalog"
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
                  disabled={statusMutation.isPending || publishBlockers.length > 0}
                  loading={statusMutation.isPending}
                  onClick={() =>
                    void setProductStatus(product.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED')
                  }
                  variant="outline"
                >
                  {product.status === 'PUBLISHED' ? 'بازگشت به پیش‌نویس' : 'انتشار'}
                </Button>
                <Button
                  disabled={statusMutation.isPending}
                  onClick={() => void setProductStatus('ARCHIVED')}
                  variant="ghost"
                >
                  آرشیو
                </Button>
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
              <input
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
            <input
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
            <input
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
            <input
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
          {isCreate ? (
            <>
              <label className="text-xs text-muted-foreground">
                برند
                <input
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
                <textarea
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
                <textarea
                  className="mt-2 min-h-28 w-full border border-border bg-background px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  disabled={!canWrite}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, description: event.target.value }))
                  }
                  value={draft.description}
                />
              </label>
            </>
          ) : null}
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
          <MediaPanel productId={effectiveProductId} query={mediaQuery} canWrite={canWrite} />
        </div>
      ) : null}
    </div>
  );
}

function mutationStateLabel(state: AdminMutationState): string {
  return {
    draft: 'تغییرات ذخیره‌نشده',
    invalid: 'فرم نیازمند اصلاح است',
    saving: 'در حال ذخیره...',
    saved: 'ذخیره شد',
    'publish-blocked': 'انتشار مسدود است',
  }[state];
}
function TaxonomyPanel({
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
                <input
                  checked={selectedIds.includes(category.id)}
                  disabled={!canWrite}
                  onChange={() => onToggle(category.id)}
                  type="checkbox"
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

function OptionsPanel({
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
          <input
            aria-label="کلید گزینه"
            className="min-h-11 border border-border bg-background px-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            dir="ltr"
            onChange={(event) =>
              setNewOption((current) => ({ ...current, key: event.target.value }))
            }
            placeholder="size"
            value={newOption.key}
          />
          <input
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

function OptionItem({
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
        <input
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
          <input
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

function OptionValue({
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
      <input
        aria-label={`ویرایش مقدار ${value.label}`}
        className="w-20 bg-transparent text-xs outline-none"
        disabled={!canWrite}
        onChange={(event) => setLabel(event.target.value)}
        value={label}
      />
      {canWrite ? (
        <button
          aria-label={`ذخیره مقدار ${value.label}`}
          className="flex h-7 w-7 items-center justify-center text-primary focus-visible:outline-2 focus-visible:outline-primary"
          onClick={() => void onSave({ id: value.id, label: label.trim() })}
          type="button"
        >
          <Icon name="check" size={13} />
        </button>
      ) : null}
    </span>
  );
}

function VariantsPanel({
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
          <input
            aria-label="SKU تنوع"
            className="min-h-11 border border-border bg-background px-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            dir="ltr"
            onChange={(event) => setDraft((current) => ({ ...current, sku: event.target.value }))}
            placeholder="SKU-001"
            value={draft.sku}
          />
          <input
            aria-label="عنوان تنوع"
            className="min-h-11 border border-border bg-background px-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
            placeholder="عنوان تنوع"
            value={draft.title}
          />
          <input
            aria-label="سایز تنوع"
            className="min-h-11 border border-border bg-background px-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            onChange={(event) => setDraft((current) => ({ ...current, size: event.target.value }))}
            placeholder="M"
            value={draft.size}
          />
          <input
            aria-label="رنگ تنوع"
            className="min-h-11 border border-border bg-background px-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            onChange={(event) => setDraft((current) => ({ ...current, color: event.target.value }))}
            placeholder="مشکی"
            value={draft.color}
          />
          <input
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

function VariantItem({
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
          href={`#admin/inventory/${encodeURIComponent(variant.id)}`}
        >
          موجودی <Icon name="arrow-left" size={13} />
        </a>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <input
          aria-label={`عنوان ${variant.sku}`}
          className="min-h-10 border border-border bg-background px-2 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          disabled={!canWrite}
          onChange={(event) => setTitle(event.target.value)}
          value={title}
        />
        <input
          aria-label={`سایز ${variant.sku}`}
          className="min-h-10 border border-border bg-background px-2 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          disabled={!canWrite}
          onChange={(event) => setSize(event.target.value)}
          value={size}
        />
        <input
          aria-label={`رنگ ${variant.sku}`}
          className="min-h-10 border border-border bg-background px-2 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          disabled={!canWrite}
          onChange={(event) => setColor(event.target.value)}
          value={color}
        />
        <input
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

function MediaPanel({
  productId,
  query,
  canWrite,
}: {
  productId: string;
  query: ReturnType<typeof useAdminProductMedia>;
  canWrite: boolean;
}) {
  const createMedia = useCreateAdminProductMedia();
  const updateMedia = useUpdateAdminProductMedia();
  const deleteMedia = useDeleteAdminProductMedia();
  const [draft, setDraft] = useState({
    url: '',
    altText: '',
    kind: 'PRODUCT' as 'PRODUCT' | 'DETAIL' | 'SWATCH',
  });
  const [error, setError] = useState('');
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
        قرارداد فعلی نشانی رسانه را می‌پذیرد؛ بارگذاری مستقیم فایل در این slice وجود ندارد.
      </p>
      {error ? (
        <p className="mt-3 text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {canWrite ? (
        <form className="mt-4 grid gap-2" onSubmit={addMedia}>
          <input
            aria-label="نشانی رسانه"
            className="min-h-11 border border-border bg-background px-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            dir="ltr"
            onChange={(event) => setDraft((current) => ({ ...current, url: event.target.value }))}
            placeholder="https://..."
            value={draft.url}
          />
          <div className="grid gap-2 sm:grid-cols-[1fr_130px_auto]">
            <input
              aria-label="متن جایگزین"
              className="min-h-11 border border-border bg-background px-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              onChange={(event) =>
                setDraft((current) => ({ ...current, altText: event.target.value }))
              }
              placeholder="متن جایگزین"
              value={draft.altText}
            />
            <select
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
            </select>
            <Button loading={createMedia.isPending} type="submit">
              <Icon name="plus" size={15} /> افزودن
            </Button>
          </div>
        </form>
      ) : null}
      <div className="mt-5 divide-y divide-border">
        {(query.data ?? []).length === 0 ? (
          <p className="py-3 text-xs text-muted-foreground">رسانه‌ای ثبت نشده است.</p>
        ) : (
          (query.data ?? []).map((media) => (
            <MediaItem
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

function MediaItem({
  media,
  productId,
  canWrite,
  updateMedia,
  deleteMedia,
}: {
  media: { id: string; url: string; altText: string; kind: string };
  productId: string;
  canWrite: boolean;
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
        <input
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
            disabled={deleteMedia.isPending}
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

export function AdminCatalogInventoryPage({
  view,
  productId,
  variantId,
}: {
  view?: string;
  productId?: string;
  variantId?: string;
}) {
  const activeView = normalizeAdminCatalogInventoryView(
    view ?? (variantId ? 'inventory' : productId ? 'product' : undefined),
  );
  const staffQuery = useStaffUser();
  if (staffQuery.isPending) return <AdminSessionState kind="loading" />;
  if (isStaffAuthFailure(staffQuery.error)) return <AdminSessionState kind="expired" />;
  if (isStaffAuthorizationFailure(staffQuery.error)) return <AdminSessionState kind="denied" />;
  if (!staffQuery.data) return <AdminSessionState kind="missing" />;
  const roles = staffQuery.data.roles ?? [];
  const canView = hasAdminRole(roles, ['support', 'operations', 'admin']);
  if (!canView) return <AdminSessionState kind="denied" />;
  return (
    <AdminOperationsShell roles={roles} view={activeView}>
      {activeView === 'catalog' ? (
        <CatalogView roles={roles} />
      ) : activeView === 'categories' ? (
        <CategoriesView roles={roles} />
      ) : activeView === 'inventory' ? (
        <InventoryView initialVariantId={variantId} roles={roles} />
      ) : (
        <ProductEditor productId={productId} roles={roles} />
      )}
    </AdminOperationsShell>
  );
}
