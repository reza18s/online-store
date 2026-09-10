import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  CatalogCategory,
  CatalogFacetKey,
  CatalogFacetOption,
  CatalogFacets,
  CatalogProduct,
  CatalogProductPage,
  CatalogProductColor,
  CatalogProductOption,
  CatalogProductVariant,
  ProductSummary,
  CatalogSearchSuggestion,
} from '@nova/api-client';

import { DatabaseService } from '../../database/database.service';
import {
  SEARCH_SUGGESTIONS_DEFAULT_LIMIT,
  SEARCH_SUGGESTIONS_MAX_LIMIT,
  type SearchSuggestionsQueryDto,
} from './dto/search-suggestions.query';
import type { CatalogFacetQueryDto } from './dto/catalog-facet.query';
import { normalizeSearchText, type ProductListQueryDto } from './dto/product-list.query';

interface InventorySnapshot {
  onHand: number;
  reserved: number;
  reorderPoint: number;
}

function isInventoryAvailable(inventory: InventorySnapshot | null): boolean {
  return inventory !== null && inventory.onHand - inventory.reserved > 0;
}

interface CatalogVariantSource {
  id: string;
  sku: string;
  title: string | null;
  size: string | null;
  color: string | null;
  colorHex: string | null;
  priceToman: number | null;
  compareAtPriceToman: number | null;
  optionValues: Array<{ optionValueId: string }>;
  media: Array<{ url: string; altText: string; sortOrder: number }>;
  inventory: InventorySnapshot | null;
}

interface CatalogPageRow {
  ids: string[];
  total: number;
}

interface CatalogSearchSuggestionRow {
  type: CatalogSearchSuggestion['type'];
  id: string;
  slug: string;
  label: string;
  imageUrl: string | null;
  imageAlt: string | null;
  score: number;
}

function getStockStatus(variants: CatalogVariantSource[]): ProductSummary['stockStatus'] {
  const availableVariants = variants.filter((variant) => isInventoryAvailable(variant.inventory));
  if (availableVariants.length === 0) return 'OUT_OF_STOCK';

  const hasLowStockVariant = availableVariants.some(
    (variant) =>
      variant.inventory !== null &&
      variant.inventory.reorderPoint > 0 &&
      variant.inventory.onHand - variant.inventory.reserved <= variant.inventory.reorderPoint,
  );

  return hasLowStockVariant ? 'LOW_STOCK' : 'IN_STOCK';
}

function resolveCompareAtPrice(
  activePriceToman: number,
  ownCompareAtPriceToman: number | null,
  inheritedCompareAtPriceToman: number | null = null,
): number | null {
  const compareAtPriceToman = ownCompareAtPriceToman ?? inheritedCompareAtPriceToman;
  return compareAtPriceToman !== null && compareAtPriceToman > activePriceToman
    ? compareAtPriceToman
    : null;
}

function getProductColors(variants: CatalogVariantSource[]): CatalogProductColor[] {
  const colors = new Map<string, CatalogProductColor>();

  for (const variant of variants) {
    if (!variant.color) continue;

    const key = variant.colorHex ?? variant.color;
    if (!colors.has(key)) {
      colors.set(key, { name: variant.color, hex: variant.colorHex });
    }
  }

  return [...colors.values()];
}

function getProductWhere(category?: string, audience?: 'women' | 'men' | 'children') {
  const categorySlugs = [category, audience].filter(
    (slug): slug is string => typeof slug === 'string' && slug.length > 0,
  );

  return {
    status: 'PUBLISHED' as const,
    archivedAt: null,
    ...(categorySlugs.length
      ? {
          AND: categorySlugs.map((slug) => ({
            categories: {
              some: {
                category: {
                  slug,
                  archivedAt: null,
                },
              },
            },
          })),
        }
      : {}),
  };
}

const CATALOG_FACET_MAX_OPTIONS = 40;

const CATALOG_FACET_GROUPS: Array<{ key: CatalogFacetKey; label: string }> = [
  { key: 'size', label: 'اندازه' },
  { key: 'color', label: 'رنگ' },
  { key: 'material', label: 'متریال' },
];

interface CatalogFacetRow {
  key: CatalogFacetKey;
  value: string;
  label: string;
  count: number;
  selected: boolean;
  hex: string | null;
}

function sortFacetOptions(options: CatalogFacetOption[]): CatalogFacetOption[] {
  return options.sort(
    (left, right) =>
      normalizeSearchText(left.label).localeCompare(normalizeSearchText(right.label), 'fa-IR') ||
      left.value.localeCompare(right.value, 'fa-IR'),
  );
}

