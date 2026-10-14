import { userLabel } from '../../lib/personas.ts';
export function editorLabel(userId: string) {
  return userId === 'sample-editor' ? 'Sample editor (demo)' : userLabel(userId);
}
export function editorOptions(members: Array<{ userId: string; role: string; status: string }>) {
  return members.filter((m) => m.role === 'editor' && m.status === 'active').map((m) => ({ value: m.userId, label: editorLabel(m.userId) }));
}
