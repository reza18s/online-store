export function productAddButtonLabel(
  variantCount: number,
  hasSelectedVariant: boolean,
  available: boolean,
): string {
  if (variantCount > 0 && !hasSelectedVariant) return 'انتخاب کنید';
  return available ? 'افزودن به سبد خرید' : 'ناموجود';
}