function toFacetGroups(
  rows: CatalogFacetRow[],
  query: {
    size?: string;
    color?: string;
    material?: string;
  },
): CatalogFacets {
  const optionsByKey = new Map<CatalogFacetKey, CatalogFacetOption[]>();

  for (const row of rows) {
    const option: CatalogFacetOption = {
      value: row.value.trim(),
      label: row.label.trim(),
      count: Math.max(0, row.count),
      selected:
        row.selected ||
        Boolean(
          query[row.key] &&
          normalizeSearchText(row.value) === normalizeSearchText(query[row.key] ?? ''),
        ),
    };
    if (row.key === 'color') option.hex = row.hex;

    const options = optionsByKey.get(row.key) ?? [];
    options.push(option);
    optionsByKey.set(row.key, options);
  }

  for (const group of CATALOG_FACET_GROUPS) {
    const options = optionsByKey.get(group.key) ?? [];
    const selectedValue = query[group.key];
    if (
      selectedValue &&
      !options.some(
        (option) => normalizeSearchText(option.value) === normalizeSearchText(selectedValue),
      )
    ) {
      options.push({
        value: selectedValue,
        label: selectedValue,
        count: 0,
        selected: true,
        ...(group.key === 'color' ? { hex: null } : {}),
      });
    }

    optionsByKey.set(group.key, sortFacetOptions(options));
  }

  return {
    groups: CATALOG_FACET_GROUPS.map((group) => ({
      key: group.key,
      label: group.label,
      options: optionsByKey.get(group.key) ?? [],
    })),
  };
}

function toProductSummary(product: {
  id: string;
  slug: string;
  name: string;
  basePriceToman: number;
  compareAtPriceToman: number | null;
  options: CatalogProductOption[];
  variants: CatalogVariantSource[];
  media: Array<{ url: string; altText: string }>;
  categories: CatalogCategory[];
}): ProductSummary {
  const image = product.media[0];
  const compareAtPriceToman = resolveCompareAtPrice(
    product.basePriceToman,
    product.compareAtPriceToman,
  );

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    priceToman: product.basePriceToman,
    compareAtPriceToman,
    available: product.variants.some((variant) => isInventoryAvailable(variant.inventory)),
    imageUrl: image?.url ?? null,
    imageAlt: image?.altText ?? null,
    categories: product.categories,
    options: product.options,
    variants: product.variants.map((variant) =>
      toVariant(variant, product.basePriceToman, product.compareAtPriceToman),
    ),
    colors: getProductColors(product.variants),
    stockStatus: getStockStatus(product.variants),
  };
}

function toVariant(
  variant: CatalogVariantSource,
  fallbackPriceToman?: number,
  fallbackCompareAtPriceToman: number | null = null,
): CatalogProductVariant {
  const effectivePriceToman = variant.priceToman ?? fallbackPriceToman;
  const compareAtPriceToman =
    effectivePriceToman === undefined
      ? null
      : resolveCompareAtPrice(
          effectivePriceToman,
          variant.compareAtPriceToman,
          fallbackCompareAtPriceToman,
        );

  return {
    id: variant.id,
    sku: variant.sku,
    title: variant.title,
    size: variant.size,
    color: variant.color,
    colorHex: variant.colorHex,
    priceToman: variant.priceToman,
    compareAtPriceToman,
    optionValueIds: variant.optionValues.map(({ optionValueId }) => optionValueId),
    media: variant.media,
    available: isInventoryAvailable(variant.inventory),
  };
}

@Injectable()
export class CatalogService {
  public constructor(private readonly database: DatabaseService) {}

  public async listCategories(): Promise<CatalogCategory[]> {
    const categories = await this.database.prisma.category.findMany({
      where: {
        archivedAt: null,
        products: {
          some: {
            product: getProductWhere(),
          },
        },
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        slug: true,
        name: true,
      },
    });

    return categories;
  }

