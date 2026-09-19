import type { CatalogFacetGroup, CatalogFacets, CatalogProductQuery } from '@nova/api-client';

import { fakeCatalogProducts } from '../dev-store-fixtures-shared';

export function getFakeCatalogFacets(query: CatalogProductQuery = {}): CatalogFacets {
  const groups: CatalogFacetGroup[] = [
    {
      key: 'size',
      label: 'سایز',
      options: ['S', 'M', 'L'].map((value) => ({
        value,
        label: value,
        count: fakeCatalogProducts.filter((product) =>
          product.variants.some((variant) => variant.size === value),
        ).length,
        selected: query.size === value,
      })),
    },
    {
      key: 'color',
      label: 'رنگ',
      options: Array.from(
        new Map(
          fakeCatalogProducts.map((product) => [product.colors[0]!.name, product.colors[0]!]),
        ).entries(),
      ).map(([value, color]) => ({
        value,
        label: value,
        count: fakeCatalogProducts.filter((candidate) => candidate.colors[0]?.name === value)
          .length,
        selected: query.color === value,
        hex: color.hex,
      })),
    },
    {
      key: 'material',
      label: 'جنس پارچه',
      options: [...new Set(fakeCatalogProducts.map((product) => product.material))].map(
        (value) => ({
          value,
          label: value,
          count: fakeCatalogProducts.filter((product) => product.material === value).length,
          selected: query.material === value,
        }),
      ),
    },
  ];

  return { groups };
}
