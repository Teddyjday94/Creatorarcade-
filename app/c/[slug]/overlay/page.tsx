import { publicContext } from '@/lib/server/context';
import { getViewerChallenge } from '@/lib/server/challenges';
import { getPublishedResults } from '@/lib/server/results';
import { Overlay } from '@/features/challenges/overlay';

export const dynamic = 'force-dynamic';

// Public on purpose: OBS browser sources cannot sign in. Shows only published display data.
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const ctx = await publicContext();
  const c = await getViewerChallenge(ctx, (await params).slug);
  return <Overlay id={c.id} initial={await getPublishedResults(ctx, c.id)} />;
}
