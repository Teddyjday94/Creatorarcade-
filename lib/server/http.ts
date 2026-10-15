import { AppError, check } from '../domain/validation.ts';
/** The public origin of this request, as the browser sees it (honours the platform proxy's forwarded host). */
export function requestOrigin(req: Request) { const url = new URL(req.url), host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? url.host, proto = req.headers.get('x-forwarded-proto')?.split(',')[0] ?? url.protocol.replace(':', ''); return proto + '://' + host; }
export async function readBody(req: Request) { const origin = req.headers.get('origin'); check(origin === requestOrigin(req), 'Please submit from this site.', 403); check(req.headers.get('content-type')?.split(';')[0] === 'application/json', 'Use a JSON request.', 422); check(Number(req.headers.get('content-length') ?? 0) <= 32768, 'Request too large.', 413); const reader = req.body?.getReader(); check(reader, 'Request body required.'); let bytes = 0, chunks: Uint8Array[] = []; while (true) {
    const r = await reader.read();
    if (r.done)
        break;
    bytes += r.value.byteLength;
    if (bytes > 32768) {
        await reader.cancel();
        throw new AppError(413, 'Request too large.');
    }
    chunks.push(r.value);
} const all = new Uint8Array(bytes); let offset = 0; for (const c of chunks) {
    all.set(c, offset);
    offset += c.length;
} try {
    const data = JSON.parse(new TextDecoder().decode(all));
    check(data && typeof data === 'object' && !Array.isArray(data), 'Enter valid form data.');
    return data;
}
catch (e) {
    if (e instanceof AppError)
        throw e;
    throw new AppError(422, 'Enter valid form data.');
} }
export async function respond(run: () => Promise<unknown>) { try {
    return Response.json({ data: await run() }, { headers: { 'Cache-Control': 'no-store' } });
}
catch (e) {
    if (e instanceof AppError)
        return Response.json({ error: { code: e.code, message: e.message, fields: e.fields } }, { status: e.status, headers: { 'Cache-Control': 'no-store' } });
    console.error('CreatorArcade request failed');
    return Response.json({ error: { code: 'server', message: 'Could not save this. Please try again.' } }, { status: 500 });
} }
