import type { CatalogSearchSuggestion } from '@nova/api-client';

import { fakeCatalogProducts } from '../dev-store-fixtures-shared';

import { normalizedText } from './normalized-text';

export function getFakeCatalogSuggestions(query: string, limit: number): CatalogSearchSuggestion[] {
  const search = normalizedText(query);
  if (!search) return [];
  return fakeCatalogProducts
    .filter((product) => normalizedText(`${product.name} ${product.slug}`).includes(search))
    .slice(0, Math.max(1, limit))
    .map((product) => ({
      type: 'PRODUCT',
      id: product.id,
      slug: product.slug,
      label: product.name,
      imageUrl: product.imageUrl,
      imageAlt: product.imageAlt,
    }));
}
