import type { CatalogProductOption } from '@nova/api-client';

import { type StorefrontProduct } from '../../../lib/catalog/catalog-api';

export function structuredVariantOptions(
  product: Pick<StorefrontProduct, 'variants' | 'options'>,
): CatalogProductOption[] {
  const variants = product.variants ?? [];
  return (product.options ?? []).filter((option) =>
    option.values.some((value) =>
      variants.some((variant) => variant.optionValueIds.includes(value.id)),
    ),
  );
}
