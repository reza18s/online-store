# Page Context

## Page

**Path:** `src/features/content/components/content-seo/ContentSeoView.tsx`

```tsx
import { useStaffUser } from '@/features/auth';
import { isStaffAuthFailure, isStaffAuthorizationFailure } from '@/features/auth/api/admin-auth';

import { Icon } from '@/shared/ui/icon';

import { AdminContentSeoNavigation } from '@/features/content/components/content-seo/admin-content-seo-navigation';

import { ContentView } from '@/features/content/components/content-seo/content-view';

import { RedirectsView } from '@/features/content/components/content-seo/redirects-view';

import { SeoView } from '@/features/content/components/content-seo/seo-view';

import { StatePanel } from '@/features/content/components/content-seo/state-panel';

import { canManageAdminContent } from '@/features/content/components/content-seo/can-manage-admin-content';

import { normalizeAdminContentSeoView } from '@/features/content/components/content-seo/normalize-admin-content-seo-view';

export function ContentSeoView({
  view = 'content',
  pageId,
  staffRoles,
}: {
  view?: string;
  pageId?: string;
  staffRoles?: readonly string[];
}) {
  const activeView = normalizeAdminContentSeoView(view);
  const staffQuery = useStaffUser(staffRoles === undefined);
  const roles = staffRoles ?? staffQuery.data?.roles;
  const hasExternalStaffState = staffRoles === undefined;
  if (hasExternalStaffState && staffQuery.isPending)
    return (
      <main dir="rtl" className="min-h-svh bg-background px-4 py-6 md:px-8 md:py-10">
        <div className="admin-reference-module__inner mx-auto max-w-[1180px]">
          <StatePanel
            kind="loading"
            title="در حال بررسی نشست مدیریت"
            description="دسترسی این بخش در حال بررسی است."
          />
        </div>
      </main>
    );
  if (hasExternalStaffState && isStaffAuthFailure(staffQuery.error))
    return (
      <main dir="rtl" className="min-h-svh bg-background px-4 py-6 md:px-8 md:py-10">
        <div className="mx-auto max-w-[1180px]">
          <StatePanel
            kind="expired"
            title="نشست مدیریت منقضی شده است"
            description="برای ادامه، دوباره وارد فضای مدیریت شوید."
          />
        </div>
      </main>
    );
  if (hasExternalStaffState && isStaffAuthorizationFailure(staffQuery.error))
    return (
      <main dir="rtl" className="min-h-svh bg-background px-4 py-6 md:px-8 md:py-10">
        <div className="mx-auto max-w-[1180px]">
          <StatePanel
            kind="permission"
            title="دسترسی این بخش مجاز نیست"
            description="حساب فعلی اجازه دسترسی به محتوای مدیریتی را ندارد."
          />
        </div>
      </main>
    );
  if (hasExternalStaffState && !staffQuery.data)
    return (
      <main dir="rtl" className="min-h-svh bg-background px-4 py-6 md:px-8 md:py-10">
        <div className="mx-auto max-w-[1180px]">
          <StatePanel
            kind="permission"
            title="نشست مدیریت پیدا نشد"
            description="برای مشاهده و تغییر محتوا باید وارد فضای مدیریت شوید."
          />
        </div>
      </main>
    );
  const canEdit = canManageAdminContent(roles);
  if (!canEdit)
    return (
      <main dir="rtl" className="min-h-svh bg-background px-4 py-6 md:px-8 md:py-10">
        <div className="mx-auto max-w-[1180px]">
          <StatePanel
            kind="permission"
            title="دسترسی کافی ندارید"
            description="این بخش به نقش مدیر نیاز دارد؛ کنترل‌های تغییردهنده برای نقش‌های دیگر نمایش داده نمی‌شوند."
          />
        </div>
      </main>
    );
  return (
    <main
      dir="rtl"
      className="admin-reference-module admin-reference-content-seo min-h-0 bg-transparent px-0 py-0 text-foreground"
    >
      <div className="admin-reference-module__inner mx-auto max-w-[1180px]">
        <header className="admin-reference-module__header mb-5 flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
          <div className="text-right">
            <span className="section-heading__eyebrow">ATELIER EDITORIAL / ADMIN</span>
            <h1 className="mt-1 text-2xl leading-relaxed md:text-3xl">محتوا و دیده‌شدن</h1>
            <p className="mt-1 max-w-2xl text-xs leading-7 text-muted-foreground">
              صفحه‌های عمومی، متادیتای SEO و انتقال‌های سایت را با چرخه پیش‌نویس تا انتشار مدیریت
              کنید.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-control border border-border bg-surface px-3 py-2 text-[11px] text-muted-foreground">
            <Icon name="check" size={15} />
            اتصال به قراردادهای واقعی محتوا
          </div>
        </header>
        <AdminContentSeoNavigation activeView={activeView} />
        <div className="mt-5">
          {activeView === 'content' ? (
            <ContentView canEdit={canEdit} pageId={pageId} />
          ) : activeView === 'seo' ? (
            <SeoView canEdit={canEdit} />
          ) : (
            <RedirectsView canEdit={canEdit} />
          )}
        </div>
      </div>
    </main>
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


### 5. Label

**Path:** `../../packages/ui/src/label.tsx`

```tsx
import { forwardRef } from 'react';
import type { LabelHTMLAttributes } from 'react';

import { cn } from './cn';

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export const Label = forwardRef<HTMLLabelElement, LabelProps>(({ className, ...props }, ref) => (
  <label ref={ref} className={cn('text-sm font-medium leading-none', className)} {...props} />
));

Label.displayName = 'Label';

```

---


### 6. Select

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


### 7. Textarea

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


### 8. AdminContentSeoNavigation

**Path:** `src/features/content/components/content-seo/admin-content-seo-navigation.tsx`

```tsx
import { Icon, type IconName } from '@/shared/ui/icon';

import type { AdminContentSeoView } from '@/features/content/pages/admin-content-seo-page-shared';

