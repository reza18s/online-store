import { useQuery } from '@tanstack/react-query';
import {
  apiClient,
  queryKeys,
  type CatalogAudience,
  type CatalogCategory,
  type CatalogFacetQuery,
  type CatalogFacets,
  type CatalogProduct,
  type CatalogProductMedia,
  type CatalogProductOption,
  type CatalogProductPage,
  type CatalogProductQuery,
  type CatalogProductVariant,
  type CatalogSearchSuggestion,
  type CatalogSort,
  type ProductSummary,
} from '@nova/api-client';

export type { CatalogAudience, CatalogSort };

export type CatalogFilters = Partial<CatalogProductQuery>;
export type CatalogFacetFilters = Partial<CatalogFacetQuery>;

type ProductSummaryWithMetadata = ProductSummary;

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

function normalizeFilters(filters: CatalogFilters): CatalogFilters {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== ''),
  ) as CatalogFilters;
}

function toQueryString(filters: CatalogFilters): string {
  const params = new URLSearchParams();
  const normalized = normalizeFilters(filters);

  for (const [key, value] of Object.entries(normalized)) {
    if (value === undefined || value === '') continue;
    params.set(key, String(value));
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

function normalizeFacetFilters(filters: CatalogFacetFilters): CatalogFacetFilters {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== ''),
  ) as CatalogFacetFilters;
}

function toFacetQueryString(filters: CatalogFacetFilters): string {
  const params = new URLSearchParams();
  const normalized = normalizeFacetFilters(filters);

  for (const [key, value] of Object.entries(normalized)) {
    if (value === undefined || value === '') continue;
    params.set(key, String(value));
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

export function catalogRequestPath(filters: CatalogFilters = {}): string {
  const normalized = normalizeFilters(filters);
  const endpoint = normalized.q ? '/v1/search' : '/v1/catalog/products';
  return `${endpoint}${toQueryString(normalized)}`;
}

export async function fetchCatalogCategories(): Promise<CatalogCategory[]> {
  const response = await apiClient.getEnvelope<CatalogCategory[]>(catalogCategoriesPath);
  return response.data;
}

export function catalogFacetsRequestPath(filters: CatalogFacetFilters = {}): string {
  const normalized = normalizeFacetFilters(filters);
  return `${catalogFacetsPath}${toFacetQueryString(normalized)}`;
}

export async function fetchCatalogFacets(
  filters: CatalogFacetFilters = {},
): Promise<CatalogFacets> {
  const response = await apiClient.getEnvelope<CatalogFacets>(catalogFacetsRequestPath(filters));
  return response.data;
}

export function catalogSuggestionsRequestPath(
  query: string,
  limit = catalogSearchSuggestionsDefaultLimit,
): string {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  return `${catalogSearchSuggestionsPath}?${params.toString()}`;
}

export async function fetchCatalogSuggestions(
  query: string,
  limit = catalogSearchSuggestionsDefaultLimit,
): Promise<CatalogSearchSuggestion[]> {
  const response = await apiClient.getEnvelope<CatalogSearchSuggestion[]>(
    catalogSuggestionsRequestPath(query, limit),
  );
  return response.data;
}

export async function fetchCatalogProducts(
  filters: CatalogFilters = {},
): Promise<CatalogProductPage> {
  const response = await apiClient.getEnvelope<CatalogProductPage>(catalogRequestPath(filters));
  return response.data;
}

export async function fetchCatalogProduct(slug: string): Promise<CatalogProduct> {
  const response = await apiClient.getEnvelope<CatalogProduct>(
    `/v1/catalog/products/${encodeURIComponent(slug)}`,
  );
  return response.data;
}

export function useCatalogCategories(enabled = true) {
  return useQuery({
    queryKey: queryKeys.catalog.categories(),
    queryFn: fetchCatalogCategories,
    enabled,
    staleTime: 5 * 60_000,
  });
}

export function useCatalogFacets(filters: CatalogFacetFilters = {}, enabled = true) {
  const normalized = normalizeFacetFilters(filters);

  return useQuery({
    queryKey: queryKeys.catalog.facets(normalized),
    queryFn: () => fetchCatalogFacets(normalized),
    enabled,
    staleTime: 30_000,
  });
}

export function useCatalogSuggestions(query: string, enabled = true) {
  const normalizedQuery = query.trim();

  return useQuery({
    queryKey: queryKeys.catalog.suggestions(normalizedQuery),
    queryFn: () => fetchCatalogSuggestions(normalizedQuery),
    enabled: enabled && Boolean(normalizedQuery),
    staleTime: 30_000,
  });
}

export function useCatalogProducts(filters: CatalogFilters = {}, enabled = true) {
  const normalized = normalizeFilters(filters);

  return useQuery({
    queryKey: normalized.q
      ? queryKeys.catalog.search(normalized)
      : queryKeys.catalog.products(normalized),
    queryFn: () => fetchCatalogProducts(normalized),
    enabled,
    staleTime: 30_000,
  });
}

export function useCatalogProduct(slug: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.catalog.product(slug),
    queryFn: () => fetchCatalogProduct(slug),
    enabled: enabled && Boolean(slug),
    staleTime: 60_000,
  });
}

