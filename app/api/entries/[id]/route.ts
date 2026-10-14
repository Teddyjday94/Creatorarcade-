import { write } from '@/lib/server/routes';
import { reviewEntry, editOwnEntry } from '@/lib/server/entries';
type P = {
    params: Promise<{
        id: string;
    }>;
};
export async function PATCH(req: Request, { params }: P) { return write(req, async (ctx, b) => b.action === 'review' ? reviewEntry(ctx, (await params).id, b, b.version) : editOwnEntry(ctx, (await params).id, b, b.version)); }
