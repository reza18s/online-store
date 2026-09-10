import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

import { normalizeSearchText } from '../../catalog/dto/product-list.query';

export const ADMIN_INVENTORY_VARIANT_STATUSES = ['ALL', 'ACTIVE', 'INACTIVE'] as const;
export type AdminInventoryVariantStatus = (typeof ADMIN_INVENTORY_VARIANT_STATUSES)[number];

function queryNumber(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  return typeof value === 'number' ? value : Number(value);
}

function queryBoolean(value: unknown): boolean | unknown {
  if (value === undefined) return undefined;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return value;
}

function optionalText(value: unknown): string | unknown {
  if (typeof value !== 'string') return value;
  const normalized = normalizeSearchText(value);
  return normalized || undefined;
}

export class AdminInventoryListQueryDto {
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

  @Transform(({ value }) => queryBoolean(value))
  @IsOptional()
  @IsBoolean()
  public lowStock?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(ADMIN_INVENTORY_VARIANT_STATUSES)
  public status: AdminInventoryVariantStatus = 'ALL';
}
