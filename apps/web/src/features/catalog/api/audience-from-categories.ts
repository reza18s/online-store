import { type CatalogAudience, type CatalogCategory } from '@nova/api-client';

export function audienceFromCategories(categories: CatalogCategory[] | undefined): CatalogAudience {
  const audience = categories?.find((category) =>
    ['women', 'men', 'children'].includes(category.slug),
  )?.slug;

  return (audience as CatalogAudience | undefined) ?? 'women';
}
