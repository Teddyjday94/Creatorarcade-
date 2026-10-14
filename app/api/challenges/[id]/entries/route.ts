import { write } from '@/lib/server/routes';
import { submitEntry } from '@/lib/server/entries';
type P = {
    params: Promise<{
        id: string;
    }>;
};
export async function POST(req: Request, { params }: P) { return write(req, async (ctx, b) => submitEntry(ctx, (await params).id, b)); }
