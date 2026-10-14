// Applies committed SQL migrations in order, once each, tracked in `appMigrations`.
// Each migration runs in a single D1 batch (one transaction) together with its
// tracking row, so a concurrent or failed run never leaves a half-applied migration.
import m0000 from '../drizzle/0000_third_stark_industries.sql?raw';
import m0001 from '../drizzle/0001_users_and_sessions.sql?raw';

export const MIGRATIONS: Array<{ name: string; sql: string }> = [
  { name: '0000_third_stark_industries', sql: m0000 },
  { name: '0001_users_and_sessions', sql: m0001 },
];

export async function migrate(db: D1Database) {
  await db.prepare('CREATE TABLE IF NOT EXISTS appMigrations (name TEXT PRIMARY KEY NOT NULL, appliedAt TEXT NOT NULL)').run();
  const applied = new Set(((await db.prepare('SELECT name FROM appMigrations').all<{ name: string }>()).results ?? []).map((r) => r.name));
  // Databases created before migration tracking already have the base schema.
  if (!applied.has(MIGRATIONS[0].name)) {
    const legacy = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='workspaces'").first();
    if (legacy) {
      await db.prepare('INSERT OR IGNORE INTO appMigrations(name,appliedAt) VALUES(?,?)').bind(MIGRATIONS[0].name, new Date().toISOString()).run();
      applied.add(MIGRATIONS[0].name);
    }
  }
  for (const m of MIGRATIONS) {
    if (applied.has(m.name)) continue;
    const statements = m.sql.split('--> statement-breakpoint').map((s) => s.trim()).filter(Boolean);
    await db.batch([
      ...statements.map((s) => db.prepare(s)),
      db.prepare('INSERT INTO appMigrations(name,appliedAt) VALUES(?,?)').bind(m.name, new Date().toISOString()),
    ]);
  }
}