export function AdminContentSeoNavigation({ activeView }: { activeView: AdminContentSeoView }) {
  const items: Array<[AdminContentSeoView, string, IconName]> = [
    ['content', 'محتوا', 'book'],
    ['seo', 'متادیتای SEO', 'sparkles'],
    ['redirects', 'redirectها', 'rotate'],
  ];
  return (
    <nav className="admin-reference-tabs overflow-x-auto" aria-label="بخش‌های محتوا و SEO">
      <div className="flex min-w-max gap-2">
        {items.map(([view, label, icon]) => (
          <a
            key={view}
            href={`/admin/${view === 'content' ? 'content' : `content/${view}`}`}
            aria-current={activeView === view ? 'page' : undefined}
            className={`inline-flex min-h-11 items-center gap-2 rounded-control border px-4 text-xs transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${activeView === view ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-surface text-foreground hover:border-primary hover:text-primary'}`}
          >
            <Icon name={icon} size={17} />
            {label}
          </a>
        ))}
      </div>
    </nav>
  );
}

```

---


### 9. ContentEditor

**Path:** `src/features/content/components/content-seo/content-editor.tsx`

```tsx
import { useEffect, useState, type FormEvent } from 'react';
import { type AdminContentPage } from '@nova/api-client';
import { Button } from '@nova/ui';

import {
  useCreateAdminContentPage,
  useUpdateAdminContentPage,
  useUpdateAdminContentPageStatus,
} from '@/features/content/api/content/content-api';

import type { ContentDraft } from '@/features/content/pages/admin-content-seo-page-shared';
import { MAX_BLOCKS, MAX_JSON_LENGTH } from '@/features/content/pages/admin-content-seo-page-shared';

import { DraftNotice } from '@/features/content/components/content-seo/draft-notice';

import { ErrorMessage } from '@/features/content/components/content-seo/error-message';

import { Input } from '@/features/content/components/content-seo/input';

import { Panel } from '@/features/content/components/content-seo/panel';

import { StatePanel } from '@/features/content/components/content-seo/state-panel';

import { StatusChip } from '@/features/content/components/content-seo/status-chip';

import { Textarea } from '@/features/content/components/content-seo/textarea';

import { formatDate } from '@/features/content/components/content-seo/format-date';

import { isAdminContentSeoEditorInputDisabled } from '@/features/content/components/content-seo/is-admin-content-seo-editor-input-disabled';

import { isContentPublishActionDisabled } from '@/features/content/components/content-seo/is-content-publish-action-disabled';

import { validateContentDraft } from '@/features/content/components/content-seo/validate-content-draft';

export function ContentEditor({
  page,
  pageId,
  canEdit,
  onCreated,
  onSaved,
}: {
  page: AdminContentPage | null;
  pageId: string;
  canEdit: boolean;
  onCreated: (page: AdminContentPage) => void;
  onSaved: (page: AdminContentPage) => void;
}) {
  const isNew = !pageId;
  const createMutation = useCreateAdminContentPage();
  const updateMutation = useUpdateAdminContentPage();
  const statusMutation = useUpdateAdminContentPageStatus();
  const [draft, setDraft] = useState<ContentDraft>({
    slug: '',
    title: '',
    body: '',
    blocksJson: '[]',
  });
  const [dirty, setDirty] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!page || dirty) return;
    setDraft({
      slug: page.slug,
      title: page.title,
      body: page.body ?? '',
      blocksJson: JSON.stringify(
        page.blocks.map((block) => ({
          kind: block.kind,
          payload: block.payload,
          sortOrder: block.sortOrder,
        })),
        null,
        2,
      ),
    });
    setValidationError('');
  }, [page, dirty]);

  const update = (next: Partial<ContentDraft>) => {
    setDraft((current) => ({ ...current, ...next }));
    setDirty(true);
    setSaved(false);
    setValidationError('');
  };
  const busy = createMutation.isPending || updateMutation.isPending || statusMutation.isPending;
  const handleSaved = (next: AdminContentPage) => {
    setDirty(false);
    setSaved(true);
    onSaved(next);
  };
  const handleCreated = (next: AdminContentPage) => {
    setDirty(false);
    setSaved(true);
    onCreated(next);
  };
  const queryLoading = Boolean(pageId) && !page;
  const save = (event?: FormEvent, publish = false) => {
    event?.preventDefault();
    if (!canEdit) return;
    const result = validateContentDraft(draft, { requireUsableContent: publish });
    if (result.error || !result.input || !result.update) {
      setValidationError(result.error ?? 'فرم معتبر نیست.');
      return;
    }
    setValidationError('');
    if (isNew) {
      createMutation.mutate(result.input, { onSuccess: handleCreated, onError: () => undefined });
      return;
    }
    if (publish) {
      statusMutation.mutate(
        { pageId, input: { status: 'PUBLISHED', expectedUpdatedAt: page?.updatedAt } },
        { onSuccess: handleSaved, onError: () => undefined },
      );
      return;
    }
    updateMutation.mutate(
      { pageId, input: { ...result.update, expectedUpdatedAt: page?.updatedAt } },
      { onSuccess: handleSaved, onError: () => undefined },
    );
  };
  if (queryLoading)
    return (
      <StatePanel
        kind="loading"
        title="در حال بارگیری صفحه"
        description="جزئیات صفحه از سرویس محتوا دریافت می‌شود."
      />
    );
  return (
    <Panel
      title={isNew ? 'صفحه محتوای جدید' : 'ویرایش صفحه محتوا'}
      eyebrow={isNew ? 'CONTENT / CREATE' : 'CONTENT / DETAIL'}
    >
      <form className="space-y-4" onSubmit={(event) => save(event)}>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="اسلاگ عمومی"
            value={draft.slug}
            onChange={(value) => update({ slug: value })}
            dir="ltr"
            placeholder="shipping-policy"
            disabled={!isNew || busy || !canEdit}
          />
          <Input
            label="عنوان صفحه"
            value={draft.title}
            onChange={(value) => update({ title: value })}
            disabled={busy || !canEdit}
            placeholder="راهنمای ارسال"
          />
        </div>
        <Textarea
          label="متن صفحه"
          value={draft.body}
          onChange={(value) => update({ body: value })}
          disabled={isAdminContentSeoEditorInputDisabled(canEdit, busy)}
          hint="متن به‌صورت امن و بدون HTML ذخیره می‌شود."
          rows={7}
        />
        <Textarea
          label="بلوک‌های typed JSON"
          value={draft.blocksJson}
          onChange={(value) => update({ blocksJson: value })}
          dir="ltr"
          disabled={isAdminContentSeoEditorInputDisabled(canEdit, busy)}
          hint={`حداکثر ${MAX_BLOCKS} بلوک و ${MAX_JSON_LENGTH.toLocaleString('fa-IR')} نویسه؛ HTML پذیرفته نمی‌شود.`}
          rows={8}
        />
        {page ? (
          <div className="grid gap-3 rounded-control border border-border bg-background p-3 text-xs md:grid-cols-3">
            <span>
              وضعیت: <StatusChip status={page.status} />
            </span>
            <span>
              آخرین تغییر: <b dir="ltr">{formatDate(page.updatedAt)}</b>
            </span>
            <span className="text-muted-foreground">اسلاگ پس از ایجاد ثابت می‌ماند.</span>
          </div>
        ) : (
          <DraftNotice text="این صفحه ابتدا به‌عنوان پیش‌نویس ذخیره می‌شود؛ انتشار یک اقدام جداگانه است." />
        )}
        {validationError ? (
          <div
            className="rounded-control border border-destructive/30 bg-error-soft px-3 py-2 text-xs leading-7 text-destructive"
            role="alert"
          >
            {validationError}
          </div>
        ) : null}
        {createMutation.error ? <ErrorMessage error={createMutation.error} /> : null}
        {updateMutation.error ? <ErrorMessage error={updateMutation.error} /> : null}
        {statusMutation.error ? <ErrorMessage error={statusMutation.error} /> : null}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <span className="text-xs text-muted-foreground" role="status">
            {busy
              ? 'در حال ذخیره…'
              : saved
                ? 'ذخیره شد'
                : dirty
                  ? 'تغییرات ذخیره‌نشده'
                  : 'همگام با سرور'}
          </span>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={busy} disabled={!canEdit || !dirty}>
              {isNew ? 'ذخیره پیش‌نویس' : 'ذخیره تغییرات'}
            </Button>
            {page && page.status === 'DRAFT' ? (
              <Button
                type="button"
                variant="outline"
                disabled={isContentPublishActionDisabled(canEdit, busy, dirty)}
                onClick={() => save(undefined, true)}
              >
                بررسی و انتشار
              </Button>
            ) : null}
          </div>
        </div>
      </form>
    </Panel>
  );
}

