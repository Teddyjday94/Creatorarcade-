'use client';
import Link from 'next/link';
import { useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { LayoutDashboard, Trophy, Clapperboard, Settings, Gamepad2, ArrowUpRight, Joystick, LogOut, Menu, X, Repeat2 } from 'lucide-react';
import { PERSONAS, initials } from '@/lib/personas';
import { ActionForm } from './forms';

export function Brand() {
  return (
    <Link href="/" className="brand">
      <span className="brand-icon"><Gamepad2 size={23} /></span>
      <span>creator<span className="brand-light">arcade</span><i /></span>
    </Link>
  );
}

export type ShellUser = { id: string; name: string; title: string; color: string; demo: boolean; signOut: string };

/** Persona switcher used in demo mode. Posts to /auth/demo, which lands on the persona's home. */
export function PersonaSwitcher({ current, compact = false }: { current: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={'persona-switch ' + (compact ? 'compact' : '')}>
      <button type="button" className="button secondary small" aria-expanded={open} onClick={() => setOpen(!open)}>
        <Repeat2 size={14} /> Switch persona
      </button>
      {open && (
        <div className="persona-menu" role="menu">
          <span className="persona-menu-label">DEMO PERSONAS</span>
          {PERSONAS.map((p) => (
            <form method="POST" action="/auth/demo" key={p.id}>
              <input type="hidden" name="persona" value={p.id} />
              <input type="hidden" name="return_to" value="/dashboard" />
              <button type="submit" role="menuitem" className={p.id === current ? 'current' : ''} style={{ ['--accent' as string]: p.color }}>
                <span className="mini-avatar">{initials(p.name)}</span>
                <span><strong>{p.name}</strong><small>{p.title}</small></span>
                {p.id === current && <span className="tiny-tag">YOU</span>}
              </button>
            </form>
          ))}
          <form method="POST" action="/auth/demo">
            <input type="hidden" name="persona" value="guest" />
            <input type="hidden" name="return_to" value="/dashboard" />
            <button type="submit" role="menuitem"><span className="mini-avatar">+</span><span><strong>New guest</strong><small>Fresh identity, no workspaces</small></span></button>
          </form>
        </div>
      )}
    </div>
  );
}

export function Shell({ workspaces, user, children }: { workspaces: any[]; user: ShellUser; children: React.ReactNode }) {
  const path = usePathname();
  const params = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const w = workspaces.find((x) => x.id === params.get('workspace')) ?? workspaces[0];
  const suffix = w ? '?workspace=' + w.id : '';
  const owner = w?.role === 'owner';
  const nav: Array<[any, string, string]> = [
    [LayoutDashboard, 'Overview', '/dashboard'],
    ...(owner || !w ? ([[Trophy, 'Challenges', '/challenges']] as Array<[any, string, string]>) : []),
    ...(w ? ([[Clapperboard, 'ClipCrew', '/clipcrew']] as Array<[any, string, string]>) : []),
    ...(owner || !w ? ([[Settings, 'Settings', '/settings']] as Array<[any, string, string]>) : []),
  ];
  return (
    <div className={'app-shell ' + (menuOpen ? 'menu-open' : '')}>
      <aside className="sidebar">
        <div className="sidebar-top">
          <Brand />
          <button className="icon-button mobile-only" type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <div className="sidebar-body">
          <div className="workspace-label">YOUR WORKSPACE</div>
          {w ? (
            <select aria-label="Select workspace" value={w.id} onChange={(e) => location.assign(path.split('/').slice(0, 2).join('/') + '?workspace=' + e.target.value)}>
              {workspaces.map((x) => <option key={x.id} value={x.id}>{x.name}{x.role === 'editor' ? ' (editor)' : ''}</option>)}
            </select>
          ) : (
            <p className="muted small-text">No workspace yet</p>
          )}
          {w && <span className={'role-pill ' + w.role}>{w.role === 'owner' ? 'Owner access' : 'Editor access'}</span>}
          <nav onClick={() => setMenuOpen(false)}>
            {nav.map(([Icon, label, url]) => {
              const active = path.startsWith(url);
              return (
                <Link key={url} className={'nav-item ' + (active ? 'active' : '')} href={url + suffix} aria-current={active ? 'page' : undefined}>
                  <Icon size={19} />{label}{active && <span className="nav-dot" />}
                </Link>
              );
            })}
            <div className="nav-divider" />
            <Link className={'nav-item ' + (path.startsWith('/play') ? 'active' : '')} href="/play"><Joystick size={19} />Live challenges</Link>
          </nav>
          <div className="sidebar-note">
            <span className="tiny-tag">{user.demo ? 'DEMO MODE' : 'PRIVATE PREVIEW'}</span>
            <p>Your community.<br />Your next great moment.</p>
            <Link href="/">Explore CreatorArcade <ArrowUpRight size={14} /></Link>
          </div>
          <div className="user-chip">
            <span className="avatar" style={{ color: user.color, borderColor: user.color + '44', background: user.color + '14' }}>{initials(user.name)}</span>
            <span className="user-chip-text">{user.name}<small>{user.title}</small></span>
            <a className="icon-button" href={user.signOut} aria-label="Sign out" title="Sign out"><LogOut size={16} /></a>
          </div>
        </div>
      </aside>
      <div className="main-wrap">
        <header className="app-topbar">
          <span className="status-light" /> {w ? w.name : 'Creator workspace'}
          <span className="topbar-right">
            {user.demo && <PersonaSwitcher current={user.id} />}
          </span>
        </header>
        <main className="app-main">
          {w?.isDemo === 1 && (
            <div className="demo-banner">
              <span><strong>Demo workspace.</strong> Sample entries and editing tasks. Everything you change here is real and saved, so feel free to click around.</span>
              {owner && (
                <ActionForm path="/api/demo" method="PUT" label="Reset demo data" variant="secondary" confirmText="Reset the demo workspace? All changes made in it will be replaced with fresh sample data." className="inline-form" successRoute="/dashboard?workspace={id}" successMessage="Demo reset." />
              )}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
