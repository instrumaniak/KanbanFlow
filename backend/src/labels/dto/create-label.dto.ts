import { IsString, MinLength, MaxLength, IsEnum } from 'class-validator';

export class CreateLabelDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name!: string;

  @IsEnum(['red', 'orange', 'yellow', 'green', 'blue', 'purple'])
  color!: 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple';
}
