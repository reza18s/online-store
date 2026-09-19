import type { CatalogProduct } from '@nova/api-client';

import { fakeCatalogProducts } from '../dev-store-fixtures-shared';

export function getFakeCatalogProduct(slug: string): CatalogProduct {
  const product = fakeCatalogProducts.find(
    (candidate) => candidate.slug === slug.trim().toLowerCase(),
  );
  if (!product) throw new Error('محصول نمونه پیدا نشد.');
  return product;
}
