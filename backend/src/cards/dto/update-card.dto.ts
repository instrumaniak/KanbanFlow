import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, MaxLength, IsDateString } from 'class-validator';

export class UpdateCardDto {
  @ApiProperty({ example: 'Buy milk and eggs', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  column_id?: number;

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  @IsNumber()
  position?: number;

  @ApiProperty({ example: 'Updated description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z', required: false })
  @IsOptional()
  @IsDateString()
  due_date?: string;
}
