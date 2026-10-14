import test from 'node:test';
import assert from 'node:assert/strict';
import { readBody, respond } from '../lib/server/http.ts';
import { fixture } from './helpers/fixtures.ts';
import { createWorkspace } from '../lib/server/workspaces.ts';
import { transitionChallenge } from '../lib/server/challenges.ts';
const request = (body: string, origin = 'https://arcade.test', headers: Record<string, string> = {}) => new Request('https://arcade.test/api/challenges', { method: 'POST', headers: { origin, 'content-type': 'application/json', ...headers }, body });
test('request boundary rejects cross-origin, malformed and oversized data', async () => { await assert.rejects(readBody(request('{}', 'https://evil.test')), { status: 403 }); await assert.rejects(readBody(request('{')), { status: 422 }); await assert.rejects(readBody(request('[]')), { status: 422 }); await assert.rejects(readBody(request('"' + 'x'.repeat(33000) + '"')), { status: 413 }); assert.deepEqual(await readBody(request('{"title":"hello"}')), { title: 'hello' }); });
test('identity missing and client roles cannot authorize writes; errors serialize safely', async () => { const { h, c } = await fixture(); await assert.rejects(createWorkspace({ ...h.owner, actor: { userId: '' } }, { name: 'Denied', slug: 'denied', brandColor: '#4be2da', timezone: 'America/Chicago' }), { status: 401 }); const b = await readBody(request('{"role":"owner","userId":"owner"}')); assert.equal(b.role, 'owner'); const result = await respond(() => transitionChallenge(h.viewer, c.id, 'close', c.version)); assert.equal(result.status, 404); const json: any = await result.json(); assert.equal(json.error.message, 'Workspace not found.'); assert.ok(!JSON.stringify(json).includes('ownerId')); });
