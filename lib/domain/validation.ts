export class AppError extends Error {
    status: number;
    code: string;
    fields?: Record<string, string>;
    constructor(status: number, message: string, code = 'invalid', fields?: Record<string, string>) { super(message); this.status = status; this.code = code; this.fields = fields; }
}
export function check(condition: unknown, message: string, status = 422): asserts condition { if (!condition)
    throw new AppError(status, message); }
export function text(value: unknown, name: string, max: number, required = true): string { check(typeof value === 'string', name + ' must be text.'); const s = value.trim(); check((!required || s.length > 0) && s.length <= max, name + ' must be ' + (required ? '1–' : '0–') + max + ' characters.'); return s; }
export function version(v: unknown): number { check(Number.isInteger(v) && Number(v) >= 0, 'Reload this page before saving.', 409); return Number(v); }
export function timezone(v: unknown): string { const s = text(v, 'Timezone', 100); try {
    new Intl.DateTimeFormat('en-US', { timeZone: s }).format();
}
catch {
    throw new AppError(422, 'Choose a valid timezone.');
} return s; }
export function httpsUrl(v: unknown): string { const s = text(v, 'Link', 2048); let u: URL; try {
    u = new URL(s);
}
catch {
    throw new AppError(422, 'Enter a valid HTTPS link.');
} check(u.protocol === 'https:' && !u.username && !u.password && !u.port, 'Use an HTTPS link without credentials or a custom port.'); return u.href; }
export function clipUrl(v: unknown): string { const s = httpsUrl(v), u = new URL(s), h = u.hostname, p = u.pathname; const ok = (h === 'clips.twitch.tv' && /^\/[A-Za-z0-9_-]+$/.test(p)) || (['twitch.tv', 'www.twitch.tv'].includes(h) && /^\/(videos\/\d+|[\w]+\/clip\/[\w-]+)$/.test(p)) || (['youtube.com', 'www.youtube.com'].includes(h) && ((p === '/watch' && /^[\w-]{6,}$/.test(u.searchParams.get('v') ?? '')) || /^\/(shorts|live)\/[\w-]{6,}$/.test(p))) || (h === 'youtu.be' && /^\/[\w-]{6,}$/.test(p)) || (h === 'medal.tv' && /^\/(games\/[^/]+\/clips\/[^/]+|clips\/[^/]+)/.test(p)); check(ok, 'Use a Twitch, YouTube, or Medal clip link.'); return s; }
export function utcDate(v: unknown): string { const s = text(v, 'Deadline', 50); check(/^\d{4}-\d{2}-\d{2}T.*Z$/.test(s) && Number.isFinite(Date.parse(s)), 'Choose a valid deadline.'); return new Date(s).toISOString(); }
