import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsHexColor } from 'class-validator';

export class UpdateBoardDto {
  @ApiPropertyOptional({ example: 'Updated Board Name' })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '#FFAB00' })
  @IsHexColor()
  @IsOptional()
  background_color?: string;

  @ApiPropertyOptional({ example: 1, nullable: true })
  @IsOptional()
  project_id?: number | null;
}