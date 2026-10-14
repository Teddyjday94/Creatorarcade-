import Link from 'next/link';
import { ArrowUpRight, Clock3, Gamepad2, Trophy, Users } from 'lucide-react';
import { getUser, signInPath, isDemoAuth } from '@/lib/auth';
import { publicContext } from '@/lib/server/context';
import { listPlayable } from '@/features/workspaces/demo';
import { Brand, PersonaSwitcher } from '@/components/arcade/shell';
import { Status, timeLeft, relativeTime } from '@/components/arcade/ui';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Live challenges' };

export default async function Page() {
  const user = await getUser();
  const ctx = await publicContext();
  const { live, mine } = await listPlayable(ctx, isDemoAuth());
  const open = live.filter((c) => c.state === 'published');
  const wrapped = live.filter((c) => c.state === 'results_published');
  return (
    <div className="viewer-wrap play-wrap">
      <header className="marketing-nav">
        <Brand />
        <span className="viewer-nav">
          {user && isDemoAuth() && <PersonaSwitcher current={user.userId} />}
          {user ? <Link className="button secondary small" href="/dashboard">My workspace</Link> : <Link className="button primary small" href={signInPath('/play')}>Sign in</Link>}
        </span>
      </header>
      <div className="viewer-hero">
        <span className="eyebrow">LIVE CHALLENGES</span>
        <h1>{user ? `Hey ${user.displayName.split(' ')[0]}, what are you entering?` : 'Find your next challenge.'}</h1>
        <p>Pick a challenge, send the clip you are proudest of, and see if it makes the stream.</p>
      </div>

      {mine.length > 0 && (
        <section className="section">
          <div className="section-heading"><h2>Your entries</h2></div>
          <div className="panel task-list">
            {mine.map((e: any) => (
              <Link key={e.id} className="task-row" href={'/c/' + e.slug + (e.challengeState === 'results_published' ? '/results' : '')}>
                <span className="clip-thumb">{e.rank ? <Trophy size={19} /> : <Gamepad2 size={19} />}</span>
                <div><strong>{e.title}</strong><small>Entered as {e.displayName} · {relativeTime(e.createdAt)}{e.rank ? ` · Placed #${e.rank}` : ''}</small></div>
                <Status state={e.state} />
                <ArrowUpRight size={17} />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <div className="section-heading"><h2>Open now <span className="count">{open.length}</span></h2></div>
        {open.length ? (
          <div className="play-grid">
            {open.map((c: any) => (
              <Link key={c.slug} className="play-card" href={'/c/' + c.slug}>
                <div className={'game-art art-' + (c.game.length % 3)}>
                  <span className="game-art-grid" />
                  <span className="game-glyph">{c.game.slice(0, 2).toUpperCase()}</span>
                  <span className="game-tag"><Gamepad2 size={13} />{c.game}</span>
                  <span className="live-chip"><i />LIVE</span>
                </div>
                <div className="card-content">
                  <small className="muted">{c.workspaceName}</small>
                  <h3>{c.title}</h3>
                  <p>{c.description}</p>
                  <div className="card-bottom">
                    <span><Clock3 size={13} />{timeLeft(c.deadline)}</span>
                    <span><Users size={13} />{c.entryCount} entries</span>
                    <span className="enter">Enter <ArrowUpRight size={15} /></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state"><h2>No challenges are open right now.</h2><p>Check back soon, creators post new ones every week.</p></div>
        )}
      </section>

      {wrapped.length > 0 && (
        <section className="section">
          <div className="section-heading"><h2>Recently wrapped</h2></div>
          <div className="panel task-list">
            {wrapped.map((c: any) => (
              <Link key={c.slug} className="task-row" href={'/c/' + c.slug + '/results'}>
                <span className="clip-thumb"><Trophy size={19} /></span>
                <div><strong>{c.title}</strong><small>{c.workspaceName} · {c.game}</small></div>
                <span className="text-button">See winners</span>
                <ArrowUpRight size={17} />
              </Link>
            ))}
          </div>
        </section>
      )}
      <footer className="viewer-footer">Powered by CreatorArcade</footer>
    </div>
  );
}
