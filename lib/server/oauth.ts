// OAuth 2.0 authorization-code flows for Google, Discord, and Twitch.
// No SDKs: each provider is a token endpoint plus a profile endpoint.
import type { Profile, Provider } from './accounts.ts';
import { AppError } from '../domain/validation.ts';

export type OAuthEnv = Partial<Record<
  'GOOGLE_CLIENT_ID' | 'GOOGLE_CLIENT_SECRET' | 'DISCORD_CLIENT_ID' | 'DISCORD_CLIENT_SECRET' | 'TWITCH_CLIENT_ID' | 'TWITCH_CLIENT_SECRET',
  string
>>;

type Config = {
  label: string;
  authorize: string;
  token: string;
  scope: string;
  pkce: boolean;
  extra?: Record<string, string>;
  profile: (accessToken: string, clientId: string, fetcher: typeof fetch) => Promise<Profile>;
};

async function json(res: Response, what: string) {
  if (!res.ok) throw new AppError(502, `Could not ${what}. Please try signing in again.`);
  return (await res.json()) as any;
}

export const PROVIDERS: Record<Provider, Config> = {
  google: {
    label: 'Google',
    authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
    token: 'https://oauth2.googleapis.com/token',
    scope: 'openid email profile',
    pkce: true,
    extra: { prompt: 'select_account' },
    profile: async (token, _id, f) => {
      const u = await json(await f('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: 'Bearer ' + token } }), 'read your Google profile');
      return { provider: 'google', providerId: String(u.sub ?? ''), name: u.name || u.given_name || (u.email ?? '').split('@')[0], email: u.email_verified ? u.email ?? '' : '', avatarUrl: u.picture ?? '' };
    },
  },
  discord: {
    label: 'Discord',
    authorize: 'https://discord.com/oauth2/authorize',
    token: 'https://discord.com/api/oauth2/token',
    scope: 'identify email',
    pkce: true,
    profile: async (token, _id, f) => {
      const u = await json(await f('https://discord.com/api/users/@me', { headers: { Authorization: 'Bearer ' + token } }), 'read your Discord profile');
      return {
        provider: 'discord',
        providerId: String(u.id ?? ''),
        name: u.global_name || u.username || 'Discord user',
        email: u.verified ? u.email ?? '' : '',
        avatarUrl: u.avatar ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=128` : '',
      };
    },
  },
  twitch: {
    label: 'Twitch',
    authorize: 'https://id.twitch.tv/oauth2/authorize',
    token: 'https://id.twitch.tv/oauth2/token',
    scope: 'user:read:email',
    pkce: false,
    profile: async (token, clientId, f) => {
      const b = await json(await f('https://api.twitch.tv/helix/users', { headers: { Authorization: 'Bearer ' + token, 'Client-Id': clientId } }), 'read your Twitch profile');
      const u = b.data?.[0] ?? {};
      return { provider: 'twitch', providerId: String(u.id ?? ''), name: u.display_name || u.login || 'Twitch user', email: u.email ?? '', avatarUrl: u.profile_image_url ?? '' };
    },
  },
};

export function credentials(provider: Provider, env: OAuthEnv) {
  const key = provider.toUpperCase() as 'GOOGLE' | 'DISCORD' | 'TWITCH';
  const id = env[`${key}_CLIENT_ID`], secret = env[`${key}_CLIENT_SECRET`];
  return id && secret ? { id, secret } : null;
}

export function enabledProviders(env: OAuthEnv): Provider[] {
  return (Object.keys(PROVIDERS) as Provider[]).filter((p) => credentials(p, env));
}

export function isProvider(value: string): value is Provider {
  return value in PROVIDERS;
}

export async function pkceChallenge(verifier: string) {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  return btoa(String.fromCharCode(...digest)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

export async function authorizeUrl(provider: Provider, env: OAuthEnv, redirectUri: string, state: string, verifier: string) {
  const c = PROVIDERS[provider], creds = credentials(provider, env);
  if (!creds) throw new AppError(404, 'This sign-in option is not set up.');
  const url = new URL(c.authorize);
  url.search = new URLSearchParams({
    client_id: creds.id,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: c.scope,
    state,
    ...(c.pkce ? { code_challenge: await pkceChallenge(verifier), code_challenge_method: 'S256' } : {}),
    ...(c.extra ?? {}),
  }).toString();
  return url.toString();
}

export async function exchangeCode(provider: Provider, env: OAuthEnv, code: string, redirectUri: string, verifier: string, fetcher: typeof fetch = fetch): Promise<Profile> {
  const c = PROVIDERS[provider], creds = credentials(provider, env);
  if (!creds) throw new AppError(404, 'This sign-in option is not set up.');
  const body = new URLSearchParams({
    client_id: creds.id,
    client_secret: creds.secret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
    ...(c.pkce ? { code_verifier: verifier } : {}),
  });
  const tok = await json(await fetcher(c.token, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }, body }), `finish ${c.label} sign-in`);
  if (!tok.access_token) throw new AppError(502, `${c.label} did not return an access token.`);
  const profile = await c.profile(tok.access_token, creds.id, fetcher);
  if (!profile.providerId) throw new AppError(502, `${c.label} did not return an account id.`);
  return profile;
}
