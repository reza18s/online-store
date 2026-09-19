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
  { label: string; title: string; description: string; image: string }
> = {
  women: {
    label: 'زنانه',
    title: 'لباس‌هایی برای روزهای روشن',
    description: 'رویه‌های سبک، بافت‌های آرام و جزئیاتی که هر روز را شخصی‌تر می‌کنند.',
    image: '/assets/nova-hero-editorial-v2.png',
  },
  men: {
    label: 'مردانه',
    title: 'فرم‌های ساده، حضور ماندگار',
    description: 'ترکیبی از برش دقیق، پارچه‌های خوش‌دست و رنگ‌هایی که به‌راحتی کنار هم می‌نشینند.',
    image: '/assets/nova-hero-men.webp',
  },
  children: {
    label: 'بچگانه',
    title: 'برای بازی‌های تمام‌نشدنی',
    description: 'لباس‌های راحت و مقاوم برای حرکت، کشف و روزهایی که باید آزاد باشند.',
    image: '/assets/nova-children-lifestyle.webp',
  },
};

export const sortValues = new Set<CatalogSort>(['newest', 'price_asc', 'price_desc', 'name']);
