import Link from 'next/link';
import { Plus } from 'lucide-react';
import { workspaceFor } from '@/lib/server/page-data';
import { listChallenges } from '@/lib/server/challenges';
import { PageHeader, WorkspaceStart, ChallengeCard, Empty } from '@/components/arcade/ui';
export const dynamic = 'force-dynamic';
export default async function Page({ searchParams }: {
    searchParams: Promise<Record<string, string | undefined>>;
}) { const { ctx, workspace: w } = await workspaceFor(searchParams); if (!w)
    return <WorkspaceStart />; if (w.role !== 'owner')
    return <Empty title="Your work is in ClipCrew." description="Challenge administration is managed by the workspace owner."/>; const cs = await listChallenges(ctx, w.id); return <><PageHeader eyebrow="CHALLENGEHUB" title="Give your community a mission." description="Create an event, collect the moments, and find your finalists." action={<Link className="button primary" href={'/challenges/new?workspace=' + w.id}><Plus size={17}/>New challenge</Link>}/>{cs.length ? <div className="challenge-grid">{cs.map(c => <ChallengeCard key={c.id} c={c}/>)}</div> : <Empty title="Your first challenge is waiting." description="Start with a funny moment, a stunt, or your own idea."/>}</>; }
