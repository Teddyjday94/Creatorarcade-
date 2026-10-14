import { DEMO_COOKIE } from '@/lib/auth';

export async function GET() {
  return new Response(null, {
    status: 303,
    headers: {
      Location: '/',
      'Set-Cookie': `${DEMO_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
      'Cache-Control': 'no-store',
    },
  });
}
