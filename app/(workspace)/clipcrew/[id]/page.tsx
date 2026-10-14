import Link from 'next/link';
import { Film, Link2, PlaySquare, CheckCircle2 } from 'lucide-react';
import { context } from '@/lib/server/context';
import { getAssignment, listComments } from '@/lib/server/assignments';
import { getWorkspace } from '@/lib/server/workspaces';
import { requireMembership } from '@/lib/server/access';
import { listTeam } from '@/lib/server/invitations';
import { PageHeader, Status, Avatar, stateLabel, relativeTime } from '@/components/arcade/ui';
import { ActionForm, Field, Area } from '@/components/arcade/forms';
import { formatDeadline } from '@/lib/domain/time';
import { labeler } from '@/lib/server/people';

export const dynamic = 'force-dynamic';

const STAGES = ['assigned', 'editing', 'in_review', 'approved'];

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await context();
  const { id } = await params;
  const a = await getAssignment(ctx, id);
  const w = await getWorkspace(ctx, a.workspaceId);
  const m = await requireMembership(ctx, w.id);
  const comments = await listComments(ctx, id);
  const owner = m.role === 'owner';
  const team = owner ? await listTeam(ctx, w.id) : null;
  const userLabel = await labeler(ctx, [a.editorId, w.ownerId, ...comments.map((c) => c.authorId), ...(team?.members.map((x) => x.userId) ?? [])]);
  const isEditor = a.editorId === ctx.actor.userId;
  const overdue = Date.parse(a.dueAt) < Date.now() && a.state !== 'approved';
  const at = STAGES.indexOf(a.state);
  const nameOf = (uid: string) => (uid === ctx.actor.userId ? 'You' : userLabel(uid));
  const roleOf = (uid: string) => (uid === w.ownerId ? 'Owner' : 'Editor');
  const patch = '/api/assignments/' + id;

  return (
    <>
      <Link className="back-link top" href={'/clipcrew?workspace=' + w.id}>← Back to ClipCrew</Link>
      <PageHeader
        eyebrow={'CLIPCREW / ' + a.challengeTitle}
        title={a.displayName + "'s moment"}
        description={`${a.format} · Editor: ${userLabel(a.editorId)} · Due ${formatDeadline(a.dueAt, w.timezone)}${overdue ? ' (overdue)' : ''}`}
        action={<Status state={a.state} />}
      />
      <ol className="lifecycle" aria-label="Editing stage">
        {STAGES.map((s, i) => (
          <li key={s} className={i < at ? 'done' : i === at ? 'current' : ''} aria-current={i === at ? 'step' : undefined}>
            <span className="lifecycle-dot">{i + 1}</span>{stateLabel(s)}
          </li>
        ))}
      </ol>

      <div className="two-columns">
        <section className="panel">
          <span className="eyebrow">THE EDITING BRIEF</span>
          <h2>Make the moment count.</h2>
          <p className="entry-description">{a.brief}</p>
          <div className="asset-list">
            <a className="asset" href={a.clipUrl} target="_blank" rel="noopener noreferrer"><Film size={18} /><span><strong>Source clip</strong><small>From {a.displayName}</small></span>↗</a>
            {a.deliverableUrl && <a className="asset" href={a.deliverableUrl} target="_blank" rel="noopener noreferrer"><PlaySquare size={18} /><span><strong>Submitted edit</strong><small>Latest deliverable</small></span>↗</a>}
            {a.publicationUrl && <a className="asset" href={a.publicationUrl} target="_blank" rel="noopener noreferrer"><Link2 size={18} /><span><strong>Published</strong><small>Where it went live</small></span>↗</a>}
          </div>

          {a.archivedAt ? (
            <p className="notice">This assignment is archived.</p>
          ) : (
            <div className="assignment-controls">
              <span className="eyebrow">NEXT STEP</span>
              {a.state === 'assigned' && (isEditor || owner) && (
                <ActionForm path={patch} method="PATCH" values={{ action: 'start', version: a.version }} label="Start editing" />
              )}
              {a.state === 'editing' && (
                <ActionForm path={patch} method="PATCH" values={{ action: 'submit', version: a.version }} label="Send for review">
                  <Field label="Finished edit link (HTTPS)" name="deliverableUrl" type="url" value={a.deliverableUrl} maxLength={2048} help="Link to the cut on YouTube, Drive, Frame.io, or anywhere your team shares files." />
                </ActionForm>
              )}
              {a.state === 'in_review' &&
                (owner ? (
                  <div className="review-decision">
                    <ActionForm path={patch} method="PATCH" values={{ action: 'approve', version: a.version }} label="Approve edit" />
                    <details>
                      <summary>Request changes instead</summary>
                      <ActionForm path={patch} method="PATCH" values={{ action: 'request_changes', version: a.version }} label="Send back with feedback" variant="secondary">
                        <Area label="Feedback for editor" name="feedback" />
                      </ActionForm>
                    </details>
                  </div>
                ) : (
                  <p className="notice">Your edit is waiting for owner review. Feedback will show up in the thread.</p>
                ))}
              {a.state === 'approved' && (
                <>
                  <p className="success big"><CheckCircle2 size={18} />Approved and ready to post.</p>
                  {owner && (
                    <ActionForm path={patch} method="PATCH" values={{ action: 'publication', version: a.version }} label="Save publication link" variant="secondary">
                      <Field label="Where you posted it" name="publicationUrl" type="url" value={a.publicationUrl} maxLength={2048} />
                    </ActionForm>
                  )}
                </>
              )}
              {owner && (
                <details>
                  <summary>Manage assignment</summary>
                  <ActionForm path={patch} method="PATCH" values={{ action: 'reassign', version: a.version }} label="Reassign and restart" variant="secondary">
                    <label className="field">
                      <span>Editor</span>
                      <select name="editorId" defaultValue={a.editorId}>
                        {team?.members.filter((x) => x.role === 'editor' && x.status === 'active').map((x) => <option value={x.userId} key={x.id}>{userLabel(x.userId)}</option>)}
                      </select>
                    </label>
                    <p className="muted small-text">Reassignment clears approval and deliverable links.</p>
                  </ActionForm>
                  <ActionForm path={patch} method="PATCH" values={{ action: 'archive', version: a.version }} label="Archive assignment" variant="danger" confirmText="Archive this assignment? It will leave the board." />
                </details>
              )}
            </div>
          )}
        </section>

        <section className="panel">
          <span className="eyebrow">FEEDBACK & DISCUSSION</span>
          <h2>Keep everyone on the same page.</h2>
          <div className="comments">
            {comments.length ? (
              comments.map((c) => (
                <div className={'comment ' + (c.authorId === ctx.actor.userId ? 'mine' : '')} key={c.id}>
                  <div>
                    <Avatar name={userLabel(c.authorId)} size="sm" />
                    <strong>{nameOf(c.authorId)}</strong>
                    <span className="tiny-tag">{roleOf(c.authorId)}</span>
                    <small title={formatDeadline(c.createdAt, w.timezone)}>{relativeTime(c.createdAt)}</small>
                  </div>
                  <p>{c.text}</p>
                </div>
              ))
            ) : (
              <p className="muted">Comments and requested changes appear here.</p>
            )}
          </div>
          {!a.archivedAt && (
            <ActionForm path={'/api/assignments/' + id + '/comments'} label="Post comment">
              <Area label="Comment" name="text" />
            </ActionForm>
          )}
        </section>
      </div>
    </>
  );
}
