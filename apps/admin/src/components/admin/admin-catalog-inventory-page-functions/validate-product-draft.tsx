import type { ProductDraftValues } from '../../../pages/admin/admin-catalog-inventory-page-shared';
import { productSlugPattern } from '../../../pages/admin/admin-catalog-inventory-page-shared';

export function validateProductDraft(
  draft: ProductDraftValues,
  mode: 'create' | 'edit' = 'create',
): string[] {
  const issues: string[] = [];
  if (mode === 'create' && !productSlugPattern.test(draft.slug.trim())) {
    issues.push('شناسه محصول باید با حروف لاتین کوچک، عدد و خط تیره نوشته شود.');
  }
  if (!draft.name.trim()) issues.push('نام محصول را وارد کنید.');
  const price = Number(draft.basePriceToman);
  if (!Number.isSafeInteger(price) || price < 0)
    issues.push('قیمت پایه باید عدد صحیح نامنفی باشد.');
  if (draft.compareAtPriceToman.trim()) {
    const compareAt = Number(draft.compareAtPriceToman);
    if (!Number.isSafeInteger(compareAt) || compareAt < 0) {
      issues.push('قیمت قبل باید عدد صحیح نامنفی باشد.');
    } else if (Number.isSafeInteger(price) && compareAt < price) {
      issues.push('قیمت قبل نباید کمتر از قیمت پایه باشد.');
    }
  }
  return issues;
}
