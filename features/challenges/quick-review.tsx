'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Star, X, LoaderCircle } from 'lucide-react';
import { request } from '@/components/arcade/forms';

/** One-click accept / shortlist / reject for a single entry. Uses the bulk endpoint, so notes are preserved. */
export function QuickReview({ challengeId, entry }: { challengeId: string; entry: { id: string; version: number; state: string } }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [refreshing, startRefresh] = useTransition();
  const choices: Array<[string, string, any]> = [
    ['accepted', 'Accept', Check],
    ['shortlisted', 'Shortlist', Star],
    ['rejected', 'Reject', X],
  ];
  return (
    <div className="quick-review">
      {choices.map(([state, label, Icon]) => (
        <button
          key={state}
          type="button"
          className={'quick ' + state + (entry.state === state ? ' active' : '')}
          disabled={!!busy || refreshing || entry.state === state}
          aria-pressed={entry.state === state}
          onClick={async () => {
            setBusy(state);
            setError('');
            try {
              await request('/api/challenges/' + challengeId + '/entries/bulk', 'PATCH', { selected: [{ id: entry.id, version: entry.version }], state });
              startRefresh(() => router.refresh());
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(null);
            }
          }}
        >
          {busy === state ? <LoaderCircle size={14} className="spin" /> : <Icon size={14} />}
          {label}
        </button>
      ))}
      {error && <span className="error inline" role="alert">{error}</span>}
    </div>
  );
}
