# Page Context

## Page

**Path:** `src/features/content/components/ContentView.tsx`

```tsx
import { useContentPage } from '@/features/content/api/content-api';

import type { PublicContentSystemState } from '@/features/content/pages/public-content-system-page-shared';
import { stateCopy } from '@/features/content/pages/public-content-system-page-shared';

import { PublishedContent } from '@/features/content/components/published-content';

import { SystemStatePanel } from '@/features/content/components/system-state-panel';

import { getPublicContentState } from '@/features/content/components/get-public-content-state';

import { normalizePublicContentSlug } from '@/features/content/components/normalize-public-content-slug';

import { useOnlineStatus } from '@/features/content/components/use-online-status';

export function ContentView({
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

```

---

## Custom Components


### 1. Button

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


### 2. CatalogQueryState

**Path:** `src/features/catalog/components/catalog-query-state.tsx`

```tsx
import { type ReactNode } from 'react';

import { ApiClientError } from '@nova/api-client';

import type { useCatalogProducts } from '@/features/catalog/api/catalog-api';

import { CatalogRefreshNotice } from '@/features/catalog/components/catalog-refresh-notice';

import { MessageCard } from '@/features/catalog/components/message-card';

import { ProductSkeleton } from '@/features/catalog/components/product-skeleton';

import { shouldShowCatalogRefreshNotice } from '@/features/catalog/components/should-show-catalog-refresh-notice';

export function CatalogQueryState({
  query,
  emptyTitle = 'محصولی برای نمایش پیدا نشد',
  children,
}: {
  query: ReturnType<typeof useCatalogProducts>;
  emptyTitle?: string;
  children: ReactNode;
}) {
  if (query.isPending && !query.data) return <ProductSkeleton />;
  if (query.isError && !query.data) {
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
    const serviceUnavailable = query.error instanceof ApiClientError && query.error.status >= 500;
    return (
      <MessageCard
        title={
          offline
            ? 'اتصال اینترنت برقرار نیست'
            : serviceUnavailable
              ? 'سرویس فهرست محصولات در دسترس نیست'
              : 'بارگذاری محصولات ممکن نشد'
        }
        description={
          offline
            ? 'اتصال خود را بررسی کنید و دوباره تلاش کنید.'
            : serviceUnavailable
              ? 'ارتباط با سرور محصولات برقرار نشد. پس از بررسی وضعیت سامانه دوباره تلاش کنید.'
              : 'لطفاً چند لحظه بعد دوباره تلاش کنید.'
        }
        icon={offline ? 'info' : 'warning'}
        action="تلاش دوباره"
        onAction={() => void query.refetch()}
        tone="warning"
      />
    );
  }
  const refreshNotice = shouldShowCatalogRefreshNotice(query.isError, Boolean(query.data)) ? (
    <CatalogRefreshNotice onRetry={() => void query.refetch()} />
  ) : null;
  if (query.data && !query.data.items.length) {
    return (
      <div className="space-y-3">
        {refreshNotice}
        <MessageCard
          title={emptyTitle}
          description="فیلترها را تغییر دهید یا از انتخاب‌های تازه نوا دیدن کنید."
          icon="layers"
        />
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {refreshNotice}
      {query.isFetching ? (
        <p className="text-xs text-muted-foreground" role="status">
          در حال به‌روزرسانی نتایج...
        </p>
      ) : null}
      {children}
    </div>
  );
}

```

---


### 3. CatalogRefreshNotice

**Path:** `src/features/catalog/components/catalog-refresh-notice.tsx`

```tsx
import { Button } from '@nova/ui';
import { Icon } from '@/shared/ui/icon';

export function CatalogRefreshNotice({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 border border-warning bg-warning-soft p-4 text-sm"
      role="alert"
    >
      <span>به‌روزرسانی نتایج انجام نشد؛ اطلاعات فعلی ممکن است قدیمی باشد.</span>
      <Button type="button" size="sm" variant="outline" onClick={onRetry}>
        <Icon name="refresh" size={16} />
        تلاش دوباره
      </Button>
    </div>
  );
}

```

---


### 4. MessageCard

**Path:** `src/features/catalog/components/message-card.tsx`

