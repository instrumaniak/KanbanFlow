import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateProjectDto } from './create-project.dto';

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  @ApiPropertyOptional({ example: 'Updated Project', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  override name?: string;
}
