import { type StorefrontProduct } from '../../../lib/catalog/catalog-api';

export function availabilityLabel(product: StorefrontProduct): string {
  return product.stock ?? (product.available === false ? 'ناموجود' : 'موجود');
}
