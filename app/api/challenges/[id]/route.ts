import { write } from '@/lib/server/routes';
import { getChallenge, updateChallenge, transitionChallenge } from '@/lib/server/challenges';
import { challengeInput } from '@/lib/server/routes';
type P = {
    params: Promise<{
        id: string;
    }>;
};
export async function PATCH(req: Request, { params }: P) { return write(req, async (ctx, b) => { const id = (await params).id; if (b.action)
    return transitionChallenge(ctx, id, b.action, b.version); const c = await getChallenge(ctx, id); return updateChallenge(ctx, id, await challengeInput(ctx, c.workspaceId, b), b.version); }); }
