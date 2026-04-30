import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MoveCardsDto {
  @ApiProperty({ example: 3, description: 'Target column ID' })
  @IsNumber()
  @Min(1)
  targetColumnId!: number;
}
