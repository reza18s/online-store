import type { CatalogSort } from '@nova/api-client';

import type {
  DiscoveryQueryState,
  StorefrontDiscoveryPageProps,
} from '@/features/catalog/pages/storefront-discovery-page-shared';
import { sortValues } from '@/features/catalog/pages/storefront-discovery-page-shared';

import { optionalNumber } from '@/features/catalog/components/optional-number';

import { positivePage } from '@/features/catalog/components/positive-page';

export function parseDiscoveryQuery(
  queryString = '',
  mode?: StorefrontDiscoveryPageProps['mode'],
): DiscoveryQueryState {
  const params = new URLSearchParams(
    queryString.startsWith('?') ? queryString.slice(1) : queryString,
  );
  const queryCategory = params.get('category') ?? '';
  return {
    q: params.get('q')?.trim() ?? '',
    category: mode === 'accessories' ? 'accessories' : queryCategory,
    size: params.get('size') ?? '',
    color: params.get('color') ?? '',
    material: params.get('material') ?? '',
    minPrice: optionalNumber(params.get('minPrice')),
    maxPrice: optionalNumber(params.get('maxPrice')),
    inStock: params.get('inStock') === 'true',
    onSale: mode === 'sale' || params.get('onSale') === 'true',
    sort: sortValues.has(params.get('sort') as CatalogSort)
      ? (params.get('sort') as CatalogSort)
      : 'newest',
    page: positivePage(params.get('page')),
  };
}
