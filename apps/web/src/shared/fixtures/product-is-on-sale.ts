import type { FakeCatalogProduct } from '@/shared/fixtures/dev-store-fixtures-shared';

export function productIsOnSale(product: FakeCatalogProduct): boolean {
  return product.compareAtPriceToman !== null && product.compareAtPriceToman > product.priceToman;
}
