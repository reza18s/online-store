import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

import { normalizeSearchText } from './product-list.query';

export const SEARCH_SUGGESTIONS_DEFAULT_LIMIT = 8;
export const SEARCH_SUGGESTIONS_MAX_LIMIT = 10;

function queryNumber(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  return typeof value === 'number' ? value : Number(value);
}

function optionalText(value: unknown): string | unknown {
  if (typeof value !== 'string') return value;

  const normalized = normalizeSearchText(value);
  return normalized || undefined;
}

export class SearchSuggestionsQueryDto {
  @Transform(({ value }) => optionalText(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  public q?: string;

  @Transform(({ value }) => queryNumber(value))
  @IsInt()
  @Min(1)
  @Max(SEARCH_SUGGESTIONS_MAX_LIMIT)
  public limit = SEARCH_SUGGESTIONS_DEFAULT_LIMIT;
}
