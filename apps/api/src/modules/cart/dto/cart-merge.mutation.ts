import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

function toNumber(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  return typeof value === 'number' ? value : Number(value);
}

export class CartMergeResolutionDto {
  @IsString()
  @MaxLength(128)
  @Matches(/^[A-Za-z0-9_-]+$/)
  public variantId!: string;

  @Transform(({ value }) => toNumber(value))
  @IsInt()
  @Min(0)
  @Max(99)
  public quantity!: number;
}

export class CartMergeDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartMergeResolutionDto)
  public resolutions!: CartMergeResolutionDto[];
}
