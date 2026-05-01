import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

const testEnvPath = path.resolve(__dirname, '../.env.test');
const testEnvConfig = dotenv.parse(fs.readFileSync(testEnvPath));

for (const key in testEnvConfig) {
  process.env[key] = testEnvConfig[key];
}

export default async function globalSetup() {
  console.log('[E2E Setup] Starting database setup (production-style with migrations)...');
  console.log(
    '[E2E Setup] Using DB:',
    process.env.DB_HOST,
    process.env.DB_USERNAME,
    process.env.DB_NAME,
  );

  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'kanbanflow_test',
    synchronize: false,
    dropSchema: true,
    entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../src/migrations/*{.ts,.js}'],
    migrationsTableName: 'typeorm_migrations',
  });

  await dataSource.initialize();

  console.log('[E2E Setup] Running migrations (same as production)...');
  await dataSource.runMigrations();

  console.log('[E2E Setup] Database ready!');
  await dataSource.destroy();
}
