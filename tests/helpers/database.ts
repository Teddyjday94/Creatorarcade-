import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import type { Database, Context, Statement } from '../../lib/domain/types.ts';
export function harness() {
    const sql = new DatabaseSync(':memory:');
    sql.exec('PRAGMA foreign_keys=ON');
    for (const file of readdirSync('drizzle').filter(x => x.endsWith('.sql')).sort())
        sql.exec(readFileSync('drizzle/' + file, 'utf8'));
    const db: Database = { first: async <T>(q: string, a: any[] = []) => (sql.prepare(q).get(...a) ?? null) as T | null, all: async <T>(q: string, a: any[] = []) => sql.prepare(q).all(...a) as T[], batch: async (items: Statement[]) => { sql.exec('BEGIN'); try {
            const r = items.map(s => ({ changes: Number(sql.prepare(s.sql).run(...(s.args ?? [])).changes) }));
            sql.exec('COMMIT');
            return r;
        }
        catch (e) {
            sql.exec('ROLLBACK');
            throw e;
        } } };
    let date = new Date('2026-10-14T04:00:00Z');
    const actor = (id: string): Context => ({ db, actor: { userId: id }, now: () => date });
    return { db, sql, owner: actor('owner'), viewer: actor('viewer'), editor: actor('editor'), outsider: actor('outsider'), actor, setTime: (s: string) => { date = new Date(s); } };
}
