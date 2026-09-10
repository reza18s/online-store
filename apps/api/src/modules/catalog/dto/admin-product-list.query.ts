import { Transform } from 'class-transformer';
import {
  IsIn,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { normalizeSearchText } from './product-list.query';
import { CATALOG_PRODUCT_STATUSES, type CatalogProductStatus } from './product-status.dto';

function queryNumber(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  return typeof value === 'number' ? value : Number(value);
}

function optionalText(value: unknown): string | unknown {
  if (typeof value !== 'string') return value;
  const normalized = normalizeSearchText(value);
  return normalized || undefined;
}

function queryBoolean(value: unknown): boolean | unknown {
  if (value === undefined) return undefined;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return value;
}

export class AdminProductListQueryDto {
  @Transform(({ value }) => queryNumber(value))
  @IsInt()
  @Min(1)
  @Max(100)
  public limit = 24;

  @Transform(({ value }) => queryNumber(value))
  @IsInt()
  @Min(1)
  @Max(100_000)
  public page = 1;

  @Transform(({ value }) => optionalText(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  public q?: string;

  @IsOptional()
  @IsString()
  @IsIn(CATALOG_PRODUCT_STATUSES)
  public status?: CatalogProductStatus;

  @Transform(({ value }) => optionalText(value))
  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  public category?: string;

  @Transform(({ value }) => queryBoolean(value))
  @IsOptional()
  @IsBoolean()
  public lowStock?: boolean;
}
