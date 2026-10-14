// Accounts and sessions for OAuth sign-in. Session tokens are random 32-byte values;
// only their SHA-256 hash is stored, so a database leak does not leak live sessions.
import type { Database } from '../domain/types.ts';
import { check } from '../domain/validation.ts';

export type Provider = 'google' | 'discord' | 'twitch';
export type Profile = { provider: Provider; providerId: string; name: string; email: string; avatarUrl: string };
export type Account = { id: string; provider: Provider; providerId: string; name: string; email: string; avatarUrl: string; createdAt: string; lastSeenAt: string };

export const SESSION_DAYS = 30;
const PROVIDERS: Provider[] = ['google', 'discord', 'twitch'];

export async function sha256Hex(value: string) {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function randomToken(bytes = 32) {
  const raw = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...raw)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function clean(profile: Profile): Profile {
  check(PROVIDERS.includes(profile.provider), 'Unsupported sign-in provider.', 400);
  check(typeof profile.providerId === 'string' && profile.providerId.length > 0 && profile.providerId.length <= 200, 'Sign-in provider returned no account id.', 502);
  const name = (profile.name || '').trim().slice(0, 80) || 'Player';
  const email = (profile.email || '').trim().slice(0, 254);
  const avatarUrl = /^https:\/\//.test(profile.avatarUrl || '') ? profile.avatarUrl.slice(0, 1000) : '';
  return { ...profile, name, email, avatarUrl };
}

/** Finds the account for this provider identity, creating it on first sign-in. Name/avatar refresh each time. */
export async function upsertAccount(db: Database, input: Profile, now = new Date()): Promise<Account> {
  const p = clean(input);
  const at = now.toISOString();
  const existing = await db.first<Account>('SELECT * FROM users WHERE provider=? AND providerId=?', [p.provider, p.providerId]);
  if (existing) {
    await db.batch([{ sql: 'UPDATE users SET name=?,email=?,avatarUrl=?,lastSeenAt=? WHERE id=?', args: [p.name, p.email, p.avatarUrl, at, existing.id] }]);
    return { ...existing, name: p.name, email: p.email, avatarUrl: p.avatarUrl, lastSeenAt: at };
  }
  const id = 'u_' + crypto.randomUUID().replaceAll('-', '');
  await db.batch([{ sql: 'INSERT INTO users(id,provider,providerId,name,email,avatarUrl,createdAt,lastSeenAt) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(provider,providerId) DO NOTHING', args: [id, p.provider, p.providerId, p.name, p.email, p.avatarUrl, at, at] }]);
  // A concurrent first sign-in may have won the insert; read back whichever row exists.
  return (await db.first<Account>('SELECT * FROM users WHERE provider=? AND providerId=?', [p.provider, p.providerId]))!;
}

export async function createSession(db: Database, userId: string, now = new Date()) {
  const token = randomToken();
  const expiresAt = new Date(now.getTime() + SESSION_DAYS * 86400000).toISOString();
  await db.batch([
    { sql: 'DELETE FROM sessions WHERE userId=? AND expiresAt<?', args: [userId, now.toISOString()] },
    { sql: 'INSERT INTO sessions(id,userId,expiresAt,createdAt) VALUES(?,?,?,?)', args: [await sha256Hex(token), userId, expiresAt, now.toISOString()] },
  ]);
  return { token, expiresAt };
}

export async function accountForSession(db: Database, token: string | null | undefined, now = new Date()): Promise<Account | null> {
  if (!token || !/^[\w-]{43}$/.test(token)) return null;
  return db.first<Account>('SELECT u.* FROM sessions s JOIN users u ON u.id=s.userId WHERE s.id=? AND s.expiresAt>?', [await sha256Hex(token), now.toISOString()]);
}

export async function deleteSession(db: Database, token: string | null | undefined) {
  if (!token || !/^[\w-]{43}$/.test(token)) return;
  await db.batch([{ sql: 'DELETE FROM sessions WHERE id=?', args: [await sha256Hex(token)] }]);
}

/** Display names for a set of user ids. Unknown ids are simply absent. */
export async function namesFor(db: Database, ids: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(ids.filter((x) => x && x.startsWith('u_')))].slice(0, 200);
  if (!unique.length) return {};
  const rows = await db.all<{ id: string; name: string }>('SELECT id,name FROM users WHERE id IN (' + unique.map(() => '?').join(',') + ')', unique);
  return Object.fromEntries(rows.map((r) => [r.id, r.name]));
}
