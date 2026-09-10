import { IsIn, IsISO8601, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export const ADMIN_RETURN_REVIEW_STATUSES = ['APPROVED', 'REJECTED', 'RECEIVED'] as const;

export class AdminReturnReviewDto {
  @IsString()
  @IsIn(ADMIN_RETURN_REVIEW_STATUSES)
  public status!: (typeof ADMIN_RETURN_REVIEW_STATUSES)[number];

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  public reason!: string;

  @IsOptional()
  @IsISO8601()
  public expectedUpdatedAt?: string;
}
