import type { CatalogProductOption, CatalogProductVariant } from '@nova/api-client';

export function productVariants(
  slug: string,
  priceToman: number,
  compareAtPriceToman: number | null,
  imageUrl: string,
  color: string,
  colorHex: string,
  sizes: CatalogProductOption['values'],
): CatalogProductVariant[] {
  return sizes.map((size, index) => ({
    id: `${slug}-variant-${size.key}`,
    sku: `NOVA-${slug.toUpperCase()}-${size.label}`,
    title: `${color} / ${size.label}`,
    size: size.label,
    color,
    colorHex,
    priceToman,
    compareAtPriceToman,
    optionValueIds: [size.id],
    media: [{ url: imageUrl, altText: `${slug} ${color}`, sortOrder: 0 }],
    available: index !== sizes.length - 1 || slug !== 'textured-scarf',
  }));
}
