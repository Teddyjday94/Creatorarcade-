import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveDeadline } from '../lib/domain/time.ts';
test('Chicago daylight-saving gaps and folds require valid explicit times', () => { assert.throws(() => resolveDeadline('2026-03-08T02:30', 'America/Chicago'), { status: 422 }); assert.throws(() => resolveDeadline('2026-11-01T01:30', 'America/Chicago'), { status: 422 }); assert.equal(resolveDeadline('2026-11-01T01:30', 'America/Chicago', -300), '2026-11-01T06:30:00.000Z'); assert.equal(resolveDeadline('2026-11-01T01:30', 'America/Chicago', -360), '2026-11-01T07:30:00.000Z'); assert.equal(resolveDeadline('2026-10-15T18:00', 'America/Chicago'), '2026-10-15T23:00:00.000Z'); });