  public async listFacets(query: CatalogFacetQueryDto): Promise<CatalogFacets> {
    if (
      query.minPrice !== undefined &&
      query.maxPrice !== undefined &&
      query.minPrice > query.maxPrice
    ) {
      throw new BadRequestException('حداقل قیمت نمی‌تواند بیشتر از حداکثر قیمت باشد.');
    }

    const q = query.q ?? null;
    const category = query.category ?? null;
    const audience = query.audience ?? null;
    const size = query.size ?? null;
    const color = query.color ?? null;
    const material = query.material ?? null;
    const minPrice = query.minPrice ?? null;
    const maxPrice = query.maxPrice ?? null;
    const inStock = query.inStock ?? null;
    const onSale = query.onSale ?? null;

    const rows = await this.database.prisma.$queryRaw<CatalogFacetRow[]>`
      WITH variant_values AS (
        SELECT
          v."id" AS "variantId",
          v."productId",
          v."size",
          v."color",
          v."colorHex",
          lower(
            regexp_replace(
              replace(replace(replace(replace(replace(replace(replace(coalesce(v."size", ''), 'ي', 'ی'), 'ك', 'ک'), chr(8203), ''), chr(8204), ' '), chr(8205), ''), chr(8288), ''), chr(65279), ''),
              '[[:space:]]+',
              ' ',
              'g'
            )
          ) AS "normalizedSize",
          lower(
            regexp_replace(
              replace(replace(replace(replace(replace(replace(replace(coalesce(v."color", ''), 'ي', 'ی'), 'ك', 'ک'), chr(8203), ''), chr(8204), ' '), chr(8205), ''), chr(8288), ''), chr(65279), ''),
              '[[:space:]]+',
              ' ',
              'g'
            )
          ) AS "normalizedColor"
        FROM "ProductVariant" v
        WHERE v."isActive" = true
      ),
      material_values AS (
        SELECT
          a."productId",
          a."value",
          lower(
            regexp_replace(
              replace(replace(replace(replace(replace(replace(replace(a."value", 'ي', 'ی'), 'ك', 'ک'), chr(8203), ''), chr(8204), ' '), chr(8205), ''), chr(8288), ''), chr(65279), ''),
              '[[:space:]]+',
              ' ',
              'g'
            )
          ) AS "normalizedValue"
        FROM "ProductAttribute" a
        WHERE lower(a."key") = 'material'
      ),
      catalog_scope AS (
        SELECT p."id"
        FROM "Product" p
        WHERE p."status" = 'PUBLISHED'
          AND p."archivedAt" IS NULL
          AND (${category}::text IS NULL OR EXISTS (
            SELECT 1
            FROM "ProductCategory" pc
            INNER JOIN "Category" c ON c."id" = pc."categoryId"
            WHERE pc."productId" = p."id"
              AND c."slug" = ${category}
              AND c."archivedAt" IS NULL
          ))
          AND (${audience}::text IS NULL OR EXISTS (
            SELECT 1
            FROM "ProductCategory" pc
            INNER JOIN "Category" c ON c."id" = pc."categoryId"
            WHERE pc."productId" = p."id"
              AND c."slug" = ${audience}
              AND c."archivedAt" IS NULL
          ))
          AND (${minPrice}::int IS NULL OR p."basePriceToman" >= ${minPrice})
          AND (${maxPrice}::int IS NULL OR p."basePriceToman" <= ${maxPrice})
          AND (
            ${inStock}::boolean IS NULL
            OR (${inStock}::boolean = true AND EXISTS (
              SELECT 1
              FROM variant_values v
              INNER JOIN "InventoryItem" i ON i."variantId" = v."variantId"
              WHERE v."productId" = p."id"
                AND i."onHand" - i."reserved" > 0
            ))
            OR (${inStock}::boolean = false AND NOT EXISTS (
              SELECT 1
              FROM variant_values v
              INNER JOIN "InventoryItem" i ON i."variantId" = v."variantId"
              WHERE v."productId" = p."id"
                AND i."onHand" - i."reserved" > 0
            ))
          )
          AND (
            ${onSale}::boolean IS NULL
            OR (${onSale}::boolean = true AND (
              (p."compareAtPriceToman" IS NOT NULL AND p."compareAtPriceToman" > p."basePriceToman")
              OR EXISTS (
                SELECT 1
                FROM "ProductVariant" v
                WHERE v."productId" = p."id"
                  AND v."isActive" = true
                  AND COALESCE(v."compareAtPriceToman", p."compareAtPriceToman") IS NOT NULL
                  AND COALESCE(v."compareAtPriceToman", p."compareAtPriceToman") > COALESCE(v."priceToman", p."basePriceToman")
              )
            ))
            OR (${onSale}::boolean = false AND NOT (
              (p."compareAtPriceToman" IS NOT NULL AND p."compareAtPriceToman" > p."basePriceToman")
              OR EXISTS (
                SELECT 1
                FROM "ProductVariant" v
                WHERE v."productId" = p."id"
                  AND v."isActive" = true
                  AND COALESCE(v."compareAtPriceToman", p."compareAtPriceToman") IS NOT NULL
                  AND COALESCE(v."compareAtPriceToman", p."compareAtPriceToman") > COALESCE(v."priceToman", p."basePriceToman")
              )
            ))
          )
          AND (
            ${q}::text IS NULL
            OR to_tsvector('simple', coalesce(p."searchText", '')) @@ websearch_to_tsquery('simple', ${q})
            OR lower(p."searchText") ILIKE '%' || lower(${q}) || '%'
            OR (char_length(${q}) >= 3 AND lower(p."searchText") % lower(${q}))
          )
      ),
      size_base AS (
        SELECT DISTINCT scope."id"
        FROM catalog_scope scope
        WHERE (${color}::text IS NULL OR EXISTS (
          SELECT 1
          FROM variant_values v
          WHERE v."productId" = scope."id"
            AND v."normalizedColor" = lower(${color})
        ))
          AND (${material}::text IS NULL OR EXISTS (
            SELECT 1
            FROM material_values m
            WHERE m."productId" = scope."id"
              AND m."normalizedValue" = lower(${material})
          ))
      ),
      color_base AS (
        SELECT DISTINCT scope."id"
        FROM catalog_scope scope
        WHERE (${size}::text IS NULL OR EXISTS (
          SELECT 1
          FROM variant_values v
          WHERE v."productId" = scope."id"
            AND v."normalizedSize" = lower(${size})
        ))
          AND (${material}::text IS NULL OR EXISTS (
            SELECT 1
            FROM material_values m
            WHERE m."productId" = scope."id"
              AND m."normalizedValue" = lower(${material})
          ))
      ),
      material_base AS (
        SELECT DISTINCT scope."id"
        FROM catalog_scope scope
        WHERE (${size}::text IS NULL OR EXISTS (
          SELECT 1
          FROM variant_values v
          WHERE v."productId" = scope."id"
            AND v."normalizedSize" = lower(${size})
        ))
          AND (${color}::text IS NULL OR EXISTS (
          SELECT 1
          FROM variant_values v
          WHERE v."productId" = scope."id"
            AND v."normalizedColor" = lower(${color})
        ))
      ),
      size_candidates AS (
        SELECT
          v."normalizedSize" AS "normalizedValue",
          min(btrim(v."size")) AS "value",
          min(btrim(v."size")) AS "label",
          count(DISTINCT base."id")::int AS "count"
        FROM size_base base
        INNER JOIN variant_values v ON v."productId" = base."id"
        WHERE v."normalizedSize" <> ''
        GROUP BY v."normalizedSize"
      ),
      color_candidates AS (
        SELECT
          v."normalizedColor" AS "normalizedValue",
          min(btrim(v."color")) AS "value",
          min(btrim(v."color")) AS "label",
          min(v."colorHex") AS "hex",
          count(DISTINCT base."id")::int AS "count"
        FROM color_base base
        INNER JOIN variant_values v ON v."productId" = base."id"
        WHERE v."normalizedColor" <> ''
        GROUP BY v."normalizedColor"
      ),
      material_candidates AS (
        SELECT
          m."normalizedValue",
          min(btrim(m."value")) AS "value",
          min(btrim(m."value")) AS "label",
          count(DISTINCT base."id")::int AS "count"
        FROM material_base base
        INNER JOIN material_values m ON m."productId" = base."id"
        WHERE m."normalizedValue" <> ''
        GROUP BY m."normalizedValue"
      ),
      facet_rows AS (
        SELECT
          'size'::text AS "key",
          candidate."normalizedValue",
          candidate."value",
          candidate."label",
          candidate."count",
          (${size}::text IS NOT NULL AND candidate."normalizedValue" = lower(${size})) AS "selected",
          NULL::text AS "hex"
        FROM size_candidates candidate
        UNION ALL
        SELECT
          'color'::text AS "key",
          candidate."normalizedValue",
          candidate."value",
          candidate."label",
          candidate."count",
          (${color}::text IS NOT NULL AND candidate."normalizedValue" = lower(${color})) AS "selected",
          candidate."hex"
        FROM color_candidates candidate
        UNION ALL
        SELECT
          'material'::text AS "key",
          candidate."normalizedValue",
          candidate."value",
          candidate."label",
          candidate."count",
          (${material}::text IS NOT NULL AND candidate."normalizedValue" = lower(${material})) AS "selected",
          NULL::text AS "hex"
        FROM material_candidates candidate
      ),
      ranked AS (
        SELECT
          rows.*,
          row_number() OVER (
            PARTITION BY rows."key"
            ORDER BY lower(rows."label") ASC, rows."value" ASC
          ) AS "position"
        FROM facet_rows rows
      )
      SELECT "key", "value", "label", "count", "selected", "hex"
      FROM ranked
      WHERE "position" <= ${CATALOG_FACET_MAX_OPTIONS} OR "selected" = true
      ORDER BY
        CASE "key" WHEN 'size' THEN 0 WHEN 'color' THEN 1 ELSE 2 END,
        lower("label") ASC,
        "value" ASC
    `;

    return toFacetGroups(rows, query);
  }

