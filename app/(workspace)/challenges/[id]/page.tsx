import Link from 'next/link';
import { Download, ExternalLink, MonitorPlay, Search, Clock3, Users } from 'lucide-react';
import { context } from '@/lib/server/context';
import { getChallenge } from '@/lib/server/challenges';
import { listEntries } from '@/lib/server/entries';
import { listTeam } from '@/lib/server/invitations';
import { PageHeader, Status, Lifecycle, Avatar, timeLeft, relativeTime } from '@/components/arcade/ui';
import { ActionForm, Area, Field, CopyLink } from '@/components/arcade/forms';
import { ChallengeForm } from '@/features/challenges/form';
import { BulkReview, EntrySelect } from '@/features/challenges/bulk-review';
import { QuickReview } from '@/features/challenges/quick-review';
import { Ranks } from '@/features/challenges/ranks';
import { localInput } from '@/lib/domain/display';
import { formatDeadline } from '@/lib/domain/time';
import { userLabel } from '@/lib/personas';

export const dynamic = 'force-dynamic';

const STATES = ['pending', 'accepted', 'shortlisted', 'rejected'];

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const ctx = await context();
  const { id } = await params;
  const p = await searchParams;
  const c = await getChallenge(ctx, id);
  const queue = await listEntries(ctx, id, { page: Number(p.page), search: p.search, state: p.state });
  const team = await listTeam(ctx, c.workspaceId);
  const editors = team.members.filter((m) => m.role === 'editor' && m.status === 'active');
  const ranks = await ctx.db.all('SELECT r.*,e.displayName FROM results r JOIN entries e ON e.id=r.entryId WHERE r.challengeId=? ORDER BY r.rank', [id]);
  const shortlist = await ctx.db.all("SELECT id,displayName,description FROM entries WHERE challengeId=? AND state='shortlisted' AND brokenLink=0 ORDER BY createdAt LIMIT 100", [id]);
  const counts = Object.fromEntries((await ctx.db.all<{ state: string; n: number }>('SELECT state,COUNT(*) AS n FROM entries WHERE challengeId=? GROUP BY state', [id])).map((r) => [r.state, Number(r.n)]));
  const total = STATES.reduce((sum, s) => sum + (counts[s] ?? 0), 0);
  const taskByEntry = Object.fromEntries((await ctx.db.all<{ entryId: string; id: string; state: string }>('SELECT a.entryId,a.id,a.state FROM assignments a JOIN entries e ON e.id=a.entryId WHERE e.challengeId=? AND a.archivedAt IS NULL', [id])).map((a) => [a.entryId, a]));
  const ws = '?workspace=' + c.workspaceId;
  const tabHref = (state?: string) => '?' + new URLSearchParams({ workspace: c.workspaceId, ...(state ? { state } : {}), ...(p.search ? { search: p.search } : {}) });
  const judging = c.state !== 'results_published';

  const primary =
    c.state === 'draft' ? <ActionForm path={'/api/challenges/' + id} method="PATCH" values={{ action: 'publish', version: c.version }} label="Publish challenge" />
    : c.state === 'published' ? <ActionForm path={'/api/challenges/' + id} method="PATCH" values={{ action: 'close', version: c.version }} label="Close submissions" variant="secondary" confirmText="Close submissions now? Viewers will no longer be able to enter." />
    : null;

  return (
    <>
      <Link className="back-link top" href={'/challenges' + ws}>← All challenges</Link>
      <PageHeader eyebrow={'CHALLENGEHUB / ' + c.game} title={c.title} description={c.workspaceName} action={<Status state={c.state} />} />
      <Lifecycle state={c.state} />

      <div className="challenge-summary">
        <div className="summary-item"><Clock3 size={16} /><div><small>{c.state === 'published' ? 'Closes' : 'Closed'}</small><strong>{formatDeadline(c.deadline, c.timezone)}</strong>{c.state === 'published' && <em>{timeLeft(c.deadline)}</em>}</div></div>
        <div className="summary-item"><Users size={16} /><div><small>Entries</small><strong>{total}</strong>{(counts.pending ?? 0) > 0 && <em>{counts.pending} to review</em>}</div></div>
        <div className="summary-item link-item">
          <ExternalLink size={16} />
          <div>
            <small>Viewer link</small>
            <strong className="mono">/c/{c.slug}</strong>
            <span className="summary-actions">
              <CopyLink value={'/c/' + c.slug} label="Copy" />
              {c.state !== 'draft' && <Link className="text-button" href={'/c/' + c.slug} target="_blank">Open ↗</Link>}
            </span>
          </div>
        </div>
      </div>

      <div className="challenge-actions">
        {primary}
        <ActionForm path={'/api/challenges/' + id + '/duplicate'} values={{ version: c.version }} label="Repeat as new draft" variant="secondary" successRoute={'/challenges/{id}' + ws} />
        <a className="button secondary" href={'/api/challenges/' + id + '/entries/export'}><Download size={15} />Export CSV</a>
      </div>
      {c.state === 'draft' && <p className="notice">This challenge is a draft. Viewers cannot see it until you publish.</p>}
      {c.originalDeadline !== c.deadline && <p className="notice">Deadline updated from {formatDeadline(c.originalDeadline, c.timezone)}.</p>}

      {['draft', 'published'].includes(c.state) && (
        <details className="panel disclosure" open={c.state === 'draft'}>
          <summary>Edit challenge details</summary>
          <ChallengeForm workspaceId={c.workspaceId} timezone={c.timezone} challenge={c} initialLocal={localInput(c.deadline, c.timezone)} />
        </details>
      )}

      {['closed', 'results_published'].includes(c.state) && (
        <section className="panel results-panel" id="results">
          <span className="eyebrow">FINALISTS AND RESULTS</span>
          {c.state === 'closed' ? (
            <>
              <h2>Pick your winners.</h2>
              <Ranks id={id} version={c.version} entries={shortlist} ranks={ranks} />
              <div className="publish-row">
                <ActionForm path={'/api/challenges/' + id + '/results'} method="PATCH" values={{ action: 'publish', version: c.version }} label="Publish results" />
                <small className="muted">Publishing shows the ranked winners on the public results page and OBS overlay.</small>
              </div>
            </>
          ) : (
            <>
              <h2>Results are live.</h2>
              <ol className="podium">
                {ranks.map((r: any) => <li key={r.id}><span>#{r.rank}</span>{r.displayName}</li>)}
              </ol>
              <div className="challenge-actions">
                <Link className="button primary" href={'/c/' + c.slug + '/results'} target="_blank">View results page ↗</Link>
                <Link className="button secondary" href={'/c/' + c.slug + '/overlay'} target="_blank"><MonitorPlay size={15} />Preview overlay</Link>
                <CopyLink value={'/c/' + c.slug + '/overlay'} label="Copy OBS overlay link" />
              </div>
              <p className="muted small-text">Add the overlay link as an OBS browser source. It is public, refreshes every 20 seconds, and has a transparent background.</p>
              <ActionForm path={'/api/challenges/' + id + '/results'} method="PATCH" values={{ action: 'reopen', version: c.version }} label="Reopen results" variant="secondary" />
            </>
          )}
        </section>
      )}

      <section className="section">
        <div className="section-heading"><h2>Submission queue <span className="count">{queue.total}</span></h2><span className="muted small-text">One entry per viewer · Newest first</span></div>
        <nav className="state-tabs" aria-label="Filter by status">
          <Link className={!p.state ? 'active' : ''} href={tabHref()}>All <span>{total}</span></Link>
          {STATES.map((s) => <Link key={s} className={(p.state === s ? 'active ' : '') + s} href={tabHref(s)}>{s[0].toUpperCase() + s.slice(1)} <span>{counts[s] ?? 0}</span></Link>)}
        </nav>
        <form method="GET" className="filter-bar">
          <input type="hidden" name="workspace" value={c.workspaceId} />
          {p.state && <input type="hidden" name="state" value={p.state} />}
          <label className="search-input"><Search size={15} /><input aria-label="Search submissions" placeholder="Search name or description" name="search" defaultValue={p.search ?? ''} /></label>
          <button className="button secondary">Search</button>
        </form>
        <BulkReview challengeId={id} entries={queue.items.map((e) => ({ id: e.id, version: e.version, displayName: e.displayName }))} enabled={judging}>
          {queue.items.length ? (
            queue.items.map((e) => {
              const task = taskByEntry[e.id];
              return (
                <article className={'panel entry-card state-' + e.state} key={e.id}>
                  <EntrySelect entry={{ id: e.id, version: e.version, displayName: e.displayName }} />
                  <div className="entry-header">
                    <Avatar name={e.displayName} />
                    <div>
                      <h3>{e.displayName}</h3>
                      <small>Submitted {relativeTime(e.createdAt)} · Permission confirmed {new Date(e.consentAt).toLocaleDateString('en-US', { timeZone: c.timezone })}</small>
                    </div>
                    {!!e.brokenLink && <span className="badge rejected">Broken link</span>}
                    <Status state={e.state} />
                  </div>
                  <p className="entry-description">{e.description}</p>
                  <div className="entry-actions">
                    <a className="clip-link" href={e.clipUrl} target="_blank" rel="noopener noreferrer">▶ Open submitted clip ↗</a>
                    {task && <Link className="task-link" href={'/clipcrew/' + task.id + ws}>In ClipCrew · <Status state={task.state} /></Link>}
                    {judging && <QuickReview challengeId={id} entry={{ id: e.id, version: e.version, state: e.state }} />}
                  </div>
                  {e.privateNote && <p className="private-note"><strong>Your note:</strong> {e.privateNote}</p>}
                  {judging && (
                    <details>
                      <summary>Notes and explanation</summary>
                      <ActionForm path={'/api/entries/' + e.id} method="PATCH" values={{ action: 'review', version: e.version }} label="Save review">
                        <div className="two-fields">
                          <label className="field"><span>Decision</span><select name="state" defaultValue={e.state}>{STATES.map((s) => <option key={s}>{s}</option>)}</select></label>
                          <label className="checkbox"><input name="brokenLink" type="checkbox" defaultChecked={!!e.brokenLink} />Clip link is broken</label>
                        </div>
                        <Area label="Private judge note" name="privateNote" value={e.privateNote} required={false} />
                        <Area label="Explanation visible to viewer" name="viewerExplanation" value={e.viewerExplanation} required={false} />
                      </ActionForm>
                    </details>
                  )}
                  {['accepted', 'shortlisted'].includes(e.state) && !e.brokenLink && !task && (
                    <details>
                      <summary>Send to ClipCrew</summary>
                      {editors.length ? (
                        <ActionForm path="/api/assignments" values={{ entryId: e.id }} label="Create editing assignment" successRoute={'/clipcrew/{id}' + ws}>
                          <label className="field"><span>Editor</span><select name="editorId">{editors.map((m) => <option value={m.userId} key={m.id}>{userLabel(m.userId)}</option>)}</select></label>
                          <Area label="Editing brief" name="brief" maxLength={2000} />
                          <div className="two-fields">
                            <Field label="Target format" name="format" value="Vertical 9:16" maxLength={80} />
                            <Field label={'Due time · ' + c.timezone} name="dueLocal" type="datetime-local" value={localInput(new Date(Date.now() + 3 * 86400000).toISOString(), c.timezone)} />
                          </div>
                        </ActionForm>
                      ) : (
                        <p className="muted">Invite an editor in <Link href={'/settings' + ws}>Settings</Link> first.</p>
                      )}
                    </details>
                  )}
                </article>
              );
            })
          ) : (
            <div className="panel"><p className="muted">{p.state || p.search ? 'No entries match this filter.' : 'No entries yet. Share the viewer link to collect submissions.'}</p></div>
          )}
        </BulkReview>
        <div className="pagination">
          {queue.page > 1 && <Link className="button secondary" href={'?' + new URLSearchParams({ ...p, workspace: c.workspaceId, page: String(queue.page - 1) } as Record<string, string>)}>Previous</Link>}
          <span>Page {queue.page} of {Math.max(1, Math.ceil(queue.total / queue.pageSize))}</span>
          {queue.page * queue.pageSize < queue.total && <Link className="button secondary" href={'?' + new URLSearchParams({ ...p, workspace: c.workspaceId, page: String(queue.page + 1) } as Record<string, string>)}>Next</Link>}
        </div>
      </section>
    </>
  );
}
