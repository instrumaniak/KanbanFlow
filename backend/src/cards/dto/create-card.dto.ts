import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, MaxLength, IsOptional, IsDateString } from 'class-validator';

export class CreateCardDto {
  @ApiProperty({ example: 'Buy groceries' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  column_id!: number;

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  @IsNumber()
  position?: number;

  @ApiProperty({ example: 'Card description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z', required: false })
  @IsOptional()
  @IsDateString()
  due_date?: string;
}
