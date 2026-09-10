import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export const ADMIN_CATALOG_KEY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const ADMIN_CATEGORY_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const SORT_ORDER_MAX = 100_000;

export class CreateAdminCategoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Matches(ADMIN_CATEGORY_SLUG_PATTERN)
  public slug!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  public name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1_000)
  public description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  public parentId?: string | null;
}

export class UpdateAdminCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  public name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1_000)
  public description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  public parentId?: string | null;
}

export class UpdateAdminCategoryStatusDto {
  @IsBoolean()
  public archived!: boolean;
}

export class ReplaceProductCategoriesDto {
  @IsArray()
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(128, { each: true })
  public categoryIds!: string[];
}

export class CreateAdminProductOptionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  @Matches(ADMIN_CATALOG_KEY_PATTERN)
  public key!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  public name!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(SORT_ORDER_MAX)
  public sortOrder?: number;
}

export class UpdateAdminProductOptionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  public name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(SORT_ORDER_MAX)
  public sortOrder?: number;
}

export class CreateAdminProductOptionValueDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  @Matches(ADMIN_CATALOG_KEY_PATTERN)
  public key!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  public label!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(SORT_ORDER_MAX)
  public sortOrder?: number;
}

export class UpdateAdminProductOptionValueDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  public label?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(SORT_ORDER_MAX)
  public sortOrder?: number;
}
