import { getChatGPTUser } from '../../app/chatgpt-auth';
import { getDatabase } from '../../db';
import type { Context } from '../domain/types';
import { AppError } from '../domain/validation';
export async function context(): Promise<Context> { const user = await getChatGPTUser(); if (!user)
    throw new AppError(401, 'Sign in to continue.'); return { db: getDatabase(), actor: { userId: user.userId }, now: () => new Date() }; }