```tsx
import { Button } from '@nova/ui';
import { Icon } from '@/shared/ui/icon';

export function MessageCard({
  title,
  description,
  icon,
  action,
  onAction,
  tone = 'neutral',
}: {
  title: string;
  description: string;
  icon: 'info' | 'warning' | 'layers';
  action?: string;
  onAction?: () => void;
  tone?: 'neutral' | 'warning' | 'error';
}) {
  return (
    <section
      className={`rounded-editorial border bg-surface p-7 text-center shadow-card ${tone === 'error' ? 'border-error text-destructive' : tone === 'warning' ? 'border-warning' : 'border-border'}`}
      role={tone === 'neutral' ? undefined : 'alert'}
    >
      <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
        <Icon name={icon} size={22} />
      </span>
      <h2 className="mt-4 text-lg text-foreground">{title}</h2>
      <p className="mx-auto mt-2 max-w-[42ch] text-sm leading-7 text-muted-foreground">
        {description}
      </p>
      {action && onAction ? (
        <Button className="mt-5" type="button" variant="outline" onClick={onAction}>
          <Icon name="refresh" size={16} />
          {action}
        </Button>
      ) : null}
    </section>
  );
}

```

---


### 5. ProductSkeleton

**Path:** `src/features/catalog/components/product-skeleton.tsx`

```tsx
export function ProductSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className="product-grid product-grid--loading"
      role="status"
      aria-label="در حال بارگذاری محصولات"
    >
      {Array.from({ length: count }, (_, index) => (
        <div className="product-skeleton motion-safe:animate-pulse" key={index} aria-hidden="true">
          <div className="product-skeleton__media" />
          <div className="product-skeleton__body">
            <div className="product-skeleton__title" />
            <div className="product-skeleton__meta" />
            <div className="product-skeleton__price" />
            <div className="product-skeleton__swatches">
              <span />
              <span />
              <span />
            </div>
            <div className="product-skeleton__action" />
          </div>
        </div>
      ))}
    </div>
  );
}

```

---


### 6. AboutContentPage

**Path:** `src/features/content/components/about-content-page.tsx`