function audienceFromCategories(categories: CatalogCategory[] | undefined): CatalogAudience {
  const audience = categories?.find((category) =>
    ['women', 'men', 'children'].includes(category.slug),
  )?.slug;

  return (audience as CatalogAudience | undefined) ?? 'women';
}

function stockLabel(available: boolean, status: ProductSummaryWithMetadata['stockStatus']): string {
  if (status === 'LOW_STOCK') return 'رو به اتمام';
  if (status === 'OUT_OF_STOCK' || !available) return 'ناموجود';
  return 'موجود';
}

function hasVariantSale(item: ProductSummaryWithMetadata): boolean {
  return item.variants.some((variant) => {
    const activePriceToman = variant.priceToman ?? item.priceToman;
    const compareAtPriceToman = variant.compareAtPriceToman;
    return compareAtPriceToman !== null && compareAtPriceToman > activePriceToman;
  });
}

export function toStorefrontProduct(item: ProductSummaryWithMetadata): StorefrontProduct {
  const category =
    item.categories.find((candidate) => !['women', 'men', 'children'].includes(candidate.slug)) ??
    item.categories[0];
  const compareAt =
    item.compareAtPriceToman !== null && item.compareAtPriceToman > item.priceToman
      ? item.compareAtPriceToman
      : null;
  const sale = compareAt !== null || hasVariantSale(item);
  const colors = item.colors
    .map((color) => color.hex)
    .filter((color): color is string => Boolean(color));

  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    audience: audienceFromCategories(item.categories),
    category: category?.name ?? 'انتخاب نوا',
    price: item.priceToman,
    compareAt,
    image: item.imageUrl ?? '',
    alt: item.imageAlt ?? item.name,
    colors,
    tag: sale ? 'پیشنهاد ویژه' : undefined,
    stock: stockLabel(item.available, item.stockStatus),
    available: item.available,
    categories: item.categories,
    options: item.options,
    variants: item.variants,
  };
}

export function toStorefrontProductDetail(item: CatalogProduct): StorefrontProduct {
  const primaryMedia = item.media.find((media) => media.kind === 'PRODUCT') ?? item.media[0];

  return {
    ...toStorefrontProduct({
      ...item,
      categories: item.categories,
      variants: item.variants,
    }),
    description: item.description ?? item.shortDescription,
    brand: item.brand,
    image: primaryMedia?.url ?? item.imageUrl ?? '',
    alt: primaryMedia?.altText ?? item.imageAlt ?? item.name,
    media: item.media,
    attributes: item.attributes,
  };
}
