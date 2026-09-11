import { useEffect, useState, type ReactNode } from 'react';

import { ApiClientError, isContentPageSlug } from '@nova/api-client';
import type { ContentPage } from '@nova/api-client';

import { Icon } from '../../shared/icon';
import { useContentPage } from './content-api';

const MAX_BLOCKS = 12;
const MAX_TEXT_LENGTH = 12_000;
const MAX_BLOCK_TEXT_LENGTH = 4_000;
const MAX_LINK_LABEL_LENGTH = 160;
const MAX_HREF_LENGTH = 2_048;

const textBlockKinds = new Set(['paragraph', 'text', 'rich-text']);
const supportedBlockKinds = new Set(['paragraph', 'text', 'rich-text', 'heading', 'quote', 'link']);

export type PublicContentSystemState = 'offline' | 'maintenance';

export type PublicContentViewState =
  | 'invalid-route'
  | 'loading'
  | 'missing'
  | 'error'
  | 'offline'
  | 'maintenance'
  | 'empty'
  | 'unsupported'
  | 'published';

export type PublicContentErrorState = Extract<
  PublicContentViewState,
  'missing' | 'error' | 'offline' | 'maintenance'
>;

export type RenderableContentBlock =
  | { kind: 'text'; key: string; text: string }
  | { kind: 'heading'; key: string; level: 2 | 3; text: string }
  | { kind: 'quote'; key: string; text: string; cite?: string }
  | { kind: 'link'; key: string; label: string; href: string };

export interface RenderableContentBlocks {
  blocks: RenderableContentBlock[];
  unsupportedCount: number;
}

interface ContentQuerySnapshot {
  isPending: boolean;
  isError: boolean;
  error?: unknown;
  data?: ContentPage;
}

function recordValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function containsControlCharacter(value: string): boolean {
  return [...value].some((character) => {
    const code = character.charCodeAt(0);
    return code <= 0x1f || code === 0x7f;
  });
}

function boundedText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text ? text.slice(0, maxLength) : null;
}

function decodeSlug(value: string): string | null {
  try {
    return decodeURIComponent(value.trim());
  } catch {
    return null;
  }
}

export function normalizePublicContentSlug(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const decoded = decodeSlug(value);
  if (!decoded) return null;
  const normalized = decoded.toLowerCase();
  return isContentPageSlug(normalized) ? normalized : null;
}

export function publicContentPath(slug: string): string | null {
  const normalized = normalizePublicContentSlug(slug);
  return normalized ? `/content/${encodeURIComponent(normalized)}` : null;
}

export function publicContentHashHref(slug: string): string | null {
  const normalized = normalizePublicContentSlug(slug);
  return normalized ? `#content/${encodeURIComponent(normalized)}` : null;
}

