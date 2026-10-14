import { DEMO_COOKIE, SESSION_COOKIE, readCookie, authMode } from '@/lib/auth';
import { deleteSession } from '@/lib/server/accounts';
import { getDatabase } from '@/db';

export async function GET(req: Request) {
  if (authMode() === 'oauth') await deleteSession(getDatabase(), readCookie(req.headers.get('cookie'), SESSION_COOKIE));
  const headers = new Headers({ Location: '/', 'Cache-Control': 'no-store' });
  headers.append('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  headers.append('Set-Cookie', `${DEMO_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  return new Response(null, { status: 303, headers });
}
