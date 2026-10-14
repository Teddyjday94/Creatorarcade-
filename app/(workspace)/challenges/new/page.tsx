import { workspaceFor } from '@/lib/server/page-data';
import { requireOwner } from '@/lib/server/access';
import { PageHeader, WorkspaceStart } from '@/components/arcade/ui';
import { ChallengeForm } from '@/features/challenges/form';
import { localInput } from '@/lib/domain/display';
export const dynamic = 'force-dynamic';
export default async function Page({ searchParams }: {
    searchParams: Promise<Record<string, string | undefined>>;
}) { const { ctx, workspace: w } = await workspaceFor(searchParams); if (!w)
    return <WorkspaceStart />; await requireOwner(ctx, w.id); return <><PageHeader eyebrow="CHALLENGEHUB / NEW CHALLENGE" title="Set the challenge." description="Start with a template. Make the rules and deadline your own."/><section className="panel narrow"><ChallengeForm workspaceId={w.id} timezone={w.timezone} initialLocal={localInput(new Date(Date.now() + 7 * 86400000).toISOString(), w.timezone)}/></section></>; }
