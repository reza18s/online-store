import type {
  CatalogCategory,
  CatalogAudience,
  CatalogProduct,
  CatalogProductPage,
  ContentPage,
} from '@nova/api-client';

export type SeoDocumentType = 'website' | 'product' | 'article';

export interface SeoDocument {
  title: string;
  description: string;
  canonicalUrl: string | null;
  robots: 'index, follow' | 'noindex, nofollow';
  openGraph: {
    type: SeoDocumentType;
    imageUrl: string | null;
  };
  jsonLd: unknown | null;
}

export type InitialRenderData =
  | { kind: 'home'; products: CatalogProductPage }
  | {
      kind: 'category';
      audience: CatalogAudience;
      categories: CatalogCategory[];
      products: CatalogProductPage;
    }
  | { kind: 'product'; product: CatalogProduct }
  | { kind: 'content'; page: ContentPage };

export interface InitialRenderContext {
  path: string;
  hashRoute: string;
  seo: SeoDocument;
  initialData?: InitialRenderData;
}

export type PublicRenderRoute =
  | { kind: 'home'; path: '/' }
  | { kind: 'category'; path: string; slug: CatalogAudience }
  | { kind: 'product'; path: string; slug: string }
  | { kind: 'content'; path: string; slug: string }
  | { kind: 'client'; path: string }
  | { kind: 'private'; path: string }
  | { kind: 'unknown'; path: string };

export const siteDescription = 'NOVA Store، فروشگاه پوشاک ایرانی برای انتخابی روشن و قابل اعتماد.';

export const categoryCopy: Record<string, { label: string; description: string }> = {
  women: {
    label: 'زنانه',
    description: 'رویه‌های سبک، بافت‌های آرام و جزئیاتی که هر روز را شخصی‌تر می‌کنند.',
  },
  men: {
    label: 'مردانه',
    description: 'ترکیبی از برش دقیق، پارچه‌های خوش‌دست و رنگ‌هایی که به‌راحتی کنار هم می‌نشینند.',
  },
  children: {
    label: 'بچگانه',
    description: 'لباس‌های راحت و مقاوم برای حرکت، کشف و روزهایی که باید آزاد باشند.',
  },
};

export const clientOnlyRenderPaths = new Set([
  '/search',
  '/campaign',
  '/guide',
  '/article',
  '/lookbook',
  '/about',
  '/trust',
  '/size-guide',
  '/shipping-policy',
  '/returns-policy',
  '/care-guide',
  '/faq',
  '/contact',
  '/privacy',
  '/terms',
  '/support',
  '/not-found',
  '/state/offline',
  '/state/error',
  '/state/maintenance',
]);

export const defaultSiteDescription = siteDescription;
