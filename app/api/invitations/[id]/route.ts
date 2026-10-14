import { write } from '@/lib/server/routes';
import { revokeInvitation } from '@/lib/server/invitations';
type P = {
    params: Promise<{
        id: string;
    }>;
};
export async function DELETE(req: Request, { params }: P) { return write(req, async (ctx) => revokeInvitation(ctx, (await params).id)); }
