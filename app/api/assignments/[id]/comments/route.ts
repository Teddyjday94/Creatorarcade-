import { write } from '@/lib/server/routes';
import { addComment } from '@/lib/server/assignments';
type P = {
    params: Promise<{
        id: string;
    }>;
};
export async function POST(req: Request, { params }: P) { return write(req, async (ctx, b) => addComment(ctx, (await params).id, b.text)); }
