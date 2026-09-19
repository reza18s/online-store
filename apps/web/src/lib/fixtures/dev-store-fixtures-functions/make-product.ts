import type { CatalogAudience } from '@nova/api-client';

import type { FakeCatalogProduct } from '../dev-store-fixtures-shared';
import { categoryBySlug } from '../dev-store-fixtures-shared';

import { productMedia } from './product-media';

import { productVariants } from './product-variants';

import { sizeOptions } from './size-options';

export function makeProduct(input: {
  slug: string;
  name: string;
  audience: CatalogAudience;
  category: keyof typeof categoryBySlug;
  priceToman: number;
  compareAtPriceToman: number | null;
  imageUrl: string;
  imageAlt: string;
  color: string;
  colorHex: string;
  material: string;
  description: string;
}): FakeCatalogProduct {
  const options = sizeOptions(input.slug);
  const sizes = options[0]!.values;
  const variants = productVariants(
    input.slug,
    input.priceToman,
    input.compareAtPriceToman,
    input.imageUrl,
    input.color,
    input.colorHex,
    sizes,
  );
  const categories = [categoryBySlug[input.audience]!, categoryBySlug[input.category]!];

  return {
    id: `product-${input.slug}`,
    slug: input.slug,
    name: input.name,
    priceToman: input.priceToman,
    compareAtPriceToman: input.compareAtPriceToman,
    available: true,
    imageUrl: input.imageUrl,
    imageAlt: input.imageAlt,
    categories,
    options,
    variants,
    colors: [{ name: input.color, hex: input.colorHex }],
    stockStatus: input.slug === 'textured-scarf' ? 'LOW_STOCK' : 'IN_STOCK',
    shortDescription: input.description,
    description: input.description,
    brand: 'NOVA Atelier',
    media: productMedia(input.imageUrl, input.imageAlt),
    attributes: [
      { key: 'material', value: input.material },
      { key: 'care', value: 'شست‌وشوی ملایم و خشک‌کردن در سایه' },
    ],
    audience: input.audience,
    material: input.material,
  };
}
