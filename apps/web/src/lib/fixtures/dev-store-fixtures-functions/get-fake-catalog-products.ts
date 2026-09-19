import type { CatalogProductPage, CatalogProductQuery } from '@nova/api-client';

import { fakeCatalogProducts } from '../dev-store-fixtures-shared';

import { matchesProduct } from './matches-product';

export function getFakeCatalogProducts(query: CatalogProductQuery = {}): CatalogProductPage {
  const matching = fakeCatalogProducts.filter((product) => matchesProduct(product, query));
  const sorted = [...matching].sort((left, right) => {
    switch (query.sort) {
      case 'price_asc':
        return left.priceToman - right.priceToman;
      case 'price_desc':
        return right.priceToman - left.priceToman;
      case 'name':
        return left.name.localeCompare(right.name, 'fa');
      default:
        return 0;
    }
  });
  const page = Number.isSafeInteger(query.page) && query.page! > 0 ? query.page! : 1;
  const limit = Number.isSafeInteger(query.limit) && query.limit! > 0 ? query.limit! : 24;
  const start = (page - 1) * limit;

  return { items: sorted.slice(start, start + limit), total: sorted.length, page, limit };
}
