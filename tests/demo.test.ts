import test from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './helpers/database.ts';
import { createDemoWorkspace, getDashboard } from '../features/workspaces/demo.ts';
import { createWorkspace } from '../lib/server/workspaces.ts';
test('demo is isolated and idempotent while real workspace remains empty', async () => { const h = harness(); const w = await createDemoWorkspace(h.owner); assert.equal(w.isDemo, 1); assert.equal((await createDemoWorkspace(h.owner)).id, w.id); const counts = await getDashboard(h.owner, w.id); assert.equal(counts.submissionCount, 4); assert.equal(counts.shortlistedCount, 2); assert.equal(counts.awaitingReviewCount, 1); const real = await createWorkspace(h.owner, { name: 'Real', slug: 'real', brandColor: '#4be2da', timezone: 'America/Chicago' }); assert.equal((await getDashboard(h.owner, real.id)).submissionCount, 0); const sample = await getDashboard(h.actor('sample-editor'), w.id); assert.equal(sample.submissionCount, null); assert.equal(sample.activeChallenges, null); assert.equal(sample.assignedTasks, 2); });
