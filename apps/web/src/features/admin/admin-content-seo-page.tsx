import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';

import {
  ApiClientError,
  type AdminContentPage,
  type AdminContentPageCreateInput,
  type AdminContentPageListItem,
  type AdminContentPageUpdateInput,
  type AdminContentStatus,
  type AdminRedirect,
  type AdminRedirectCreateInput,
  type AdminRedirectUpdateInput,
  type AdminSeoMetadata,
  type AdminSeoMetadataCreateInput,
  type AdminSeoMetadataUpdateInput,
  type SeoRedirectStatusCode,
} from '@nova/api-client';
import { Button } from '@nova/ui';

import { useStaffUser } from './admin-catalog-api';
import { isStaffAuthFailure, isStaffAuthorizationFailure } from './admin-auth';
import {
  useAdminContentPage,
  useAdminContentPages,
  useAdminRedirects,
  useAdminSeoMetadata,
  useCreateAdminContentPage,
  useCreateAdminRedirect,
  useCreateAdminSeoMetadata,
  useDeleteAdminRedirect,
  useDeleteAdminSeoMetadata,
  useUpdateAdminContentPage,
  useUpdateAdminContentPageStatus,
  useUpdateAdminRedirect,
  useUpdateAdminSeoMetadata,
} from '../content/content-api';
import { Icon, type IconName } from '../../shared/icon';

export type AdminContentSeoView = 'content' | 'seo' | 'redirects';
export type AdminContentSeoState =
  'loading' | 'ready' | 'empty' | 'error' | 'offline' | 'expired' | 'permission';

const MAX_BLOCKS = 12;
const MAX_JSON_LENGTH = 12_000;
const MAX_JSON_DEPTH = 5;
const SAFE_BLOCK_KIND = /^[a-z][a-z0-9._-]{0,31}$/;
const SAFE_SITE_PATH = /^\/(?!\/)[^\s<>\\:]*$/;
const HTML_LIKE = /<\/?[a-z!/][^>]*>/i;
const CONTENT_LIMIT = 10;
const SEO_LIMIT = 10;
const REDIRECT_LIMIT = 100;

type ContentDraft = { slug: string; title: string; body: string; blocksJson: string };
type SeoDraft = {
  path: string;
  title: string;
  description: string;
  canonicalUrl: string;
  noIndex: boolean;
  structuredDataJson: string;
};
type RedirectDraft = { fromPath: string; toPath: string; statusCode: SeoRedirectStatusCode };

export type AdminContentSeoQueryState = {
  isPending?: boolean;
  isError?: boolean;
  error?: unknown;
  hasItems?: boolean;
};

export function normalizeAdminContentSeoView(view: string | undefined): AdminContentSeoView {
  if (view === 'seo' || view === 'redirects') return view;
  return 'content';
}

export function canManageAdminContent(roles: readonly string[] | undefined): boolean {
  return Boolean(roles?.some((role) => role.toLowerCase() === 'admin'));
}

export function normalizeSiteRelativePath(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '/';
  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withSlash.length > 1 ? withSlash.replace(/\/+$/, '') || '/' : '/';
}

export function isSafeSiteRelativePath(value: string): boolean {
  const raw = value.trim();
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith('//')) return false;
  const normalized = normalizeSiteRelativePath(value);
  return normalized.length <= 500 && normalized !== '//' && SAFE_SITE_PATH.test(normalized);
}

export function safeContentHref(slug: string): string {
  return `#content/${encodeURIComponent(slug.trim().toLowerCase())}`;
}

function containsHtmlLikeValue(value: unknown): boolean {
  if (typeof value === 'string') return HTML_LIKE.test(value);
  if (Array.isArray(value)) return value.some(containsHtmlLikeValue);
  if (value && typeof value === 'object') {
    return Object.entries(value).some(
      ([key, child]) => HTML_LIKE.test(key) || containsHtmlLikeValue(child),
    );
  }
  return false;
}

function jsonDepth(value: unknown): number {
  if (!value || typeof value !== 'object') return 0;
  const children = Array.isArray(value) ? value : Object.values(value);
  return children.length ? 1 + Math.max(...children.map(jsonDepth)) : 1;
}

export function parseBoundedJson(
  value: string,
  label = 'JSON',
): { value?: unknown; error?: string } {
  const trimmed = value.trim();
  if (!trimmed) return { value: null };
  if (trimmed.length > MAX_JSON_LENGTH) {
    return { error: `${label} باید حداکثر ${MAX_JSON_LENGTH.toLocaleString('fa-IR')} نویسه باشد.` };
  }
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (jsonDepth(parsed) > MAX_JSON_DEPTH) {
      return { error: `${label} بیش از حد تو در تو است.` };
    }
    if (containsHtmlLikeValue(parsed)) {
      return { error: `${label} نباید شامل HTML یا محتوای نشانه‌گذاری‌شده باشد.` };
    }
    return { value: parsed };
  } catch {
    return { error: `${label} معتبر نیست؛ ساختار JSON را بررسی کنید.` };
  }
}

