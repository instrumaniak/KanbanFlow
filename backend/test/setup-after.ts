import * as path from 'path';

beforeAll(() => {
  require('dotenv').config({ path: path.resolve(__dirname, '../.env.test') });
});