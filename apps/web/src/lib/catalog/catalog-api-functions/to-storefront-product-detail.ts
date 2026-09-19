import { type CatalogProduct } from '@nova/api-client';

import type { StorefrontProduct } from '../catalog-api-shared';

import { toStorefrontProduct } from './to-storefront-product';

export function toStorefrontProductDetail(item: CatalogProduct): StorefrontProduct {
  const primaryMedia = item.media.find((media) => media.kind === 'PRODUCT') ?? item.media[0];

  return {
    ...toStorefrontProduct({
      ...item,
      categories: item.categories,
      variants: item.variants,
    }),
    description: item.description ?? item.shortDescription,
    brand: item.brand,
    image: primaryMedia?.url ?? item.imageUrl ?? '',
    alt: primaryMedia?.altText ?? item.imageAlt ?? item.name,
    media: item.media,
    attributes: item.attributes,
  };
}
