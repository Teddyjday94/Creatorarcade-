import { context } from './context';
import { listWorkspaces } from './workspaces';
export async function workspaceFor(searchParams: Promise<Record<string, string | undefined>>) { const ctx = await context(), p = await searchParams, all = await listWorkspaces(ctx), workspace = all.find(w => w.id === p.workspace) ?? all[0] ?? null; return { ctx, p, workspace }; }
