import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';

const defaultDbFile = './data/db.sqlite';
const dbUrl = process.env.DB_FILE_NAME ?? `file:${defaultDbFile}`;
const resolvedDbFile = dbUrl.replace(/^file:/, '');
fs.mkdirSync(path.dirname(resolvedDbFile), { recursive: true });
const client = createClient({
  url: dbUrl,
});

export const db = drizzle(client);
