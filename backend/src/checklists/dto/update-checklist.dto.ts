import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class UpdateChecklistDto {
  @ApiProperty({ example: 'Updated title' })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title?: string;
}
