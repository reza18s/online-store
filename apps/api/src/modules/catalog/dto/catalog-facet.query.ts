import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { normalizeSearchText } from './product-list.query';

function optionalText(value: unknown): string | unknown {
  if (typeof value !== 'string') return value;

  const normalized = normalizeSearchText(value);
  return normalized || undefined;
}

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

export class CatalogFacetQueryDto {
  @Transform(({ value }) => optionalText(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  public q?: string;

  @Transform(({ value }) => optionalText(value))
  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  public category?: string;

  @Transform(({ value }) => optionalText(value))
  @IsOptional()
  @IsString()
  @IsIn(['women', 'men', 'children'])
  public audience?: 'women' | 'men' | 'children';

  @Transform(({ value }) => optionalText(value))
  @IsOptional()
  @IsString()
  @MaxLength(80)
  public size?: string;

  @Transform(({ value }) => optionalText(value))
  @IsOptional()
  @IsString()
  @MaxLength(80)
  public color?: string;

  @Transform(({ value }) => optionalText(value))
  @IsOptional()
  @IsString()
  @MaxLength(80)
  public material?: string;

  @Transform(({ value }) => queryNumber(value))
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  public minPrice?: number;

  @Transform(({ value }) => queryNumber(value))
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  public maxPrice?: number;

  @Transform(({ value }) => queryBoolean(value))
  @IsOptional()
  @IsBoolean()
  public inStock?: boolean;

  @Transform(({ value }) => queryBoolean(value))
  @IsOptional()
  @IsBoolean()
  public onSale?: boolean;
}
