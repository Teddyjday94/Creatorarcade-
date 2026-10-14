import { write } from '@/lib/server/routes';
import { transitionAssignment, reassignAssignment, archiveAssignment, recordPublication } from '@/lib/server/assignments';
type P = {
    params: Promise<{
        id: string;
    }>;
};
export async function PATCH(req: Request, { params }: P) { return write(req, async (ctx, b) => { const id = (await params).id; if (b.action === 'reassign')
    return reassignAssignment(ctx, id, b.editorId, b.version); if (b.action === 'archive')
    return archiveAssignment(ctx, id, b.version); if (b.action === 'publication')
    return recordPublication(ctx, id, b.publicationUrl, b.version); return transitionAssignment(ctx, id, b.action, b, b.version); }); }
