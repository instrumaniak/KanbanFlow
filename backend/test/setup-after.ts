import * as path from 'path';
import dotenv from 'dotenv';

beforeAll(() => {
  dotenv.config({ path: path.resolve(__dirname, '../.env.test') });
});
