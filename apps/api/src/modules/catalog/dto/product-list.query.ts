import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const ZERO_WIDTH_CHARACTERS = /(?:\u200B|\u200C|\u200D|\u2060|\uFEFF)/gu;
const SEARCH_PUNCTUATION = /[^\p{L}\p{N}\s_-]/gu;
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const WESTERN_DIGITS = '0123456789';

export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFC')
    .replace(ZERO_WIDTH_CHARACTERS, ' ')
    .replace(/[يى]/gu, 'ی')
    .replace(/ك/gu, 'ک')
    .replace(/[ۀة]/gu, 'ه')
    .replace(/[إأٱ]/gu, 'ا')
    .replace(/[٠-٩۰-۹]/gu, (digit) => {
      const arabicIndex = ARABIC_DIGITS.indexOf(digit);
      const digitIndex = arabicIndex >= 0 ? arabicIndex : PERSIAN_DIGITS.indexOf(digit);
      return digitIndex >= 0 ? (WESTERN_DIGITS[digitIndex] ?? digit) : digit;
    })
    .replace(SEARCH_PUNCTUATION, ' ')
    .replace(/\s+/gu, ' ')
    .trim()
    .toLocaleLowerCase('fa-IR');
}

function optionalText(value: unknown): string | unknown {
  if (typeof value !== 'string') return value;

  const normalized = normalizeSearchText(value);
  return normalized || undefined;
}

function queryNumber(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  return typeof value === 'number' ? value : Number(value);
}

function queryBoolean(value: unknown): boolean | unknown {
  if (value === undefined) return undefined;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return value;
}

export class ProductListQueryDto {
  @Transform(({ value }) => queryNumber(value))
  @IsInt()
  @Min(1)
  @Max(100)
  public limit = 24;

  @Transform(({ value }) => queryNumber(value))
  @IsInt()
  @Min(1)
  @Max(100_000)
  public page = 1;

  @Transform(({ value }) => optionalText(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  public q?: string;

  @Transform(({ value }) => optionalText(value))
  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  public category?: string;

  @Transform(({ value }) => optionalText(value))
  @IsOptional()
  @IsString()
  @IsIn(['women', 'men', 'children'])
  public audience?: 'women' | 'men' | 'children';

  @Transform(({ value }) => optionalText(value))
  @IsOptional()
  @IsString()
  @MaxLength(80)
  public size?: string;

  @Transform(({ value }) => optionalText(value))
  @IsOptional()
  @IsString()
  @MaxLength(80)
  public color?: string;

  @Transform(({ value }) => optionalText(value))
  @IsOptional()
  @IsString()
  @MaxLength(80)
  public material?: string;

  @Transform(({ value }) => queryNumber(value))
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  public minPrice?: number;

  @Transform(({ value }) => queryNumber(value))
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  public maxPrice?: number;

  @Transform(({ value }) => queryBoolean(value))
  @IsOptional()
  @IsBoolean()
  public inStock?: boolean;

  @Transform(({ value }) => queryBoolean(value))
  @IsOptional()
  @IsBoolean()
  public onSale?: boolean;

  @IsOptional()
  @IsIn(['newest', 'price_asc', 'price_desc', 'name'])
  public sort?: 'newest' | 'price_asc' | 'price_desc' | 'name';
}
