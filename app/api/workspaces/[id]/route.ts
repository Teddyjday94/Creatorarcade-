import { context } from '@/lib/server/context';
import { respond, readBody } from '@/lib/server/http';
import { updateWorkspace } from '@/lib/server/workspaces';
export async function PATCH(req: Request, { params }: {
    params: Promise<{
        id: string;
    }>;
}) { return respond(async () => { const b = await readBody(req); return updateWorkspace(await context(), (await params).id, b, b.version); }); }
