'use client';
import { useEffect, useState } from 'react';

/** OBS browser-source overlay. Transparent background, refreshes every 20 seconds. */
export function Overlay({ id, initial }: { id: string; initial: any[] }) {
  const [rows, setRows] = useState(initial);
  const [stale, setStale] = useState(false);
  useEffect(() => {
    let live = true;
    const timer = setInterval(async () => {
      try {
        const r = await fetch('/api/challenges/' + id + '/results');
        if (!r.ok) throw new Error();
        const b: any = await r.json();
        if (live) { setRows(b.data); setStale(false); }
      } catch {
        if (live) setStale(true);
      }
    }, 20000);
    return () => { live = false; clearInterval(timer); };
  }, [id]);
  if (!rows.length) return <div className="overlay-page" />;
  return (
    <div className="overlay-page">
      <div className="overlay-board" style={{ ['--brand' as string]: rows[0].brandColor }}>
        <span className="eyebrow">{rows[0].workspaceName} / RESULTS</span>
        <h1>{rows[0].title}</h1>
        {rows.map((r, i) => (
          <div className={'overlay-row place-' + r.rank} key={r.rank} style={{ animationDelay: i * 120 + 'ms' }}>
            <strong>#{r.rank}</strong>
            <span>{r.displayName}</span>
          </div>
        ))}
        {stale && <small>Showing the last received results</small>}
      </div>
    </div>
  );
}