  public async listSearchSuggestions(
    query: SearchSuggestionsQueryDto,
  ): Promise<CatalogSearchSuggestion[]> {
    const search = query.q ? normalizeSearchText(query.q) : '';
    if (!search) return [];

    const limit = Math.min(
      query.limit ?? SEARCH_SUGGESTIONS_DEFAULT_LIMIT,
      SEARCH_SUGGESTIONS_MAX_LIMIT,
    );
    const rows = await this.database.prisma.$queryRaw<CatalogSearchSuggestionRow[]>`
      WITH visible_categories AS (
        SELECT
          c."id",
          c."slug",
          c."name",
          lower(
            regexp_replace(
              replace(replace(replace(replace(replace(replace(replace(coalesce(c."name", ''), 'ي', 'ی'), 'ك', 'ک'), chr(8203), ''), chr(8204), ' '), chr(8205), ''), chr(8288), ''), chr(65279), ''),
              '[[:space:]]+',
              ' ',
              'g'
            )
          ) AS "normalizedName"
        FROM "Category" c
        WHERE c."archivedAt" IS NULL
          AND EXISTS (
            SELECT 1
            FROM "ProductCategory" pc
            INNER JOIN "Product" p ON p."id" = pc."productId"
            WHERE pc."categoryId" = c."id"
              AND p."status" = 'PUBLISHED'
              AND p."archivedAt" IS NULL
          )
      ),
      category_matches AS (
        SELECT
          c."id",
          c."slug",
          c."name" AS "label",
          GREATEST(
            CASE WHEN c."normalizedName" LIKE lower(${search}) || '%' THEN 1.0 ELSE 0 END,
            CASE WHEN lower(c."slug") LIKE lower(${search}) || '%' THEN 0.95 ELSE 0 END,
            COALESCE(similarity(c."normalizedName", lower(${search})), 0)
          ) AS "score"
        FROM visible_categories c
        WHERE c."normalizedName" ILIKE '%' || lower(${search}) || '%'
          OR lower(c."slug") ILIKE '%' || lower(${search}) || '%'
          OR (char_length(${search}) >= 3 AND c."normalizedName" % lower(${search}))
        ORDER BY "score" DESC, lower(c."name") ASC, c."id" ASC
        LIMIT ${limit}
      ),
      product_matches AS (
        SELECT
          p."id",
          p."slug",
          p."name" AS "label",
          media."url" AS "imageUrl",
          media."altText" AS "imageAlt",
          GREATEST(
            CASE WHEN lower(coalesce(p."searchText", '')) LIKE lower(${search}) || '%' THEN 1.0 ELSE 0 END,
            CASE WHEN lower(p."name") LIKE lower(${search}) || '%' THEN 1.05 ELSE 0 END,
            CASE WHEN lower(p."slug") LIKE lower(${search}) || '%' THEN 1.0 ELSE 0 END,
            CASE WHEN EXISTS (
              SELECT 1
              FROM "ProductVariant" v
              WHERE v."productId" = p."id"
                AND v."isActive" = true
                AND lower(v."sku") LIKE lower(${search}) || '%'
            ) THEN 0.98 ELSE 0 END,
            COALESCE(similarity(lower(coalesce(p."searchText", '')), lower(${search})), 0)
          ) AS "score"
        FROM "Product" p
        LEFT JOIN LATERAL (
          SELECT m."url", m."altText"
          FROM "ProductMedia" m
          WHERE m."productId" = p."id"
            AND m."kind" = 'PRODUCT'
          ORDER BY m."sortOrder" ASC, m."id" ASC
          LIMIT 1
        ) media ON true
        WHERE p."status" = 'PUBLISHED'
          AND p."archivedAt" IS NULL
          AND (
            to_tsvector('simple', coalesce(p."searchText", '')) @@ websearch_to_tsquery('simple', ${search})
            OR lower(coalesce(p."searchText", '')) ILIKE '%' || lower(${search}) || '%'
            OR lower(p."name") ILIKE '%' || lower(${search}) || '%'
            OR lower(p."slug") ILIKE '%' || lower(${search}) || '%'
            OR EXISTS (
              SELECT 1
              FROM "ProductVariant" v
              WHERE v."productId" = p."id"
                AND v."isActive" = true
                AND lower(v."sku") ILIKE '%' || lower(${search}) || '%'
            )
            OR (char_length(${search}) >= 3 AND lower(coalesce(p."searchText", '')) % lower(${search}))
          )
        ORDER BY "score" DESC, lower(p."name") ASC, p."id" ASC
        LIMIT ${limit}
      ),
      suggestions AS (
        SELECT
          'CATEGORY'::text AS "type",
          c."id",
          c."slug",
          c."label",
          NULL::text AS "imageUrl",
          NULL::text AS "imageAlt",
          c."score"
        FROM category_matches c
        UNION ALL
        SELECT
          'PRODUCT'::text AS "type",
          p."id",
          p."slug",
          p."label",
          p."imageUrl",
          p."imageAlt",
          p."score"
        FROM product_matches p
      )
      SELECT "type", "id", "slug", "label", "imageUrl", "imageAlt", "score"
      FROM suggestions
      ORDER BY CASE WHEN "type" = 'CATEGORY' THEN 0 ELSE 1 END, "score" DESC, lower("label") ASC, "id" ASC
      LIMIT ${limit}
    `;

    return rows.map((row) => ({
      type: row.type,
      id: row.id,
      slug: row.slug,
      label: row.label,
      imageUrl: row.imageUrl ?? null,
      imageAlt: row.imageAlt ?? null,
    }));
  }

