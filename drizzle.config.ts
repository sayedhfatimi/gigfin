import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const dbUrl = process.env.DB_FILE_NAME ?? 'file:db.sqlite';

export default defineConfig({
  out: './drizzle',
  schema: './db/schema.ts',
  dialect: 'sqlite',
  dbCredentials: {
    url: dbUrl,
  },
});
