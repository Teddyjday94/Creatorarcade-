import Link from 'next/link';
import { ArrowUpRight, Gamepad2, Plus, Trophy } from 'lucide-react';
import { ActionForm, Field } from './forms';
export function PageHeader({ eyebrow, title, description, action }: {
    eyebrow: string;
    title: string;
    description: string;
    action?: React.ReactNode;
}) { return <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action}</div>; }
export function Status({ state }: {
    state: string;
}) { return <span className={'badge ' + state}>{state.replaceAll('_', ' ')}</span>; }
export function Empty({ title, description, children }: {
    title: string;
    description: string;
    children?: React.ReactNode;
}) { return <div className="empty-state"><span className="empty-icon"><Trophy size={28}/></span><h2>{title}</h2><p>{description}</p>{children}</div>; }
export function WorkspaceStart() { return <><PageHeader eyebrow="LET'S GET STARTED" title="Build your community's arcade." description="One workspace for challenges, submissions, and your next video."/><div className="two-columns"><section className="panel"><h2>Create your workspace</h2><p className="muted">Start empty and make it yours.</p><ActionForm path="/api/workspaces" label="Create workspace" successRoute="/dashboard?workspace={id}"><Field label="Workspace name" name="name" maxLength={80}/><Field label="Workspace address" name="slug" maxLength={60} help="Lowercase letters, numbers, and single hyphens."/><div className="two-fields"><Field label="Accent color" name="brandColor" type="color" value="#4be2da"/><Field label="Timezone" name="timezone" value="America/Chicago"/></div></ActionForm></section><section className="panel onboarding-demo"><span className="giant-icon"><Gamepad2 size={70}/></span><span className="eyebrow">TAKE A LOOK AROUND</span><h2>Try the demo arcade.</h2><p>Explore a sample challenge, four submissions, and two editing tasks. Your real workspace stays separate.</p><ActionForm path="/api/demo" label="Open demo workspace" successRoute="/dashboard?workspace={id}"/></section></div></>; }
export function ChallengeCard({ c }: {
    c: any;
}) { return <Link className="challenge-card" href={'/challenges/' + c.id + '?workspace=' + c.workspaceId}><div className={'game-art art-' + (c.game.length % 3)}><span className="game-art-grid"/><span className="game-glyph">{c.game.slice(0, 2).toUpperCase()}</span><span className="game-tag"><Gamepad2 size={13}/>{c.game}</span></div><div className="card-content"><Status state={c.state}/><h3>{c.title}</h3><p>{c.description || 'Your next community challenge.'}</p><div className="card-bottom"><span>{c.entryCount ?? 0} submissions</span><ArrowUpRight size={19}/></div></div></Link>; }
