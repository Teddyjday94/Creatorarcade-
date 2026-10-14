import { write } from '@/lib/server/routes';
import { createChallenge } from '@/lib/server/challenges';
import { challengeInput } from '@/lib/server/routes';
type P = {
    params: Promise<{
        id: string;
    }>;
};
export async function POST(req: Request) { return write(req, async (ctx, b) => createChallenge(ctx, b.workspaceId, await challengeInput(ctx, b.workspaceId, b))); }
