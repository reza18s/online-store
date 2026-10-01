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
