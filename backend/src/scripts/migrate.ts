import 'dotenv/config';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from '../database/data-source-options';

const dataSource = new DataSource(buildDataSourceOptions());

async function runMigrations(): Promise<void> {
  let exitCode = 0;

  try {
    await dataSource.initialize();
    const result = await dataSource.runMigrations({ transaction: 'each' });
    if (result.length === 0) {
      console.log('No pending migrations.');
    } else {
      console.log(`Applied ${result.length} migration(s):`);
      for (const migration of result) {
        console.log(`  - ${migration.name}`);
      }
    }
  } catch (error) {
    console.error('Migration failed:', error);
    exitCode = 1;
  } finally {
    if (dataSource.isInitialized) {
      try {
        await dataSource.destroy();
      } catch (destroyError) {
        console.error('Failed to destroy data source:', destroyError);
        exitCode = 1;
      }
    }
    process.exitCode = exitCode;
  }
}

void runMigrations();
