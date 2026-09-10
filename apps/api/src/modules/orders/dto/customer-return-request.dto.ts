import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export const CUSTOMER_RETURN_REASONS = [
  'DAMAGED',
  'INCORRECT_ITEM',
  'DEFECTIVE',
  'SIZE_PREFERENCE',
  'COLOR_PREFERENCE',
  'CHANGE_OF_MIND',
] as const;

export class CustomerReturnItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  public orderItemId!: string;

  @IsInt()
  @Min(1)
  @Max(100)
  public quantity!: number;
}

export class CustomerReturnRequestDto {
  @IsString()
  @IsIn(CUSTOMER_RETURN_REASONS)
  public reason!: (typeof CUSTOMER_RETURN_REASONS)[number];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  public note?: string | null;

  @IsBoolean()
  public unusedConfirmed!: boolean;

  @IsBoolean()
  public unwashedConfirmed!: boolean;

  @IsBoolean()
  public tagsAttachedConfirmed!: boolean;

  @ValidateNested({ each: true })
  @Type(() => CustomerReturnItemDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  public items!: CustomerReturnItemDto[];
}
