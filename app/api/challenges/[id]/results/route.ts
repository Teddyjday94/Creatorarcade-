import { write } from '@/lib/server/routes';
import { publishResults, reopenResults, setResultRanks, getPublishedResults } from '@/lib/server/results';
import { publicContext } from '@/lib/server/context';
import { respond } from '@/lib/server/http';
type P = {
    params: Promise<{
        id: string;
    }>;
};
export async function GET(req: Request, { params }: P) { return respond(async () => getPublishedResults(await publicContext(), (await params).id)); }
export async function PATCH(req: Request, { params }: P) { return write(req, async (ctx, b) => { const id = (await params).id; return b.action === 'publish' ? publishResults(ctx, id, b.version) : b.action === 'reopen' ? reopenResults(ctx, id, b.version) : setResultRanks(ctx, id, b.ranks, b.version); }); }
