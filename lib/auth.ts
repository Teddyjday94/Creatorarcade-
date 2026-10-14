// Identity adapter for CreatorArcade.
//
// AUTH_MODE=demo (default): visitors pick a demo persona on /signin. The choice is
// stored in an HttpOnly cookie that only ever maps to a fixed persona or a random
// guest id, so a visitor cannot inject an arbitrary identity. This is for demos
// and pilots only. It is NOT real authentication.
//
// AUTH_MODE=sites: trusts the oai-authenticated-user-* headers. Only safe behind
// the original ChatGPT Sites platform, which strips and re-sets those headers.
//
// To go to production, add a third mode backed by a real provider (Clerk, Auth.js,
// Cloudflare Access, etc.) that returns a verified, stable userId.
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { env } from 'cloudflare:workers';
import { PERSONAS, personaFor, type Persona } from './personas';

export type User = {
  userId: string;
  displayName: string;
  fullName: string | null;
  email: string;
  persona: Persona | null;
};

export const DEMO_COOKIE = 'ca_demo';
const SIGN_IN_PATH = '/signin';
const SIGN_OUT_PATH = '/signout';

export function authMode(): 'demo' | 'sites' {
  const mode = (env as unknown as { AUTH_MODE?: string }).AUTH_MODE;
  return mode === 'sites' ? 'sites' : 'demo';
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

function readCookie(header: string | null, name: string) {
  for (const part of (header ?? '').split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return decodeURIComponent(rest.join('='));
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
    return { userId, email, fullName, displayName: fullName ?? email, persona: null };
  }
  const userId = demoUserIdFromCookie(readCookie(h.get('cookie'), DEMO_COOKIE));
  if (!userId) return null;
  const persona = personaFor(userId);
  return {
    userId,
    email: userId + '@demo.creatorarcade.local',
    fullName: persona.name,
    displayName: persona.name,
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
