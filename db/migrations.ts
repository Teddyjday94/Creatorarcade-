// Applies committed SQL migrations in order, once each, tracked in `appMigrations`.
// Each migration runs in one transactional batch together with its tracking row,
// so concurrent cold starts or a failure never leave a half-applied migration.
import type { Client } from '@libsql/client';
import { MIGRATIONS } from './migrations.generated';

export { MIGRATIONS };

export async function migrate(db: Client) {
  await db.execute('CREATE TABLE IF NOT EXISTS appMigrations (name TEXT PRIMARY KEY NOT NULL, appliedAt TEXT NOT NULL)');
  const applied = new Set((await db.execute('SELECT name FROM appMigrations')).rows.map((r) => String(r.name)));
  for (const m of MIGRATIONS) {
    if (applied.has(m.name)) continue;
    const statements = m.sql.split('--> statement-breakpoint').map((s) => s.trim()).filter(Boolean);
    try {
      await db.batch([
        ...statements,
        { sql: 'INSERT INTO appMigrations(name,appliedAt) VALUES(?,?)', args: [m.name, new Date().toISOString()] },
      ], 'write');
    } catch (e) {
      // Another instance may have applied it at the same moment.
      const done = await db.execute({ sql: 'SELECT name FROM appMigrations WHERE name=?', args: [m.name] });
      if (!done.rows.length) throw e;
    }
  }
}
