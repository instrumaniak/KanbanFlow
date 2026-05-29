import 'dotenv/config';
import { DataSourceOptions } from 'typeorm';
import { entities, migrations } from './typeorm-registry';

export function buildDataSourceOptions(): DataSourceOptions {
  const rawPort = process.env.DB_PORT ?? '3306';
  const port = Number(rawPort);

  return {
    type: 'mysql',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number.isNaN(port) ? 3306 : port,
    username: process.env.DB_USERNAME ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'kanbanflow_dev',
    entities,
    migrations,
    migrationsTableName: 'typeorm_migrations',
    migrationsRun: false,
    synchronize: false,
  };
}