```

---


### 10. ContentList

**Path:** `src/features/content/components/content-seo/content-list.tsx`

```tsx
import { type AdminContentPageListItem } from '@nova/api-client';
import { Button } from '@nova/ui';

import { Icon } from '@/shared/ui/icon';

import { Panel } from '@/features/content/components/content-seo/panel';

import { StatusChip } from '@/features/content/components/content-seo/status-chip';

import { formatDate } from '@/features/content/components/content-seo/format-date';

import { safeContentHref } from '@/features/content/components/content-seo/safe-content-href';

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

```

---


### 11. ContentView

**Path:** `src/features/content/components/content-seo/content-view.tsx`

```tsx
import { useEffect, useMemo, useState } from 'react';
import { type AdminContentPage, type AdminContentStatus } from '@nova/api-client';
import { Button } from '@nova/ui';

import { useAdminContentPage, useAdminContentPages } from '@/features/content/api/content/content-api';
import { Icon } from '@/shared/ui/icon';

import { CONTENT_LIMIT } from '@/features/content/pages/admin-content-seo-page-shared';

import { ContentEditor } from '@/features/content/components/content-seo/content-editor';

import { ContentList } from '@/features/content/components/content-seo/content-list';

import { SearchBar } from '@/features/content/components/content-seo/search-bar';

import { Select } from '@/features/content/components/content-seo/select';

import { StatePanel } from '@/features/content/components/content-seo/state-panel';

import { adminContentSeoErrorMessage } from '@/features/content/components/content-seo/admin-content-seo-error-message';

import { isOfflineError } from '@/features/content/components/content-seo/is-offline-error';

import { shouldShowContentEditor } from '@/features/content/components/content-seo/should-show-content-editor';

