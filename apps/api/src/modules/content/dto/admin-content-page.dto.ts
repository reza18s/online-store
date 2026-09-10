import {
  ArrayMaxSize,
  IsArray,
  IsISO8601,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { CONTENT_PAGE_SLUG_MAX_LENGTH } from '../content-page.constants';
import { ADMIN_CONTENT_STATUSES, type AdminContentStatus } from './admin-content-page.query';

export const CONTENT_BLOCK_KIND_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

class AdminContentBlockDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  public kind!: string;

  @IsOptional()
  public payload?: unknown;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100_000)
  public sortOrder?: number;
}

export class CreateAdminContentPageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(CONTENT_PAGE_SLUG_MAX_LENGTH)
  public slug!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  public title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100_000)
  public body?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => AdminContentBlockDto)
  public blocks?: AdminContentBlockDto[];
}

export class UpdateAdminContentPageDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  public title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100_000)
  public body?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => AdminContentBlockDto)
  public blocks?: AdminContentBlockDto[];

  @IsOptional()
  @IsISO8601()
  public expectedUpdatedAt?: string;
}

export class UpdateAdminContentPageStatusDto {
  @IsString()
  @IsIn(ADMIN_CONTENT_STATUSES)
  public status!: AdminContentStatus;

  @IsOptional()
  @IsISO8601()
  public expectedUpdatedAt?: string;
}
