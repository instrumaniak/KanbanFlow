import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, IsOptional, IsBoolean } from 'class-validator';

export class UpdateChecklistItemDto {
  @ApiProperty({ example: 'Updated text' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  text?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  is_completed?: boolean;
}
