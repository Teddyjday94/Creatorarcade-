'use client';
import { useEffect, useState } from 'react';
export function Overlay({ id, initial }: {
    id: string;
    initial: any[];
}) { const [rows, setRows] = useState(initial), [stale, setStale] = useState(false); useEffect(() => { let live = true; const timer = setInterval(async () => { try {
    const r = await fetch('/api/challenges/' + id + '/results');
    if (!r.ok)
        throw new Error();
    const b: any = await r.json();
    if (live) {
        setRows(b.data);
        setStale(false);
    }
}
catch {
    if (live)
        setStale(true);
} }, 20000); return () => { live = false; clearInterval(timer); }; }, [id]); return <div className="overlay-page">{rows.length > 0 && <div className="overlay-board"><span className="eyebrow">{rows[0].workspaceName} / RESULTS</span><h1>{rows[0].title}</h1>{rows.map(r => <div className="overlay-row" key={r.rank}><strong>#{r.rank}</strong><span>{r.displayName}</span></div>)}{stale && <small>Showing the last received results</small>}</div>}</div>; }
