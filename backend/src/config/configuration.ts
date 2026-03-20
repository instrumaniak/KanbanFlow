import { registerAs } from '@nestjs/config';

export default registerAs('database', () => {
  const port = parseInt(process.env.DB_PORT ?? '3306', 10);
  return {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number.isNaN(port) ? 3306 : port,
    username: process.env.DB_USERNAME ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    name: process.env.DB_NAME ?? 'kanbanflow_dev',
  };
});
