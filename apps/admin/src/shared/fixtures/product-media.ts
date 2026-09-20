import type { CatalogProductMedia } from '@nova/api-client';

export function productMedia(imageUrl: string, imageAlt: string): CatalogProductMedia[] {
  return [
    { url: imageUrl, altText: imageAlt, kind: 'PRODUCT', sortOrder: 0 },
    { url: imageUrl, altText: `${imageAlt}، نمای نزدیک`, kind: 'DETAIL', sortOrder: 1 },
  ];
}