export function ContentView({ canEdit, pageId }: { canEdit: boolean; pageId?: string }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<AdminContentStatus | ''>('');
  const [selectedId, setSelectedId] = useState(pageId ?? '');
  const [isCreating, setIsCreating] = useState(false);
  const queryInput = useMemo(
    () => ({
      page: 1,
      limit: CONTENT_LIMIT,
      ...(search.trim() ? { q: search.trim() } : {}),
      ...(status ? { status } : {}),
    }),
    [search, status],
  );
  const listQuery = useAdminContentPages(queryInput, canEdit);
  const detailQuery = useAdminContentPage(selectedId, canEdit && Boolean(selectedId));
  const [editorKey, setEditorKey] = useState(0);
  useEffect(() => {
    setSelectedId(pageId ?? '');
    setIsCreating(false);
    setEditorKey((key) => key + 1);
  }, [pageId]);
  const select = (id: string) => {
    setSelectedId(id);
    setIsCreating(false);
    setEditorKey((key) => key + 1);
  };
  const create = () => {
    setSelectedId('');
    setIsCreating(true);
    setEditorKey((key) => key + 1);
  };
  const onSaved = (page: AdminContentPage) => {
    setSelectedId(page.id);
    setIsCreating(false);
  };
  const onCreated = (page: AdminContentPage) => {
    setSelectedId(page.id);
    setIsCreating(false);
    setEditorKey((key) => key + 1);
  };
  if (listQuery.isPending)
    return (
      <StatePanel
        kind="loading"
        title="در حال بارگیری صفحه‌ها"
        description="فهرست محتوای مدیریت در حال دریافت است."
      />
    );
  if (listQuery.error)
    return (
      <StatePanel
        kind={isOfflineError(listQuery.error) ? 'offline' : 'error'}
        title={isOfflineError(listQuery.error) ? 'اتصال برقرار نیست' : 'بارگیری صفحه‌ها انجام نشد'}
        description={adminContentSeoErrorMessage(listQuery.error)}
        action={
          <Button variant="outline" onClick={() => void listQuery.refetch()}>
            <Icon name="refresh" size={17} />
            تلاش دوباره
          </Button>
        }
      />
    );
  if (selectedId && detailQuery.error)
    return (
      <StatePanel
        kind={isOfflineError(detailQuery.error) ? 'offline' : 'error'}
        title={isOfflineError(detailQuery.error) ? 'اتصال برقرار نیست' : 'جزئیات صفحه بارگیری نشد'}
        description={adminContentSeoErrorMessage(detailQuery.error)}
        action={
          <Button variant="outline" onClick={() => void detailQuery.refetch()}>
            <Icon name="refresh" size={17} />
            تلاش دوباره
          </Button>
        }
      />
    );
  const items = listQuery.data?.items ?? [];
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-editorial border border-border bg-surface p-3 md:flex-row">
        <SearchBar value={search} onChange={setSearch} placeholder="جست‌وجو در عنوان و اسلاگ…" />
        <Select
          label="وضعیت"
          value={status}
          onChange={(value) => setStatus(value as AdminContentStatus | '')}
        >
          <option value="">همه وضعیت‌ها</option>
          <option value="DRAFT">پیش‌نویس</option>
          <option value="PUBLISHED">منتشر شده</option>
          <option value="ARCHIVED">بایگانی شده</option>
        </Select>
      </div>
      {!shouldShowContentEditor({ itemCount: items.length, selectedId, isCreating }) ? (
        <StatePanel
          kind="empty"
          title="هنوز صفحه‌ای ندارید"
          description="یک صفحه را به‌عنوان پیش‌نویس بسازید و بعد از بررسی منتشر کنید."
          action={
            canEdit ? (
              <Button onClick={create}>
                <Icon name="plus" size={17} />
                صفحه جدید
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)]">
          <ContentList
            items={items}
            selectedId={selectedId}
            onSelect={select}
            onCreate={create}
            canEdit={canEdit}
          />
          <ContentEditor
            key={editorKey}
            page={detailQuery.data ?? null}
            pageId={selectedId}
            canEdit={canEdit}
            onCreated={onCreated}
            onSaved={onSaved}
          />
        </div>
      )}
    </div>
  );
}

```

---


### 12. DraftNotice

**Path:** `src/features/content/components/content-seo/draft-notice.tsx`

```tsx
export function DraftNotice({ text }: { text: string }) {
  return (
    <div
      className="rounded-control border border-info/30 bg-info-soft px-3 py-2 text-xs leading-7 text-info"
      role="status"
    >
      {text}
    </div>
  );
}

```

---


### 13. ErrorMessage

**Path:** `src/features/content/components/content-seo/error-message.tsx`

```tsx
import { adminContentSeoErrorMessage } from '@/features/content/components/content-seo/admin-content-seo-error-message';

export function ErrorMessage({ error }: { error: unknown }) {
  return (
    <div
      className="rounded-control border border-warning/30 bg-warning-soft px-3 py-2 text-xs leading-7 text-warning"
      role="alert"
    >
      {adminContentSeoErrorMessage(error)}
    </div>
  );
}

```

---


### 14. Input

**Path:** `src/features/content/components/content-seo/input.tsx`

```tsx
import { Input as UiInput, Label } from '@nova/ui';

export function Input({
  label,
  value,
  onChange,
  dir = 'rtl',
  error,
  ...props
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  dir?: 'rtl' | 'ltr';
  error?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <Label className="block space-y-2 text-right text-xs">
      <span className="font-semibold text-foreground">{label}</span>
      <UiInput
        {...props}
        dir={dir}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-control border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-secondary"
      />
      {error ? (
        <span className="block text-[11px] leading-6 text-destructive" role="alert">
          {error}
        </span>
      ) : null}
    </Label>
  );
}

```

---


### 15. Panel

**Path:** `src/features/content/components/content-seo/panel.tsx`

```tsx
import { type ReactNode } from 'react';

