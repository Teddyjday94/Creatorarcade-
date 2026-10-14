import { redirect } from 'next/navigation';
import { ArrowUpRight, Crown, Scissors, Ticket, UserPlus } from 'lucide-react';
import { Brand } from '@/components/arcade/shell';
import { getUser, isDemoAuth, safeReturnPath, signInPath } from '@/lib/auth';
import { PERSONAS, initials } from '@/lib/personas';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Sign in' };

const icons = { owner: Crown, editor: Scissors, viewer: Ticket } as const;

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const p = await searchParams;
  if (!isDemoAuth()) redirect(signInPath(p.return_to ?? '/dashboard'));
  const user = await getUser();
  const returnTo = safeReturnPath(p.return_to);
  return (
    <div className="viewer-wrap signin-wrap">
      <header className="marketing-nav"><Brand /><span className="tiny-tag">DEMO MODE</span></header>
      <section className="signin">
        <span className="eyebrow">PICK A SEAT AT THE ARCADE</span>
        <h1>Who are you playing as?</h1>
        <p>
          This demo has three ready-made people so you can walk the whole workflow: the creator who runs it,
          the editor who cuts the clips, and the viewer who submits them. Switch any time from the top bar.
        </p>
        {user && <p className="notice">Signed in as {user.displayName}. Picking a persona switches you.</p>}
        <div className="persona-grid">
          {PERSONAS.map((persona) => {
            const Icon = icons[persona.role];
            return (
              <form method="POST" action="/auth/demo" key={persona.id} className="persona-card" style={{ ['--accent' as string]: persona.color }}>
                <input type="hidden" name="persona" value={persona.id} />
                <input type="hidden" name="return_to" value={returnTo} />
                <div className="persona-top">
                  <span className="persona-avatar">{initials(persona.name)}</span>
                  <span className="persona-role"><Icon size={14} />{persona.role}</span>
                </div>
                <h2>{persona.name}</h2>
                <small>{persona.handle} · {persona.title}</small>
                <p>{persona.blurb}</p>
                <button className="button primary" type="submit">Play as {persona.name.split(' ')[0]} <ArrowUpRight size={16} /></button>
              </form>
            );
          })}
        </div>
        <form method="POST" action="/auth/demo" className="guest-row">
          <input type="hidden" name="persona" value="guest" />
          <input type="hidden" name="return_to" value={returnTo} />
          <UserPlus size={18} />
          <span>Need a second viewer, or want to start a workspace from zero?</span>
          <button className="button secondary small" type="submit">Continue as a new guest</button>
        </form>
        <p className="muted small-text">Demo identities are not real accounts. Anyone with the link can pick any persona.</p>
      </section>
    </div>
  );
}
