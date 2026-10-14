import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: { default: 'CreatorArcade · Your community. Your next great moment.', template: '%s · CreatorArcade' }, description: 'Run gaming challenges, collect your community’s best moments, and keep your editing crew moving.', robots: { index: false, follow: false }, icons: { icon: '/favicon.svg' } };
export default function RootLayout({ children }: {
    children: React.ReactNode;
}) { return <html lang="en"><body>{children}</body></html>; }
