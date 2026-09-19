import type { AdminInventoryItem } from '@nova/api-client';

import type { AdminLowStockItem, AdminProductRow } from '../../components/app/app-shared';

export function toAdminLowStockItem(
  source: AdminInventoryItem,
  products: AdminProductRow[],
): AdminLowStockItem {
  const product = products.find(
    (candidate) => candidate.id === source.productId || candidate.slug === source.productSlug,
  );

  return {
    productId: source.productId,
    slug: source.productSlug,
    name: source.productName,
    stock: source.available,
    image: product?.image ?? null,
    alt: product?.alt ?? source.productName,
  };
}
