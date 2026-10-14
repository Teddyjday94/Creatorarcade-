import { write } from '@/lib/server/routes';
import { revokeEditor } from '@/lib/server/invitations';
type P = {
    params: Promise<{
        id: string;
    }>;
};
export async function DELETE(req: Request, { params }: P) { return write(req, async (ctx, b) => revokeEditor(ctx, (await params).id, b.userId)); }
