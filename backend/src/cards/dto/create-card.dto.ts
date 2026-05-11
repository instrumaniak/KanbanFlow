import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, MaxLength, IsOptional } from 'class-validator';

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
}
