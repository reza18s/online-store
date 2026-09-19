import type { CatalogProductVariant } from '@nova/api-client';

import { type StorefrontProduct } from '../../../lib/catalog/catalog-api';

import { structuredVariantOptions } from './structured-variant-options';

export function resolveVariant(
  product: Pick<StorefrontProduct, 'variants' | 'options'>,
  selectedOptionValues: Record<string, string>,
  selectedSize: string,
  selectedColor: string,
): CatalogProductVariant | undefined {
  const variants = product.variants ?? [];
  if (!variants.length) return undefined;
  const optionKeys = structuredVariantOptions(product);
  if (optionKeys.length && variants.some((variant) => variant.optionValueIds.length)) {
    if (!optionKeys.every((option) => Boolean(selectedOptionValues[option.key]))) return undefined;
    return variants.find((variant) =>
      optionKeys.every((option) =>
        variant.optionValueIds.includes(selectedOptionValues[option.key]!),
      ),
    );
  }
  const sizes = new Set(variants.map((variant) => variant.size).filter(Boolean));
  const colors = new Set(variants.map((variant) => variant.color).filter(Boolean));
  return variants.find(
    (variant) =>
      (!sizes.size || variant.size === selectedSize) &&
      (!colors.size || variant.color === selectedColor),
  );
}
