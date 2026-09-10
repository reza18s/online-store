import {
  ArrayMaxSize,
  ArrayUnique,
  IsBoolean,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export const ADMIN_PRODUCT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const POSTGRES_INT_MAX = 2_147_483_647;
export const ADMIN_PRODUCT_MEDIA_KINDS = ['PRODUCT', 'DETAIL', 'SWATCH'] as const;
export type AdminProductMediaKind = (typeof ADMIN_PRODUCT_MEDIA_KINDS)[number];

const PRODUCT_VARIANT_SKU_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/;
const PRODUCT_COLOR_HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

export class CreateAdminProductDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Matches(ADMIN_PRODUCT_SLUG_PATTERN)
  public slug!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  public name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  public shortDescription?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(10_000)
  public description?: string | null;

  @IsInt()
  @Min(0)
  @Max(POSTGRES_INT_MAX)
  public basePriceToman!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(POSTGRES_INT_MAX)
  public compareAtPriceToman?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  public brand?: string | null;
}

export class UpdateAdminProductDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  public name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  public shortDescription?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(10_000)
  public description?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(POSTGRES_INT_MAX)
  public basePriceToman?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(POSTGRES_INT_MAX)
  public compareAtPriceToman?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  public brand?: string | null;
}

export class CreateAdminProductVariantDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Matches(PRODUCT_VARIANT_SKU_PATTERN)
  public sku!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  public title?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  public size?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  public color?: string | null;

  @IsOptional()
  @IsString()
  @Matches(PRODUCT_COLOR_HEX_PATTERN)
  public colorHex?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(POSTGRES_INT_MAX)
  public priceToman?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(POSTGRES_INT_MAX)
  public compareAtPriceToman?: number | null;

  @IsOptional()
  @IsBoolean()
  public isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(128, { each: true })
  public optionValueIds?: string[];
}

export class UpdateAdminProductVariantDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  public title?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  public size?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  public color?: string | null;

  @IsOptional()
  @IsString()
  @Matches(PRODUCT_COLOR_HEX_PATTERN)
  public colorHex?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(POSTGRES_INT_MAX)
  public priceToman?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(POSTGRES_INT_MAX)
  public compareAtPriceToman?: number | null;

  @IsOptional()
  @IsBoolean()
  public isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(128, { each: true })
  public optionValueIds?: string[];
}

export class CreateAdminProductMediaDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2_000)
  public url!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(240)
  public altText!: string;

  @IsOptional()
  @IsIn(ADMIN_PRODUCT_MEDIA_KINDS)
  public kind?: AdminProductMediaKind;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100_000)
  public sortOrder?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10_000)
  public width?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10_000)
  public height?: number | null;
}

export class UpdateAdminProductMediaDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2_000)
  public url?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(240)
  public altText?: string;

  @IsOptional()
  @IsIn(ADMIN_PRODUCT_MEDIA_KINDS)
  public kind?: AdminProductMediaKind;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100_000)
  public sortOrder?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10_000)
  public width?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10_000)
  public height?: number | null;
}
