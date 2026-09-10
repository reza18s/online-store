import { IsString, Matches, MaxLength } from 'class-validator';

export class ProductIdParamsDto {
  @IsString()
  @MaxLength(128)
  @Matches(/^[A-Za-z0-9_-]+$/)
  public productId!: string;
}
