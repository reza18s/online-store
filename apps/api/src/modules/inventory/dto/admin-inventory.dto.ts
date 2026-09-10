import {
  IsISO8601,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  NotEquals,
} from 'class-validator';

export const POSTGRES_INT_MAX = 2_147_483_647;

export class AdminInventoryAdjustmentDto {
  @IsInt()
  @Min(-POSTGRES_INT_MAX)
  @Max(POSTGRES_INT_MAX)
  @NotEquals(0)
  public delta!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(240)
  public reason!: string;

  @IsOptional()
  @IsISO8601()
  public expectedUpdatedAt?: string;
}

export class AdminInventoryReorderPointDto {
  @IsInt()
  @Min(0)
  @Max(POSTGRES_INT_MAX)
  public reorderPoint!: number;

  @IsOptional()
  @IsISO8601()
  public expectedUpdatedAt?: string;
}
