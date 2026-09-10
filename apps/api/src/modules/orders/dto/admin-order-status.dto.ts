import { IsIn, IsISO8601, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import type { OrderStatus } from '@nova/db';

export const ADMIN_FULFILLMENT_ORDER_STATUSES = ['PREPARING', 'SHIPPED', 'DELIVERED'] as const;

export class AdminOrderStatusDto {
  @IsString()
  @IsIn(ADMIN_FULFILLMENT_ORDER_STATUSES)
  public status!: (typeof ADMIN_FULFILLMENT_ORDER_STATUSES)[number];

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  public reason!: string;

  @IsOptional()
  @IsISO8601()
  public expectedUpdatedAt?: string;
}

export type AdminFulfillmentOrderStatus = (typeof ADMIN_FULFILLMENT_ORDER_STATUSES)[number] &
  OrderStatus;
