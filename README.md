# CreatorArcade

Gaming challenge + editing workflow app: **ChallengeHub** (viewer challenges, judging, results, OBS overlay) and **ClipCrew** (editor assignments, review, approval).

Built on Vinext (Next-style app routes) running as a Cloudflare Worker with D1 (SQLite).

## Going live

See **SETUP.md**: Cloudflare login, create the D1 database, `pnpm ship <database id>`, then add Google / Discord / Twitch credentials as secrets.

## Run it locally

```sh
pnpm install --frozen-lockfile
pnpm dev            # http://127.0.0.1:5173
```

Copy `.dev.vars.example` to `.dev.vars`. Migrations in `drizzle/` apply automatically on first request (tracked in the `appMigrations` table).

## Auth modes

Set `AUTH_MODE` as a Worker variable (`.dev.vars` locally):

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
node --experimental-strip-types --test tests/*.test.ts   # 44 tests
pnpm exec tsc --noEmit
node scripts/check-source.mjs
pnpm build
```

`pnpm lint` reports `no-explicit-any` errors that were already present in the original export.

## Deploying

`pnpm ship <D1 database id>` builds and runs `wrangler deploy`. Full walkthrough in SETUP.md. This is a Cloudflare Worker, not a Vercel project.
