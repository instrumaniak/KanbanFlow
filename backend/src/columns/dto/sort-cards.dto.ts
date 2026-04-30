import { IsString, IsIn, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SortCardsDto {
  @ApiProperty({ enum: ['asc', 'desc'], example: 'asc' })
  @IsString()
  @IsNotEmpty()
  @IsIn(['asc', 'desc'])
  order!: 'asc' | 'desc';
}
