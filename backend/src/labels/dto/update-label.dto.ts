import { IsOptional, IsString, MinLength, MaxLength, IsEnum } from 'class-validator';

export class UpdateLabelDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsEnum(['red', 'orange', 'yellow', 'green', 'blue', 'purple'])
  color?: 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple';
}
