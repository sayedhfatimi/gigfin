import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'drizzle-kit';

const defaultDbFile = './data/db.sqlite';
const dbUrl = process.env.DB_FILE_NAME ?? `file:${defaultDbFile}`;
const resolvedDbFile = dbUrl.replace(/^file:/, '');
fs.mkdirSync(path.dirname(resolvedDbFile), { recursive: true });

export default defineConfig({
  out: './drizzle',
  schema: './db/schema.ts',
  dialect: 'sqlite',
  dbCredentials: {
    url: dbUrl,
  },
});
