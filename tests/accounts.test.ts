import test from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './helpers/database.ts';
import { upsertAccount, createSession, accountForSession, deleteSession, namesFor } from '../lib/server/accounts.ts';
import { exchangeCode, authorizeUrl, enabledProviders } from '../lib/server/oauth.ts';

const env = { GOOGLE_CLIENT_ID: 'gid', GOOGLE_CLIENT_SECRET: 'gsecret', TWITCH_CLIENT_ID: 'tid', TWITCH_CLIENT_SECRET: 'tsecret' };

test('first sign-in creates an account, later sign-ins reuse it and refresh the profile', async () => {
  const h = harness();
  const a = await upsertAccount(h.db, { provider: 'discord', providerId: '42', name: 'Maya', email: 'm@x.com', avatarUrl: 'https://cdn/a.png' });
  const b = await upsertAccount(h.db, { provider: 'discord', providerId: '42', name: 'Maya R', email: 'm@x.com', avatarUrl: 'http://insecure' });
  assert.equal(a.id, b.id);
  assert.equal(b.name, 'Maya R');
  assert.equal(b.avatarUrl, '');
  const other = await upsertAccount(h.db, { provider: 'twitch', providerId: '42', name: 'Maya', email: '', avatarUrl: '' });
  assert.notEqual(other.id, a.id, 'same id on another provider is a different account');
  assert.deepEqual(await namesFor(h.db, [a.id, 'demo-owner']), { [a.id]: 'Maya R' });
});

test('sessions resolve only with the exact token, expire, and can be revoked', async () => {
  const h = harness();
  const a = await upsertAccount(h.db, { provider: 'google', providerId: 'g1', name: 'Jules', email: '', avatarUrl: '' });
  const now = new Date('2026-10-14T12:00:00Z');
  const s = await createSession(h.db, a.id, now);
  assert.equal((await accountForSession(h.db, s.token, now))?.id, a.id);
  assert.equal(await accountForSession(h.db, s.token.slice(0, -1) + (s.token.endsWith('A') ? 'B' : 'A'), now), null);
  assert.equal(await accountForSession(h.db, 'not-a-token', now), null);
  assert.equal(await accountForSession(h.db, s.token, new Date('2026-12-01T00:00:00Z')), null);
  const stored = await h.db.first<{ id: string }>('SELECT id FROM sessions');
  assert.notEqual(stored?.id, s.token, 'raw token is never stored');
  await deleteSession(h.db, s.token);
  assert.equal(await accountForSession(h.db, s.token, now), null);
});

test('only providers with both id and secret are offered; PKCE is sent where supported', async () => {
  assert.deepEqual(enabledProviders(env), ['google', 'twitch']);
  const g = new URL(await authorizeUrl('google', env, 'https://app/cb', 'st', 'verifier'));
  assert.equal(g.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(g.searchParams.get('state'), 'st');
  const t = new URL(await authorizeUrl('twitch', env, 'https://app/cb', 'st', 'verifier'));
  assert.equal(t.searchParams.get('code_challenge'), null);
  await assert.rejects(authorizeUrl('discord', env, 'https://app/cb', 'st', 'v'), /not set up/);
});

test('code exchange maps provider profiles and ignores unverified emails', async () => {
  const calls: string[] = [];
  const fake = (async (url: string, init?: RequestInit) => {
    calls.push(String(url));
    if (String(url).includes('token')) {
      assert.match(String(init?.body), /code=abc/);
      return Response.json({ access_token: 'tok' });
    }
    if (String(url).includes('googleapis')) return Response.json({ sub: 'g-1', name: 'Rico', email: 'r@x.com', email_verified: false, picture: 'https://p' });
    return Response.json({ data: [{ id: 't-9', display_name: 'RicoClips', email: 'r@x.com', profile_image_url: 'https://t' }] });
  }) as typeof fetch;
  const g = await exchangeCode('google', env, 'abc', 'https://app/cb', 'v', fake);
  assert.deepEqual(g, { provider: 'google', providerId: 'g-1', name: 'Rico', email: '', avatarUrl: 'https://p' });
  const t = await exchangeCode('twitch', env, 'abc', 'https://app/cb', 'v', fake);
  assert.equal(t.name, 'RicoClips');
  assert.equal(t.providerId, 't-9');
  const failing = (async () => new Response('no', { status: 400 })) as unknown as typeof fetch;
  await assert.rejects(exchangeCode('google', env, 'abc', 'https://app/cb', 'v', failing), /try signing in again/);
});
