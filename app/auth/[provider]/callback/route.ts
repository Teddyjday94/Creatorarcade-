import { requestOrigin } from '@/lib/server/http';
import { authMode, cookie, OAUTH_COOKIE, readCookie, SESSION_COOKIE, workerEnv } from '@/lib/auth';
import { exchangeCode, isProvider } from '@/lib/server/oauth';
import { createSession, upsertAccount, SESSION_DAYS } from '@/lib/server/accounts';
import { AppError } from '@/lib/domain/validation';
import { getDatabase } from '@/db';

function fail(origin: string, message: string, clear: string) {
  return new Response(null, {
    status: 302,
    headers: { Location: `${origin}/signin?error=${encodeURIComponent(message)}`, 'Set-Cookie': clear, 'Cache-Control': 'no-store' },
  });
}

// Step 2 of sign-in: verify state, swap the code for a profile, then start a session.
export async function GET(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const env = workerEnv();
  const url = new URL(req.url);
  const origin = env.APP_URL?.replace(/\/$/, '') || requestOrigin(req);
  const secure = origin.startsWith('https:');
  const clear = cookie(OAUTH_COOKIE, '', { maxAge: 0, secure, path: '/auth' });
  if (authMode() !== 'oauth' || !isProvider(provider)) return new Response('Not found', { status: 404 });
  if (url.searchParams.get('error')) return fail(origin, 'Sign-in was cancelled.', clear);

  let saved: { provider?: string; state?: string; verifier?: string; returnTo?: string } = {};
  try { saved = JSON.parse(readCookie(req.headers.get('cookie'), OAUTH_COOKIE) ?? '{}'); } catch { saved = {}; }
  const code = url.searchParams.get('code');
  if (!code || !saved.state || saved.provider !== provider || saved.state !== url.searchParams.get('state')) {
    return fail(origin, 'That sign-in link expired. Please try again.', clear);
  }

  try {
    const profile = await exchangeCode(provider, env, code, `${origin}/auth/${provider}/callback`, saved.verifier ?? '');
    const db = getDatabase();
    const account = await upsertAccount(db, profile);
    const session = await createSession(db, account.id);
    const headers = new Headers({ Location: origin + (saved.returnTo || '/dashboard'), 'Cache-Control': 'no-store' });
    headers.append('Set-Cookie', clear);
    headers.append('Set-Cookie', cookie(SESSION_COOKIE, session.token, { maxAge: SESSION_DAYS * 86400, secure }));
    return new Response(null, { status: 302, headers });
  } catch (e) {
    console.error('CreatorArcade sign-in failed', provider, e instanceof AppError ? e.message : 'unexpected error');
    return fail(origin, e instanceof AppError ? e.message : 'Sign-in failed. Please try again.', clear);
  }
}
