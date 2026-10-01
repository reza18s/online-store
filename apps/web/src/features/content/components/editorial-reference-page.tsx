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
