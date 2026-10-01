import type { CatalogAudience, CatalogSort } from '@nova/api-client';

export type StorefrontDiscoveryView = 'home' | 'category' | 'listing' | 'search' | 'product';

export interface StorefrontDiscoveryPageProps {
  view: StorefrontDiscoveryView;
  audience?: CatalogAudience;
  mode?: 'new' | 'sale' | 'accessories';
  slug?: string;
  queryString?: string;
  isWishlisted?: (slug: string) => boolean;
  onToggleWishlist?: (slug: string) => void;
}

export interface DiscoveryQueryState {
  q: string;
  category: string;
  size: string;
  color: string;
  material: string;
  minPrice?: number;
  maxPrice?: number;
  inStock: boolean;
  onSale: boolean;
  sort: CatalogSort;
  page: number;
}

export const audienceCopy: Record<
  CatalogAudience,
  { label: string; title: string; lead?: string; description: string; image: string; ctaLabel: string }
> = {
  women: {
    label: 'زنانه',
    title: 'زنانه',
    description: 'مجموعه‌ای از لباس‌ها و استایل‌های زنانه برای روزهای واقعی شما.',
    image: '/assets/nova-hero-editorial-v2.png',
    ctaLabel: 'مشاهده مجموعه',
  },
  men: {
    label: 'مردانه',
    title: 'استایل مردانه',
    lead: 'تعادل میان اصالت و امروز',
    description: 'انتخاب‌هایی برای مردان امروزی؛ کیفیت در جزئیات، استایلی برای هر روز و هر موقعیت.',
    image: '/assets/nova-hero-men.webp',
    ctaLabel: 'مشاهده کالکشن',
  },
  children: {
    label: 'بچگانه',
    title: 'دنیای کوچک با داستان‌های بزرگ',
    description: 'لباس‌هایی راحت، باکیفیت و امن برای هر روز کودک شما.',
    image: '/assets/nova-children-lifestyle.webp',
    ctaLabel: 'مشاهده مجموعه',
  },
};

export const sortValues = new Set<CatalogSort>(['newest', 'price_asc', 'price_desc', 'name']);
