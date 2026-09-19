import type { CatalogProductVariant, CartLine } from '@nova/api-client';

import type { FakeCatalogProduct } from '../dev-store-fixtures-shared';

export function cartLineFor(
  product: FakeCatalogProduct,
  variant: CatalogProductVariant,
  quantity: number,
): CartLine {
  return {
    id: `cart-line-${variant.id}`,
    variantId: variant.id,
    quantity,
    available: variant.available,
    productId: product.id,
    productSlug: product.slug,
    productName: product.name,
    sku: variant.sku,
    title: variant.title,
    unitPriceToman: variant.priceToman ?? product.priceToman,
    compareAtPriceToman: variant.compareAtPriceToman,
    imageUrl: product.imageUrl,
    imageAlt: product.imageAlt,
  };
}
