import Link from 'next/link';
import { Plus, ArrowUpRight, Trophy, Clapperboard, CheckCircle2, Users, Inbox, Eye, Clock3, Activity, Sparkles } from 'lucide-react';
import { workspaceFor } from '@/lib/server/page-data';
import { getDashboard, listActivity } from '@/features/workspaces/demo';
import { listChallenges } from '@/lib/server/challenges';
import { listAssignments } from '@/lib/server/assignments';
import { PageHeader, WorkspaceStart, ChallengeCard, Empty, Status, Avatar, relativeTime } from '@/components/arcade/ui';
import { userLabel } from '@/lib/personas';
import { formatDeadline } from '@/lib/domain/time';

export const dynamic = 'force-dynamic';

const ACTIVITY: Record<string, (who: string, meta: string) => string> = {
  'entry.submitted': (who, m) => `${m || who} submitted a clip`,
  'entry.reviewed': (who) => `${who} reviewed an entry`,
  'entry.bulk_reviewed': (who) => `${who} reviewed a batch of entries`,
  'entry.updated': (who) => `${who} updated an entry`,
  'assignment.created': (who, m) => `${who} sent ${m ? m + "'s clip" : 'a clip'} to ClipCrew`,
  'assignment.start': (who) => `${who} started editing`,
  'assignment.submit': (who, m) => `${who} sent ${m ? m + "'s edit" : 'an edit'} for review`,
  'assignment.approve': (who, m) => `${who} approved ${m ? m + "'s edit" : 'an edit'}`,
  'assignment.request_changes': (who) => `${who} requested changes`,
  'assignment.comment': (who) => `${who} left feedback`,
  'assignment.publication_recorded': (who) => `${who} recorded where an edit was posted`,
  'assignment.reassigned': (who) => `${who} reassigned a task`,
  'assignment.archived': (who) => `${who} archived a task`,
  'challenge.created': (who) => `${who} drafted a challenge`,
  'challenge.duplicated': (who) => `${who} repeated a challenge`,
  'challenge.publish': (who) => `${who} published a challenge`,
  'challenge.close': (who, m) => `${who} closed ${m || 'a challenge'} for judging`,
  'results.ranked': (who) => `${who} ranked the finalists`,
  'results.published': (who, m) => `${who} published results for ${m || 'a challenge'}`,
  'invitation.created': (who) => `${who} created an editor invite`,
  'invitation.redeemed': (who) => `${who} joined the editing team`,
  'demo.created': () => 'Demo arcade created',
};

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { ctx, workspace: w } = await workspaceFor(searchParams);
  if (!w) return <WorkspaceStart />;
  const owner = w.role === 'owner';
  const d = await getDashboard(ctx, w.id);
  const challenges = owner ? await listChallenges(ctx, w.id) : [];
  const tasks = await listAssignments(ctx, w.id);
  const activity = owner ? await listActivity(ctx, w.id) : [];
  const now = Date.now();
  const q = '?workspace=' + w.id;

  if (!owner) {
    const open = tasks.filter((t) => t.state !== 'approved');
    return (
      <>
        <PageHeader eyebrow="CLIPCREW · EDITOR" title="Your editing queue." description={`Clips assigned to you in ${w.name}. Earliest due first.`} action={<Link className="button primary" href={'/clipcrew' + q}><Clapperboard size={17} />Open board</Link>} />
        <div className="metrics three">
          <Metric icon={Clapperboard} label="Assigned to you" value={d.assignedTasks} />
          <Metric icon={Sparkles} label="To start or in progress" value={d.inProgressTasks} />
          <Metric icon={Clock3} label="Overdue" value={d.overdueTasks} tone={d.overdueTasks ? 'warn' : undefined} />
        </div>
        <section className="section">
          <div className="section-heading"><h2>Up next</h2></div>
          <TaskList tasks={open} w={w} now={now} empty="Nothing waiting on you. Nice." />
        </section>
      </>
    );
  }

  const live = challenges.find((c) => c.state === 'published');
  const closed = challenges.find((c) => c.state === 'closed');
  const inReview = tasks.filter((t) => t.state === 'in_review');
  const attention: Array<{ icon: any; title: string; detail: string; href: string; cta: string }> = [];
  for (const c of challenges.filter((c) => c.pendingCount > 0).slice(0, 2))
    attention.push({ icon: Inbox, title: `${c.pendingCount} new ${c.pendingCount === 1 ? 'entry' : 'entries'} to review`, detail: c.title, href: `/challenges/${c.id}${q}&state=pending`, cta: 'Review' });
  for (const t of inReview.slice(0, 2))
    attention.push({ icon: Eye, title: `${t.displayName}'s edit is ready for review`, detail: `${t.challengeTitle} · ${t.format}`, href: `/clipcrew/${t.id}${q}`, cta: 'Review edit' });
  if (closed) attention.push({ icon: Trophy, title: 'Pick your winners', detail: `${closed.title} is closed. Rank the finalists and publish.`, href: `/challenges/${closed.id}${q}#results`, cta: 'Rank' });

  return (
    <>
      <PageHeader
        eyebrow="YOUR NEXT GREAT MOMENT STARTS HERE"
        title="Welcome to the arcade."
        description="Bring your community together. Keep the creative work moving."
        action={<Link className="button primary" href={'/challenges/new' + q}><Plus size={17} />New challenge</Link>}
      />
      <div className="metrics">
        <Metric icon={Trophy} label="Live challenges" value={d.activeChallenges} href={'/challenges' + q} />
        <Metric icon={Users} label="Submissions" value={d.submissionCount} sub={d.pendingCount ? `${d.pendingCount} waiting for review` : 'All reviewed'} href={live ? `/challenges/${live.id}${q}` : undefined} />
        <Metric icon={CheckCircle2} label="Shortlisted" value={d.shortlistedCount} />
        <Metric icon={Clapperboard} label="Edits in review" value={d.awaitingReviewCount} tone={d.awaitingReviewCount ? 'accent' : undefined} href={'/clipcrew' + q + '&state=in_review'} />
      </div>

      <div className="dash-grid">
        <section className="panel attention">
          <div className="section-heading"><h2>Needs your attention</h2><span className="count">{attention.length}</span></div>
          {attention.length ? (
            <ul className="attention-list">
              {attention.map((a) => (
                <li key={a.href}>
                  <span className="clip-thumb"><a.icon size={19} /></span>
                  <div><strong>{a.title}</strong><small>{a.detail}</small></div>
                  <Link className="button secondary small" href={a.href}>{a.cta}<ArrowUpRight size={14} /></Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">You are all caught up. Time to set the next challenge.</p>
          )}
        </section>
        <section className="panel activity">
          <div className="section-heading"><h2><Activity size={17} /> Recent activity</h2></div>
          {activity.length ? (
            <ul className="activity-list">
              {activity.map((a) => {
                const who = a.actorId === ctx.actor.userId ? 'You' : userLabel(a.actorId);
                const text = (ACTIVITY[a.action] ?? ((x: string) => `${x}: ${a.action}`))(who, a.metadata);
                return (
                  <li key={a.id}>
                    <i className={'activity-dot ' + a.action.split('.')[0]} />
                    <span>{text}</span>
                    <small>{relativeTime(a.createdAt, now)}</small>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="muted">Activity from your team shows up here.</p>
          )}
        </section>
      </div>

      <section className="section">
        <div className="section-heading"><h2>Your challenges</h2><Link href={'/challenges' + q}>View all <ArrowUpRight size={15} /></Link></div>
        {challenges.length ? (
          <div className="challenge-grid">{challenges.slice(0, 3).map((c) => <ChallengeCard key={c.id} c={c} />)}</div>
        ) : (
          <Empty title="Set the first challenge." description="Give your community a reason to create something worth sharing.">
            <Link className="button primary" href={'/challenges/new' + q}>Create challenge</Link>
          </Empty>
        )}
      </section>
      <section className="section">
        <div className="section-heading"><h2>In the editing room</h2><Link href={'/clipcrew' + q}>Open ClipCrew <ArrowUpRight size={15} /></Link></div>
        <TaskList tasks={tasks.slice(0, 5)} w={w} now={now} empty="Accepted entries can become editing assignments here." showEditor />
      </section>
    </>
  );
}

function Metric({ icon: Icon, label, value, sub, href, tone }: { icon: any; label: string; value: number | null; sub?: string; href?: string; tone?: 'warn' | 'accent' }) {
  const body = (
    <>
      <span>{label}<Icon size={18} /></span>
      <strong>{value ?? 0}</strong>
      <small>{sub ?? 'From your workspace'}</small>
    </>
  );
  const cls = 'metric ' + (tone ?? '') + (href ? ' linked' : '');
  return href ? <Link className={cls} href={href}>{body}</Link> : <div className={cls}>{body}</div>;
}

function TaskList({ tasks, w, now, empty, showEditor = false }: { tasks: any[]; w: any; now: number; empty: string; showEditor?: boolean }) {
  return (
    <div className="panel task-list">
      {tasks.length ? (
        tasks.map((t) => {
          const overdue = Date.parse(t.dueAt) < now && t.state !== 'approved';
          return (
            <Link key={t.id} className="task-row" href={'/clipcrew/' + t.id + '?workspace=' + w.id}>
              <Avatar name={t.displayName} />
              <div>
                <strong>{t.displayName}&apos;s moment</strong>
                <small>{t.challengeTitle} · {t.format}{showEditor ? ' · ' + userLabel(t.editorId) : ''}</small>
              </div>
              <small className={'due ' + (overdue ? 'overdue' : '')}>{overdue ? 'Overdue · ' : 'Due '}{formatDeadline(t.dueAt, w.timezone)}</small>
              <Status state={t.state} />
              <ArrowUpRight size={17} />
            </Link>
          );
        })
      ) : (
        <p className="muted">{empty}</p>
      )}
    </div>
  );
}
