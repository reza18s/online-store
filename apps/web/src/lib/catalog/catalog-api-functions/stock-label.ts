import type { ProductSummaryWithMetadata } from '../catalog-api-shared';

export function stockLabel(
  available: boolean,
  status: ProductSummaryWithMetadata['stockStatus'],
): string {
  if (status === 'LOW_STOCK') return 'رو به اتمام';
  if (status === 'OUT_OF_STOCK' || !available) return 'ناموجود';
  return 'موجود';
}
