import type { ProductSummaryWithMetadata, StorefrontProduct } from '../catalog-api-shared';

import { audienceFromCategories } from './audience-from-categories';

import { hasVariantSale } from './has-variant-sale';

import { stockLabel } from './stock-label';

export function toStorefrontProduct(item: ProductSummaryWithMetadata): StorefrontProduct {
  const category =
    item.categories.find((candidate) => !['women', 'men', 'children'].includes(candidate.slug)) ??
    item.categories[0];
  const compareAt =
    item.compareAtPriceToman !== null && item.compareAtPriceToman > item.priceToman
      ? item.compareAtPriceToman
      : null;
  const sale = compareAt !== null || hasVariantSale(item);
  const colors = item.colors
    .map((color) => color.hex)
    .filter((color): color is string => Boolean(color));

  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    audience: audienceFromCategories(item.categories),
    category: category?.name ?? 'انتخاب نوا',
    price: item.priceToman,
    compareAt,
    image: item.imageUrl ?? '',
    alt: item.imageAlt ?? item.name,
    colors,
    tag: sale ? 'پیشنهاد ویژه' : undefined,
    stock: stockLabel(item.available, item.stockStatus),
    available: item.available,
    categories: item.categories,
    options: item.options,
    variants: item.variants,
  };
}
