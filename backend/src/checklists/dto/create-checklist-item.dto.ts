import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsNumber, IsOptional } from 'class-validator';

export class CreateChecklistItemDto {
  @ApiProperty({ example: 'Buy milk' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  text!: string;

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  @IsNumber()
  position?: number;
}
