// Identity adapter for CreatorArcade.
//
// AUTH_MODE=oauth (default): real accounts via Google, Discord, or Twitch. Sessions
// are random tokens in an HttpOnly cookie; only their hash is stored (lib/server/accounts.ts).
//
// AUTH_MODE=demo: visitors pick a demo persona on /signin. The choice is
// stored in an HttpOnly cookie that only ever maps to a fixed persona or a random
// guest id, so a visitor cannot inject an arbitrary identity. This is for demos
// and pilots only. It is NOT real authentication.
//
// AUTH_MODE=sites: trusts the oai-authenticated-user-* headers. Only safe behind
// the original ChatGPT Sites platform, which strips and re-sets those headers.
//
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { PERSONAS, personaFor, type Persona } from './personas';
import { getDatabase, DatabaseNotConfigured } from '../db';
import { accountForSession } from './server/accounts';

export type User = {
  userId: string;
  displayName: string;
  fullName: string | null;
  email: string;
  avatarUrl: string;
  provider: string;
  persona: Persona | null;
};

export const DEMO_COOKIE = 'ca_demo';
export const SESSION_COOKIE = 'ca_session';
export const OAUTH_COOKIE = 'ca_oauth';
const SIGN_IN_PATH = '/signin';
const SIGN_OUT_PATH = '/signout';

export type AuthMode = 'oauth' | 'demo' | 'sites';

export function authMode(): AuthMode {
  const mode = process.env.AUTH_MODE;
  return mode === 'sites' || mode === 'demo' ? mode : 'oauth';
}

export function isDemoAuth() {
  return authMode() === 'demo';
}

/** Validates a demo cookie value and returns the user id it stands for. */
export function demoUserIdFromCookie(value: string | undefined | null): string | null {
  if (!value) return null;
  if (PERSONAS.some((p) => p.id === value)) return value;
  if (/^guest-[a-f0-9]{12}$/.test(value)) return value;
  return null;
}

export function readCookie(header: string | null, name: string) {
  for (const part of (header ?? '').split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) {
      try { return decodeURIComponent(rest.join('=')); } catch { return null; }
    }
  }
  return null;
}

export async function getUser(): Promise<User | null> {
  const h = await headers();
  if (authMode() === 'sites') {
    const userId = h.get('oai-authenticated-user-id');
    const email = h.get('oai-authenticated-user-email');
    if (!userId || !email) return null;
    const encoded = h.get('oai-authenticated-user-full-name');
    let fullName: string | null = null;
    if (encoded && h.get('oai-authenticated-user-full-name-encoding') === 'percent-encoded-utf-8') {
      try { fullName = decodeURIComponent(encoded); } catch { fullName = null; }
    }
    return { userId, email, fullName, displayName: fullName ?? email, avatarUrl: '', provider: 'sites', persona: null };
  }
  if (authMode() === 'oauth') {
    const token = readCookie(h.get('cookie'), SESSION_COOKIE);
    if (!token) return null;
    let account;
    try {
      account = await accountForSession(getDatabase(), token);
    } catch (e) {
      if (e instanceof DatabaseNotConfigured) return null;
      throw e;
    }
    if (!account) return null;
    return { userId: account.id, email: account.email, fullName: account.name, displayName: account.name, avatarUrl: account.avatarUrl, provider: account.provider, persona: null };
  }
  const userId = demoUserIdFromCookie(readCookie(h.get('cookie'), DEMO_COOKIE));
  if (!userId) return null;
  const persona = personaFor(userId);
  return {
    userId,
    email: userId + '@demo.creatorarcade.local',
    fullName: persona.name,
    displayName: persona.name,
    avatarUrl: '',
    provider: 'demo',
    persona,
  };
}

export async function requireUser(returnTo: string): Promise<User> {
  const user = await getUser();
  if (user) return user;
  redirect(signInPath(returnTo));
}

export function safeReturnPath(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/dashboard';
  try {
    const url = new URL(value, 'https://app.local');
    if (url.origin !== 'https://app.local') return '/dashboard';
    if (url.pathname.startsWith(SIGN_IN_PATH) || url.pathname.startsWith(SIGN_OUT_PATH)) return '/dashboard';
    return url.pathname + url.search + url.hash;
  } catch {
    return '/dashboard';
  }
}

export function signInPath(returnTo = '/dashboard') {
  if (authMode() === 'sites') return '/signin-with-chatgpt?return_to=' + encodeURIComponent(safeReturnPath(returnTo));
  return SIGN_IN_PATH + '?return_to=' + encodeURIComponent(safeReturnPath(returnTo));
}

export function signOutPath(returnTo = '/') {
  if (authMode() === 'sites') return '/signout-with-chatgpt?return_to=' + encodeURIComponent(returnTo);
  return SIGN_OUT_PATH;
}

/** Server environment, including OAuth client ids/secrets (Vercel project env vars). */
export function workerEnv() {
  return process.env as Record<string, string | undefined>;
}

export function cookie(name: string, value: string, opts: { maxAge: number; secure: boolean; path?: string }) {
  return `${name}=${encodeURIComponent(value)}; Path=${opts.path ?? '/'}; HttpOnly; SameSite=Lax; Max-Age=${opts.maxAge}${opts.secure ? '; Secure' : ''}`;
}
