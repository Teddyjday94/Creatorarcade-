'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, LoaderCircle } from 'lucide-react';
import { request } from '@/components/arcade/forms';
import { Avatar } from '@/components/arcade/ui';

const ordinal = (n: number) => n + (['th', 'st', 'nd', 'rd'][n % 100 > 10 && n % 100 < 14 ? 0 : n % 10 < 4 ? n % 10 : 0] ?? 'th');

/** Pick a placing for each shortlisted entry. Duplicate placings are blocked before saving. */
export function Ranks({ id, version, entries, ranks }: { id: string; version: number; entries: any[]; ranks: any[] }) {
  const router = useRouter();
  const [picks, setPicks] = useState<Record<string, number>>(() => Object.fromEntries(ranks.map((r) => [r.entryId, r.rank])));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const used = Object.values(picks).filter(Boolean);
  const dupes = used.length !== new Set(used).size;
  const places = Array.from({ length: Math.max(3, entries.length) }, (_, i) => i + 1);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (dupes) return setError('Each place can only go to one entry.');
        setBusy(true); setError(''); setDone(false);
        const selected = entries.map((x) => ({ entryId: x.id, rank: picks[x.id] ?? 0 })).filter((x) => x.rank > 0);
        try {
          await request('/api/challenges/' + id + '/results', 'PATCH', { ranks: selected, version });
          setDone(true);
          router.refresh();
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <fieldset disabled={busy}>
        <p className="muted">Give each finalist a place. Leave an entry as “Not placed” to keep it off the results.</p>
        {entries.length ? (
          entries.map((e) => (
            <label className={'rank-row ' + (picks[e.id] ? 'placed place-' + picks[e.id] : '')} key={e.id}>
              <Avatar name={e.displayName} />
              <span className="rank-name">{e.displayName}<small>{e.description}</small></span>
              <select aria-label={'Place for ' + e.displayName} value={picks[e.id] ?? 0} onChange={(ev) => { setDone(false); setPicks({ ...picks, [e.id]: Number(ev.target.value) }); }}>
                <option value={0}>Not placed</option>
                {places.map((n) => <option key={n} value={n}>{ordinal(n)} place</option>)}
              </select>
            </label>
          ))
        ) : (
          <p className="notice">No entries are shortlisted yet. Shortlist your favorites in the queue below, then rank them here.</p>
        )}
        {entries.length > 0 && (
          <div className="form-actions">
            <button className="button secondary" disabled={busy || dupes || !used.length}>{busy ? <LoaderCircle size={16} className="spin" /> : <Check size={16} />}Save placings</button>
            {done && <span className="success" role="status"><Check size={15} />Placings saved. Publish when you are ready.</span>}
          </div>
        )}
      </fieldset>
      {(error || dupes) && <p className="error" role="alert">{error || 'Each place can only go to one entry.'}</p>}
    </form>
  );
}
