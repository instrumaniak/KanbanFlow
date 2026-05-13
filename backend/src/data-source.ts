import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from './database/data-source-options';

export default new DataSource(buildDataSourceOptions());
