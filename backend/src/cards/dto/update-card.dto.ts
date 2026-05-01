import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, MaxLength } from 'class-validator';

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
}
