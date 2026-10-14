import Link from 'next/link';
import { Clock3, Trophy, Users, ShieldCheck } from 'lucide-react';
import { getUser, signInPath } from '@/lib/auth';
import { publicContext } from '@/lib/server/context';
import { getViewerChallenge } from '@/lib/server/challenges';
import { getOwnEntry } from '@/lib/server/entries';
import { Brand } from '@/components/arcade/shell';
import { Status, timeLeft } from '@/components/arcade/ui';
import { ActionForm, Field, Area } from '@/components/arcade/forms';
import { formatDeadline } from '@/lib/domain/time';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getUser();
  const ctx = await publicContext();
  const c = await getViewerChallenge(ctx, slug);
  const own = user ? await getOwnEntry(ctx, c.id) : null;
  const entryCount = Number((await ctx.db.first('SELECT COUNT(*) AS n FROM entries WHERE challengeId=?', [c.id]))?.n ?? 0);
  const editable = c.accepting && (!own || own.state === 'pending');
  return (
    <div className="viewer-wrap branded" style={{ ['--brand' as string]: c.brandColor }}>
      <header className="marketing-nav">
        <Brand />
        <span className="viewer-nav">
          <Link href="/play">More challenges</Link>
          {user ? <Link className="button secondary small" href="/dashboard">{user.displayName}</Link> : <Link className="button secondary small" href={signInPath('/c/' + slug)}>Sign in</Link>}
        </span>
      </header>
      {c.isDemo === 1 && <div className="demo-banner">Illustrative demo challenge. Sample clips are media references, not real viewer entries.</div>}
      <div className="viewer-hero">
        <span className="eyebrow">{c.workspaceName} / {c.game}</span>
        <h1>{c.title}</h1>
        <p>{c.description}</p>
        <div className="viewer-stats">
          <Status state={c.accepting ? 'published' : c.state === 'results_published' ? 'results_published' : 'closed'} />
          <span><Clock3 size={15} />{c.accepting ? 'Closes ' + formatDeadline(c.deadline, c.timezone) + ' · ' + timeLeft(c.deadline) : 'Closed ' + formatDeadline(c.deadline, c.timezone)}</span>
          <span><Users size={15} />{entryCount} {entryCount === 1 ? 'entry' : 'entries'} so far</span>
        </div>
      </div>
      {c.state === 'results_published' && (
        <Link className="results-callout" href={'/c/' + slug + '/results'}>
          <Trophy size={22} /><span><strong>The winners are in.</strong><small>See which moments made the cut.</small></span><span className="button primary small">See the winners ↗</span>
        </Link>
      )}
      <div className="two-columns">
        <section className="panel">
          <h2>Your mission</h2>
          <h3>Rules</h3>
          <p className="pre-wrap">{c.rules}</p>
          <h3>How entries are judged</h3>
          <p className="pre-wrap">{c.criteria}</p>
          {c.originalDeadline !== c.deadline && <p className="notice">Deadline extended from {formatDeadline(c.originalDeadline, c.timezone)}.</p>}
          <p className="consent-note"><ShieldCheck size={16} />Your clip stays on Twitch, YouTube, or Medal. We only store the link and the permission you give.</p>
        </section>
        <section className="panel submit-panel">
          <h2>{own ? 'Your entry' : c.accepting ? 'Submit your moment.' : 'Submissions are closed.'}</h2>
          {own && (
            <div className="own-entry-status">
              <Status state={own.state} />
              <span className="muted small-text">{own.state === 'pending' ? 'Waiting for the creator to review.' : own.state === 'rejected' ? 'Not selected this time.' : own.state === 'shortlisted' ? 'You made the shortlist!' : 'Accepted by the creator.'}</span>
            </div>
          )}
          {own?.viewerExplanation && <p className="notice">{own.viewerExplanation}</p>}
          {!user && c.accepting ? (
            <div className="signin-prompt">
              <p>Sign in to submit a clip. One entry per person, and you can edit it until the creator reviews it.</p>
              <Link className="button primary" href={signInPath('/c/' + slug)}>Sign in to enter</Link>
            </div>
          ) : editable ? (
            <ActionForm path={own ? '/api/entries/' + own.id : '/api/challenges/' + c.id + '/entries'} method={own ? 'PATCH' : 'POST'} values={{ version: own?.version }} label={own ? 'Update entry' : 'Submit entry'} successMessage="Your entry is saved.">
              <Field label="Display name" name="displayName" value={own?.displayName ?? user?.displayName ?? ''} maxLength={60} help="Shown on the results page if you win." />
              <Field label="Twitch, YouTube, or Medal clip link" name="clipUrl" type="url" value={own?.clipUrl ?? ''} maxLength={2048} help="For example https://youtu.be/… or https://medal.tv/clips/…" />
              <Area label="Tell us about the moment" name="description" value={own?.description ?? ''} maxLength={2000} />
              <label className="checkbox"><input name="consent" type="checkbox" required defaultChecked={!!own} />I own this clip or have permission to share it, and allow this creator to feature it.</label>
            </ActionForm>
          ) : own ? (
            <>
              <p className="pre-wrap">{own.description}</p>
              <a className="clip-link" href={own.clipUrl} target="_blank" rel="noopener noreferrer">Open your clip ↗</a>
              <p className="muted small-text">Reviewed entries and closed challenges cannot be edited.</p>
            </>
          ) : (
            <p className="muted">{c.state === 'results_published' ? 'This one is wrapped. Check out the winners above.' : 'Judging is underway. Check back for the results.'}</p>
          )}
        </section>
      </div>
      <footer className="viewer-footer">Powered by CreatorArcade · Your community&apos;s creative playground</footer>
    </div>
  );
}
