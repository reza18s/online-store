import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export const ADMIN_CONTENT_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
export type AdminContentStatus = (typeof ADMIN_CONTENT_STATUSES)[number];

function trimText(value: unknown): string | unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function queryNumber(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  return typeof value === 'number' ? value : Number(value);
}

export class AdminContentPageListQueryDto {
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

  @IsOptional()
  @IsString()
  @IsIn(ADMIN_CONTENT_STATUSES)
  public status?: AdminContentStatus;
}
