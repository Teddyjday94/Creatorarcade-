import { env } from 'cloudflare:workers';
import type { Database, Statement } from '../lib/domain/types';
import { migrate } from './migrations';

let schemaReady: Promise<void> | null = null;

export function getDatabase(): Database {
  if (!env.DB) throw new Error('DB binding unavailable');
  const db = env.DB;
  schemaReady ??= migrate(db).catch((e) => {
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
