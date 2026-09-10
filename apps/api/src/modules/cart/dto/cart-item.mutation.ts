import { Transform } from 'class-transformer';
import { IsInt, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

function toNumber(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  return typeof value === 'number' ? value : Number(value);
}

export class CartItemMutationDto {
  @IsString()
  @MaxLength(128)
  @Matches(/^[A-Za-z0-9_-]+$/)
  public variantId!: string;

  @Transform(({ value }) => toNumber(value))
  @IsInt()
  @Min(1)
  @Max(99)
  public quantity!: number;
}

export class CartItemQuantityDto {
  @Transform(({ value }) => toNumber(value))
  @IsInt()
  @Min(1)
  @Max(99)
  public quantity!: number;
}