```tsx
import type { ContentPage } from '@nova/api-client';

import { Icon } from '@/shared/ui/icon';

import { getRenderableContentBlocks } from '@/features/content/api/content-blocks';
import { MAX_TEXT_LENGTH } from '@/features/content/pages/public-content-system-page-shared';
import { boundedText } from '@/features/content/components/bounded-text';
import { PageShell } from '@/features/content/components/page-shell';
import { RenderedBlock } from '@/features/content/components/rendered-block';

import './about-content-page.reference.css';

type HeroAsset = {
  src: string;
  alt: string;
};

export function AboutContentPage({
  page,
  state,
  heroAsset,
}: {
  page: ContentPage;
  state: 'published' | 'empty' | 'unsupported';
  heroAsset: HeroAsset;
}) {
  const body = boundedText(page.body, MAX_TEXT_LENGTH);
  const rendered = getRenderableContentBlocks(page.blocks);
  const textBlocks = rendered.blocks.flatMap((block) => (block.kind === 'text' ? [block.text] : []));
  const quoteBlock = rendered.blocks.find((block) => block.kind === 'quote');
  const linkBlock = rendered.blocks.find((block) => block.kind === 'link');
  const story =
    textBlocks[0] ??
    body ??
    'نوا در سال ۱۳۹۹ با یک رؤیای ساده آغاز شد: خلق لباس برای زنی که اصالت، کیفیت و زیبایی آگاهانه را در کنار هم می‌خواهد.';
  const quote =
    quoteBlock?.kind === 'quote'
      ? quoteBlock.text
      : 'زیبایی، زمانی ماندگار است که واقعی باشد.';
  const quoteCite = quoteBlock?.kind === 'quote' ? quoteBlock.cite : 'NOVA';
  const ctaHref = linkBlock?.kind === 'link' ? linkBlock.href : '/campaign';
  const ctaLabel = linkBlock?.kind === 'link' ? linkBlock.label : 'آشنایی با نوا';

  return (
    <PageShell labelledBy="about-title">
      <div className="nova-about-page">
        <section className="nova-about-hero" aria-labelledby="about-title">
          <img className="nova-about-hero__image" src={heroAsset.src} alt={heroAsset.alt} />
          <div className="nova-about-hero__shade" aria-hidden="true" />

          <div className="nova-about-hero__copy">
            <h1 id="about-title">
              داستان نوا؛
              <br />
              فراتر از مد، برای شما.
            </h1>
            <p>
              نوا از باور به زیبایی آگاهانه متولد شد؛
              <br />
              با لباسی که تنها پوشیده نمی‌شود،
              <br />
              بلکه با شما زندگی می‌کند.
            </p>
            <a href={ctaHref}>
              {ctaLabel} <Icon name="arrow-left" size={16} />
            </a>
          </div>

          <aside className="nova-about-hero__note" aria-label="هویت نوا">
            <p>
              ریشه در فرهنگ،
              <br />
              نگاهی به امروز،
              <br />
              و فردایی زیباتر.
            </p>
            <span aria-hidden="true" />
            <small>
              TIMELESS
              <br />
              ELEGANT
              <br />
              PERSIAN
              <br />
              ALWAYS YOU
            </small>
          </aside>

          <div className="nova-about-hero__dots" aria-hidden="true">
            <span className="is-active" />
            <span />
            <span />
          </div>
        </section>

        <section className="nova-about-pillars" aria-label="ارزش‌های نوا">
          <article>
            <Icon name="sparkles" size={31} />
            <div>
              <strong>ریشه در فرهنگ</strong>
              <span>با نگاهی معاصر</span>
            </div>
          </article>
          <article>
            <Icon name="shield" size={31} />
            <div>
              <strong>کیفیت بی‌گذشت</strong>
              <span>در هر جزئیات</span>
            </div>
          </article>
          <article>
            <Icon name="users" size={31} />
            <div>
              <strong>زنان، الهام ما</strong>
              <span>برای زندگی واقعی</span>
            </div>
          </article>
          <article>
            <Icon name="heart" size={31} />
            <div>
              <strong>زیبایی آگاهانه</strong>
              <span>مدی با معنا و ماندگار</span>
            </div>
          </article>
        </section>

        <section className="nova-about-story">
          <blockquote className="nova-about-quote">
            <img src={heroAsset.src} alt="" loading="lazy" />
            <div aria-hidden="true" />
            <span>“</span>
            <p>{quote}</p>
            <cite>{quoteCite || 'NOVA'}</cite>
          </blockquote>

          <article className="nova-about-story__copy">
            <h2>از یک رؤیا تا نوا</h2>
            <p>{story}</p>
            {textBlocks[1] ? <p>{textBlocks[1]}</p> : null}
            <a href="#about-published">
              بیشتر درباره داستان ما <Icon name="arrow-left" size={14} />
            </a>
          </article>

          <article className="nova-about-craft">
            <img src="/assets/nova-materials.webp" alt="جزئیات پارچه و فرایند طراحی نوا" loading="lazy" />
            <div>
              <h2>هنر در جزئیات</h2>
              <p>از انتخاب پارچه تا دوخت نهایی، همه‌چیز با دقت، عشق و احترام به زمان انجام می‌شود.</p>
              <a href="/care-guide">
                فرایند ما <Icon name="arrow-left" size={13} />
              </a>
            </div>
          </article>
        </section>

        <section className="nova-about-lower-grid">
          <article className="nova-about-materials">
            <img src="/assets/nova-materials.webp" alt="بافت پارچه‌های منتخب نوا" loading="lazy" />
            <div>
              <h3>مواد اولیه، با احترام به طبیعت</h3>
              <p>ما از بهترین متریال‌های طبیعی و پایدار استفاده می‌کنیم؛ از پارچه واقعی تا بسته‌بندی معنا‌دار.</p>
              <a href="/care-guide">
                فلسفه ما <Icon name="arrow-left" size={13} />
              </a>
            </div>
          </article>

          <a className="nova-about-cta" href="/campaign">
            <img src={heroAsset.src} alt="" loading="lazy" />
            <span aria-hidden="true" />
            <div>
              <strong>
                برای امروز،
                <br />
                و فردایی زیباتر
              </strong>
              <em>
                همراه با ما باشید <Icon name="arrow-left" size={14} />
              </em>
            </div>
          </a>

          <article className="nova-about-values">
            <img src="/assets/nova-home-mobile-story.webp" alt="فضای آتلیه نوا" loading="lazy" />
            <div>
              <h3>ارزش‌هایی که ما را هدایت می‌کنند</h3>
              <ul>
                <li>کیفیت</li>
                <li>اصالت</li>
                <li>پایداری</li>
                <li>احترام به جامعه</li>
                <li>زیبایی برای همه</li>
              </ul>
            </div>
          </article>
        </section>

        {body || rendered.blocks.length ? (
          <article id="about-published" className="reading-column nova-about-published" aria-label="محتوای منتشرشده درباره نوا">
            {body ? <p>{body}</p> : null}
            {rendered.blocks.map((block) => <RenderedBlock block={block} key={block.key} />)}
          </article>
        ) : null}

        {state === 'empty' ? (
          <p className="nova-about-notice" role="status">
            این صفحه منتشر شده است، اما هنوز محتوای قابل نمایش ندارد.
          </p>
        ) : null}

        {state === 'unsupported' || rendered.unsupportedCount > 0 ? (
          <p className="nova-about-notice" role="status">
            بخشی از محتوای این صفحه فعلاً قابل نمایش نیست.
          </p>
        ) : null}
      </div>
    </PageShell>
  );
}

```

