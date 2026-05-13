import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

const testEnvPath = path.resolve(__dirname, '../.env.test');
const testEnvConfig = dotenv.parse(fs.readFileSync(testEnvPath));

for (const key in testEnvConfig) {
  process.env[key] = testEnvConfig[key];
}

export default async function globalTeardown() {
  console.log('[E2E Teardown] Cleaning up test database...');
  console.log(
    '[E2E Teardown] Using DB:',
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
    entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../src/migrations/*{.ts,.js}'],
    migrationsTableName: 'typeorm_migrations',
  });

  await dataSource.initialize();

  await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
  const rawTables: unknown = await dataSource.query('SHOW TABLES');
  const tables = rawTables as Array<Record<string, string>>;
  for (const row of tables) {
    const tableName = String(Object.values(row)[0]);
    await dataSource.query(`DROP TABLE IF EXISTS ${tableName}`);
  }
  await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');

  await dataSource.destroy();
  console.log('[E2E Teardown] Database cleaned up!');
}
