import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { SEO_PUBLIC_PATH_MAX_LENGTH } from './seo.query';

export const SEO_REDIRECT_STATUS_CODES = [301, 302, 307, 308] as const;
export type SeoRedirectStatusCode = (typeof SEO_REDIRECT_STATUS_CODES)[number];

const SEO_TITLE_MAX_LENGTH = 200;
const SEO_DESCRIPTION_MAX_LENGTH = 320;
const SEO_CANONICAL_URL_MAX_LENGTH = 2_048;

export class CreateAdminSeoMetadataDto {
  @IsString()
  @MinLength(1)
  @MaxLength(SEO_PUBLIC_PATH_MAX_LENGTH)
  public path!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(SEO_TITLE_MAX_LENGTH)
  public title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(SEO_DESCRIPTION_MAX_LENGTH)
  public description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(SEO_CANONICAL_URL_MAX_LENGTH)
  public canonicalUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  public noIndex?: boolean;

  @IsOptional()
  public structuredData?: unknown | null;
}

export class UpdateAdminSeoMetadataDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(SEO_TITLE_MAX_LENGTH)
  public title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(SEO_DESCRIPTION_MAX_LENGTH)
  public description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(SEO_CANONICAL_URL_MAX_LENGTH)
  public canonicalUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  public noIndex?: boolean;

  @IsOptional()
  public structuredData?: unknown | null;

  @IsOptional()
  @IsISO8601()
  public expectedUpdatedAt?: string;
}

export class CreateAdminRedirectDto {
  @IsString()
  @MinLength(1)
  @MaxLength(SEO_PUBLIC_PATH_MAX_LENGTH)
  public fromPath!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(SEO_PUBLIC_PATH_MAX_LENGTH)
  public toPath!: string;

  @IsOptional()
  @IsInt()
  @IsIn(SEO_REDIRECT_STATUS_CODES)
  public statusCode?: SeoRedirectStatusCode;
}

export class UpdateAdminRedirectDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(SEO_PUBLIC_PATH_MAX_LENGTH)
  public toPath?: string;

  @IsOptional()
  @IsInt()
  @IsIn(SEO_REDIRECT_STATUS_CODES)
  public statusCode?: SeoRedirectStatusCode;
}
