import { requireUser, isDemoAuth, signOutPath } from '@/lib/auth';
import { context } from '@/lib/server/context';
import { listWorkspaces } from '@/lib/server/workspaces';
import { Shell } from '@/components/arcade/shell';

export const dynamic = 'force-dynamic';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await requireUser('/dashboard');
  const all = await listWorkspaces(await context());
  return (
    <Shell
      workspaces={all}
      user={{
        id: user.userId,
        name: user.displayName,
        title: user.persona?.title ?? (user.provider === 'sites' ? 'Creator workspace' : 'Signed in with ' + user.provider[0].toUpperCase() + user.provider.slice(1)),
        avatarUrl: user.avatarUrl,
        color: user.persona?.color ?? '#4be2da',
        demo: isDemoAuth(),
        signOut: signOutPath('/'),
      }}
    >
      {children}
    </Shell>
  );
}
