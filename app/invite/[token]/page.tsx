import { requireUser } from '@/lib/auth';
import { Brand } from '@/components/arcade/shell';
import { ActionForm } from '@/components/arcade/forms';

export const dynamic = 'force-dynamic';
export const metadata = { referrer: 'no-referrer' };

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const user = await requireUser('/invite/' + token);
  return (
    <div className="viewer-wrap">
      <header className="marketing-nav"><Brand /></header>
      <section className="panel invite-page">
        <span className="eyebrow">YOU&apos;RE INVITED</span>
        <h1>Join the editing room.</h1>
        <p>Accept this invitation to work on clips assigned to you. The invitation can be used once and expires after seven days.</p>
        <p className="muted small-text">Accepting as <strong>{user.displayName}</strong>.</p>
        <ActionForm path="/api/invitations/redeem" values={{ token }} label="Accept editor invitation" successRoute="/clipcrew?workspace={workspaceId}" />
      </section>
    </div>
  );
}
