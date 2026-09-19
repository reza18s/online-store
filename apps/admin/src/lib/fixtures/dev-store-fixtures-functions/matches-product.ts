import type { CatalogProductQuery } from '@nova/api-client';

import type { FakeCatalogProduct } from '../dev-store-fixtures-shared';

import { normalizedText } from './normalized-text';

import { productIsOnSale } from './product-is-on-sale';

export function matchesProduct(product: FakeCatalogProduct, query: CatalogProductQuery): boolean {
  const search = normalizedText(query.q);
  const category = normalizedText(query.category);
  const size = normalizedText(query.size);
  const color = normalizedText(query.color);
  const material = normalizedText(query.material);

  return (
    (!search || normalizedText(`${product.name} ${product.slug}`).includes(search)) &&
    (!category || product.categories.some((item) => item.slug === category)) &&
    (!query.audience || product.audience === query.audience) &&
    (!size || product.variants.some((variant) => normalizedText(variant.size) === size)) &&
    (!color || product.colors.some((item) => normalizedText(item.name) === color)) &&
    (!material || normalizedText(product.material) === material) &&
    (query.minPrice === undefined || product.priceToman >= query.minPrice) &&
    (query.maxPrice === undefined || product.priceToman <= query.maxPrice) &&
    (!query.inStock || product.available) &&
    (!query.onSale || productIsOnSale(product))
  );
}
