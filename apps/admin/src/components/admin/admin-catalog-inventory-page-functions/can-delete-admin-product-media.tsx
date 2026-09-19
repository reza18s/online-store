import type { AdminCatalogProductMedia, AdminCatalogProductStatus } from '@nova/api-client';

export function canDeleteAdminProductMedia(
  productStatus: AdminCatalogProductStatus,
  media: Pick<AdminCatalogProductMedia, 'kind'>,
  mediaItems: ReadonlyArray<Pick<AdminCatalogProductMedia, 'kind'>>,
): boolean {
  if (productStatus !== 'PUBLISHED' || media.kind !== 'PRODUCT') return true;
  return mediaItems.filter((item) => item.kind === 'PRODUCT').length > 1;
}
