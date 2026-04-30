import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsHexColor } from 'class-validator';

export class CreateBoardDto {
  @ApiProperty({ example: 'My Board' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: '#0079BF' })
  @IsHexColor()
  @IsOptional()
  background_color?: string;

  @ApiPropertyOptional({ example: 1, nullable: true })
  @IsOptional()
  project_id?: number | null;
}