export function validateContentBlocks(value: string): {
  blocks?: AdminContentPageCreateInput['blocks'];
  error?: string;
} {
  const parsed = parseBoundedJson(value, 'بلوک‌ها');
  if (parsed.error) return { error: parsed.error };
  if (parsed.value === null || parsed.value === undefined || parsed.value === '')
    return { blocks: [] };
  if (!Array.isArray(parsed.value)) return { error: 'بلوک‌ها باید یک آرایه JSON باشند.' };
  if (parsed.value.length > MAX_BLOCKS)
    return { error: `تعداد بلوک‌ها نمی‌تواند بیشتر از ${MAX_BLOCKS} باشد.` };

  const blocks: Array<{ kind: string; payload: unknown; sortOrder: number }> = [];
  for (const [index, item] of parsed.value.entries()) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return { error: `بلوک ${index + 1} باید یک شیء باشد.` };
    }
    const candidate = item as Record<string, unknown>;
    const kind = typeof candidate.kind === 'string' ? candidate.kind.trim() : '';
    if (!SAFE_BLOCK_KIND.test(kind)) {
      return { error: `نوع بلوک ${index + 1} معتبر نیست.` };
    }
    if (!Object.prototype.hasOwnProperty.call(candidate, 'payload')) {
      return { error: `بلوک ${index + 1} باید payload داشته باشد.` };
    }
    const sortOrder = candidate.sortOrder === undefined ? index : candidate.sortOrder;
    if (typeof sortOrder !== 'number' || !Number.isInteger(sortOrder) || sortOrder < 0) {
      return { error: `ترتیب بلوک ${index + 1} معتبر نیست.` };
    }
    blocks.push({ kind, payload: candidate.payload, sortOrder });
  }
  return { blocks };
}

export function validateContentDraft(
  draft: ContentDraft,
  options: { requireUsableContent?: boolean } = {},
): { input?: AdminContentPageCreateInput; update?: AdminContentPageUpdateInput; error?: string } {
  const slug = draft.slug.trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120) {
    return {
      error:
        'اسلاگ باید فقط شامل حروف انگلیسی کوچک، عدد و خط تیره باشد و حداکثر ۱۲۰ نویسه داشته باشد.',
    };
  }
  const title = draft.title.trim();
  if (!title) return { error: 'عنوان صفحه را وارد کنید.' };
  if (title.length > 200) return { error: 'عنوان صفحه نباید بیشتر از ۲۰۰ نویسه باشد.' };
  if (HTML_LIKE.test(draft.body)) return { error: 'متن صفحه نباید شامل HTML باشد.' };
  const parsedBlocks = validateContentBlocks(draft.blocksJson);
  if (parsedBlocks.error || !parsedBlocks.blocks)
    return { error: parsedBlocks.error ?? 'بلوک‌ها معتبر نیستند.' };
  const body = draft.body.trim();
  if (options.requireUsableContent && !body && parsedBlocks.blocks.length === 0) {
    return { error: 'پیش از انتشار، حداقل یک متن یا بلوک محتوایی اضافه کنید.' };
  }
  const input = { slug, title, body: body || null, blocks: parsedBlocks.blocks };
  return { input, update: { title, body: body || null, blocks: parsedBlocks.blocks } };
}

export function getPublishReadiness(draft: ContentDraft): { canPublish: boolean; reason?: string } {
  const result = validateContentDraft(draft, { requireUsableContent: true });
  return result.error ? { canPublish: false, reason: result.error } : { canPublish: true };
}

export function validateSeoDraft(draft: SeoDraft): {
  input?: AdminSeoMetadataCreateInput;
  update?: AdminSeoMetadataUpdateInput;
  error?: string;
} {
  const path = normalizeSiteRelativePath(draft.path);
  if (!isSafeSiteRelativePath(path))
    return { error: 'مسیر باید یک مسیر داخلی معتبر و نسبی از ریشه سایت باشد.' };
  const title = draft.title.trim();
  const description = draft.description.trim();
  if (!title) return { error: 'عنوان SEO را وارد کنید.' };
  if (!description) return { error: 'توضیح SEO را وارد کنید.' };
  if (title.length > 200 || description.length > 500)
    return { error: 'طول عنوان یا توضیح SEO بیشتر از حد مجاز است.' };
  const canonicalUrl = draft.canonicalUrl.trim();
  if (canonicalUrl && !isSafeCanonicalUrl(canonicalUrl))
    return { error: 'canonical باید مسیر داخلی یا URL امن HTTPS باشد.' };
  const structured = parseBoundedJson(draft.structuredDataJson, 'داده ساختاریافته');
  if (structured.error) return { error: structured.error };
  const input = {
    path,
    title,
    description,
    canonicalUrl: canonicalUrl || null,
    noIndex: draft.noIndex,
    structuredData: structured.value ?? null,
  };
  return {
    input,
    update: {
      title,
      description,
      canonicalUrl: canonicalUrl || null,
      noIndex: draft.noIndex,
      structuredData: structured.value ?? null,
    },
  };
}

