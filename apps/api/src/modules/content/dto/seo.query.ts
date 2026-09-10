import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export const SEO_PUBLIC_PATH_MAX_LENGTH = 2_048;

function trimText(value: unknown): string | unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function queryNumber(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  return typeof value === 'number' ? value : Number(value);
}

export class SeoResolveQueryDto {
  @Transform(({ value }) => trimText(value))
  @IsString()
  @MinLength(1)
  @MaxLength(SEO_PUBLIC_PATH_MAX_LENGTH)
  public path!: string;
}

export class AdminContentListQueryDto {
  @Transform(({ value }) => queryNumber(value))
  @IsInt()
  @Min(1)
  @Max(100_000)
  public page = 1;

  @Transform(({ value }) => queryNumber(value))
  @IsInt()
  @Min(1)
  @Max(100)
  public limit = 24;

  @Transform(({ value }) => trimText(value))
  @IsOptional()
  @IsString()
  @MaxLength(160)
  public q?: string;
}
