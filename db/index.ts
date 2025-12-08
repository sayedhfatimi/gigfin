import 'dotenv/config';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';

const dbUrl = process.env.DB_FILE_NAME ?? 'file:db.sqlite';
const client = createClient({
  url: dbUrl,
});

export const db = drizzle(client);
