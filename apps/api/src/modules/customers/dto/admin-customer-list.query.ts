import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import type { UserStatus } from '@nova/db';

export const ADMIN_CUSTOMER_STATUSES = ['ACTIVE', 'SUSPENDED', 'DELETED'] as const satisfies readonly UserStatus[];

function queryNumber(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  return typeof value === 'number' ? value : Number(value);
}

function optionalText(value: unknown): string | unknown {
  if (typeof value !== 'string') return value;
  const normalized = value.trim();
  return normalized || undefined;
}

export class AdminCustomerListQueryDto {
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
  @MaxLength(128)
  public q?: string;

  @IsOptional()
  @IsString()
  @IsIn(ADMIN_CUSTOMER_STATUSES)
  public status?: UserStatus;
}
