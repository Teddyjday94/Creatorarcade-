# CreatorArcade: continue in Claude

> **Update 3, October 14, 2026:** Moved to standard Next.js on Vercel. Storage is Turso/libSQL (same SQLite schema and queries) via `db/index.ts`; Cloudflare/vinext build tooling removed. See `SETUP.md`.
>
> **Update 2, October 14, 2026:** Real sign-in is in. Default `AUTH_MODE=oauth` uses Google, Discord, and Twitch with hashed server-side sessions (`users`/`sessions` tables, migration 0001). Hosting stays on Cloudflare Workers + D1; see `SETUP.md`. Demo personas remain available with `AUTH_MODE=demo`.
>
> **Update 1, October 14, 2026:** The app now runs standalone in demo mode. `app/chatgpt-auth.ts` was replaced by `lib/auth.ts`, the schema bootstraps itself, and a persona sign-in lets you demo owner, editor, and viewer flows. See `README.md` and `docs/demo-pass-2026-10-14.md`. Steps 1 and 2 below are done for demo purposes; real authentication is still the next step before inviting real users.

Export date: October 14, 2026. Source commit: 582d874fadf6ed348216605229eaebf9596837e9.

## First message to Claude

> Continue developing CreatorArcade from this source. Preserve the existing design and ChallengeHub/ClipCrew workflows. I want to move away from ChatGPT sign-in: replace the Sites identity integration with real authentication appropriate for my chosen host, and configure persistent storage. Read CLAUDE-HANDOFF.md first. Ask which hosting and login provider I want before provisioning external services. Keep owner/editor/viewer permissions and server-side authorization intact.

## What was changed for this handoff

The landing-page wording "Private preview · Sign in with ChatGPT" is now "Private preview". This change was built and published on the existing site. The platform's sign-in flow remains active on that hosted site. This ZIP does not claim to have removed that authentication dependency.

The exported hosting manifest retains the DB binding declaration but omits the original site project identity. The live site's manifest remains unchanged. Dependencies, build output, Git metadata, runtime state, secrets, and live database records are excluded.

## Current product

- ChallengeHub: workspace creation, challenge drafting/publishing, consented clip entries, deadlines, review notes, shortlisting, judging, rankings, results, and an OBS overlay.
- ClipCrew: editor invitations, clip assignments, editing/review/approval stages, feedback, comments, reassignment, archiving, and published links.
- Latest improvements: copy an existing challenge into a fresh draft; bulk accept/shortlist/reject selected entries; filter/search editing tasks; owner CSV export of submissions.
- Owners administer workspaces and judge. Editors operate within membership and assignment permissions. Viewers submit their own consented entries.
- Rejected or broken source clips revoke active editing eligibility. Private judging notes stay separate from viewer-visible explanations.
- Pricing is proposed only. Payments and real video processing are not implemented. This app tracks clip links and editing workflow.

## Code map

| Path | Purpose |
| --- | --- |
| app/page.tsx | Landing page |
| app/globals.css | Product styling |
| app/(workspace)/ | Dashboard, challenges, editing tasks, settings |
| app/c/[slug]/ | Submission page, results, OBS overlay |
| app/api/ | API endpoints |
| components/arcade/ | Forms, shared product UI, navigation |
| features/ | Challenge and task interaction components |
| lib/server/ | Business rules and server-side authorization |
| lib/domain/ | Validation, types, time handling |
| db/schema.ts | Drizzle schema |
| drizzle/ | SQL migration and migration metadata |
| tests/ | Domain, permission, workflow and regression tests |

## Removing the ChatGPT dependency on a new host

This is a React/TypeScript app using Vinext, Vite, and Cloudflare Workers. It has Next-compatible app routes, but is not automatically deployable as a standard Next.js/Vercel project.

1. Replace `app/chatgpt-auth.ts` with an identity adapter backed by securely verified sessions from the selected authentication provider. The current code reads headers that are trusted only behind the original Sites platform. Do not trust user-supplied `oai-authenticated-user-*` headers on an independent host.
2. Update identity calls in `app/page.tsx`, `app/(workspace)/layout.tsx`, `app/c/[slug]/page.tsx`, `app/invite/[token]/page.tsx`, and `lib/server/context.ts`. Replace reserved `/signin-with-chatgpt` and `/signout-with-chatgpt` links with the chosen provider's login/logout routes.
3. Keep `Context.actor.userId` a verified, stable identity. Preserve all role, membership, ownership, entry-consent, and assignment checks. Do not hardcode a shared owner identity or remove authorization to avoid login.
4. `db/index.ts` currently reads a Cloudflare D1 `DB` binding. Either provision D1 on a new Cloudflare deployment or implement the `Database` interface in `lib/domain/types.ts` for the new database. The SQL is SQLite-oriented. Preserve atomic batch behavior used by the domain services; review migrations carefully if changing to Postgres.
5. Review `vite.config.ts`, `build/sites-worker.ts`, `build/sites-vite-plugin.ts`, and connector helpers. Retain them for local reference; replace platform-specific runtime/build integration when moving to another framework or host. Do not remove them blindly before establishing replacement routing and runtime behavior.
6. Account IDs are scoped to the original site. This ZIP contains schema and seed code, not production data. A later live-data migration needs an explicit identity mapping and authorized database export.

## Local development using the current architecture

Prerequisites: Node 24 recommended (the existing project requires >=22.13), and the package manager pinned in package.json: pnpm 11.25.0. These are commands for the recipient's machine; a clean installation was not rerun for this export.

```sh
pnpm install --frozen-lockfile
node --experimental-strip-types --test tests/*.test.ts
pnpm exec tsc --noEmit
node scripts/check-source.mjs
pnpm build
```

Initialize a fresh local D1 database after building (do not run a fresh-schema script against an existing populated database):

```sh
pnpm exec wrangler d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_third_stark_industries.sql
pnpm dev
```

The portable development profile defaults automatically when there is no checkout-local execution profile. It provides loopback-only mock sign-in through the original starter's `/signin-with-chatgpt` route. That mock is a development convenience, not production authentication. `pnpm start` runs the built Worker locally and does not simulate sign-in. See `docs/starter-runtime.md` for runtime details.

## Verification and priorities

The functionality release passed 37 automated tests, TypeScript checks, source checks, and a production build. For the final wording-only change, source checks and the production build were rerun successfully. The uploaded ZIP was checked for archive integrity and completeness against the committed source, with only the manifest sanitization and handoff documentation differing. Browser verification and a clean install of the sanitized ZIP were not performed.

Next priorities: choose independent hosting/auth, complete that migration and its integration tests, verify full user journeys in a browser, then consider billing and public launch. Treat historical docs as product context; this handoff and the user's new instructions take precedence over earlier ChatGPT-specific hosting choices.
