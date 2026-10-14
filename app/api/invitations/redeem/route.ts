import { write } from '@/lib/server/routes';
import { redeemInvitation } from '@/lib/server/invitations';
type P = {
    params: Promise<{
        id: string;
    }>;
};
export async function POST(req: Request) { return write(req, (ctx, b) => redeemInvitation(ctx, b.token)); }