---


### 7. EditorialReferencePage

**Path:** `src/features/content/components/editorial-reference-page.tsx`

```tsx
import type { ContentPage } from '@nova/api-client';

import { Icon } from '@/shared/ui/icon';
import { useCatalogProducts } from '@/features/catalog/api/catalog-api';
import { CatalogQueryState } from '@/features/catalog/components/catalog-query-state';
import { formatToman } from '@/shared/utils/format-toman';
import { RenderedBlock } from '@/features/content/components/rendered-block';
import { type RenderableContentBlock, getRenderableContentBlocks } from '@/features/content/api/content-blocks';
import { MAX_TEXT_LENGTH } from '@/features/content/pages/public-content-system-page-shared';
import { boundedText } from '@/features/content/components/bounded-text';
import { PageShell } from '@/features/content/components/page-shell';

import './editorial-reference-page.css';

type HeroAsset = { src: string; alt: string };

const copy = {
  campaign: {
    title: 'زنی که به زیبایی خود ایمان دارد',
    subtitle: 'مجموعه پاییز و زمستان نوا؛ روایتی از اصالت، زنانگی و سبک زندگی امروز.',
    cta: 'مشاهده مجموعه',
    kicker: 'AUTUMN / WINTER · SAME WOMAN · A BRIGHTER STORY',
  },
  lookbook: {
    title: 'استایل‌هایی برای زندگی واقعی',
    subtitle: 'ترکیبی از ظرافت، شخصیت و لحظه‌های خاص؛ الهام بگیرید، سبک خود را پیدا کنید.',
    cta: 'مشاهده لوک‌بوک',
    kicker: 'REAL PEOPLE · BEAUTIFUL STORIES',
  },
  'care-guide': {
    title: 'راهنمای مراقبت از لباس‌ها',
    subtitle: 'زیبایی ماندگار، با مراقبت آگاهانه آغاز می‌شود.',
    cta: 'اطلاعات بیشتر',
    kicker: 'CARE TODAY · A MORE BEAUTIFUL TOMORROW',
  },
  privacy: {
    title: 'حریم خصوصی شما برای ما مهم است',
    subtitle: 'ما به اعتماد شما احترام می‌گذاریم و متعهدیم اطلاعات شخصی شما را با شفافیت و مسئولیت‌پذیری مدیریت کنیم.',
    cta: 'اطلاعات بیشتر',
    kicker: 'YOUR TRUST · A MORE BEAUTIFUL TOMORROW',
  },
  'returns-policy': {
    title: 'با خیال آسوده خرید کنید',
    subtitle: 'ما در نوا معتقدیم که تجربه خرید باید به همان اندازه که زیباست، مطمئن باشد.',
    cta: 'آشنایی با شرایط بازگشت',
    kicker: 'TIMELESS · ELEGANT · PERSIAN · ALWAYS YOU',
  },
} as const;

export function EditorialReferencePage({
  page,
  slug,
  state,
  heroAsset,
}: {
  page: ContentPage;
  slug: string;
  state: 'published' | 'empty' | 'unsupported';
  heroAsset: HeroAsset;
}) {
  const body = boundedText(page.body, MAX_TEXT_LENGTH);
  const rendered = getRenderableContentBlocks(page.blocks);
  const config = copy[slug as keyof typeof copy] ?? copy.campaign;
  const textBlocks = rendered.blocks.flatMap((block) => (block.kind === 'text' ? [block.text] : []));
  const quoteBlock = rendered.blocks.find((block) => block.kind === 'quote');
  const quote = quoteBlock?.kind === 'quote' ? quoteBlock.text : 'زیبایی، انتخاب آگاهانه است.';
  const quoteCite = quoteBlock?.kind === 'quote' ? quoteBlock.cite : 'NOVA';

  return (
    <PageShell labelledBy="editorial-reference-title">
      <div className={`nova-editorial-reference nova-editorial-reference--${slug}`}>
        <section className="nova-editorial-reference__hero">
          <img src={heroAsset.src} alt={heroAsset.alt} />
          <span className="nova-editorial-reference__hero-shade" aria-hidden="true" />
          <div className="nova-editorial-reference__hero-copy">
            <h1 id="editorial-reference-title">{boundedText(page.title, 200) ?? config.title}</h1>
            <p>{config.subtitle}</p>
            <a href={slug === 'privacy' ? '#editorial-content' : slug === 'returns-policy' ? '#returns-guide' : slug === 'care-guide' ? '#care-content' : '/products/new'}>
              {config.cta} <Icon name="arrow-left" size={16} />
            </a>
            <small>{config.kicker}</small>
          </div>
          <aside className="nova-editorial-reference__hero-note">
            <p>
              بیش از مد،
              <br />
              یک سبک زندگی.
            </p>
            <span />
            <small>TIMELESS<br />ELEGANT<br />PERSIAN<br />ALWAYS YOU</small>
          </aside>
          <div className="nova-editorial-reference__dots" aria-hidden="true">
            <span className="is-active" /><span /><span />
          </div>
        </section>

        {slug === 'campaign' ? (
          <CampaignBody heroAsset={heroAsset} quote={quote} quoteCite={quoteCite} body={body ?? textBlocks[0]} />
        ) : slug === 'lookbook' ? (
          <LookbookBody heroAsset={heroAsset} quote={quote} quoteCite={quoteCite} body={body ?? textBlocks[0]} />
        ) : slug === 'care-guide' ? (
          <CareGuideBody heroAsset={heroAsset} body={body} blocks={rendered.blocks} />
        ) : slug === 'privacy' ? (
          <PrivacyBody body={body} blocks={rendered.blocks} />
        ) : (
          <ReturnsPolicyBody heroAsset={heroAsset} body={body} blocks={rendered.blocks} />
        )}

        {['campaign', 'lookbook'].includes(slug) && rendered.blocks.length > 0 ? (
          <article className="reading-column nova-editorial-published" aria-label="محتوای منتشرشده">
            {rendered.blocks.map((block) => <RenderedBlock key={block.key} block={block} />)}
          </article>
        ) : null}

        {state === 'empty' ? <p className="nova-editorial-reference__notice">این صفحه هنوز محتوای کامل ندارد.</p> : null}
        {state === 'unsupported' || rendered.unsupportedCount > 0 ? (
          <p className="nova-editorial-reference__notice">بخشی از محتوای این صفحه فعلاً قابل نمایش نیست.</p>
        ) : null}
      </div>
    </PageShell>
  );
}

function CampaignBody({ heroAsset, quote, quoteCite, body }: { heroAsset: HeroAsset; quote: string; quoteCite?: string; body?: string | null }) {
  return (
    <>
      <section className="nova-editorial-cards nova-editorial-cards--three">
        {[
          ['لایه‌هایی از شخصیت', 'پالتوها و کت‌های فصل جدید', '/assets/nova-product-knit-cardigan.webp'],
          ['جزئیاتی که ماندگارند', 'کیف‌ها و اکسسوری‌های خاص', '/assets/nova-materials.webp'],
          ['تعادل در تمام لحظات', 'استایل روزمره با امضای نوا', '/assets/nova-women-lifestyle.webp'],
        ].map(([title, text, image]) => (
          <a href="/products/new" key={title}>
            <img src={image} alt="" />
            <span><strong>{title}</strong><small>{text}</small><em>مشاهده <Icon name="arrow-left" size={13} /></em></span>
          </a>
        ))}
      </section>

      <section className="nova-editorial-story-row">
        <blockquote>
          <img src={heroAsset.src} alt="" />
          <span aria-hidden="true" />
          <b>“</b>
          <p>{quote}</p>
          <cite>{quoteCite || 'NOVA'}</cite>
        </blockquote>
        <article>
          <h2>داستان این کمپین</h2>
          <p>{body || 'برای زنانی که در هر نقش، خود واقعی‌شان هستند؛ مجموعه‌ای از اصالت، آرامش و جزئیاتی که در زندگی امروز ماندگار می‌شوند.'}</p>
          <a href="/about">بیشتر درباره کمپین <Icon name="arrow-left" size={14} /></a>
        </article>
        <a className="nova-editorial-mini-feature" href="/lookbook">
          <img src="/assets/nova-home-mobile-story.webp" alt="" />
          <span>زن، سبک زندگی، فراتر از زمان.</span>
        </a>
      </section>

      <ProductRail />
    </>
  );
}

function LookbookBody({ heroAsset, quote, quoteCite, body }: { heroAsset: HeroAsset; quote: string; quoteCite?: string; body?: string | null }) {
  return (
    <>
      <section className="nova-editorial-cards nova-editorial-cards--four">
        {[
          ['شهر در پاییز', '/assets/nova-women-lifestyle.webp'],
          ['مینیمال همیشه زیباست', '/assets/nova-hero-men.webp'],
          ['تعادل در هر فصل', '/assets/nova-home-mobile-story.webp'],
          ['شب‌های تهران', heroAsset.src],
        ].map(([title, image]) => (
          <a href="/products/new" key={title}>
            <img src={image} alt="" />
            <span><strong>{title}</strong><small>وقتی استایل داستان می‌گوید</small><em>مشاهده استایل <Icon name="arrow-left" size={13} /></em></span>
          </a>
        ))}
      </section>

      <section className="nova-editorial-story-row">
        <blockquote>
          <img src={heroAsset.src} alt="" />
          <span aria-hidden="true" />
          <b>“</b>
          <p>{quote}</p>
          <cite>{quoteCite || 'NOVA'}</cite>
        </blockquote>
        <article>
          <h2>لحظه‌هایی که می‌مانند</h2>
          <p>{body || 'هر استایل، بخشی از یک روایت است؛ از صبح‌های آرام تا شب‌های فراموش‌نشدنی.'}</p>
          <a href="/products">کاوش در لوک‌بوک <Icon name="arrow-left" size={14} /></a>
        </article>
        <a className="nova-editorial-mini-feature" href="/campaign">
          <img src="/assets/nova-materials.webp" alt="" />
          <span>استایل کامل این لوک</span>
        </a>
      </section>

      <ProductRail />
    </>
  );
}

type PublishedBodyProps = { body?: string | null; blocks: RenderableContentBlock[] };

function CareGuideBody({ heroAsset, body, blocks }: PublishedBodyProps & { heroAsset: HeroAsset }) {
  return (
    <>
      <section className="nova-care-banner">
        <img src="/assets/nova-materials.webp" alt="بافت پارچه‌های نوا" />
        <div><strong>مراقبت بهتر<br />سبک زندگی زیباتر</strong></div>
      </section>
      <article id="care-content" className="reading-column nova-editorial-published" aria-label="راهنمای منتشرشده مراقبت">
        {body ? <p>{body}</p> : null}
        {blocks.map((block) => <RenderedBlock key={block.key} block={block} />)}
        <a className="text-link" href="/contact">پرسش درباره مراقبت از لباس <Icon name="arrow-left" size={16} /></a>
      </article>
      <img className="nova-editorial-care-image" src={heroAsset.src} alt={heroAsset.alt} loading="lazy" />
    </>
  );
}

function PrivacyBody({ body, blocks }: PublishedBodyProps) {
  const sections: { title: string; blocks: RenderableContentBlock[] }[] = [];
  for (const block of blocks) {
    if (block.kind === 'heading') {
      sections.push({ title: block.text, blocks: [] });
    } else {
      if (!sections.length) sections.push({ title: 'حریم خصوصی', blocks: [] });
      sections[sections.length - 1]!.blocks.push(block);
    }
  }
  return (
    <section className="nova-privacy-layout" id="editorial-content">
      <aside>
        <h2>فهرست مطالب</h2>
        <nav aria-label="بخش‌های حریم خصوصی">
          {sections.map((section, index) => <a href={`#privacy-${index}`} key={index}><Icon name="shield" size={16} />{section.title}</a>)}
          <a href="/contact"><Icon name="mail" size={16} />پرسش درباره حریم خصوصی</a>
        </nav>
      </aside>
      <article className="reading-column">
        {body ? <p>{body}</p> : null}
        {sections.map((section, index) => (
          <details id={`privacy-${index}`} key={index} open={index === 0}>
            <summary><h2>{section.title}</h2><Icon name="chevron-down" size={16} /></summary>
            {section.blocks.map((block) => <RenderedBlock key={block.key} block={block} />)}
          </details>
        ))}
      </article>
    </section>
  );
}

