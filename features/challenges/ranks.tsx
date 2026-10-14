'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { request } from '@/components/arcade/forms';
export function Ranks({ id, version, entries, ranks }: {
    id: string;
    version: number;
    entries: any[];
    ranks: any[];
}) { const router = useRouter(), [error, setError] = useState(''), [busy, setBusy] = useState(false), [done, setDone] = useState(false); return <form onSubmit={async (e) => { e.preventDefault(); setBusy(true); setError(''); const f = new FormData(e.currentTarget), selected = entries.map(x => ({ entryId: x.id, rank: Number(f.get(x.id)) })).filter(x => x.rank > 0); try {
    await request('/api/challenges/' + id + '/results', 'PATCH', { ranks: selected, version });
    setDone(true);
    router.refresh();
}
catch (e) {
    setError((e as Error).message);
}
finally {
    setBusy(false);
} }}><fieldset disabled={busy}><p className="muted">Assign unique ranks to your shortlisted entries. Leave unranked entries blank.</p>{entries.length ? entries.map(e => <label className="rank-row" key={e.id}><span>{e.displayName}<small>{e.description}</small></span><input aria-label={'Rank for ' + e.displayName} type="number" min="1" max="100" name={e.id} defaultValue={ranks.find(r => r.entryId === e.id)?.rank ?? ''}/></label>) : <p>No entries shortlisted yet.</p>}<button className="button primary" disabled={busy}>Save ranks</button></fieldset>{done && <p className="success" role="status">Ranks saved.</p>}{error && <p className="error" role="alert">{error}</p>}</form>; }
