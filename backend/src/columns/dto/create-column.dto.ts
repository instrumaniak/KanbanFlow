import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateColumnDto {
  @ApiProperty({ example: 'To Do', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;
}