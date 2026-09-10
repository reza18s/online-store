import { IsString, Matches, MaxLength } from 'class-validator';

export class OtpRequestDto {
  @IsString()
  @MaxLength(32)
  public phone!: string;
}

export class OtpVerifyDto {
  @IsString()
  @MaxLength(64)
  @Matches(/^[A-Za-z0-9_-]{24,64}$/)
  public challengeId!: string;

  @IsString()
  @MaxLength(12)
  @Matches(/^[0-9۰-۹٠-٩\s]{6,12}$/)
  public code!: string;
}
