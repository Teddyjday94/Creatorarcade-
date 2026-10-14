import type { Context, Statement } from '../../lib/domain/types.ts';
import { check } from '../../lib/domain/validation.ts';
import { requireMembership, requireOwner, atomic } from '../../lib/server/access.ts';
import { getWorkspace } from '../../lib/server/workspaces.ts';

/** The editor seeded into every demo workspace. Matches the "Jules" demo persona. */
export const DEMO_EDITOR_ID = 'demo-editor';
const DEMO_OWNER_ID = 'demo-owner';
const CLIP = 'https://youtu.be/QdBZY2fkU-0';

type SeedEntry = {
  name: string;
  desc: string;
  state: 'pending' | 'accepted' | 'shortlisted' | 'rejected';
  explanation?: string;
  note?: string;
  rank?: number;
  task?: { state: 'assigned' | 'editing' | 'in_review' | 'approved'; brief: string; format: string; dueHours: number; published?: boolean; comments?: Array<[string, string]> };
};

type SeedChallenge = {
  key: string;
  title: string;
  game: string;
  description: string;
  rules: string;
  criteria: string;
  state: 'draft' | 'published' | 'closed' | 'results_published';
  deadlineHours: number;
  entries: SeedEntry[];
};

const SEED: SeedChallenge[] = [
  {
    key: 'weekly-highlight-reel',
    title: 'The weekly highlight reel',
    game: 'GTA Online',
    description: 'Send the one clip from this week you still cannot believe happened. The best five make Friday\'s stream and the channel short.',
    rules: 'One clip per person, 60 seconds or less.\nYou must have recorded it or have the player\'s permission.\nNo slurs, no doxxing, nothing that breaks the game\'s terms.',
    criteria: 'Timing, originality, and how loud chat gets when it plays.',
    state: 'published',
    deadlineHours: 5 * 24,
    entries: [
      { name: 'NeonDriver', desc: 'Threaded a jet between two towers at full throttle, then landed it on a moving truck.', state: 'shortlisted', note: 'Opener for Friday. Huge reaction potential.', task: { state: 'in_review', brief: 'Cut a 30 second vertical short. Slow-mo on the tower gap, hard cut to the landing. Add the chat reaction overlay at the end.', format: 'Vertical 9:16', dueHours: 30, comments: [['demo-editor', 'First pass is up. I held the slow-mo for about two seconds, tell me if it drags.'], ['demo-owner', 'Looks great. Can we get the chat overlay a beat earlier?']] } },
      { name: 'PixelPilot', desc: 'A five-car pileup that somehow ends with everyone driving off in the right direction.', state: 'shortlisted', task: { state: 'editing', brief: 'Horizontal cut for the stream recap. Keep the full chain reaction, add a replay from the overhead angle.', format: 'Horizontal 16:9', dueHours: 52 } },
      { name: 'Teddy', desc: 'Parachute misfire, lands in a pool, crew loses it on voice chat.', state: 'accepted', task: { state: 'assigned', brief: 'Short, punchy, keep the voice chat audio. Subtitle the best line.', format: 'Vertical 9:16', dueHours: -10 } },
      { name: 'MidnightMods', desc: 'Clean heist escape through the storm drains with zero damage.', state: 'accepted', task: { state: 'approved', brief: 'Clean highlight with route callouts.', format: 'Vertical 9:16', dueHours: -48, published: true } },
      { name: 'ArcadeAce', desc: 'Sniped a tire from across the bay to win the race on the last turn.', state: 'pending' },
      { name: 'LagSwitchLarry', desc: 'The physics engine decided my car should be a rocket today.', state: 'pending' },
      { name: 'CoopQueen', desc: 'Four of us tried to synchronize a jump. One of us made it.', state: 'pending' },
      { name: 'Sk8rGhost', desc: 'Bike flip off the pier. Mostly.', state: 'rejected', explanation: 'The clip cuts off before the landing. Send the full take next week!' },
    ],
  },
  {
    key: 'rooftop-rally',
    title: 'Rooftop Rally: best stunt',
    game: 'Forza Horizon 5',
    description: 'Biggest, cleanest, most ridiculous stunt off any rooftop in the map.',
    rules: 'One continuous take. No replay editing tricks. Tell us the car.',
    criteria: 'Difficulty, style, and the landing.',
    state: 'closed',
    deadlineHours: -2 * 24,
    entries: [
      { name: 'TurboTess', desc: 'Barrel roll off the stadium roof, lands it on two wheels.', state: 'shortlisted', note: 'Strongest landing of the batch.' },
      { name: 'DriftKing', desc: 'Roof to roof to roof, three gaps, no brakes.', state: 'shortlisted' },
      { name: 'Ollie_Outback', desc: 'Jumped the river, clipped a balloon, still landed.', state: 'shortlisted' },
      { name: 'GearGrinder', desc: 'Long jump attempt that turns into a long fall.', state: 'accepted' },
      { name: 'NoBrakesNate', desc: 'Same stunt as last week, slightly better.', state: 'rejected', explanation: 'Already featured. Bring us something new next time.' },
    ],
  },
  {
    key: 'funniest-fail-september',
    title: 'Funniest fail of September',
    game: 'Minecraft',
    description: 'Creepers, lava, gravity. Show us the moment it all went wrong.',
    rules: 'One clip, under 45 seconds, family friendly.',
    criteria: 'How hard it makes the panel laugh.',
    state: 'results_published',
    deadlineHours: -20 * 24,
    entries: [
      { name: 'BlockHead', desc: 'Built a perfect house, then lit the fireplace. Wooden fireplace.', state: 'shortlisted', rank: 1 },
      { name: 'CreeperCam', desc: 'A creeper follows me for six minutes and waits for the worst possible moment.', state: 'shortlisted', rank: 2 },
      { name: 'LavaLad', desc: 'Mined straight down. You know the rest.', state: 'shortlisted', rank: 3 },
      { name: 'PickaxePat', desc: 'Lost a full diamond set to a cactus.', state: 'accepted' },
    ],
  },
  {
    key: 'photo-mode-showdown',
    title: 'Photo mode showdown',
    game: 'Cyberpunk 2077',
    description: 'Draft. One screenshot, best composition wins a spot on the channel banner.',
    rules: 'One screenshot or short clip. Photo mode filters are fine.',
    criteria: 'Composition, mood, and story.',
    state: 'draft',
    deadlineHours: 14 * 24,
    entries: [],
  },
];

