import { context } from './context';
import { readBody, respond } from './http';
import { resolveDeadline } from '../domain/time';
import { getWorkspace } from './workspaces';
import type { Context } from '../domain/types';
export function write(req: Request, run: (ctx: Context, b: any) => Promise<unknown>) { return respond(async () => { const b = await readBody(req), ctx = await context(); return run(ctx, b); }); }
export async function challengeInput(ctx: Context, w: string, b: any) { const workspace = await getWorkspace(ctx, w); return { ...b, deadline: b.deadlineLocal ? resolveDeadline(b.deadlineLocal, workspace.timezone, b.offsetMinutes === '' || b.offsetMinutes === undefined ? undefined : Number(b.offsetMinutes)) : b.deadline }; }
