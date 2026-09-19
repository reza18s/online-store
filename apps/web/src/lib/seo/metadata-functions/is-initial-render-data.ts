import type { InitialRenderData } from '../metadata-shared';

export function isInitialRenderData(value: unknown): value is InitialRenderData {
  if (!value || typeof value !== 'object') return false;
  const data = value as Record<string, unknown>;
  if (typeof data.kind !== 'string') return false;
  if (data.kind === 'home') return Boolean(data.products && typeof data.products === 'object');
  if (data.kind === 'category') {
    return (
      Array.isArray(data.categories) && Boolean(data.products && typeof data.products === 'object')
    );
  }
  if (data.kind === 'product') return Boolean(data.product && typeof data.product === 'object');
  if (data.kind === 'content') return Boolean(data.page && typeof data.page === 'object');
  return false;
}
