import { context } from '@/lib/server/context';
import { respond, readBody } from '@/lib/server/http';
import { createWorkspace, listWorkspaces } from '@/lib/server/workspaces';
export async function GET() { return respond(async () => listWorkspaces(await context())); }
export async function POST(req: Request) { return respond(async () => createWorkspace(await context(), await readBody(req))); }
