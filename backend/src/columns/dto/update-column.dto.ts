import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateColumnDto {
  @ApiProperty({ example: 'In Progress' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;
}