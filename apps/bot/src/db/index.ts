import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import * as schema from './schema';

const sqlite = new Database('db.sqlite');
const db = drizzle({ schema, client: sqlite });
migrate(db, { migrationsFolder: './drizzle' });

export { db };