async function digestOf(value: string) {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
  return Array.from(bytes).map((x) => x.toString(16).padStart(2, '0')).join('').slice(0, 20);
}

export async function createDemoWorkspace(ctx: Context) {
  check(ctx.actor?.userId, 'Sign in to continue.', 401);
  const existing = await ctx.db.first('SELECT id FROM workspaces WHERE ownerId=? AND isDemo=1', [ctx.actor.userId]);
  if (existing) return getWorkspace(ctx, existing.id);
  const owner = ctx.actor.userId;
  const digest = await digestOf(owner);
  // The shared demo owner gets clean, memorable viewer links. Others get unique ones.
  const slugFor = (key: string) => (owner === DEMO_OWNER_ID ? key : key + '-' + digest.slice(0, 8));
  const nowMs = ctx.now().getTime();
  const at = (hours: number) => new Date(nowMs + hours * 3600000).toISOString();
  const w = crypto.randomUUID();
  const ops: Statement[] = [
    {
      sql: "INSERT INTO workspaces(id,ownerId,name,slug,brandColor,timezone,isDemo,createdAt) VALUES(?,?,?,?,'#4be2da','America/Chicago',1,?)",
      args: [w, owner, owner === DEMO_OWNER_ID ? "Maya's Arcade · Demo" : 'The Arcade · Demo', 'demo-' + digest, at(-30 * 24)],
    },
    {
      sql: "INSERT INTO memberships(id,workspaceId,userId,role,status) VALUES(?,?,?,'owner','active'),(?,?,?,'editor','active')",
      args: [crypto.randomUUID(), w, owner, crypto.randomUUID(), w, DEMO_EDITOR_ID],
    },
  ];
  const event = (actor: string, action: string, target: string, hoursAgo: number, metadata = '') =>
    ops.push({
      sql: 'INSERT INTO auditEvents(id,workspaceId,actorId,action,targetId,metadata,createdAt) VALUES(?,?,?,?,?,?,?)',
      args: [crypto.randomUUID(), w, actor, action, target, metadata, at(-hoursAgo)],
    });
  event(owner, 'demo.created', w, 30 * 24);

  SEED.forEach((sc, ci) => {
    const c = crypto.randomUUID();
    const created = at(sc.deadlineHours - 10 * 24 - ci);
    ops.push({
      sql: 'INSERT INTO challenges(id,workspaceId,creatorId,slug,title,game,description,rules,criteria,deadline,originalDeadline,state,createdAt) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',
      args: [c, w, owner, slugFor(sc.key), sc.title, sc.game, sc.description, sc.rules, sc.criteria, at(sc.deadlineHours), at(sc.deadlineHours), sc.state, created],
    });
    sc.entries.forEach((se, n) => {
      const e = crypto.randomUUID();
      // Live challenge: entries trickle in over the last two days. Older challenges: before their deadline.
      const submittedHoursAgo = sc.deadlineHours > 0 ? 4 + n * 5 : -sc.deadlineHours + 6 + n * 7;
      ops.push({
        sql: 'INSERT INTO entries(id,challengeId,submitterId,displayName,description,clipUrl,consentAt,state,privateNote,viewerExplanation,createdAt) VALUES(?,?,?,?,?,?,?,?,?,?,?)',
        args: [e, c, 'sample-viewer-' + ci + '-' + n, se.name, se.desc, CLIP, at(-submittedHoursAgo), se.state, se.note ?? '', se.explanation ?? '', at(-submittedHoursAgo)],
      });
      if (sc.state === 'published' && n < 6) event('sample-viewer-' + ci + '-' + n, 'entry.submitted', e, submittedHoursAgo, se.name);
      if (se.rank) ops.push({ sql: 'INSERT INTO results(id,challengeId,entryId,rank) VALUES(?,?,?,?)', args: [crypto.randomUUID(), c, e, se.rank] });
      if (se.task) {
        const a = crypto.randomUUID(), t = se.task;
        ops.push({
          sql: 'INSERT INTO assignments(id,workspaceId,entryId,editorId,brief,format,dueAt,state,deliverableUrl,publicationUrl,createdAt) VALUES(?,?,?,?,?,?,?,?,?,?,?)',
          args: [a, w, e, DEMO_EDITOR_ID, t.brief, t.format, at(t.dueHours), t.state, ['in_review', 'approved'].includes(t.state) ? CLIP : '', t.published ? CLIP : '', at(-submittedHoursAgo + 2)],
        });
        event(owner, 'assignment.created', a, submittedHoursAgo - 2, se.name);
        if (t.state === 'in_review') event(DEMO_EDITOR_ID, 'assignment.submit', a, 1, se.name);
        if (t.state === 'approved') event(owner, 'assignment.approve', a, 2, se.name);
        (t.comments ?? []).forEach(([author, text], k) => {
          ops.push({ sql: 'INSERT INTO assignmentComments(id,assignmentId,authorId,text,createdAt) VALUES(?,?,?,?,?)', args: [crypto.randomUUID(), a, author === 'demo-owner' ? owner : author, text, at(-1 + k * 0.5)] });
        });
      }
    });
    if (sc.state === 'results_published') event(owner, 'results.published', c, -sc.deadlineHours - 48, sc.title);
    if (sc.state === 'closed') event(owner, 'challenge.close', c, -sc.deadlineHours, sc.title);
  });

  try {
    await atomic(ctx, ops);
  } catch (e) {
    const row = await ctx.db.first('SELECT id FROM workspaces WHERE ownerId=? AND isDemo=1', [owner]);
    if (row) return getWorkspace(ctx, row.id);
    throw e;
  }
  return getWorkspace(ctx, w);
}