  public async listProducts(query: ProductListQueryDto): Promise<CatalogProductPage> {
    if (
      query.minPrice !== undefined &&
      query.maxPrice !== undefined &&
      query.minPrice > query.maxPrice
    ) {
      throw new BadRequestException('حداقل قیمت نمی‌تواند بیشتر از حداکثر قیمت باشد.');
    }

    const normalizedQuery = {
      ...query,
      q: query.q ? normalizeSearchText(query.q) || undefined : undefined,
      size: query.size ? normalizeSearchText(query.size) || undefined : undefined,
      color: query.color ? normalizeSearchText(query.color) || undefined : undefined,
      material: query.material ? normalizeSearchText(query.material) || undefined : undefined,
    };
    const skip = (normalizedQuery.page - 1) * normalizedQuery.limit;
    const search = normalizedQuery.q ?? null;
    const category = normalizedQuery.category ?? null;
    const audience = normalizedQuery.audience ?? null;
    const size = normalizedQuery.size ?? null;
    const color = normalizedQuery.color ?? null;
    const material = normalizedQuery.material ?? null;
    const minPrice = normalizedQuery.minPrice ?? null;
    const maxPrice = normalizedQuery.maxPrice ?? null;
    const inStock = normalizedQuery.inStock ?? null;
    const onSale = normalizedQuery.onSale ?? null;
    const sort = normalizedQuery.sort ?? 'newest';

    const [page] = await this.database.prisma.$queryRaw<CatalogPageRow[]>`
      WITH filtered AS (
        SELECT
          p."id",
          p."basePriceToman",
          p."name",
          p."publishedAt",
          GREATEST(
            COALESCE(
              ts_rank_cd(
                to_tsvector('simple', coalesce(p."searchText", '')),
                websearch_to_tsquery('simple', ${search}::text)
              ),
              0
            ),
            COALESCE(similarity(lower(p."searchText"), lower(${search}::text)), 0)
          ) AS "searchRank"
        FROM "Product" p
        WHERE p."status" = 'PUBLISHED'
          AND p."archivedAt" IS NULL
          AND (${category}::text IS NULL OR EXISTS (
            SELECT 1
            FROM "ProductCategory" pc
            INNER JOIN "Category" c ON c."id" = pc."categoryId"
            WHERE pc."productId" = p."id"
              AND c."slug" = ${category}
              AND c."archivedAt" IS NULL
          ))
          AND (${audience}::text IS NULL OR EXISTS (
            SELECT 1
            FROM "ProductCategory" pc
            INNER JOIN "Category" c ON c."id" = pc."categoryId"
            WHERE pc."productId" = p."id"
              AND c."slug" = ${audience}
              AND c."archivedAt" IS NULL
          ))
          AND (${size}::text IS NULL OR EXISTS (
            SELECT 1
            FROM "ProductVariant" v
            WHERE v."productId" = p."id"
              AND v."isActive" = true
              AND lower(regexp_replace(replace(replace(replace(replace(replace(replace(replace(coalesce(v."size", ''), 'ي', 'ی'), 'ك', 'ک'), chr(8203), ''), chr(8204), ' '), chr(8205), ''), chr(8288), ''), chr(65279), ''), '[[:space:]]+', ' ', 'g')) = lower(${size})
          ))
          AND (${color}::text IS NULL OR EXISTS (
            SELECT 1
            FROM "ProductVariant" v
            WHERE v."productId" = p."id"
              AND v."isActive" = true
              AND lower(regexp_replace(replace(replace(replace(replace(replace(replace(replace(coalesce(v."color", ''), 'ي', 'ی'), 'ك', 'ک'), chr(8203), ''), chr(8204), ' '), chr(8205), ''), chr(8288), ''), chr(65279), ''), '[[:space:]]+', ' ', 'g')) = lower(${color})
          ))
          AND (${material}::text IS NULL OR EXISTS (
            SELECT 1
            FROM "ProductAttribute" a
            WHERE a."productId" = p."id"
              AND lower(a."key") = 'material'
              AND lower(regexp_replace(replace(replace(replace(replace(replace(replace(replace(a."value", 'ي', 'ی'), 'ك', 'ک'), chr(8203), ''), chr(8204), ' '), chr(8205), ''), chr(8288), ''), chr(65279), ''), '[[:space:]]+', ' ', 'g')) = lower(${material})
          ))
          AND (${minPrice}::int IS NULL OR p."basePriceToman" >= ${minPrice})
          AND (${maxPrice}::int IS NULL OR p."basePriceToman" <= ${maxPrice})
          AND (
            ${inStock}::boolean IS NULL
            OR (${inStock}::boolean = true AND EXISTS (
              SELECT 1
              FROM "ProductVariant" v
              INNER JOIN "InventoryItem" i ON i."variantId" = v."id"
              WHERE v."productId" = p."id"
                AND v."isActive" = true
                AND i."onHand" - i."reserved" > 0
            ))
            OR (${inStock}::boolean = false AND NOT EXISTS (
              SELECT 1
              FROM "ProductVariant" v
              INNER JOIN "InventoryItem" i ON i."variantId" = v."id"
              WHERE v."productId" = p."id"
                AND v."isActive" = true
                AND i."onHand" - i."reserved" > 0
            ))
          )
          AND (
            ${onSale}::boolean IS NULL
            OR (${onSale}::boolean = true AND (
              (p."compareAtPriceToman" IS NOT NULL AND p."compareAtPriceToman" > p."basePriceToman")
              OR EXISTS (
                SELECT 1
                FROM "ProductVariant" v
                WHERE v."productId" = p."id"
                  AND v."isActive" = true
                  AND COALESCE(v."compareAtPriceToman", p."compareAtPriceToman") IS NOT NULL
                  AND COALESCE(v."compareAtPriceToman", p."compareAtPriceToman") > COALESCE(v."priceToman", p."basePriceToman")
              )
            ))
            OR (${onSale}::boolean = false AND NOT (
              (p."compareAtPriceToman" IS NOT NULL AND p."compareAtPriceToman" > p."basePriceToman")
              OR EXISTS (
                SELECT 1
                FROM "ProductVariant" v
                WHERE v."productId" = p."id"
                  AND v."isActive" = true
                  AND COALESCE(v."compareAtPriceToman", p."compareAtPriceToman") IS NOT NULL
                  AND COALESCE(v."compareAtPriceToman", p."compareAtPriceToman") > COALESCE(v."priceToman", p."basePriceToman")
              )
            ))
          )
          AND (
            ${search}::text IS NULL
            OR to_tsvector('simple', coalesce(p."searchText", '')) @@ websearch_to_tsquery('simple', ${search})
            OR lower(p."searchText") ILIKE '%' || lower(${search}) || '%'
            OR (char_length(${search}) >= 3 AND lower(p."searchText") % lower(${search}))
          )
      ),
      ranked AS (
        SELECT filtered."id",
          row_number() OVER (
            ORDER BY
              CASE WHEN ${search}::text IS NOT NULL THEN filtered."searchRank" END DESC,
              CASE WHEN ${sort} = 'price_asc' THEN filtered."basePriceToman" END ASC,
              CASE WHEN ${sort} = 'price_desc' THEN filtered."basePriceToman" END DESC,
              CASE WHEN ${sort} = 'name' THEN lower(filtered."name") END ASC,
              CASE WHEN ${sort} = 'newest' THEN filtered."publishedAt" END DESC NULLS LAST,
              filtered."id" DESC
          ) AS position
        FROM filtered
      )
      SELECT
        coalesce(array_agg(ranked."id" ORDER BY ranked.position), ARRAY[]::text[]) AS ids,
        (SELECT count(*)::int FROM filtered) AS total
      FROM ranked
      WHERE ranked.position > ${skip}
        AND ranked.position <= ${skip + normalizedQuery.limit}
    `;

    const ids = page?.ids ?? [];
    const total = page?.total ?? 0;
    if (ids.length === 0) {
      return { items: [], total, page: normalizedQuery.page, limit: normalizedQuery.limit };
    }

    const products = await this.database.prisma.product.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        slug: true,
        name: true,
        basePriceToman: true,
        compareAtPriceToman: true,
        options: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            key: true,
            name: true,
            sortOrder: true,
            values: {
              orderBy: { sortOrder: 'asc' },
              select: { id: true, key: true, label: true, sortOrder: true },
            },
          },
        },
        variants: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            sku: true,
            title: true,
            size: true,
            color: true,
            colorHex: true,
            priceToman: true,
            compareAtPriceToman: true,
            optionValues: { select: { optionValueId: true } },
            media: {
              orderBy: { sortOrder: 'asc' },
              select: { url: true, altText: true, sortOrder: true },
            },
            inventory: { select: { onHand: true, reserved: true, reorderPoint: true } },
          },
        },
        categories: {
          where: { category: { archivedAt: null } },
          orderBy: { category: { name: 'asc' } },
          select: { category: { select: { id: true, slug: true, name: true } } },
        },
        media: {
          where: { kind: 'PRODUCT' },
          orderBy: { sortOrder: 'asc' },
          take: 1,
          select: { url: true, altText: true },
        },
      },
    });
    const productsById = new Map(products.map((product) => [product.id, product]));

    return {
      items: ids.flatMap((id) => {
        const product = productsById.get(id);
        if (!product) return [];

        return [
          toProductSummary({
            ...product,
            categories: product.categories.map(({ category }) => category),
            options: product.options,
          }),
        ];
      }),
      total,
      page: normalizedQuery.page,
      limit: normalizedQuery.limit,
    };
  }

  public async getProduct(slug: string): Promise<CatalogProduct> {
    const product = await this.database.prisma.product.findFirst({
      where: {
        ...getProductWhere(),
        slug,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        shortDescription: true,
        description: true,
        brand: true,
        basePriceToman: true,
        compareAtPriceToman: true,
        options: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            key: true,
            name: true,
            sortOrder: true,
            values: {
              orderBy: { sortOrder: 'asc' },
              select: { id: true, key: true, label: true, sortOrder: true },
            },
          },
        },
        variants: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            sku: true,
            title: true,
            size: true,
            color: true,
            colorHex: true,
            priceToman: true,
            compareAtPriceToman: true,
            optionValues: { select: { optionValueId: true } },
            media: {
              orderBy: { sortOrder: 'asc' },
              select: { url: true, altText: true, sortOrder: true },
            },
            inventory: {
              select: {
                onHand: true,
                reserved: true,
                reorderPoint: true,
              },
            },
          },
        },
        categories: {
          where: { category: { archivedAt: null } },
          orderBy: { category: { name: 'asc' } },
          select: {
            category: {
              select: {
                id: true,
                slug: true,
                name: true,
              },
            },
          },
        },
        media: {
          orderBy: { sortOrder: 'asc' },
          select: {
            url: true,
            altText: true,
            kind: true,
            sortOrder: true,
          },
        },
        attributes: {
          orderBy: { key: 'asc' },
          select: {
            key: true,
            value: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('محصول موردنظر پیدا نشد.');
    }

    const summary = toProductSummary({
      ...product,
      categories: product.categories.map(({ category }) => category),
      options: product.options,
    });

    return {
      ...summary,
      shortDescription: product.shortDescription,
      description: product.description,
      brand: product.brand,
      options: product.options,
      categories: product.categories.map(({ category }) => category),
      variants: product.variants.map((variant) =>
        toVariant(variant, product.basePriceToman, product.compareAtPriceToman),
      ),
      media: product.media,
      attributes: product.attributes,
    };
  }
}
