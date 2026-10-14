import { write } from '@/lib/server/routes';
import { getWorkspace } from '@/lib/server/workspaces';
import { resolveDeadline } from '@/lib/domain/time';
import { createAssignment } from '@/lib/server/assignments';
type P = {
    params: Promise<{
        id: string;
    }>;
};
export async function POST(req: Request) { return write(req, async (ctx, b) => { if (b.dueLocal) {
    const e = await ctx.db.first('SELECT c.workspaceId FROM entries e JOIN challenges c ON c.id=e.challengeId WHERE e.id=?', [b.entryId]);
    if (e) {
        const w = await getWorkspace(ctx, e.workspaceId);
        b.dueAt = resolveDeadline(b.dueLocal, w.timezone);
    }
} return createAssignment(ctx, b.entryId, b); }); }