export function Panel({
  title,
  eyebrow,
  children,
  className = '',
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-editorial border border-border bg-surface p-4 shadow-card md:p-5 ${className}`}
    >
      <div className="mb-4 flex items-start justify-between gap-4 border-b border-border pb-3">
        <div className="text-right">
          <span className="section-heading__eyebrow">{eyebrow}</span>
          <h2 className="mt-1 text-lg leading-8 text-foreground">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

```

---


### 16. RedirectEditor

**Path:** `src/features/content/components/content-seo/redirect-editor.tsx`

```tsx
import { useEffect, useState, type FormEvent } from 'react';
import { type AdminRedirect, type SeoRedirectStatusCode } from '@nova/api-client';
import { Button } from '@nova/ui';

import {
  useCreateAdminRedirect,
  useDeleteAdminRedirect,
  useUpdateAdminRedirect,
} from '@/features/content/api/content/content-api';

import type { RedirectDraft } from '@/features/content/pages/admin-content-seo-page-shared';

import { DraftNotice } from '@/features/content/components/content-seo/draft-notice';

import { ErrorMessage } from '@/features/content/components/content-seo/error-message';

import { Input } from '@/features/content/components/content-seo/input';

import { Panel } from '@/features/content/components/content-seo/panel';

import { Select } from '@/features/content/components/content-seo/select';

import { isAdminContentSeoEditorInputDisabled } from '@/features/content/components/content-seo/is-admin-content-seo-editor-input-disabled';

import { validateRedirectDraft } from '@/features/content/components/content-seo/validate-redirect-draft';

export function RedirectEditor({
  item,
  redirects,
  canEdit,
  onSaved,
}: {
  item: AdminRedirect | null;
  redirects: AdminRedirect[];
  canEdit: boolean;
  onSaved: (item: AdminRedirect) => void;
}) {
  const createMutation = useCreateAdminRedirect();
  const updateMutation = useUpdateAdminRedirect();
  const deleteMutation = useDeleteAdminRedirect();
  const [draft, setDraft] = useState<RedirectDraft>({
    fromPath: '/',
    toPath: '/',
    statusCode: 301,
  });
  const [dirty, setDirty] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [saved, setSaved] = useState(false);
  const isNew = !item;
  useEffect(() => {
    if (item && !dirty) {
      setDraft({ fromPath: item.fromPath, toPath: item.toPath, statusCode: item.statusCode });
      setValidationError('');
    }
  }, [item, dirty]);
  const update = (next: Partial<RedirectDraft>) => {
    setDraft((current) => ({ ...current, ...next }));
    setDirty(true);
    setSaved(false);
    setValidationError('');
  };
  const busy = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!canEdit) return;
    const result = validateRedirectDraft(draft, redirects, item?.id);
    if (result.error || !result.input || !result.update) {
      setValidationError(result.error ?? 'فرم معتبر نیست.');
      return;
    }
    setValidationError('');
    if (isNew)
      createMutation.mutate(result.input, {
        onSuccess: (next) => {
          setDirty(false);
          setSaved(true);
          onSaved(next);
        },
        onError: () => undefined,
      });
    else
      updateMutation.mutate(
        { redirectId: item.id, input: result.update },
        {
          onSuccess: (next) => {
            setDirty(false);
            setSaved(true);
            onSaved(next);
          },
          onError: () => undefined,
        },
      );
  };
  const remove = () => {
    if (!item || typeof window === 'undefined' || !window.confirm('این redirect حذف شود؟')) return;
    deleteMutation.mutate(item.id, {
      onSuccess: () => {
        setDirty(false);
        setSaved(false);
        onSaved(item);
      },
      onError: () => undefined,
    });
  };
  return (
    <Panel
      title={isNew ? 'redirect جدید' : 'ویرایش redirect'}
      eyebrow={isNew ? 'REDIRECT / CREATE' : 'REDIRECT / DETAIL'}
    >
      <form className="space-y-4" onSubmit={submit}>
        <Input
          label="مسیر قدیمی"
          value={draft.fromPath}
          onChange={(value) => update({ fromPath: value })}
          dir="ltr"
          disabled={!isNew || busy || !canEdit}
          placeholder="/old-path"
        />
        <Input
          label="مسیر مقصد"
          value={draft.toPath}
          onChange={(value) => update({ toPath: value })}
          dir="ltr"
          disabled={busy || !canEdit}
          placeholder="/new-path"
        />
        <Select
          label="کد وضعیت"
          value={String(draft.statusCode)}
          onChange={(value) => update({ statusCode: Number(value) as SeoRedirectStatusCode })}
          disabled={isAdminContentSeoEditorInputDisabled(canEdit, busy)}
        >
          <option value="301">301 — انتقال دائمی</option>
          <option value="302">302 — انتقال موقت</option>
          <option value="307">307 — موقت با حفظ روش</option>
          <option value="308">308 — دائمی با حفظ روش</option>
        </Select>
        <DraftNotice text="مبدأ و مقصد فقط می‌توانند مسیر داخلی سایت باشند؛ مقصدهای خارجی و چرخه‌های redirect رد می‌شوند." />
        {validationError ? (
          <div
            className="rounded-control border border-destructive/30 bg-error-soft px-3 py-2 text-xs leading-7 text-destructive"
            role="alert"
          >
            {validationError}
          </div>
        ) : null}
        {createMutation.error ? <ErrorMessage error={createMutation.error} /> : null}
        {updateMutation.error ? <ErrorMessage error={updateMutation.error} /> : null}
        {deleteMutation.error ? <ErrorMessage error={deleteMutation.error} /> : null}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <span className="text-xs text-muted-foreground" role="status">
            {busy
              ? 'در حال ذخیره…'
              : saved
                ? 'ذخیره شد'
                : dirty
                  ? 'تغییرات ذخیره‌نشده'
                  : 'همگام با سرور'}
          </span>
          <div className="flex gap-2">
            <Button type="submit" loading={busy} disabled={!canEdit || !dirty}>
              {isNew ? 'ذخیره redirect' : 'ذخیره تغییرات'}
            </Button>
            {item ? (
              <Button
                type="button"
                variant="destructive"
                disabled={!canEdit || busy}
                onClick={remove}
              >
                حذف
              </Button>
            ) : null}
          </div>
        </div>
      </form>
    </Panel>
  );
}

```

---


### 17. RedirectList

**Path:** `src/features/content/components/content-seo/redirect-list.tsx`

```tsx
import { type AdminRedirect } from '@nova/api-client';
import { Button } from '@nova/ui';

import { Icon } from '@/shared/ui/icon';

import { Panel } from '@/features/content/components/content-seo/panel';

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

```

---


### 18. RedirectsView

**Path:** `src/features/content/components/content-seo/redirects-view.tsx`

```tsx
import { useMemo, useState } from 'react';
import { type AdminRedirect } from '@nova/api-client';
import { Button } from '@nova/ui';

import { useAdminRedirects } from '@/features/content/api/content/content-api';
import { Icon } from '@/shared/ui/icon';

import { REDIRECT_LIMIT } from '@/features/content/pages/admin-content-seo-page-shared';

import { RedirectEditor } from '@/features/content/components/content-seo/redirect-editor';

import { RedirectList } from '@/features/content/components/content-seo/redirect-list';

import { SearchBar } from '@/features/content/components/content-seo/search-bar';

import { StatePanel } from '@/features/content/components/content-seo/state-panel';

import { adminContentSeoErrorMessage } from '@/features/content/components/content-seo/admin-content-seo-error-message';

import { isOfflineError } from '@/features/content/components/content-seo/is-offline-error';

export function RedirectsView({ canEdit }: { canEdit: boolean }) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const queryInput = useMemo(
    () => ({ page: 1, limit: REDIRECT_LIMIT, ...(search.trim() ? { q: search.trim() } : {}) }),
    [search],
  );
  const query = useAdminRedirects(queryInput, canEdit);
  const items = query.data?.items ?? [];
  const selected = creating
    ? null
    : (items.find((item) => item.id === selectedId) ?? items[0] ?? null);
  const save = (item: AdminRedirect) => {
    setCreating(false);
    setSelectedId(item.id);
    void query.refetch();
  };
  if (query.isPending)
    return (
      <StatePanel
        kind="loading"
        title="در حال بارگیری redirectها"
        description="قواعد انتقال در حال دریافت هستند."
      />
    );
  if (query.error)
    return (
      <StatePanel
        kind={isOfflineError(query.error) ? 'offline' : 'error'}
        title="بارگیری redirectها انجام نشد"
        description={adminContentSeoErrorMessage(query.error)}
        action={
          <Button variant="outline" onClick={() => void query.refetch()}>
            <Icon name="refresh" size={17} />
            تلاش دوباره
          </Button>
        }
      />
    );
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-editorial border border-border bg-surface p-3 md:flex-row">
        <SearchBar value={search} onChange={setSearch} placeholder="جست‌وجو در مسیرهای داخلی…" />
      </div>
      {!items.length && !creating ? (
        <StatePanel
          kind="empty"
          title="redirectی ثبت نشده است"
          description="انتقال‌های قدیمی به مسیرهای جدید را به‌صورت داخلی و قابل بررسی ثبت کنید."
          action={
            canEdit ? (
              <Button onClick={() => setCreating(true)}>
                <Icon name="plus" size={17} />
                redirect جدید
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)]">
          <RedirectList
            items={items}
            selectedId={selected?.id ?? null}
            onSelect={(id) => {
              setCreating(false);
              setSelectedId(id);
            }}
            onCreate={() => setCreating(true)}
            canEdit={canEdit}
          />
          <RedirectEditor
            key={creating ? 'new' : (selected?.id ?? 'empty')}
            item={selected}
            redirects={items}
            canEdit={canEdit}
            onSaved={save}
          />
        </div>
      )}
    </div>
  );
}

```

---


### 19. SearchBar

**Path:** `src/features/content/components/content-seo/search-bar.tsx`

```tsx
import { Input as UiInput } from '@nova/ui';

import { Icon } from '@/shared/ui/icon';

export function SearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="flex min-h-11 flex-1 items-center gap-2 rounded-control border border-border bg-surface px-3 text-xs focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15">
      <Icon name="search" size={18} />
      <span className="sr-only">جست‌وجو</span>
      <UiInput
        dir="rtl"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
        placeholder={placeholder}
      />
    </label>
  );
}

```

---


### 20. Select

**Path:** `src/features/content/components/content-seo/select.tsx`

```tsx
import { type ReactNode } from 'react';

import { Label, Select as UiSelect } from '@nova/ui';

export function Select({
  label,
  value,
  onChange,
  children,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <Label className="block space-y-2 text-right text-xs">
      <span className="font-semibold text-foreground">{label}</span>
      <UiSelect
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-control border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-secondary"
      >
        {children}
      </UiSelect>
    </Label>
  );
}

```

---


### 21. SeoEditor

**Path:** `src/features/content/components/content-seo/seo-editor.tsx`

```tsx
import { useEffect, useState, type FormEvent } from 'react';
import { type AdminSeoMetadata } from '@nova/api-client';
import { Button, Checkbox } from '@nova/ui';

import {
  useCreateAdminSeoMetadata,
  useDeleteAdminSeoMetadata,
  useUpdateAdminSeoMetadata,
} from '@/features/content/api/content/content-api';

import type { SeoDraft } from '@/features/content/pages/admin-content-seo-page-shared';

import { ErrorMessage } from '@/features/content/components/content-seo/error-message';

import { Input } from '@/features/content/components/content-seo/input';

import { Panel } from '@/features/content/components/content-seo/panel';

import { Textarea } from '@/features/content/components/content-seo/textarea';

import { isAdminContentSeoEditorInputDisabled } from '@/features/content/components/content-seo/is-admin-content-seo-editor-input-disabled';

import { validateSeoDraft } from '@/features/content/components/content-seo/validate-seo-draft';

export function SeoEditor({
  item,
  canEdit,
  onSaved,
}: {
  item: AdminSeoMetadata | null;
  canEdit: boolean;
  onSaved: (item: AdminSeoMetadata) => void;
}) {
  const createMutation = useCreateAdminSeoMetadata();
  const updateMutation = useUpdateAdminSeoMetadata();
  const deleteMutation = useDeleteAdminSeoMetadata();
  const [draft, setDraft] = useState<SeoDraft>({
    path: '/',
    title: '',
    description: '',
    canonicalUrl: '',
    noIndex: false,
    structuredDataJson: '',
  });
  const [dirty, setDirty] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [saved, setSaved] = useState(false);
  const isNew = !item;
  useEffect(() => {
    if (item && !dirty) {
      setDraft({
        path: item.path,
        title: item.title,
        description: item.description,
        canonicalUrl: item.canonicalUrl ?? '',
        noIndex: item.noIndex,
        structuredDataJson: item.structuredData ? JSON.stringify(item.structuredData, null, 2) : '',
      });
      setValidationError('');
    }
  }, [item, dirty]);
  const update = (next: Partial<SeoDraft>) => {
    setDraft((current) => ({ ...current, ...next }));
    setDirty(true);
    setSaved(false);
    setValidationError('');
  };
  const busy = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!canEdit) return;
    const result = validateSeoDraft(draft);
    if (result.error || !result.input || !result.update) {
      setValidationError(result.error ?? 'فرم معتبر نیست.');
      return;
    }
    setValidationError('');
    if (isNew)
      createMutation.mutate(result.input, {
        onSuccess: (next) => {
          setDirty(false);
          setSaved(true);
          onSaved(next);
        },
        onError: () => undefined,
      });
    else
      updateMutation.mutate(
        { metadataId: item.id, input: { ...result.update, expectedUpdatedAt: item.updatedAt } },
        {
          onSuccess: (next) => {
            setDirty(false);
            setSaved(true);
            onSaved(next);
          },
          onError: () => undefined,
        },
      );
  };
  const remove = () => {
    if (!item || typeof window === 'undefined' || !window.confirm('این متادیتا حذف شود؟')) return;
    deleteMutation.mutate(item.id, {
      onSuccess: () => {
        setDirty(false);
        setSaved(false);
        onSaved(item);
      },
      onError: () => undefined,
    });
  };
  return (
    <Panel
      title={isNew ? 'SEO جدید' : 'ویرایش SEO'}
      eyebrow={isNew ? 'SEO / CREATE' : 'SEO / DETAIL'}
    >
      <form className="space-y-4" onSubmit={submit}>
        <Input
          label="مسیر صفحه"
          value={draft.path}
          onChange={(value) => update({ path: value })}
          dir="ltr"
          disabled={!isNew || busy || !canEdit}
          placeholder="/shipping"
        />
        <Input
          label="عنوان SEO"
          value={draft.title}
          onChange={(value) => update({ title: value })}
          disabled={busy || !canEdit}
        />
        <Textarea
          label="توضیح SEO"
          value={draft.description}
          onChange={(value) => update({ description: value })}
          disabled={isAdminContentSeoEditorInputDisabled(canEdit, busy)}
          rows={4}
        />
        <Input
          label="canonical اختیاری"
          value={draft.canonicalUrl}
          onChange={(value) => update({ canonicalUrl: value })}
          dir="ltr"
          disabled={busy || !canEdit}
          placeholder="/shipping یا https://example.com/shipping"
        />
        <Textarea
          label="داده ساختاریافته JSON-LD"
          value={draft.structuredDataJson}
          onChange={(value) => update({ structuredDataJson: value })}
          dir="ltr"
          disabled={isAdminContentSeoEditorInputDisabled(canEdit, busy)}
          hint="JSON محدود و بدون HTML؛ برای داده ساختاریافته استفاده می‌شود."
          rows={6}
        />
        <label className="flex min-h-11 cursor-pointer items-center justify-end gap-3 rounded-control border border-border bg-background px-3 text-xs">
          <Checkbox
            checked={draft.noIndex}
            onChange={(event) => update({ noIndex: event.target.checked })}
            disabled={busy || !canEdit}
            className="h-5 w-5 accent-primary"
          />
          <span>این مسیر noindex باشد</span>
        </label>
        {validationError ? (
          <div
            className="rounded-control border border-destructive/30 bg-error-soft px-3 py-2 text-xs leading-7 text-destructive"
            role="alert"
          >
            {validationError}
          </div>
        ) : null}
        {createMutation.error ? <ErrorMessage error={createMutation.error} /> : null}
        {updateMutation.error ? <ErrorMessage error={updateMutation.error} /> : null}
        {deleteMutation.error ? <ErrorMessage error={deleteMutation.error} /> : null}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <span className="text-xs text-muted-foreground" role="status">
            {busy
              ? 'در حال ذخیره…'
              : saved
                ? 'ذخیره شد'
                : dirty
                  ? 'تغییرات ذخیره‌نشده'
                  : 'همگام با سرور'}
          </span>
          <div className="flex gap-2">
            <Button type="submit" loading={busy} disabled={!canEdit || !dirty}>
              {isNew ? 'ذخیره SEO' : 'ذخیره تغییرات'}
            </Button>
            {item ? (
              <Button
                type="button"
                variant="destructive"
                disabled={!canEdit || busy}
                onClick={remove}
              >
                حذف
              </Button>
            ) : null}
          </div>
        </div>
      </form>
    </Panel>
  );
}

```

---


### 22. SeoView

**Path:** `src/features/content/components/content-seo/seo-view.tsx`

```tsx
import { useMemo, useState } from 'react';
import { type AdminSeoMetadata } from '@nova/api-client';
import { Button } from '@nova/ui';

import { useAdminSeoMetadata } from '@/features/content/api/content/content-api';
import { Icon } from '@/shared/ui/icon';

import { SEO_LIMIT } from '@/features/content/pages/admin-content-seo-page-shared';

import { SearchBar } from '@/features/content/components/content-seo/search-bar';

import { SeoEditor } from '@/features/content/components/content-seo/seo-editor';

import { StatePanel } from '@/features/content/components/content-seo/state-panel';

import { adminContentSeoErrorMessage } from '@/features/content/components/content-seo/admin-content-seo-error-message';

import { isOfflineError } from '@/features/content/components/content-seo/is-offline-error';

import { formatDate } from '@/features/content/components/content-seo/format-date';

export function SeoView({ canEdit }: { canEdit: boolean }) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const queryInput = useMemo(
    () => ({ page: 1, limit: SEO_LIMIT, ...(search.trim() ? { q: search.trim() } : {}) }),
    [search],
  );
  const query = useAdminSeoMetadata(queryInput, canEdit);
  const items = query.data?.items ?? [];
  const selected = creating ? null : (items.find((item) => item.id === selectedId) ?? null);
  const save = (item: AdminSeoMetadata) => {
    setCreating(false);
    setSelectedId(item.id);
    void query.refetch();
  };
  if (query.isPending)
    return (
      <StatePanel
        kind="loading"
        title="در حال بارگیری متادیتا"
        description="رکوردهای SEO در حال دریافت هستند."
      />
    );
  if (query.error)
    return (
      <StatePanel
        kind={isOfflineError(query.error) ? 'offline' : 'error'}
        title="بارگیری SEO انجام نشد"
        description={adminContentSeoErrorMessage(query.error)}
        action={
          <Button variant="outline" onClick={() => void query.refetch()}>
            <Icon name="refresh" size={17} />
            تلاش دوباره
          </Button>
        }
      />
    );
  return (
    <div className="admin-reference-seo">
      <div className="admin-reference-seo__toolbar">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="جست‌وجوی صفحات..."
        />
        <div className="admin-reference-seo__filters" aria-label="فیلترهای سریع">
          <button className="is-active" type="button">همه</button>
          <button type="button">برگه‌ها</button>
          <button type="button">محصولات</button>
          <button type="button">دسته‌ها</button>
        </div>
        {canEdit ? (
          <Button className="admin-reference-seo__add" onClick={() => setCreating(true)}>
            <Icon name="plus" size={17} />
            افزودن دستی
          </Button>
        ) : null}
      </div>

      {!items.length && !creating ? (
        <StatePanel
          kind="empty"
          title="متادیتای SEO خالی است"
          description="برای کنترل عنوان، توضیح و canonical مسیرهای مهم، اولین رکورد را ایجاد کنید."
          action={
            canEdit ? (
              <Button onClick={() => setCreating(true)}>
                <Icon name="plus" size={17} />
                رکورد جدید
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          {items.length ? (
            <section className="admin-reference-seo-table" aria-label="فهرست متادیتای SEO">
              <div className="admin-reference-seo-table__head" aria-hidden="true">
                <span>صفحه</span>
                <span>عنوان SEO</span>
                <span>توضیحات متا</span>
                <span>Canonical</span>
                <span>وضعیت</span>
                <span>آخرین بروزرسانی</span>
                <span />
              </div>

              <div className="admin-reference-seo-table__rows">
                {items.map((item) => (
                  <button
                    className={`admin-reference-seo-row ${selectedId === item.id ? 'is-selected' : ''}`}
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setCreating(false);
                      setSelectedId(item.id);
                    }}
                  >
                    <span className="admin-reference-seo-row__page">
                      <span className="admin-reference-seo-row__thumb">
                        <Icon name="book" size={18} />
                      </span>
                      <span>
                        <strong>{item.path === '/' ? 'صفحه اصلی' : item.path}</strong>
                        <small dir="ltr">{item.path}</small>
                      </span>
                    </span>
                    <span>{item.title}</span>
                    <span>{item.description}</span>
                    <span dir="ltr">{item.canonicalUrl ?? '—'}</span>
                    <span>
                      <em className={item.noIndex ? 'is-warning' : 'is-good'}>
                        {item.noIndex ? 'نیاز به بررسی' : 'بهینه'}
                      </em>
                    </span>
                    <span dir="ltr">{formatDate(item.updatedAt)}</span>
                    <span className="admin-reference-more"><Icon name="more-vertical" size={17} /></span>
                  </button>
                ))}
              </div>

              <div className="admin-reference-seo-mobile">
                {items.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => {
                      setCreating(false);
                      setSelectedId(item.id);
                    }}
                  >
                    <span className="admin-reference-seo-row__thumb"><Icon name="book" size={17} /></span>
                    <span>
                      <strong>{item.path === '/' ? 'صفحه اصلی' : item.path}</strong>
                      <small>{item.title}</small>
                      <em className={item.noIndex ? 'is-warning' : 'is-good'}>
                        {item.noIndex ? 'نیاز به بررسی' : 'بهینه'}
                      </em>
                    </span>
                    <Icon name="more-vertical" size={17} />
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {creating || selected ? (
            <div className="admin-reference-seo-editor">
              <SeoEditor
                key={creating ? 'new' : (selected?.id ?? 'empty')}
                item={selected}
                canEdit={canEdit}
                onSaved={save}
              />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

```

---


### 23. StatePanel

**Path:** `src/features/content/components/content-seo/state-panel.tsx`

```tsx
import { type ReactNode } from 'react';

import { Icon } from '@/shared/ui/icon';

import type { AdminContentSeoState } from '@/features/content/pages/admin-content-seo-page-shared';

import { stateIcon } from '@/features/content/components/content-seo/state-icon';

export function StatePanel({
  kind,
  title,
  description,
  action,
}: {
  kind: AdminContentSeoState;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section
      className="rounded-editorial border border-border bg-surface p-8 text-center shadow-card"
      role={kind === 'error' || kind === 'offline' || kind === 'permission' ? 'alert' : 'status'}
    >
      <span
        className={`mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full ${kind === 'error' || kind === 'offline' || kind === 'permission' ? 'bg-warning-soft text-warning' : 'bg-accent-soft text-primary'}`}
      >
        <Icon name={stateIcon(kind)} size={22} />
      </span>
      <h2 className="mt-4 text-lg leading-8">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-xs leading-7 text-muted-foreground">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </section>
  );
}

```

---


### 24. StatusChip

**Path:** `src/features/content/components/content-seo/status-chip.tsx`

```tsx
import { type AdminContentStatus } from '@nova/api-client';
import { Badge } from '@nova/ui';

import { statusLabel } from '@/features/content/components/content-seo/status-label';

export function StatusChip({ status }: { status: AdminContentStatus }) {
  const tone = status === 'PUBLISHED' ? 'success' : status === 'ARCHIVED' ? 'neutral' : 'warning';
  const variant = tone === 'neutral' ? 'secondary' : tone;
  return (
    <Badge variant={variant} className="min-h-7 rounded-md text-[11px]">
      {statusLabel(status)}
    </Badge>
  );
}

```

---


### 25. Textarea

**Path:** `src/features/content/components/content-seo/textarea.tsx`

```tsx
import { Label, Textarea as UiTextarea } from '@nova/ui';

export function Textarea({
  label,
  value,
  onChange,
  dir = 'rtl',
  hint,
  rows = 5,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  dir?: 'rtl' | 'ltr';
  hint?: string;
  rows?: number;
  disabled?: boolean;
}) {
  return (
    <Label className="block space-y-2 text-right text-xs">
      <span className="font-semibold text-foreground">{label}</span>
      <UiTextarea
        dir={dir}
        value={value}
        rows={rows}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-control border border-border bg-background px-3 py-3 text-sm leading-7 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-secondary"
      />
      {hint ? (
        <span className="block text-[11px] leading-6 text-muted-foreground">{hint}</span>
      ) : null}
    </Label>
  );
}

```

---


### 26. Icon

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

- Page: `src/features/content/components/content-seo/ContentSeoView.tsx`
- Custom component files: 26
- Total files included: 27
