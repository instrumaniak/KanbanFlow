import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsNumber, IsOptional } from 'class-validator';

export class CreateChecklistDto {
  @ApiProperty({ example: 'Setup steps' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({ example: 1, description: 'Set automatically from URL param' })
  @IsOptional()
  @IsNumber()
  card_id?: number;
}
