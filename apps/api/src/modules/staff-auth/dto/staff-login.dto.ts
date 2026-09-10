import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class StaffLoginDto {
  @IsEmail()
  @MaxLength(254)
  public email!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(200)
  public password!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(64)
  public factor!: string;
}