function ReturnsPolicyBody({ heroAsset, body, blocks }: PublishedBodyProps & { heroAsset: HeroAsset }) {
  return (
    <div id="returns-guide">
      <section className="nova-return-policy-contact">
        <blockquote><img src={heroAsset.src} alt={heroAsset.alt} /><span /><p>جزئیات، نشانه احترام ما به شماست.</p><cite>NOVA</cite></blockquote>
        <div className="reading-column">
          {body ? <p>{body}</p> : null}
          {blocks.map((block) => <RenderedBlock key={block.key} block={block} />)}
          <div className="nova-return-policy-contact__cards">
            <a href="/account/orders"><Icon name="package" size={25} /><strong>سفارش‌های من</strong><small>بررسی امکان بازگشت در جزئیات سفارش</small></a>
            <a href="/contact"><Icon name="mail" size={25} /><strong>تماس با نوا</strong><small>راه‌های ارتباطی منتشرشده</small></a>
            <a href="/support"><Icon name="users" size={25} /><strong>پشتیبانی</strong><small>راهنمای سفارش و بازگشت</small></a>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProductRail() {
  const productsQuery = useCatalogProducts({ limit: 6, sort: 'newest' });
  return (
    <section className="nova-editorial-product-rail">
      <div className="nova-editorial-product-rail__heading"><h2>محصولات منتخب</h2><a href="/products">مشاهده همه <Icon name="arrow-left" size={13} /></a></div>
      <CatalogQueryState query={productsQuery}>
        <div className="nova-editorial-product-rail__items">
          {productsQuery.data?.items.map((product) => (
            <a href={`/product/${encodeURIComponent(product.slug)}`} key={product.id}>
              {product.imageUrl ? <img src={product.imageUrl} alt={product.imageAlt ?? product.name} loading="lazy" /> : <Icon name="shirt" size={32} />}
              <strong>{product.name}</strong><small>{formatToman(product.priceToman)}</small>
            </a>
          ))}
        </div>
      </CatalogQueryState>
    </section>
  );
}

```

---


### 8. PageShell

**Path:** `src/features/content/components/page-shell.tsx`

```tsx
import { type ReactNode } from 'react';

export function PageShell({ children, labelledBy }: { children: ReactNode; labelledBy?: string }) {
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

```

---


### 9. PublishedContent

**Path:** `src/features/content/components/published-content.tsx`

```tsx
import type { ContentPage } from '@nova/api-client';

import { Icon } from '@/shared/ui/icon';

import { getRenderableContentBlocks } from '@/features/content/api/content-blocks';

import {
  MAX_TEXT_LENGTH,
  defaultEditorialHeroAsset,
  editorialHeroAssets,
} from '@/features/content/pages/public-content-system-page-shared';

import { PageShell } from '@/features/content/components/page-shell';

import { RenderedBlock } from '@/features/content/components/rendered-block';

import { boundedText } from '@/features/content/components/bounded-text';

import { publicContentPath } from '@/features/content/components/public-content-path';

import { AboutContentPage } from '@/features/content/components/about-content-page';
import { EditorialReferencePage } from '@/features/content/components/editorial-reference-page';

export function PublishedContent({
  page,
  slug,
  state,
}: {
  page: ContentPage;
  slug: string;
  state: 'published' | 'empty' | 'unsupported';
}) {
  const canonicalPath = publicContentPath(slug) ?? '/';
  const body = boundedText(page.body, MAX_TEXT_LENGTH);
  const rendered = getRenderableContentBlocks(page.blocks);
  const pageTitle = boundedText(page.title, 200) ?? 'محتوای نوا';
  const hasUnsupported = rendered.unsupportedCount > 0;
  const heroAsset = editorialHeroAssets[slug] ?? defaultEditorialHeroAsset;

  if (slug === 'about') {
    return <AboutContentPage page={page} state={state} heroAsset={heroAsset} />;
  }

  if (['campaign', 'care-guide', 'lookbook', 'privacy', 'returns-policy'].includes(slug)) {
    return (
      <EditorialReferencePage page={page} slug={slug} state={state} heroAsset={heroAsset} />
    );
  }

  return (
    <PageShell labelledBy="public-content-title">
      <nav className="breadcrumb" aria-label="مسیر صفحه">
        <a href="/">خانه</a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{pageTitle}</span>
      </nav>

      <section
        className="editorial-hero nova-generic-editorial-hero"
        aria-labelledby="public-content-title"
      >
        <div>
          <span className="folio-mark">NOVA / CONTENT</span>
          <a href={canonicalPath} className="focus-visible:outline-none">
            <h1 id="public-content-title">{pageTitle}</h1>
          </a>
          <p>یادداشت‌ها، راهنماها و روایت‌های منتشرشده از آتلیه نوا.</p>
        </div>
        <img className="editorial-hero__image" src={heroAsset.src} alt={heroAsset.alt} />
      </section>

      <div className="editorial-reading-layout nova-generic-editorial-layout">
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
              بخشی از این صفحه در حال حاضر برای نمایش ایمن پشتیبانی نمی‌شود. برای ادامه، از خانه
              شروع کنید.
            </p>
          ) : null}
          {state === 'empty' || state === 'unsupported' ? (
            <a
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-editorial border border-border bg-surface px-5 text-sm font-semibold text-foreground hover:border-primary hover:text-primary focus-visible:outline-none"
              href="/"
            >
              بازگشت به خانه
              <Icon name="arrow-left" size={16} aria-hidden="true" />
            </a>
          ) : null}
        </article>
        <aside className="editorial-aside" aria-label="راهنمای مطالعه">
          <div className="editorial-aside__panel">
            <span className="section-heading__eyebrow">NOVA / JOURNAL</span>
            <h2>در این صفحه</h2>
            <p>
              روایت‌ها و راهنماهای نوا برای انتخابی آگاهانه‌تر؛ با حوصله بخوانید و جزئیات را نزدیک
              ببینید.
            </p>
            <a href="/support">
              پرسشی دارید؟ <Icon name="arrow-left" size={15} aria-hidden="true" />
            </a>
          </div>
          <div className="editorial-aside__image">
            <img src="/assets/nova-materials.webp" alt="بافت‌های طبیعی آتلیه نوا" loading="lazy" />
            <span>{pageTitle}</span>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}

```

---


### 10. RenderedBlock

**Path:** `src/features/content/components/rendered-block.tsx`

```tsx
import { Icon } from '@/shared/ui/icon';

import { type RenderableContentBlock } from '@/features/content/api/content-blocks';

export function RenderedBlock({ block }: { block: RenderableContentBlock }) {
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

```

---


### 11. SystemStatePanel

**Path:** `src/features/content/components/system-state-panel.tsx`

```tsx
import { Button } from '@nova/ui';
import { Icon } from '@/shared/ui/icon';

import type { PublicContentViewState } from '@/features/content/pages/public-content-system-page-shared';
import { stateCopy } from '@/features/content/pages/public-content-system-page-shared';

import { PageShell } from '@/features/content/components/page-shell';

export function SystemStatePanel({
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
            <Button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-editorial bg-primary px-5 text-sm font-semibold text-primary-foreground transition-transform duration-150 hover:-translate-y-px hover:bg-primary-hover focus-visible:outline-none motion-reduce:transform-none motion-reduce:transition-none"
              type="button"
              onClick={onRetry}
            >
              <Icon name="refresh" size={17} />
              تلاش دوباره
            </Button>
          ) : null}
          <a
            className="inline-flex min-h-11 items-center justify-center rounded-editorial border border-border bg-surface px-5 text-sm font-semibold text-foreground transition-colors duration-150 hover:border-primary hover:text-primary focus-visible:outline-none motion-reduce:transition-none"
            href="/"
          >
            بازگشت به خانه
          </a>
        </div>
      </section>
    </PageShell>
  );
}

```

---


### 12. Icon

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

- Page: `src/features/content/components/ContentView.tsx`
- Custom component files: 12
- Total files included: 13
