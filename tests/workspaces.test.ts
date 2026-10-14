import test from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './helpers/database.ts';
import { createWorkspace, getWorkspace, updateWorkspace } from '../lib/server/workspaces.ts';
test('real workspace starts empty and creator becomes owner', async () => {
    const h = harness();
    const w = await createWorkspace(h.owner, { name: 'Teddsters Den', slug: 'teddsters', brandColor: '#4be2da', timezone: 'America/Chicago' });
    assert.equal(w.name, 'Teddsters Den');
    assert.equal((await h.db.first('SELECT role FROM memberships WHERE workspaceId = ?', [w.id]))?.role, 'owner');
    assert.equal((await h.db.first('SELECT COUNT(*) AS count FROM challenges'))?.count, 0);
    assert.equal((await getWorkspace(h.owner, w.id)).id, w.id);
});
test('foreign workspace is inaccessible', async () => {
    const h = harness();
    const w = await createWorkspace(h.owner, { name: 'Home', slug: 'home', brandColor: '#4be2da', timezone: 'America/Chicago' });
    await assert.rejects(getWorkspace(h.viewer, w.id), { status: 404 });
});
test('settings reject stale versions and invalid timezones', async () => {
    const h = harness();
    const input = { name: 'Home', slug: 'home', brandColor: '#4be2da', timezone: 'America/Chicago' };
    const w = await createWorkspace(h.owner, input);
    const updated = await updateWorkspace(h.owner, w.id, { ...input, name: 'Changed' }, 0);
    assert.equal(updated.version, 1);
    await assert.rejects(updateWorkspace(h.owner, w.id, input, 0), { status: 409 });
    await assert.rejects(updateWorkspace(h.owner, w.id, { ...input, timezone: 'Mars/Foo' }, 1), { status: 422 });
});
