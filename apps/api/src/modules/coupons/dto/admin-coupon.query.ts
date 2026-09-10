import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export const ADMIN_COUPON_STATUSES = [
  'ALL',
  'ACTIVE',
  'UPCOMING',
  'EXPIRED',
  'DISABLED',
] as const;
export type AdminCouponStatusFilter = (typeof ADMIN_COUPON_STATUSES)[number];

function queryNumber(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  return typeof value === 'number' ? value : Number(value);
}

function optionalText(value: unknown): string | unknown {
  if (typeof value !== 'string') return value;
  const normalized = value.trim();
  return normalized || undefined;
}

export class AdminCouponListQueryDto {
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
  @MaxLength(64)
  public q?: string;

  @IsOptional()
  @IsString()
  @IsIn(ADMIN_COUPON_STATUSES)
  public status?: AdminCouponStatusFilter;
}
