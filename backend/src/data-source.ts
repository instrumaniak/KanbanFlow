import 'dotenv/config';
import { DataSource } from 'typeorm';

const port = Number(process.env.DB_PORT ?? '3306');

export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number.isNaN(port) ? 3306 : port,
  username: process.env.DB_USERNAME ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'kanbanflow_dev',
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  migrationsTableName: 'typeorm_migrations',
  migrationsRun: false,
  synchronize: false,
});
