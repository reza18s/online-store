import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const localizedPostalCodePattern = /^[0-9۰-۹٠-٩]{10}$/;

export class AddressCreateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  public label!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  public recipientName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  public phone!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  public province!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  public city!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  public addressLine!: string;

  @IsString()
  @Matches(localizedPostalCodePattern)
  public postalCode!: string;

  @IsOptional()
  @IsBoolean()
  public isDefault?: boolean;
}

export class AddressUpdateDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  public label?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  public recipientName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  public phone?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  public province?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  public city?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  public addressLine?: string;

  @IsOptional()
  @IsString()
  @Matches(localizedPostalCodePattern)
  public postalCode?: string;

  @IsOptional()
  @IsBoolean()
  public isDefault?: boolean;
}
