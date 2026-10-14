import { write } from '@/lib/server/routes';
import { createDemoWorkspace } from '@/features/workspaces/demo';
type P = {
    params: Promise<{
        id: string;
    }>;
};
export async function POST(req: Request) { return write(req, async (ctx) => createDemoWorkspace(ctx)); }
