import type { AdminCatalogProductDetail, AdminCatalogProductUpdateInput } from '@nova/api-client';

import type { ProductDraftValues } from '../../../pages/admin/admin-catalog-inventory-page-shared';

function nullableText(value: string): string | null {
  return value.trim() || null;
}

export function buildAdminCatalogProductUpdateInput(
  draft: ProductDraftValues,
  product: Pick<
    AdminCatalogProductDetail,
    'name' | 'shortDescription' | 'description' | 'brand' | 'basePriceToman' | 'compareAtPriceToman'
  >,
): AdminCatalogProductUpdateInput {
  const input: AdminCatalogProductUpdateInput = {};
  const shortDescription = nullableText(draft.shortDescription);
  const description = nullableText(draft.description);
  const brand = nullableText(draft.brand);
  const compareAtPriceToman = draft.compareAtPriceToman.trim()
    ? Number(draft.compareAtPriceToman)
    : null;

  if (draft.name.trim() !== product.name) input.name = draft.name.trim();
  if (shortDescription !== product.shortDescription) input.shortDescription = shortDescription;
  if (description !== product.description) input.description = description;
  if (brand !== product.brand) input.brand = brand;
  if (Number(draft.basePriceToman) !== product.basePriceToman) {
    input.basePriceToman = Number(draft.basePriceToman);
  }
  if (compareAtPriceToman !== product.compareAtPriceToman) {
    input.compareAtPriceToman = compareAtPriceToman;
  }

  return input;
}