function isSafeCanonicalUrl(value: string): boolean {
  if (value.startsWith('/') && !value.startsWith('//')) return isSafeSiteRelativePath(value);
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function wouldCreateRedirectCycle(
  redirects: readonly Pick<AdminRedirect, 'id' | 'fromPath' | 'toPath'>[],
  candidate: { id?: string; fromPath: string; toPath: string },
): boolean {
  const from = normalizeSiteRelativePath(candidate.fromPath);
  const firstTo = normalizeSiteRelativePath(candidate.toPath);
  if (from === firstTo) return true;
  const edges = new Map<string, string>();
  for (const redirect of redirects) {
    if (redirect.id !== candidate.id)
      edges.set(
        normalizeSiteRelativePath(redirect.fromPath),
        normalizeSiteRelativePath(redirect.toPath),
      );
  }
  edges.set(from, firstTo);
  const visited = new Set<string>();
  let current: string | undefined = from;
  while (current) {
    if (visited.has(current)) return true;
    visited.add(current);
    current = edges.get(current);
  }
  return false;
}

export function validateRedirectDraft(
  draft: RedirectDraft,
  redirects: readonly Pick<AdminRedirect, 'id' | 'fromPath' | 'toPath'>[] = [],
  id?: string,
): { input?: AdminRedirectCreateInput; update?: AdminRedirectUpdateInput; error?: string } {
  const fromPath = normalizeSiteRelativePath(draft.fromPath);
  const toPath = normalizeSiteRelativePath(draft.toPath);
  if (!isSafeSiteRelativePath(fromPath) || !isSafeSiteRelativePath(toPath))
    return { error: 'مبدأ و مقصد باید مسیرهای داخلی و نسبی از ریشه سایت باشند.' };
  if (wouldCreateRedirectCycle(redirects, { id, fromPath, toPath }))
    return { error: 'این تغییر یک چرخه در زنجیره redirect ایجاد می‌کند.' };
  return {
    input: { fromPath, toPath, statusCode: draft.statusCode },
    update: { toPath, statusCode: draft.statusCode },
  };
}

export function adminContentSeoErrorMessage(
  error: unknown,
  fallback = 'عملیات انجام نشد؛ دوباره تلاش کنید.',
): string {
  if (error instanceof ApiClientError) {
    if (error.status === 401) return 'نشست مدیریت منقضی شده است؛ دوباره وارد شوید.';
    if (error.status === 403) return 'شما اجازه انجام این عملیات را ندارید.';
    if (error.status === 409) return 'این رکورد هم‌زمان تغییر کرده است؛ نسخه تازه را بارگیری کنید.';
    if (error.payload?.error.message) return error.payload.error.message;
  }
  if (isOfflineError(error)) return 'اتصال شبکه برقرار نیست؛ پس از اتصال دوباره تلاش کنید.';
  return error instanceof Error && error.message ? error.message : fallback;
}

export function isOfflineError(error: unknown): boolean {
  return (
    (typeof navigator !== 'undefined' && navigator.onLine === false) ||
    (error instanceof TypeError && /fetch|network|load/i.test(error.message))
  );
}

export function getAdminContentSeoState(
  query: AdminContentSeoQueryState,
  roles?: readonly string[],
): AdminContentSeoState {
  if (roles && !canManageAdminContent(roles)) return 'permission';
  if (query.isPending) return 'loading';
  if (query.isError) return isOfflineError(query.error) ? 'offline' : 'error';
  return query.hasItems ? 'ready' : 'empty';
}

export function isAdminContentSeoEditorInputDisabled(canEdit: boolean, busy: boolean): boolean {
  return !canEdit || busy;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'تاریخ نامشخص'
    : new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function statusLabel(status: AdminContentStatus): string {
  return status === 'PUBLISHED' ? 'منتشر شده' : status === 'ARCHIVED' ? 'بایگانی شده' : 'پیش‌نویس';
}

function stateIcon(kind: AdminContentSeoState): IconName {
  return kind === 'loading'
    ? 'refresh'
    : kind === 'permission' || kind === 'offline'
      ? 'warning'
      : kind === 'error'
        ? 'info'
        : kind === 'empty'
          ? 'book'
          : 'check';
}

function Input({
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
    <label className="block space-y-2 text-right text-xs">
      <span className="font-semibold text-foreground">{label}</span>
      <input
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
    </label>
  );
}

function Textarea({
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
    <label className="block space-y-2 text-right text-xs">
      <span className="font-semibold text-foreground">{label}</span>
      <textarea
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
    </label>
  );
}

function Select({
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
    <label className="block space-y-2 text-right text-xs">
      <span className="font-semibold text-foreground">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-control border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-secondary"
      >
        {children}
      </select>
    </label>
  );
}

function Panel({
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

function StatePanel({
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

function StatusChip({ status }: { status: AdminContentStatus }) {
  const tone = status === 'PUBLISHED' ? 'success' : status === 'ARCHIVED' ? 'neutral' : 'warning';
  const classes = {
    success: 'border-success/30 bg-success-soft text-success',
    warning: 'border-warning/30 bg-warning-soft text-warning',
    neutral: 'border-border bg-secondary text-muted-foreground',
  };
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-md border px-2.5 py-1 text-[11px] ${classes[tone]}`}
    >
      {statusLabel(status)}
    </span>
  );
}

function ErrorMessage({ error }: { error: unknown }) {
  return (
    <div
      className="rounded-control border border-warning/30 bg-warning-soft px-3 py-2 text-xs leading-7 text-warning"
      role="alert"
    >
      {adminContentSeoErrorMessage(error)}
    </div>
  );
}

function DraftNotice({ text }: { text: string }) {
  return (
    <div
      className="rounded-control border border-info/30 bg-info-soft px-3 py-2 text-xs leading-7 text-info"
      role="status"
    >
      {text}
    </div>
  );
}

function ContentList({
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
              <button
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
              </button>
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

function ContentEditor({
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
                disabled={!canEdit || busy}
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

function SeoList({
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
            <button
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
            </button>
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

function SeoEditor({
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
          <input
            type="checkbox"
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

function RedirectList({
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
            <button
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
            </button>
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

function RedirectEditor({
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

function SearchBar({
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
      <input
        dir="rtl"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
        placeholder={placeholder}
      />
    </label>
  );
}

function ContentView({ canEdit, pageId }: { canEdit: boolean; pageId?: string }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<AdminContentStatus | ''>('');
  const [selectedId, setSelectedId] = useState(pageId ?? '');
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
    setEditorKey((key) => key + 1);
  }, [pageId]);
  const select = (id: string) => {
    setSelectedId(id);
    setEditorKey((key) => key + 1);
  };
  const create = () => {
    setSelectedId('');
    setEditorKey((key) => key + 1);
  };
  const onSaved = (page: AdminContentPage) => {
    setSelectedId(page.id);
  };
  const onCreated = (page: AdminContentPage) => {
    setSelectedId(page.id);
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
      {!items.length && !selectedId ? (
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

function SeoView({ canEdit }: { canEdit: boolean }) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const queryInput = useMemo(
    () => ({ page: 1, limit: SEO_LIMIT, ...(search.trim() ? { q: search.trim() } : {}) }),
    [search],
  );
  const query = useAdminSeoMetadata(queryInput, canEdit);
  const items = query.data?.items ?? [];
  const selected = creating
    ? null
    : (items.find((item) => item.id === selectedId) ?? items[0] ?? null);
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
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-editorial border border-border bg-surface p-3 md:flex-row">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="جست‌وجو بر اساس مسیر یا عنوان…"
        />
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
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)]">
          <SeoList
            items={items}
            selectedId={selected?.id ?? null}
            onSelect={(id) => {
              setCreating(false);
              setSelectedId(id);
            }}
            onCreate={() => setCreating(true)}
            canEdit={canEdit}
          />
          <SeoEditor
            key={creating ? 'new' : (selected?.id ?? 'empty')}
            item={selected}
            canEdit={canEdit}
            onSaved={save}
          />
        </div>
      )}
    </div>
  );
}

function RedirectsView({ canEdit }: { canEdit: boolean }) {
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

function AdminContentSeoNavigation({ activeView }: { activeView: AdminContentSeoView }) {
  const items: Array<[AdminContentSeoView, string, IconName]> = [
    ['content', 'محتوا', 'book'],
    ['seo', 'متادیتای SEO', 'sparkles'],
    ['redirects', 'redirectها', 'rotate'],
  ];
  return (
    <nav className="overflow-x-auto" aria-label="بخش‌های محتوا و SEO">
      <div className="flex min-w-max gap-2">
        {items.map(([view, label, icon]) => (
          <a
            key={view}
            href={`#admin/${view === 'content' ? 'content' : `content/${view}`}`}
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

export function AdminContentSeoPage({
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
        <div className="mx-auto max-w-[1180px]">
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
      className="min-h-svh bg-[#f6f3ed] px-4 py-5 text-foreground md:px-6 md:py-8 lg:px-8"
    >
      <div className="mx-auto max-w-[1180px]">
        <header className="mb-5 flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
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
