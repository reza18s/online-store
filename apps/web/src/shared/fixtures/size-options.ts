import type { CatalogProductOption } from '@nova/api-client';

export function sizeOptions(slug: string): CatalogProductOption[] {
  const values = ['S', 'M', 'L'].map((label, sortOrder) => ({
    id: `${slug}-size-${label.toLowerCase()}`,
    key: label.toLowerCase(),
    label,
    sortOrder,
  }));

  return [
    {
      id: `${slug}-size`,
      key: 'size',
      name: 'سایز',
      sortOrder: 0,
      values,
    },
  ];
}
