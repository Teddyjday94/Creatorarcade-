import { requireChatGPTUser } from '@/app/chatgpt-auth';
import { context } from '@/lib/server/context';
import { listWorkspaces } from '@/lib/server/workspaces';
import { Shell } from '@/components/arcade/shell';
export const dynamic = 'force-dynamic';
export default async function Layout({ children }: {
    children: React.ReactNode;
}) { const user = await requireChatGPTUser('/dashboard'); const all = await listWorkspaces(await context()); return <Shell workspaces={all} user={user.fullName ?? 'Creator'}>{children}</Shell>; }
