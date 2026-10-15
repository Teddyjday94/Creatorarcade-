import { requestOrigin } from '@/lib/server/http';
import { authMode, cookie, OAUTH_COOKIE, safeReturnPath, workerEnv } from '@/lib/auth';
import { authorizeUrl, credentials, isProvider } from '@/lib/server/oauth';
import { randomToken } from '@/lib/server/accounts';

// Step 1 of sign-in: remember state + PKCE verifier in a short-lived cookie and send the user to the provider.
export async function GET(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const env = workerEnv();
  if (authMode() !== 'oauth' || !isProvider(provider) || !credentials(provider, env)) return new Response('Not found', { status: 404 });
  const url = new URL(req.url);
  const origin = env.APP_URL?.replace(/\/$/, '') || requestOrigin(req);
  const state = randomToken(24);
  const verifier = randomToken(32);
  const returnTo = safeReturnPath(url.searchParams.get('return_to'));
  const location = await authorizeUrl(provider, env, `${origin}/auth/${provider}/callback`, state, verifier);
  return new Response(null, {
    status: 302,
    headers: {
      Location: location,
      'Set-Cookie': cookie(OAUTH_COOKIE, JSON.stringify({ provider, state, verifier, returnTo }), { maxAge: 600, secure: origin.startsWith('https:'), path: '/auth' }),
      'Cache-Control': 'no-store',
    },
  });
}