export function safeSiteRelativeHref(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const candidate = value.trim();
  if (
    !candidate ||
    candidate.length > MAX_HREF_LENGTH ||
    !candidate.startsWith('/') ||
    candidate.startsWith('//') ||
    candidate.includes('\\') ||
    containsControlCharacter(candidate)
  ) {
    return null;
  }

  const rawPath = candidate.split(/[?#]/, 1)[0] ?? '';
  const rawSegments = rawPath.split('/');
  if (
    rawSegments.some((segment) => segment === '.' || segment === '..') ||
    /%(?:2e|2f|5c)/i.test(rawPath)
  ) {
    return null;
  }

  try {
    const url = new URL(candidate, 'https://nova.invalid');
    if (url.origin !== 'https://nova.invalid' || url.username || url.password) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function classifyContentError(error: unknown, online = true): PublicContentErrorState {
  if (error instanceof ApiClientError) {
    const code = error.payload?.error.code ?? '';
    if (error.status === 404) return 'missing';
    if (error.status === 503 || /maintenance|unavailable/i.test(code)) return 'maintenance';
  }

  if (!online || (error instanceof TypeError && /fetch|network|load/i.test(error.message))) {
    return 'offline';
  }
  return 'error';
}

export function isPublishedContentPage(value: unknown, slug: string): value is ContentPage {
  const record = recordValue(value);
  const normalizedSlug = normalizePublicContentSlug(slug);
  return Boolean(
    record &&
    normalizedSlug &&
    record.slug === normalizedSlug &&
    typeof record.title === 'string' &&
    record.title.trim() &&
    (record.body === null || typeof record.body === 'string') &&
    Array.isArray(record.blocks),
  );
}

function blockText(payload: unknown, maxLength = MAX_BLOCK_TEXT_LENGTH): string | null {
  if (typeof payload === 'string') return boundedText(payload, maxLength);
  return boundedText(recordValue(payload)?.text, maxLength);
}

export function getRenderableContentBlocks(blocks: unknown): RenderableContentBlocks {
  if (!Array.isArray(blocks)) return { blocks: [], unsupportedCount: 1 };

  const boundedBlocks = blocks.slice(0, MAX_BLOCKS);
  const renderable: Array<{ block: RenderableContentBlock; index: number; sortOrder: number }> = [];
  let unsupportedCount = Math.max(0, blocks.length - boundedBlocks.length);

  boundedBlocks.forEach((candidate, index) => {
    const block = recordValue(candidate);
    const kind = typeof block?.kind === 'string' ? block.kind.trim().toLowerCase() : '';
    const sortOrder =
      typeof block?.sortOrder === 'number' && Number.isInteger(block.sortOrder)
        ? block.sortOrder
        : index;
    const payload = block?.payload;
    const key = `${kind || 'unsupported'}-${sortOrder}-${index}`;

    if (!supportedBlockKinds.has(kind)) {
      unsupportedCount += 1;
      return;
    }

    if (textBlockKinds.has(kind)) {
      const text = blockText(payload);
      if (!text) {
        unsupportedCount += 1;
        return;
      }
      renderable.push({ block: { kind: 'text', key, text }, index, sortOrder });
      return;
    }

    if (kind === 'heading') {
      const payloadRecord = recordValue(payload);
      const text = blockText(payloadRecord?.text ?? payload);
      const level = payloadRecord?.level === 3 ? 3 : 2;
      if (!text) {
        unsupportedCount += 1;
        return;
      }
      renderable.push({ block: { kind, key, level, text }, index, sortOrder });
      return;
    }

    if (kind === 'quote') {
      const payloadRecord = recordValue(payload);
      const text = blockText(payloadRecord?.text ?? payload);
      const cite = boundedText(payloadRecord?.cite, 160) ?? undefined;
      if (!text) {
        unsupportedCount += 1;
        return;
      }
      renderable.push({ block: { kind, key, text, ...(cite ? { cite } : {}) }, index, sortOrder });
      return;
    }

    const payloadRecord = recordValue(payload);
    const label = boundedText(payloadRecord?.label, MAX_LINK_LABEL_LENGTH);
    const href = safeSiteRelativeHref(payloadRecord?.href);
    if (!label || !href) {
      unsupportedCount += 1;
      return;
    }
    renderable.push({ block: { kind: 'link', key, label, href }, index, sortOrder });
  });

  renderable.sort((left, right) => left.sortOrder - right.sortOrder || left.index - right.index);
  return { blocks: renderable.map(({ block }) => block), unsupportedCount };
}

export function getPublicContentState({
  slug,
  systemState,
  query,
  online = true,
}: {
  slug: string;
  systemState?: PublicContentSystemState;
  query: ContentQuerySnapshot;
  online?: boolean;
}): PublicContentViewState {
  const normalizedSlug = normalizePublicContentSlug(slug);
  if (!normalizedSlug) return 'invalid-route';
  if (systemState === 'offline' || systemState === 'maintenance') return systemState;
  if (query.isPending) return 'loading';
  if (query.isError) return classifyContentError(query.error, online);
  if (!isPublishedContentPage(query.data, normalizedSlug)) return 'missing';

  const hasBody = Boolean(boundedText(query.data.body, MAX_TEXT_LENGTH));
  const blocks = getRenderableContentBlocks(query.data.blocks);
  if (!hasBody && blocks.blocks.length === 0) {
    return blocks.unsupportedCount > 0 ? 'unsupported' : 'empty';
  }
  return 'published';
}

function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return online;
}

const stateCopy: Record<
  Exclude<PublicContentViewState, 'published' | 'empty' | 'unsupported'>,
  {
    eyebrow: string;
    title: string;
    description: string;
    icon: 'layers' | 'refresh' | 'warning' | 'settings';
    retry: boolean;
  }
> = {
  'invalid-route': {
    eyebrow: 'NOVA / CONTENT',
    title: 'این صفحه پیدا نشد',
    description: 'این مسیر معتبر نیست یا محتوای آن منتشر نشده است. برای ادامه به خانه برگردید.',
    icon: 'layers',
    retry: false,
  },
  loading: {
    eyebrow: 'NOVA / CONTENT',
    title: 'در حال بارگذاری محتوا',
    description: 'محتوای منتشرشده در حال آماده‌سازی است.',
    icon: 'refresh',
    retry: false,
  },
  missing: {
    eyebrow: 'NOVA / NOT FOUND',
    title: 'این صفحه پیدا نشد',
    description: 'این محتوا در حال حاضر منتشر نشده است یا مسیر آن تغییر کرده است.',
    icon: 'layers',
    retry: false,
  },
  error: {
    eyebrow: 'NOVA / CONTENT',
    title: 'محتوا موقتاً در دسترس نیست',
    description: 'دریافت محتوای منتشرشده کامل نشد. دوباره تلاش کنید یا به خانه برگردید.',
    icon: 'warning',
    retry: true,
  },
  offline: {
    eyebrow: 'NOVA / OFFLINE',
    title: 'اتصال به اینترنت برقرار نیست',
    description: 'برای دریافت محتوای منتشرشده، اتصال خود را بررسی کنید و دوباره تلاش کنید.',
    icon: 'warning',
    retry: true,
  },
  maintenance: {
    eyebrow: 'NOVA / MAINTENANCE',
    title: 'نوا برای لحظاتی در حال به‌روزرسانی است',
    description: 'فروشگاه به‌زودی دوباره در دسترس خواهد بود. از شکیبایی شما ممنونیم.',
    icon: 'settings',
    retry: true,
  },
};

function PageShell({ children, labelledBy }: { children: ReactNode; labelledBy?: string }) {
  return (
    <main
      className="shell inner-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background"
      dir="rtl"
      {...(labelledBy ? { 'aria-labelledby': labelledBy } : {})}
    >
      {children}
    </main>
  );
}

function SystemStatePanel({
  state,
  onRetry,
}: {
  state: Exclude<PublicContentViewState, 'published' | 'empty' | 'unsupported'>;
  onRetry?: () => void;
}) {
  const copy = stateCopy[state];
  return (
    <PageShell>
      <section
        className="empty-state min-h-[min(60svh,520px)] rounded-editorial px-5 py-12 sm:px-8"
        role={state === 'loading' ? 'status' : 'alert'}
        aria-live="polite"
      >
        <span className="section-heading__eyebrow">{copy.eyebrow}</span>
        <span className="empty-state__icon" aria-hidden="true">
          <Icon name={copy.icon} size={25} />
        </span>
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          {copy.retry && onRetry ? (
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-editorial bg-primary px-5 text-sm font-semibold text-primary-foreground transition-transform duration-150 hover:-translate-y-px hover:bg-primary-hover focus-visible:outline-none motion-reduce:transform-none motion-reduce:transition-none"
              type="button"
              onClick={onRetry}
            >
              <Icon name="refresh" size={17} />
              تلاش دوباره
            </button>
          ) : null}
          <a
            className="inline-flex min-h-11 items-center justify-center rounded-editorial border border-border bg-surface px-5 text-sm font-semibold text-foreground transition-colors duration-150 hover:border-primary hover:text-primary focus-visible:outline-none motion-reduce:transition-none"
            href="#home"
          >
            بازگشت به خانه
          </a>
        </div>
      </section>
    </PageShell>
  );
}

function RenderedBlock({ block }: { block: RenderableContentBlock }) {
  switch (block.kind) {
    case 'text':
      return <p>{block.text}</p>;
    case 'heading':
      return block.level === 3 ? <h3>{block.text}</h3> : <h2>{block.text}</h2>;
    case 'quote':
      return (
        <blockquote className="border-e-2 border-primary pe-4 text-muted-foreground">
          <p>{block.text}</p>
          {block.cite ? <cite className="mt-2 block text-xs not-italic">{block.cite}</cite> : null}
        </blockquote>
      );
    case 'link':
      return (
        <p>
          <a
            className="inline-flex min-h-11 items-center gap-2 text-primary underline underline-offset-4 hover:text-primary-hover focus-visible:outline-none motion-reduce:transition-none"
            href={block.href}
          >
            {block.label}
            <Icon name="arrow-left" size={16} aria-hidden="true" />
          </a>
        </p>
      );
  }
}

function PublishedContent({
  page,
  slug,
  state,
}: {
  page: ContentPage;
  slug: string;
  state: 'published' | 'empty' | 'unsupported';
}) {
  const canonicalPath = publicContentPath(slug) ?? '#home';
  const body = boundedText(page.body, MAX_TEXT_LENGTH);
  const rendered = getRenderableContentBlocks(page.blocks);
  const pageTitle = boundedText(page.title, 200) ?? 'محتوای نوا';
  const hasUnsupported = rendered.unsupportedCount > 0;

  return (
    <PageShell labelledBy="public-content-title">
      <nav className="breadcrumb" aria-label="مسیر صفحه">
        <a href="#home">خانه</a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{pageTitle}</span>
      </nav>

      <section
        className="editorial-hero overflow-hidden rounded-editorial border border-border"
        aria-labelledby="public-content-title"
      >
        <div>
          <span className="folio-mark">NOVA / CONTENT</span>
          <a href={canonicalPath} className="focus-visible:outline-none">
            <h1 id="public-content-title">{pageTitle}</h1>
          </a>
          <p>یادداشت‌ها، راهنماها و روایت‌های منتشرشده از آتلیه نوا.</p>
        </div>
        <div className="min-h-[180px] bg-secondary/70" aria-hidden="true" />
      </section>

      <article className="reading-column" aria-label="محتوای منتشرشده">
        {body ? <p>{body}</p> : null}
        {rendered.blocks.map((block) => (
          <RenderedBlock block={block} key={block.key} />
        ))}
        {state === 'empty' ? (
          <p
            className="mt-6 border-s-2 border-warning bg-warning-soft p-4 text-sm text-warning"
            role="status"
          >
            این صفحه منتشر شده است، اما هنوز محتوای قابل نمایش ندارد.
          </p>
        ) : null}
        {state === 'unsupported' || hasUnsupported ? (
          <p
            className="mt-6 border-s-2 border-warning bg-warning-soft p-4 text-sm text-warning"
            role="status"
          >
            بخشی از این صفحه در حال حاضر برای نمایش ایمن پشتیبانی نمی‌شود. برای ادامه، از خانه شروع
            کنید.
          </p>
        ) : null}
        {state === 'empty' || state === 'unsupported' ? (
          <a
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-editorial border border-border bg-surface px-5 text-sm font-semibold text-foreground hover:border-primary hover:text-primary focus-visible:outline-none"
            href="#home"
          >
            بازگشت به خانه
            <Icon name="arrow-left" size={16} aria-hidden="true" />
          </a>
        ) : null}
      </article>
    </PageShell>
  );
}

export function PublicContentSystemPage({
  slug,
  systemState,
}: {
  slug: string;
  systemState?: PublicContentSystemState;
}) {
  const normalizedSlug = normalizePublicContentSlug(slug);
  const online = useOnlineStatus();
  const query = useContentPage(normalizedSlug ?? '', Boolean(normalizedSlug) && !systemState);
  const state = getPublicContentState({
    slug,
    systemState,
    query,
    online,
  });

  if (state === 'published' || state === 'empty' || state === 'unsupported') {
    if (!query.data || !normalizedSlug) return <SystemStatePanel state="missing" />;
    return <PublishedContent page={query.data} slug={normalizedSlug} state={state} />;
  }

  return (
    <SystemStatePanel
      state={state}
      onRetry={stateCopy[state].retry ? () => void query.refetch() : undefined}
    />
  );
}

export { PublicContentSystemPage as PublishedContentPage };
