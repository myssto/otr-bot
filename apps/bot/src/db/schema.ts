import type { InferSelectModel } from 'drizzle-orm';
import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text().primaryKey(),
  osuId: int().notNull(),
  osuUsername: text().notNull(),
});

export type User = InferSelectModel<typeof users>;
