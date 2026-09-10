import { IsIn, IsString } from 'class-validator';

export const CATALOG_PRODUCT_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
export type CatalogProductStatus = (typeof CATALOG_PRODUCT_STATUSES)[number];

export class ProductStatusDto {
  @IsString()
  @IsIn(CATALOG_PRODUCT_STATUSES)
  public status!: CatalogProductStatus;
}
