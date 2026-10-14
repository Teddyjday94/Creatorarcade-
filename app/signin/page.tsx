import { redirect } from 'next/navigation';
import { ArrowUpRight, Crown, Scissors, Ticket, UserPlus } from 'lucide-react';
import { Brand } from '@/components/arcade/shell';
import { getUser, authMode, safeReturnPath, signInPath, workerEnv } from '@/lib/auth';
import { enabledProviders, PROVIDERS } from '@/lib/server/oauth';
import { PERSONAS, initials } from '@/lib/personas';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Sign in' };

const icons = { owner: Crown, editor: Scissors, viewer: Ticket } as const;

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const p = await searchParams;
  const mode = authMode();
  if (mode === 'sites') redirect(signInPath(p.return_to ?? '/dashboard'));
  const user = await getUser();
  const returnTo = safeReturnPath(p.return_to);
  if (mode === 'oauth') {
    if (user) redirect(returnTo);
    const providers = enabledProviders(workerEnv());
    return (
      <div className="viewer-wrap signin-wrap">
        <header className="marketing-nav"><Brand /></header>
        <section className="signin signin-oauth panel">
          <span className="eyebrow">WELCOME TO THE ARCADE</span>
          <h1>Sign in to play.</h1>
          <p>Creators run challenges, editors cut the clips, and everyone else gets to enter. One account does all three.</p>
          {p.error && <p className="error" role="alert">{p.error}</p>}
          {providers.length ? (
            <div className="provider-list">
              {providers.map((id) => (
                <a key={id} className={'provider-button ' + id} href={`/auth/${id}?return_to=${encodeURIComponent(returnTo)}`}>
                  <ProviderIcon id={id} />Continue with {PROVIDERS[id].label}
                </a>
              ))}
            </div>
          ) : (
            <p className="notice">Sign-in is not configured yet. Add Google, Discord, or Twitch credentials as Worker secrets (see SETUP.md).</p>
          )}
          <p className="muted small-text">We only use your name, avatar, and email to set up your account. We never post on your behalf.</p>
        </section>
      </div>
    );
  }
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

function ProviderIcon({ id }: { id: string }) {
  if (id === 'google') return <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.6 3.8-5.4 3.8-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"/></svg>;
  if (id === 'discord') return <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.6 1.3a18.4 18.4 0 0 0-5.6 0L8.6 3a19.7 19.7 0 0 0-4.9 1.5C.6 9.1-.3 13.6.1 18.1a19.9 19.9 0 0 0 6 3l1.3-2.1c-.7-.3-1.4-.6-2-1l.5-.4a14.2 14.2 0 0 0 12.2 0l.5.4c-.6.4-1.3.7-2 1l1.3 2.1a19.8 19.8 0 0 0 6-3c.5-5.2-.9-9.7-3.6-13.7zM8 15.3c-1.2 0-2.2-1.1-2.2-2.4S6.8 10.5 8 10.5s2.2 1.1 2.2 2.4-1 2.4-2.2 2.4zm8 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4z"/></svg>;
  return <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M4.3 2 3 5.4v14h4.7V22h2.6l2.6-2.6h3.9L22 14.2V2H4.3zm15.8 11.3-3 3h-4.7l-2.6 2.6v-2.6H5.9V3.9h14.2v9.4zM17.2 7.2v5.4h-1.9V7.2h1.9zm-5.1 0v5.4h-1.9V7.2h1.9z"/></svg>;
}
