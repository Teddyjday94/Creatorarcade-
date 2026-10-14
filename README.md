# CreatorArcade

Gaming challenge + editing workflow app: **ChallengeHub** (viewer challenges, judging, results, OBS overlay) and **ClipCrew** (editor assignments, review, approval).

Built on Vinext (Next-style app routes) running as a Cloudflare Worker with D1 (SQLite).

## Run it locally

```sh
pnpm install --frozen-lockfile
pnpm dev            # http://127.0.0.1:5173
```

No database setup needed: the schema in `drizzle/` is applied automatically the first time an empty database is used.

Open `/signin`, pick a persona, and go.

## Demo mode (default)

`AUTH_MODE` defaults to `demo`. Visitors choose one of three personas on `/signin`:

| Persona | Role | Lands on |
| --- | --- | --- |
| Maya Rivers | Workspace owner | Dashboard |
| Jules Park | Editor | ClipCrew board |
| Rico Vance | Viewer | Live challenges (`/play`) |

There is also "Continue as a new guest" for a blank identity (second viewer, invite redemption, starting a workspace from zero).

The first sign-in seeds **Maya's Arcade · Demo** with four challenges, one at every stage (draft, live, judging, results live), 17 entries, ClipCrew tasks in every column (one overdue), comments, and an activity feed. Maya can hit **Reset demo data** in the banner to restore it.

A good 5 minute demo script:

1. Rico: `/play` → open *The weekly highlight reel* → submit a YouTube link.
2. Maya: Dashboard → *3 new entries to review* → Shortlist Rico in one click → *Send to ClipCrew* (editor Jules).
3. Jules: board → Rico's task → Start editing → paste an edit link → Send for review.
4. Maya: *Edit ready for review* → Approve.
5. Maya: *Pick your winners* (Rooftop Rally) → set 1st/2nd/3rd → Publish → open results page and OBS overlay.

Demo identities are not real authentication. Anyone with the link can pick any persona. Do not put real community data in a demo-mode deployment.

## Auth modes

Set `AUTH_MODE` as a Worker variable (`.dev.vars` locally, `wrangler.json` vars or dashboard in production):

- `demo` (default): persona cookie, see `lib/auth.ts`.
- `sites`: trusts `oai-authenticated-user-*` headers. Only safe behind the original ChatGPT Sites platform.

For production, add a third mode in `lib/auth.ts` backed by a real provider (Cloudflare Access, Clerk, Auth.js...). `getUser()` just needs to return a verified, stable `userId`. All authorization (owner/editor/viewer, membership, assignment checks) lives server-side in `lib/server/` and is unchanged.

## Public routes

`/`, `/play`, `/c/:slug`, `/c/:slug/results`, `/c/:slug/overlay` work signed out (the overlay must, since OBS cannot sign in). They only show published display data. Submitting an entry still requires sign-in.

## Checks

```sh
node --experimental-strip-types --test tests/*.test.ts   # 40 tests
pnpm exec tsc --noEmit
node scripts/check-source.mjs
pnpm build
```

`pnpm lint` reports `no-explicit-any` errors that were already present in the original export.

## Deploying

The build output is a Cloudflare Worker (`dist/server/wrangler.json`). To deploy independently: create a D1 database, put its id in the D1 binding, set `AUTH_MODE`, and run `wrangler deploy`. This is not a standard Vercel/Next.js deployment. See `CLAUDE-HANDOFF.md` for the original hosting notes and `docs/demo-pass-2026-10-14.md` for what changed in this pass.
