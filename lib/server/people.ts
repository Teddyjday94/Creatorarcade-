import type { Context } from '../domain/types.ts';
import { namesFor } from './accounts.ts';
import { userLabel } from '../personas.ts';

/** Returns a sync label function backed by real account names for the given ids. */
export async function labeler(ctx: Context, ids: Array<string | null | undefined>) {
  const names = await namesFor(ctx.db, ids.filter((x): x is string => !!x));
  return (id: string) => names[id] ?? userLabel(id);
}
