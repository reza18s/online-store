import type { CatalogAudience } from '@nova/api-client';

export const catalogCategorySlugsByAudience: Record<CatalogAudience, readonly string[]> = {
  women: ['outerwear', 'knitwear', 'trousers', 'shirts', 'accessories'],
  men: ['accessories', 'knitwear', 'outerwear', 'trousers', 'shirts'],
  children: ['children', 'kidswear'],
};
