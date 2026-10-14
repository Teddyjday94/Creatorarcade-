import type { Context, Membership, Statement } from '../domain/types.ts';
import { check, AppError } from '../domain/validation.ts';
export async function requireMembership(ctx: Context, id: string) { check(ctx.actor?.userId, 'Sign in to continue.', 401); const m = await ctx.db.first<Membership>('SELECT * FROM memberships WHERE workspaceId=? AND userId=? AND status=?', [id, ctx.actor.userId, 'active']); if (!m)
    throw new AppError(404, 'Workspace not found.'); return m; }
export async function requireOwner(ctx: Context, id: string) { const m = await requireMembership(ctx, id); check(m.role === 'owner', 'Workspace not found.', 404); return m; }
export function ownerCondition(ctx: Context, id: string): Statement { return { sql: "EXISTS (SELECT 1 FROM memberships WHERE workspaceId=? AND userId=? AND role='owner' AND status='active')", args: [id, ctx.actor.userId] }; }
export function guard(condition: string, args: any[] = []): Statement { return { sql: 'INSERT INTO mutationChecks(id,allowed) SELECT ?, CASE WHEN (' + condition + ') THEN 1 ELSE 0 END', args: [crypto.randomUUID(), ...args] }; }
export function audit(ctx: Context, w: string, action: string, target: string, metadata = ''): Statement { return { sql: 'INSERT INTO auditEvents(id,workspaceId,actorId,action,targetId,metadata,createdAt) VALUES(?,?,?,?,?,?,?)', args: [crypto.randomUUID(), w, ctx.actor.userId, action, target, metadata, ctx.now().toISOString()] }; }
export async function atomic(ctx: Context, items: Statement[]) { try {
    return await ctx.db.batch([...items, { sql: 'DELETE FROM mutationChecks' }]);
}
catch (e) {
    if (e instanceof AppError)
        throw e;
    const msg = String(e);
    if (/constraint|unique|check|foreign key/i.test(msg))
        throw new AppError(409, 'This changed or already exists. Reload and try again.', 'conflict');
    throw e;
} }
