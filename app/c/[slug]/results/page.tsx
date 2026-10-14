import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { context } from '@/lib/server/context';
import { getViewerChallenge } from '@/lib/server/challenges';
import { getPublishedResults } from '@/lib/server/results';
import { Brand } from '@/components/arcade/shell';
export const dynamic = 'force-dynamic';
export default async function Page({ params }: {
    params: Promise<{
        slug: string;
    }>;
}) { const { slug } = await params, ctx = await context(), c = await getViewerChallenge(ctx, slug), r = await getPublishedResults(ctx, c.id); return <div className="viewer-wrap"><header className="marketing-nav"><Brand /><Link href={'/c/' + slug}>Back to challenge</Link></header><div className="results-heading"><span className="giant-icon"><Trophy size={60}/></span><span className="eyebrow">THE MOMENTS THAT MADE IT</span><h1>{c.title}</h1><p>{c.workspaceName} · Challenge results</p></div>{r.length ? <div className="winner-grid">{r.map(x => <article className="winner-card" key={x.rank}><span className="winner-rank">#{x.rank}</span><h2>{x.displayName}</h2><p>{x.description}</p><a className="button secondary" href={x.clipUrl} target="_blank" rel="noopener noreferrer">Watch the moment ↗</a></article>)}</div> : <div className="empty-state"><h2>The results are still in the making.</h2><p>Check back when the creator publishes the winners.</p></div>}</div>; }
