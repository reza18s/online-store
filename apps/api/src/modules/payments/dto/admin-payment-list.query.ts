import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import type { PaymentAttemptStatus } from '@nova/db';

export const ADMIN_PAYMENT_ATTEMPT_STATUSES = [
  'PENDING',
  'REDIRECTED',
  'SUCCEEDED',
  'FAILED',
  'EXPIRED',
  'CANCELLED',
] as const satisfies readonly PaymentAttemptStatus[];

function queryNumber(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  return typeof value === 'number' ? value : Number(value);
}

function optionalText(value: unknown): string | unknown {
  if (typeof value !== 'string') return value;
  const normalized = value.trim();
  return normalized || undefined;
}

export class AdminPaymentListQueryDto {
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

  @IsOptional()
  @IsString()
  @IsIn(ADMIN_PAYMENT_ATTEMPT_STATUSES)
  public status?: PaymentAttemptStatus;

  @Transform(({ value }) => optionalText(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  public provider?: string;

  @Transform(({ value }) => optionalText(value))
  @IsOptional()
  @IsString()
  @MaxLength(128)
  public orderNumber?: string;
}
