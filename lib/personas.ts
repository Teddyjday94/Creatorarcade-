// Demo personas and display labels for user ids. Safe to import on the client.
export type Persona = {
  id: string;
  name: string;
  handle: string;
  role: 'owner' | 'editor' | 'viewer';
  title: string;
  blurb: string;
  start: string;
  color: string;
};

export const PERSONAS: Persona[] = [
  {
    id: 'demo-owner',
    name: 'Maya Rivers',
    handle: '@mayaplays',
    role: 'owner',
    title: 'Creator · Workspace owner',
    blurb: 'Runs the challenges, judges entries, and approves the final edits.',
    start: '/dashboard',
    color: '#4be2da',
  },
  {
    id: 'demo-editor',
    name: 'Jules Park',
    handle: '@julescuts',
    role: 'editor',
    title: 'Editor · ClipCrew',
    blurb: 'Picks up assigned clips, sends edits for review, and answers feedback.',
    start: '/clipcrew',
    color: '#b298ff',
  },
  {
    id: 'demo-viewer',
    name: 'Rico Vance',
    handle: '@ricoclips',
    role: 'viewer',
    title: 'Viewer · Community member',
    blurb: 'Finds a live challenge, submits a clip, and checks the result.',
    start: '/play',
    color: '#f5c78c',
  },
];

export function personaFor(userId: string): Persona {
  const p = PERSONAS.find((x) => x.id === userId);
  if (p) return p;
  if (userId.startsWith('guest-')) {
    return {
      id: userId,
      name: 'Guest ' + userId.slice(6, 10).toUpperCase(),
      handle: '@guest',
      role: 'viewer',
      title: 'Guest viewer',
      blurb: 'A fresh viewer identity.',
      start: '/dashboard',
      color: '#a1acbb',
    };
  }
  return {
    id: userId,
    name: userLabel(userId),
    handle: '',
    role: 'viewer',
    title: 'Member',
    blurb: '',
    start: '/dashboard',
    color: '#a1acbb',
  };
}

/** Human label for any stored user id, without exposing long opaque ids. */
export function userLabel(userId: string): string {
  const p = PERSONAS.find((x) => x.id === userId);
  if (p) return p.name;
  if (userId === 'sample-editor') return 'Sample editor';
  if (userId.startsWith('guest-')) return 'Guest ' + userId.slice(6, 10).toUpperCase();
  if (userId.startsWith('sample-viewer')) return 'Sample viewer';
  // Short ids are readable as-is; long opaque ids are trimmed but stay distinct.
  return userId.length <= 24 ? userId : 'Member ' + userId.slice(-8);
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}
