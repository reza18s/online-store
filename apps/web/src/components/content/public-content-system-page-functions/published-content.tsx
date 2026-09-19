import type { ContentPage } from '@nova/api-client';

import { Icon } from '../../ui/icon';

import { getRenderableContentBlocks } from '../../../lib/content/content-blocks';

import {
  MAX_TEXT_LENGTH,
  defaultEditorialHeroAsset,
  editorialHeroAssets,
} from '../../../pages/content/public-content-system-page-shared';

import { PageShell } from './page-shell';

import { RenderedBlock } from './rendered-block';

import { boundedText } from './bounded-text';

import { publicContentPath } from './public-content-path';

export function PublishedContent({
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
  const heroAsset = editorialHeroAssets[slug] ?? defaultEditorialHeroAsset;

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
        <img className="editorial-hero__image" src={heroAsset.src} alt={heroAsset.alt} />
      </section>

      <div className="editorial-reading-layout">
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
              href="#home"
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
            <a href="#support">
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
