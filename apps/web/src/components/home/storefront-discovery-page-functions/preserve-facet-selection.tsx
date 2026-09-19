import type { CatalogFacetOption } from '@nova/api-client';

export function preserveFacetSelection(
  options: readonly CatalogFacetOption[],
  selected: string,
): CatalogFacetOption[] {
  if (!selected || options.some((option) => option.value === selected)) return [...options];
  return [{ value: selected, label: selected, count: 0, selected: true }, ...options];
}
