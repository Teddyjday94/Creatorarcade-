import Link from 'next/link';
import { ArrowUpRight, Clock3, Gamepad2, Trophy, Users } from 'lucide-react';
import { ActionForm, Field } from './forms';
import { initials } from '@/lib/personas';

const STATE_LABELS: Record<string, string> = {
  draft: 'Draft',
  published: 'Live',
  closed: 'Judging',
  results_published: 'Results live',
  pending: 'Pending',
  accepted: 'Accepted',
  shortlisted: 'Shortlisted',
  rejected: 'Rejected',
  assigned: 'Assigned',
  editing: 'Editing',
  in_review: 'In review',
  approved: 'Approved',
};

export function stateLabel(state: string) {
  return STATE_LABELS[state] ?? state.replaceAll('_', ' ');
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && <div className="page-heading-action">{action}</div>}
    </div>
  );
}

export function Status({ state }: { state: string }) {
  return <span className={'badge ' + state}><i className="badge-dot" />{stateLabel(state)}</span>;
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  // Stable hue per name so contributors are recognizable across screens.
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return (
    <span className={'avatar ' + (size === 'sm' ? 'small-avatar' : '')} style={{ color: `hsl(${h} 85% 75%)`, background: `hsl(${h} 70% 60% / .1)`, borderColor: `hsl(${h} 70% 60% / .25)` }}>
      {initials(name)}
    </span>
  );
}

export function Empty({ title, description, children }: { title: string; description: string; children?: React.ReactNode }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><Trophy size={28} /></span>
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
    </div>
  );
}

const LIFECYCLE = ['draft', 'published', 'closed', 'results_published'];

/** Draft → Live → Judging → Results, with the current stage highlighted. */
export function Lifecycle({ state }: { state: string }) {
  const at = LIFECYCLE.indexOf(state);
  return (
    <ol className="lifecycle" aria-label="Challenge stage">
      {LIFECYCLE.map((s, i) => (
        <li key={s} className={i < at ? 'done' : i === at ? 'current' : ''} aria-current={i === at ? 'step' : undefined}>
          <span className="lifecycle-dot">{i + 1}</span>
          {stateLabel(s)}
        </li>
      ))}
    </ol>
  );
}

export function timeLeft(deadline: string, now = Date.now()) {
  const ms = Date.parse(deadline) - now;
  const abs = Math.abs(ms);
  const d = Math.floor(abs / 86400000), h = Math.floor((abs % 86400000) / 3600000), m = Math.floor((abs % 3600000) / 60000);
  const span = d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;
  return ms >= 0 ? span + ' left' : span + ' ago';
}

export function relativeTime(iso: string, now = Date.now()) {
  const s = Math.round((now - Date.parse(iso)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}

export function WorkspaceStart() {
  return (
    <>
      <PageHeader eyebrow="LET'S GET STARTED" title="Build your community's arcade." description="One workspace for challenges, submissions, and your next video." />
      <div className="two-columns">
        <section className="panel">
          <h2>Create your workspace</h2>
          <p className="muted">Start empty and make it yours.</p>
          <ActionForm path="/api/workspaces" label="Create workspace" successRoute="/dashboard?workspace={id}" hardNavigate>
            <Field label="Workspace name" name="name" maxLength={80} />
            <Field label="Workspace address" name="slug" maxLength={60} help="Lowercase letters, numbers, and single hyphens." />
            <div className="two-fields">
              <Field label="Accent color" name="brandColor" type="color" value="#4be2da" />
              <Field label="Timezone" name="timezone" value="America/Chicago" />
            </div>
          </ActionForm>
        </section>
        <section className="panel onboarding-demo">
          <span className="giant-icon"><Gamepad2 size={70} /></span>
          <span className="eyebrow">TAKE A LOOK AROUND</span>
          <h2>Try the demo arcade.</h2>
          <p>Four challenges at every stage, real-looking submissions, and an editing board with work in progress. Your real workspace stays separate.</p>
          <ActionForm path="/api/demo" label="Open demo workspace" successRoute="/dashboard?workspace={id}" hardNavigate />
        </section>
      </div>
    </>
  );
}

export function ChallengeCard({ c }: { c: any }) {
  const live = c.state === 'published' && Date.parse(c.deadline) > Date.now();
  return (
    <Link className="challenge-card" href={'/challenges/' + c.id + '?workspace=' + c.workspaceId}>
      <div className={'game-art art-' + (c.game.length % 3)}>
        <span className="game-art-grid" />
        <span className="game-glyph">{c.game.slice(0, 2).toUpperCase()}</span>
        <span className="game-tag"><Gamepad2 size={13} />{c.game}</span>
        {live && <span className="live-chip"><i />LIVE</span>}
      </div>
      <div className="card-content">
        <Status state={c.state} />
        <h3>{c.title}</h3>
        <p>{c.description || 'Your next community challenge.'}</p>
        <div className="card-bottom">
          <span><Users size={13} />{c.entryCount ?? 0} entries</span>
          {c.state === 'published' && <span><Clock3 size={13} />{timeLeft(c.deadline)}</span>}
          {c.pendingCount > 0 && <span className="pending-pill">{c.pendingCount} to review</span>}
          <ArrowUpRight size={19} />
        </div>
      </div>
    </Link>
  );
}
