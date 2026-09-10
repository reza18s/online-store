import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import type { OrderStatus, PaymentStatus } from '@nova/db';

export const ADMIN_ORDER_STATUSES = [
  'PENDING_PAYMENT',
  'CONFIRMED',
  'PREPARING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'RETURNED',
] as const satisfies readonly OrderStatus[];

export const ADMIN_PAYMENT_STATUSES = [
  'PENDING',
  'PAID',
  'FAILED',
  'REFUNDED',
] as const satisfies readonly PaymentStatus[];

function queryNumber(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  return typeof value === 'number' ? value : Number(value);
}

function optionalText(value: unknown): string | unknown {
  if (typeof value !== 'string') return value;
  const normalized = value.trim();
  return normalized || undefined;
}

export class AdminOrderListQueryDto {
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
  @IsIn(ADMIN_ORDER_STATUSES)
  public status?: OrderStatus;

  @IsOptional()
  @IsString()
  @IsIn(ADMIN_PAYMENT_STATUSES)
  public paymentStatus?: PaymentStatus;
}
