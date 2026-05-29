import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  MaxLength,
  IsOptional,
  ValidateIf,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

function IsValidDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidDate',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (value === undefined || value === null) return true;
          if (typeof value !== 'string') return false;
          const date = new Date(value);
          return !isNaN(date.getTime());
        },
        defaultMessage() {
          return 'due_date must be a valid ISO 8601 date string';
        },
      },
    });
  };
}

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

  @ApiProperty({ example: 'Card description', required: false })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @MaxLength(10000)
  description?: string | null;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z', required: false })
  @IsOptional()
  @IsValidDate()
  due_date?: string;
}
