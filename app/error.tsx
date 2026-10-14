'use client';
export default function ErrorPage({ reset }: {
    reset: () => void;
}) { return <div className="empty-state"><h1>We couldn't open that page.</h1><p>The page may be unavailable or outside your workspace access.</p><button className="button primary" onClick={reset}>Try again</button><a className="button secondary" href="/dashboard">Back to your workspace</a></div>; }
