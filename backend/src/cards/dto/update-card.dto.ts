import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  MaxLength,
  ValidateIf,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

function IsValidDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidDate',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, _args: ValidationArguments) {
          if (value === undefined || value === null) return true;
          if (typeof value !== 'string') return false;
          const date = new Date(value);
          return !isNaN(date.getTime());
        },
        defaultMessage(_args: ValidationArguments) {
          return 'due_date must be a valid ISO 8601 date string';
        },
      },
    });
  };
}

export class UpdateCardDto {
  @ApiProperty({ example: 'Buy milk and eggs', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  column_id?: number;

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  @IsNumber()
  position?: number;

  @ApiProperty({ example: 'Updated description', required: false })
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