/** Deletes the caller's demo workspace and everything in it, then seeds a fresh one. */
export async function resetDemoWorkspace(ctx: Context) {
  check(ctx.actor?.userId, 'Sign in to continue.', 401);
  const row = await ctx.db.first('SELECT id FROM workspaces WHERE ownerId=? AND isDemo=1', [ctx.actor.userId]);
  if (row) {
    await requireOwner(ctx, row.id);
    const w = row.id;
    const inChallenges = 'SELECT id FROM challenges WHERE workspaceId=?';
    await atomic(ctx, [
      { sql: 'DELETE FROM assignmentComments WHERE assignmentId IN (SELECT id FROM assignments WHERE workspaceId=?)', args: [w] },
      { sql: 'DELETE FROM assignments WHERE workspaceId=?', args: [w] },
      { sql: `DELETE FROM results WHERE challengeId IN (${inChallenges})`, args: [w] },
      { sql: `DELETE FROM entries WHERE challengeId IN (${inChallenges})`, args: [w] },
      { sql: 'DELETE FROM challenges WHERE workspaceId=?', args: [w] },
      { sql: 'DELETE FROM invitations WHERE workspaceId=?', args: [w] },
      { sql: 'DELETE FROM auditEvents WHERE workspaceId=?', args: [w] },
      { sql: 'DELETE FROM memberships WHERE workspaceId=?', args: [w] },
      { sql: 'DELETE FROM workspaces WHERE id=? AND isDemo=1', args: [w] },
    ]);
  }
  return createDemoWorkspace(ctx);
}

