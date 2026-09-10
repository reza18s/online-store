import {
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export const ADMIN_SHIPMENT_STATUSES = ['PENDING', 'PACKED', 'SHIPPED', 'DELIVERED'] as const;

export class AdminShipmentUpdateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  public provider!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  public method!: string;

  @IsString()
  @IsIn(ADMIN_SHIPMENT_STATUSES)
  public status!: (typeof ADMIN_SHIPMENT_STATUSES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(128)
  public trackingReference?: string | null;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  public reason!: string;

  @IsOptional()
  @IsISO8601()
  public expectedUpdatedAt?: string;
}
