import { IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

export class UpdateLabelDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name?: string;
}