export async function getDashboard(ctx: Context, w: string) {
  const m = await requireMembership(ctx, w);
  const count = async (q: string, a: any[] = []) => Number((await ctx.db.first(q, a))?.count ?? 0);
  const now = ctx.now().toISOString();
  if (m.role === 'editor') {
    return {
      activeChallenges: null, submissionCount: null, shortlistedCount: null, awaitingReviewCount: null, pendingCount: null,
      assignedTasks: await count('SELECT COUNT(*) AS count FROM assignments WHERE workspaceId=? AND editorId=? AND archivedAt IS NULL', [w, ctx.actor.userId]),
      inProgressTasks: await count("SELECT COUNT(*) AS count FROM assignments WHERE workspaceId=? AND editorId=? AND archivedAt IS NULL AND state IN ('assigned','editing')", [w, ctx.actor.userId]),
      overdueTasks: await count("SELECT COUNT(*) AS count FROM assignments WHERE workspaceId=? AND editorId=? AND archivedAt IS NULL AND state!='approved' AND dueAt<?", [w, ctx.actor.userId, now]),
    };
  }
  return {
    activeChallenges: await count("SELECT COUNT(*) AS count FROM challenges WHERE workspaceId=? AND state='published' AND deadline>?", [w, now]),
    submissionCount: await count('SELECT COUNT(*) AS count FROM entries e JOIN challenges c ON c.id=e.challengeId WHERE c.workspaceId=?', [w]),
    shortlistedCount: await count("SELECT COUNT(*) AS count FROM entries e JOIN challenges c ON c.id=e.challengeId WHERE c.workspaceId=? AND e.state='shortlisted'", [w]),
    awaitingReviewCount: await count("SELECT COUNT(*) AS count FROM assignments WHERE workspaceId=? AND state='in_review' AND archivedAt IS NULL", [w]),
    pendingCount: await count("SELECT COUNT(*) AS count FROM entries e JOIN challenges c ON c.id=e.challengeId WHERE c.workspaceId=? AND e.state='pending'", [w]),
    assignedTasks: null, inProgressTasks: null, overdueTasks: null,
  };
}

/** Recent workspace activity for the owner dashboard. Owner only. */
export async function listActivity(ctx: Context, w: string, limit = 8) {
  await requireOwner(ctx, w);
  return ctx.db.all<{ id: string; actorId: string; action: string; targetId: string; metadata: string; createdAt: string }>(
    "SELECT id,actorId,action,targetId,metadata,createdAt FROM auditEvents WHERE workspaceId=? AND action NOT LIKE 'workspace.%' ORDER BY createdAt DESC LIMIT ?",
    [w, limit],
  );
}

/** Live challenges anyone signed in can join, plus the caller's own entries. */
export async function listPlayable(ctx: Context) {
  const now = ctx.now().toISOString();
  const live = await ctx.db.all(
    "SELECT c.slug,c.title,c.game,c.description,c.deadline,c.state,w.name AS workspaceName,w.timezone,w.isDemo,(SELECT COUNT(*) FROM entries e WHERE e.challengeId=c.id) AS entryCount FROM challenges c JOIN workspaces w ON w.id=c.workspaceId WHERE (c.state='published' AND c.deadline>?) OR c.state='results_published' ORDER BY CASE c.state WHEN 'published' THEN 0 ELSE 1 END, c.deadline LIMIT 24",
    [now],
  );
  const mine = ctx.actor.userId
    ? await ctx.db.all(
        'SELECT e.id,e.displayName,e.state,e.viewerExplanation,e.createdAt,c.slug,c.title,c.state AS challengeState,(SELECT rank FROM results r WHERE r.entryId=e.id) AS rank FROM entries e JOIN challenges c ON c.id=e.challengeId WHERE e.submitterId=? ORDER BY e.createdAt DESC LIMIT 20',
        [ctx.actor.userId],
      )
    : [];
  return { live, mine };
}
