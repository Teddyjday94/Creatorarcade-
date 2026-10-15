import type { Metadata } from 'next';
import './globals.css';
import './arcade.css';
import { databaseUrl } from '@/db';

export const metadata: Metadata = {
  title: { default: 'CreatorArcade · Your community. Your next great moment.', template: '%s · CreatorArcade' },
  description: 'Run gaming challenges, collect your community’s best moments, and keep your editing crew moving.',
  robots: { index: false, follow: false },
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{databaseUrl() ? children : <SetupNeeded />}</body>
    </html>
  );
}

/** Shown on every page until a database is connected, instead of a generic crash. */
function SetupNeeded() {
  return (
    <div className="viewer-wrap">
      <section className="panel invite-page">
        <span className="eyebrow">ALMOST LIVE</span>
        <h1>Connect a database to finish setup.</h1>
        <p>CreatorArcade is deployed, but it does not have a database yet.</p>
        <ol className="setup-steps">
          <li>In Vercel, open this project and go to <strong>Storage</strong>.</li>
          <li>Choose <strong>Create Database</strong> → <strong>Turso</strong> (free), and connect it to this project.</li>
          <li>Redeploy. Tables are created automatically on the first visit.</li>
        </ol>
        <p className="muted small-text">Using your own Turso database instead? Add TURSO_DATABASE_URL and TURSO_AUTH_TOKEN as environment variables.</p>
      </section>
    </div>
  );
}
