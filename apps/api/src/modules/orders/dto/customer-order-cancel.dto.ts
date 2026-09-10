import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CustomerOrderCancelDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  public reason!: string;
}
