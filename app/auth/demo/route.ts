import { requestOrigin } from '@/lib/server/http';
import { DEMO_COOKIE, demoUserIdFromCookie, isDemoAuth, safeReturnPath } from '@/lib/auth';
import { personaFor } from '@/lib/personas';
import { getDatabase } from '@/db';
import { createDemoWorkspace } from '@/features/workspaces/demo';

// Demo-only sign-in: sets a persona cookie and redirects. Disabled in sites mode.
export async function POST(req: Request) {
  if (!isDemoAuth()) return new Response('Not found', { status: 404 });
  const url = new URL(req.url);
  const origin = req.headers.get('origin');
  if (origin && origin !== requestOrigin(req)) return new Response('Forbidden', { status: 403 });
  const form = await req.formData();
  let persona = String(form.get('persona') ?? '');
  if (persona === 'guest') {
    const bytes = crypto.getRandomValues(new Uint8Array(6));
    persona = 'guest-' + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  const userId = demoUserIdFromCookie(persona);
  if (!userId) return new Response('Unknown persona', { status: 422 });
  // Make sure the shared demo arcade exists so every persona lands somewhere useful.
  await createDemoWorkspace({ db: getDatabase(), actor: { userId: 'demo-owner' }, now: () => new Date() });
  const requested = String(form.get('return_to') ?? '');
  const target = requested && requested !== '/dashboard' ? safeReturnPath(requested) : personaFor(userId).start;
  const secure = requestOrigin(req).startsWith('https:') ? '; Secure' : '';
  return new Response(null, {
    status: 303,
    headers: {
      Location: target,
      'Set-Cookie': `${DEMO_COOKIE}=${userId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secure}`,
      'Cache-Control': 'no-store',
    },
  });
}
