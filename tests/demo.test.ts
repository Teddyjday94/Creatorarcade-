import test from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './helpers/database.ts';
import { createDemoWorkspace, resetDemoWorkspace, getDashboard, listActivity, listPlayable, DEMO_EDITOR_ID } from '../features/workspaces/demo.ts';
import { createWorkspace } from '../lib/server/workspaces.ts';
import { listChallenges } from '../lib/server/challenges.ts';

test('demo is isolated and idempotent while real workspace remains empty', async () => {
  const h = harness();
  const w = await createDemoWorkspace(h.owner);
  assert.equal(w.isDemo, 1);
  assert.equal((await createDemoWorkspace(h.owner)).id, w.id);
  const counts = await getDashboard(h.owner, w.id);
  assert.equal(counts.submissionCount, 17);
  assert.equal(counts.shortlistedCount, 8);
  assert.equal(counts.awaitingReviewCount, 1);
  assert.equal(counts.pendingCount, 3);
  assert.equal(counts.activeChallenges, 1);
  const real = await createWorkspace(h.owner, { name: 'Real', slug: 'real', brandColor: '#4be2da', timezone: 'America/Chicago' });
  assert.equal((await getDashboard(h.owner, real.id)).submissionCount, 0);
  const editor = await getDashboard(h.actor(DEMO_EDITOR_ID), w.id);
  assert.equal(editor.submissionCount, null);
  assert.equal(editor.activeChallenges, null);
  assert.equal(editor.assignedTasks, 4);
  assert.equal(editor.overdueTasks, 1);
});

test('demo covers every challenge stage and editors cannot read owner activity', async () => {
  const h = harness();
  const w = await createDemoWorkspace(h.owner);
  const states = (await listChallenges(h.owner, w.id)).map((c) => c.state).sort();
  assert.deepEqual(states, ['closed', 'draft', 'published', 'results_published']);
  assert.ok((await listActivity(h.owner, w.id)).length > 0);
  await assert.rejects(listActivity(h.actor(DEMO_EDITOR_ID), w.id), /not found/i);
});

test('reset replaces only the caller demo workspace', async () => {
  const h = harness();
  const w = await createDemoWorkspace(h.owner);
  const real = await createWorkspace(h.owner, { name: 'Real', slug: 'real', brandColor: '#4be2da', timezone: 'America/Chicago' });
  const other = await createDemoWorkspace(h.viewer);
  const fresh = await resetDemoWorkspace(h.owner);
  assert.notEqual(fresh.id, w.id);
  assert.equal(await h.db.first('SELECT id FROM workspaces WHERE id=?', [w.id]), null);
  assert.ok(await h.db.first('SELECT id FROM workspaces WHERE id=?', [real.id]));
  assert.ok(await h.db.first('SELECT id FROM workspaces WHERE id=?', [other.id]));
  assert.equal((await getDashboard(h.owner, fresh.id)).submissionCount, 17);
});

test('play hub lists live and wrapped challenges but never drafts', async () => {
  const h = harness();
  await createDemoWorkspace(h.owner);
  const { live, mine } = await listPlayable(h.viewer);
  assert.deepEqual(live.map((c) => c.state).sort(), ['published', 'results_published']);
  assert.equal(mine.length, 0);
  const anon = await listPlayable({ ...h.viewer, actor: { userId: '' } });
  assert.equal(anon.mine.length, 0);
});
