import { getUser } from '../auth';
import { getDatabase } from '../../db';
import type { Context } from '../domain/types';
import { AppError } from '../domain/validation';

/** Request context for a signed-in actor. Throws 401 when nobody is signed in. */
export async function context(): Promise<Context> {
  const user = await getUser();
  if (!user) throw new AppError(401, 'Sign in to continue.');
  return { db: getDatabase(), actor: { userId: user.userId }, now: () => new Date() };
}

/**
 * Context for public, read-only pages (results, OBS overlay, viewer challenge page).
 * The actor id is empty when signed out, so any membership check still fails closed.
 */
export async function publicContext(): Promise<Context> {
  const user = await getUser();
  return { db: getDatabase(), actor: { userId: user?.userId ?? '' }, now: () => new Date() };
}
