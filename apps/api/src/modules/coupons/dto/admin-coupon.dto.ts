import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import type { PromotionType } from '@nova/db';

import { POSTGRES_INT_MAX } from '../../catalog/dto/admin-product.dto';

const couponCodePattern = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;

export class CreateAdminCouponDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  @Matches(couponCodePattern)
  public code!: string;

  @IsIn(['PERCENTAGE', 'FIXED'])
  public type!: PromotionType;

  @IsInt()
  @Min(1)
  @Max(POSTGRES_INT_MAX)
  public amount!: number;

  @IsInt()
  @Min(0)
  @Max(POSTGRES_INT_MAX)
  public minimumOrderToman = 0;

  @IsISO8601()
  public activeFrom!: string;

  @IsISO8601()
  public activeUntil!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(POSTGRES_INT_MAX)
  public maxRedemptions?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(POSTGRES_INT_MAX)
  public perUserLimit?: number | null;

  @IsOptional()
  @IsBoolean()
  public isActive?: boolean;
}

export class UpdateAdminCouponDto {
  @IsOptional()
  @IsISO8601()
  public activeFrom?: string;

  @IsOptional()
  @IsISO8601()
  public activeUntil?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(POSTGRES_INT_MAX)
  public maxRedemptions?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(POSTGRES_INT_MAX)
  public perUserLimit?: number | null;

  @IsOptional()
  @IsBoolean()
  public isActive?: boolean;

  @IsOptional()
  @IsISO8601()
  public expectedUpdatedAt?: string;
}
