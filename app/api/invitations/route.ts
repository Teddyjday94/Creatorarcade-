import { write } from '@/lib/server/routes';
import { createInvitation } from '@/lib/server/invitations';
type P = {
    params: Promise<{
        id: string;
    }>;
};
export async function POST(req: Request) { return write(req, (ctx, b) => createInvitation(ctx, b.workspaceId)); }
