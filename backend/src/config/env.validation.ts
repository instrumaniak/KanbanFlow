import { plainToInstance } from 'class-transformer';
import { IsString, IsNumber, IsOptional, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsString()
  DB_HOST!: string;

  @IsNumber()
  DB_PORT!: number;

  @IsString()
  DB_USERNAME!: string;

  @IsString()
  DB_PASSWORD!: string;

  @IsString()
  DB_NAME!: string;

  @IsOptional()
  @IsString()
  NODE_ENV!: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });
  if (errors.length > 0) throw new Error(errors.toString());
  return validatedConfig;
}
