import { IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

import type { ShippingMethod } from '../shipping.provider';

const identifierPattern = /^[A-Za-z0-9_-]{1,128}$/;
const couponCodePattern = /^[A-Za-z0-9_-]{1,64}$/;

export class CheckoutRequestDto {
  @IsString()
  @MaxLength(128)
  @Matches(identifierPattern)
  public addressId!: string;

  @IsIn(['STANDARD', 'EXPRESS'])
  public shippingMethod!: ShippingMethod;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Matches(couponCodePattern)
  public couponCode?: string;
}
