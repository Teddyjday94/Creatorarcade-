# CreatorArcade

Gaming challenge + editing workflow app: **ChallengeHub** (viewer challenges, judging, results, OBS overlay) and **ClipCrew** (editor assignments, review, approval).

Next.js 16 app deployed on Vercel, with Turso/libSQL (SQLite) for storage.

## Going live

See **SETUP.md**: connect a Turso database from Vercel's Storage tab, then add Google / Discord / Twitch keys as environment variables.

## Run it locally

```sh
pnpm install --frozen-lockfile
pnpm dev            # http://localhost:3000
```

Copy `.env.example` to `.env.local`. Without a database URL it uses `./local.db`. Migrations in `drizzle/` are bundled into `db/migrations.generated.ts` (`pnpm db:generate`) and apply automatically on first request, tracked in `appMigrations`.

## Auth modes

Set `AUTH_MODE` as an environment variable (`.env.local` locally, project settings on Vercel):

- `oauth` (default): real accounts via Google, Discord, and Twitch. Only providers with both a client id and secret are shown. Sessions are 30-day random tokens in an HttpOnly cookie; only a SHA-256 hash is stored. Code in `lib/auth.ts`, `lib/server/oauth.ts`, `lib/server/accounts.ts`, and `app/auth/`.
- `demo`: persona sign-in (Maya the owner, Jules the editor, Rico the viewer, or a new guest) with a seeded, resettable demo arcade. Good for local testing and pitches. Not real security.
- `sites`: trusts ChatGPT Sites headers. Only safe behind that platform.

Each provider account is its own CreatorArcade account (Google and Discord sign-ins are not merged, even with the same email).

### Demo script (AUTH_MODE=demo)

1. Rico: `/play` → open *The weekly highlight reel* → submit a YouTube link.
2. Maya: Dashboard → *3 new entries to review* → Shortlist Rico in one click → *Send to ClipCrew* (editor Jules).
3. Jules: board → Rico's task → Start editing → paste an edit link → Send for review.
4. Maya: *Edit ready for review* → Approve.
5. Maya: *Pick your winners* (Rooftop Rally) → set 1st/2nd/3rd → Publish → open results page and OBS overlay.

In `oauth` mode anyone can still open a private sample arcade from the empty dashboard. Demo workspaces are hidden from the public `/play` page.

## Public routes

`/`, `/play`, `/c/:slug`, `/c/:slug/results`, `/c/:slug/overlay` work signed out (the overlay must, since OBS cannot sign in). They only show published display data. Submitting an entry still requires sign-in.

## Checks

```sh
pnpm test                     # 44 tests
pnpm exec tsc --noEmit
node scripts/check-source.mjs
pnpm build
```

`pnpm lint` reports `no-explicit-any` errors that were already present in the original export.

## Deploying

Push to `main`; Vercel builds with `next build`. See SETUP.md for the database and sign-in setup.
