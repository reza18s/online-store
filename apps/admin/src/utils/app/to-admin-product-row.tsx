import type { AdminCatalogProductListItem } from '@nova/api-client';

import type { AdminProductRow } from '../../components/app/app-shared';

export function toAdminProductRow(source: AdminCatalogProductListItem): AdminProductRow {
  const category = source.categories[0];

  return {
    id: source.id,
    slug: source.slug,
    name: source.name,
    category: category?.name ?? 'بدون دسته‌بندی',
    categorySlug: category?.slug ?? null,
    price: source.basePriceToman,
    compareAtPrice: source.compareAtPriceToman,
    stock: source.inventory.available,
    image: source.primaryMedia?.url ?? null,
    alt: source.primaryMedia?.altText ?? source.name,
    lifecycleStatus: source.status,
    stockStatus: source.inventory.status,
  };
}
