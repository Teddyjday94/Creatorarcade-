import { createClient, type Client, type InValue, type ResultSet } from '@libsql/client';
import type { Database, Row, Statement } from '../lib/domain/types';
import { migrate } from './migrations';

/** Thrown when no database is configured, so pages can show setup help instead of a crash. */
export class DatabaseNotConfigured extends Error {
  constructor() {
    super('Database not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN (see SETUP.md).');
    this.name = 'DatabaseNotConfigured';
  }
}

export function databaseUrl() {
  const url = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL || process.env.DATABASE_URL;
  if (url) return url;
  // Local development falls back to a file next to the project.
  return process.env.VERCEL ? null : 'file:local.db';
}

let client: Client | null = null;
let ready: Promise<void> | null = null;

function connect() {
  if (client) return client;
  const url = databaseUrl();
  if (!url) throw new DatabaseNotConfigured();
  client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN || undefined });
  return client;
}

const clean = (args: any[] = []): InValue[] => args.map((a) => (a === undefined ? null : typeof a === 'boolean' ? (a ? 1 : 0) : a));

function rows<T>(r: ResultSet): T[] {
  return r.rows.map((row) => Object.fromEntries(r.columns.map((c, i) => [c, row[i]])) as T);
}

export function getDatabase(): Database {
  const db = connect();
  ready ??= migrate(db).catch((e) => {
    ready = null;
    throw e;
  });
  return {
    first: async <T = Row>(sql: string, args: any[] = []) => {
      await ready;
      return rows<T>(await db.execute({ sql, args: clean(args) }))[0] ?? null;
    },
    all: async <T = Row>(sql: string, args: any[] = []) => {
      await ready;
      return rows<T>(await db.execute({ sql, args: clean(args) }));
    },
    batch: async (items: Statement[]) => {
      await ready;
      const result = await db.batch(items.map((s) => ({ sql: s.sql, args: clean(s.args) })), 'write');
      return result.map((r) => ({ changes: r.rowsAffected }));
    },
  };
}
