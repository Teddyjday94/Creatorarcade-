import { env } from 'cloudflare:workers';
import type { Database, Statement } from '../lib/domain/types';
import migration from '../drizzle/0000_third_stark_industries.sql?raw';

let schemaReady: Promise<void> | null = null;

// Applies the committed migration once when the database is empty, so a fresh
// local or demo deployment works without a manual `wrangler d1 execute`.
// It never alters an existing schema.
async function ensureSchema(db: D1Database) {
  const row = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='workspaces'").first();
  if (row) return;
  const statements = migration
    .split('--> statement-breakpoint')
    .map((s: string) => s.trim())
    .filter(Boolean);
  await db.batch(statements.map((s: string) => db.prepare(s)));
}

export function getDatabase(): Database {
  if (!env.DB) throw new Error('DB binding unavailable');
  const db = env.DB;
  schemaReady ??= ensureSchema(db).catch((e) => {
    schemaReady = null;
    throw e;
  });
  const ready = () => schemaReady!;
  return {
    first: async <T>(sql: string, args: any[] = []) => {
      await ready();
      return db.prepare(sql).bind(...args).first<T>();
    },
    all: async <T>(sql: string, args: any[] = []) => {
      await ready();
      return (await db.prepare(sql).bind(...args).all<T>()).results;
    },
    batch: async (items: Statement[]) => {
      await ready();
      const result = await db.batch(items.map((s) => db.prepare(s.sql).bind(...(s.args ?? []))));
      return result.map((r) => ({ changes: r.meta.changes }));
    },
  };
}
