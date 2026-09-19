import type { ContentPage } from '@nova/api-client';

export { getRenderableContentBlocks, safeSiteRelativeHref } from '../../lib/content/content-blocks';

export type {
  RenderableContentBlock,
  RenderableContentBlocks,
} from '../../lib/content/content-blocks';

export const MAX_TEXT_LENGTH = 12_000;

export const editorialHeroAssets: Record<string, { src: string; alt: string }> = {
  about: { src: '/assets/nova-hero-editorial-v2.png', alt: 'روایت سبک زندگی نوا' },
  article: { src: '/assets/nova-hero-editorial-v2.png', alt: 'استایل زنانه نوا' },
  campaign: { src: '/assets/nova-hero-editorial-v2.png', alt: 'فصل تازه نوا' },
  'care-guide': { src: '/assets/nova-materials.webp', alt: 'مراقبت از پارچه‌های نوا' },
  contact: { src: '/assets/nova-hero-men.webp', alt: 'فضای آتلیه نوا' },
  content: { src: '/assets/nova-women-lifestyle.webp', alt: 'مجله نوا' },
  faq: { src: '/assets/nova-materials.webp', alt: 'جزئیات متریال نوا' },
  guide: { src: '/assets/nova-materials.webp', alt: 'راهنمای انتخاب پارچه نوا' },
  lookbook: { src: '/assets/nova-hero-editorial-v2.png', alt: 'لوک‌بوک نوا' },
  privacy: { src: '/assets/nova-materials.webp', alt: 'جزئیات پارچه نوا' },
  'returns-policy': { src: '/assets/nova-women-lifestyle.webp', alt: 'راهنمای بازگشت نوا' },
  'shipping-policy': { src: '/assets/nova-hero-men.webp', alt: 'ارسال سفارش‌های نوا' },
  'size-guide': { src: '/assets/nova-materials.webp', alt: 'راهنمای اندازه نوا' },
  support: { src: '/assets/nova-women-lifestyle.webp', alt: 'پشتیبانی نوا' },
  terms: { src: '/assets/nova-materials.webp', alt: 'شرایط استفاده از نوا' },
  trust: { src: '/assets/nova-materials.webp', alt: 'اعتماد و کیفیت نوا' },
};

export const defaultEditorialHeroAsset = {
  src: '/assets/nova-hero-editorial-v2.png',
  alt: 'مجله نوا',
};

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

export interface ContentQuerySnapshot {
  isPending: boolean;
  isError: boolean;
  error?: unknown;
  data?: ContentPage;
}

export const stateCopy: Record<
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
