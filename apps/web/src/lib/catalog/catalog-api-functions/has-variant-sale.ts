import type { ProductSummaryWithMetadata } from '../catalog-api-shared';

export function hasVariantSale(item: ProductSummaryWithMetadata): boolean {
  return item.variants.some((variant) => {
    const activePriceToman = variant.priceToman ?? item.priceToman;
    const compareAtPriceToman = variant.compareAtPriceToman;
    return compareAtPriceToman !== null && compareAtPriceToman > activePriceToman;
  });
}
