import {
  type CatalogAudience,
  type CatalogCategory,
  type CatalogFacetQuery,
  type CatalogProduct,
  type CatalogProductMedia,
  type CatalogProductOption,
  type CatalogProductQuery,
  type CatalogProductVariant,
  type ProductSummary,
} from '@nova/api-client';

export type CatalogFilters = Partial<CatalogProductQuery>;

export type CatalogFacetFilters = Partial<CatalogFacetQuery>;

export type ProductSummaryWithMetadata = ProductSummary;

export const catalogCategoriesPath = '/v1/catalog/categories';

export const catalogFacetsPath = '/v1/catalog/facets';

export const catalogSearchSuggestionsPath = '/v1/search/suggestions';

export const catalogSearchSuggestionsDefaultLimit = 8;

export interface StorefrontProduct {
  id?: string;
  slug: string;
  name: string;
  audience: CatalogAudience;
  category: string;
  price: number;
  compareAt?: number | null;
  image: string;
  alt: string;
  colors: string[];
  tag?: string;
  stock?: string;
  available?: boolean;
  selectedVariantId?: string;
  description?: string | null;
  brand?: string | null;
  categories?: CatalogCategory[];
  options?: CatalogProductOption[];
  variants?: CatalogProductVariant[];
  media?: CatalogProductMedia[];
  attributes?: CatalogProduct['attributes'];
}
