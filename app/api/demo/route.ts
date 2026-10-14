import { write } from '@/lib/server/routes';
import { createDemoWorkspace, resetDemoWorkspace } from '@/features/workspaces/demo';

export async function POST(req: Request) {
  return write(req, async (ctx) => createDemoWorkspace(ctx));
}

/** Wipes the caller's demo workspace and reseeds it. Real workspaces are never touched. */
export async function PUT(req: Request) {
  return write(req, async (ctx) => resetDemoWorkspace(ctx));
}
