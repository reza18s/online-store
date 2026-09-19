import { encodeId } from './encode-id';

export function adminCatalogProductPath(productId: string): string {
  return `/v1/admin/catalog/products/${encodeId(productId)}`;
}
