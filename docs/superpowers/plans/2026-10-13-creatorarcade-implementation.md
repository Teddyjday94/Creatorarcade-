# CreatorArcade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a private, functional CreatorArcade preview that takes a viewer challenge from creation through judging to an approved editing assignment.

**Architecture:** One Sites Vinext application with server-enforced identity and workspace roles, D1 persistence, and two connected modules: ChallengeHub and ClipCrew. Keep domain validation, database operations, request authentication, and presentation separate. Clip and deliverable links remain external; the application never downloads or processes their contents.

**Tech Stack:** Sites Vinext starter, React, TypeScript, Cloudflare Worker, D1, Drizzle schema/migrations, native Node test runner. Preserve starter dependency versions and build integration. Node 24.19.0 is available in the current environment; the starter requires Node >=22.13.0.

**Spec:** `docs/superpowers/specs/2026-10-13-creatorarcade-design.md`, approved by Thomas on October 13, 2026. Its original file records the pre-approval status; this plan records the subsequent approval without altering its requirements.

## Global Constraints

- “Build a functional private preview, then prepare a small invited pilot.”
- “ChallengeHub is the primary experience. ClipCrew is a lightweight assignment and approval module using the same entries.”
- “The preview uses durable server storage.”
- “Sample data is clearly marked and isolated in a demo workspace.”
- “Creating a real workspace starts empty.”
- “For the Sites preview, use platform-managed ChatGPT sign-in.”
- “The initial deployment stays owner-private.”
- “Default Thomas's workspace to America/Chicago.”
- “One entry per signed-in viewer per challenge is the initial rule.”
- “Do not fetch submitted URLs, download footage, or automatically embed third-party players.”
- “Editors cannot approve their own deliverables.”
- “Display proposed Free, Creator ($19/month), and Team ($49/month) plans as preview pricing, with payments not yet available.”
- “No public voting or cash-prize handling is included.”
- “Browser verification is performed only through supported preview tooling; any unavailable browser verification is disclosed.”
- No domain purchases, paid subscriptions, live billing, outbound messages, or external game/social account integrations are needed for this build.

## Review Focus

1. Concurrent or retried actions must not duplicate entries, active assignments, invitation redemption, or winner ranks. Cover in Tasks 2, 4, 5, and 6.
2. America/Chicago daylight-saving changes must not silently move the deadline; reject ambiguous/nonexistent local times unless an explicit offset resolves them. Cover in Task 3.
3. Revoked editors and guessed cross-workspace IDs must not expose notes, contact information, or tasks. Cover in Tasks 2, 4, 6, and 8.
4. Unusual URLs, Unicode/long text, and HTML-like input must be rejected or safely displayed without server fetching. Cover in Tasks 3, 4, and 6.
5. Slow requests, stale form versions, and broken links must preserve input and explain recovery without changing judged entries or bypassing deadlines. Cover in Tasks 3, 4, 5, and 7.

## Execution and file map

Recommended method: **Native execution in this session**, because the eight stages share the same schema, authorization, and entry lifecycle. Use one final independent review as required by the execution skill. Do not dispatch implementation agents until an execution method has been selected.

The current repository contains design documents only. At execution, use the worktree skill to establish an isolated application checkout under `/workspace/sites/creatorarcade`; preserve this approved spec and plan in its `docs/superpowers/` tree. Register a new private Site only after execution approval. The supported source workflow owns Git synchronization and deployment.

| Paths | Responsibility |
| --- | --- |
| `app/layout.tsx`, `app/globals.css`, `app/page.tsx` | Shared styles, landing page, product metadata |
| `app/chatgpt-auth.ts` | Retained Sites identity helpers |
| `app/(workspace)/layout.tsx`, `app/(workspace)/dashboard/page.tsx` | Protected shell and workspace overview |
| `app/(workspace)/challenges/page.tsx`, `app/(workspace)/challenges/[id]/page.tsx` | Challenge administration and review |
| `app/c/[slug]/page.tsx`, `app/c/[slug]/results/page.tsx`, `app/c/[slug]/overlay/page.tsx` | Viewer-facing pages and published results |
| `app/(workspace)/clipcrew/page.tsx`, `app/(workspace)/clipcrew/[id]/page.tsx` | Editing board, task detail, feedback |
| `app/(workspace)/settings/page.tsx`, `app/invite/[token]/page.tsx` | Workspace settings and invitation redemption |
| `app/api/workspaces/route.ts`, `app/api/workspaces/[id]/route.ts` | Workspace creation/settings |
| `app/api/invitations/route.ts`, `app/api/invitations/[id]/route.ts`, `app/api/invitations/redeem/route.ts` | Invitation lifecycle |
| `app/api/challenges/route.ts`, `app/api/challenges/[id]/route.ts` | Challenge lifecycle |
| `app/api/challenges/[id]/entries/route.ts`, `app/api/entries/[id]/route.ts` | Submission and judging operations |
| `app/api/challenges/[id]/results/route.ts` | Rankings and publication |
| `app/api/assignments/route.ts`, `app/api/assignments/[id]/route.ts`, `app/api/assignments/[id]/comments/route.ts` | Editor assignment workflow |
| `components/ui/`, `features/workspaces/`, `features/challenges/`, `features/clipcrew/` | Focused client components and form/board presentation |
| `lib/domain/types.ts`, `lib/domain/validation.ts`, `lib/domain/time.ts` | Shared records, validated inputs, deadline conversions |
| `lib/server/context.ts`, `lib/server/http.ts`, `lib/server/access.ts` | Actor resolution, request guards, role policy |
| `lib/server/workspaces.ts`, `lib/server/invitations.ts`, `lib/server/challenges.ts`, `lib/server/entries.ts`, `lib/server/results.ts`, `lib/server/assignments.ts` | Authorized database operations per feature |
| `db/schema.ts`, `db/index.ts`, `drizzle/` | D1 schema, connection adapter, generated migrations |
| `tests/helpers/database.ts`, `tests/*.test.ts` | Actual migration-backed SQLite harness and domain/request tests |
| `scripts/check-source.mjs` | Static route/link and production-boundary checks |
| `docs/verification.md` | Commands, outcomes, and explicit verification limits |

Use same-origin POST/PATCH/DELETE handlers for writes, JSON request bodies, origin checks, bounded body size, and server-derived actors. Do not accept user IDs or roles from clients as authentication. Keep app routes thin; services own permission checks and return saved records. Response envelope: `{data}` or `{error: {code, message, fields?}}`. Use 401 for missing identity, 404 for inaccessible objects, 409 for duplicates/stale state, 422 for invalid inputs, and generic 500 responses with no sensitive values.

Shared service context: `Context = { db: Database; actor: { userId: string }; now: () => Date }`. `Database` exposes parameterized `first<T>(sql, params)`, `all<T>(sql, params)`, and atomic `batch(statements)`; production adapts D1 and tests adapt Node SQLite. Batch results include change counts. Server binding and auth imports stay out of domain/testable services.

Records use UUID string IDs and ISO UTC timestamps; mutable records include integer `version`. Text limits: title 120, display name 60, workspace name 80, description/brief 2000, rules/criteria/feedback 5000, URL 2048. Page size 25, maximum 100. These are implementation defaults, not paid plan limits.

---

### Task 1: Persistent workspace and protected application shell

**Files:** `db/schema.ts`, `db/index.ts`, `lib/domain/types.ts`, `lib/server/context.ts`, `lib/server/http.ts`, `lib/server/access.ts`, `lib/server/workspaces.ts`, workspace routes/layout, `tests/helpers/database.ts`, `tests/workspaces.test.ts`, generated migrations.

**Interfaces:** Produce `createWorkspace(ctx, {name,slug,brandColor,timezone}): Promise<Workspace>`, `getWorkspace(ctx,id): Promise<Workspace>`, `updateWorkspace(ctx,id,input,expectedVersion): Promise<Workspace>`, `requireOwner(ctx,workspaceId): Promise<Membership>`, and `requireMembership(ctx,workspaceId): Promise<Membership>`. Record types follow the spec; persist roles `owner|editor` and treat viewer as an authenticated nonmember acting on published challenges.

- [ ] Set up the approved checkout with the Sites starter, persist the returned private Site ID, configure D1 binding `DB`, retain authentication helpers, and install through the supported helper. Copy the approved documents into the application source.
- [ ] Add native Node tests using `node --experimental-strip-types --test tests/*.test.ts`; the harness applies the generated SQL to `node:sqlite` and implements the production database interface with atomic rollback. Keep test identity injection confined to tests.
- [ ] Write failing tests: `real workspace starts empty` asserts zero challenges/entries/tasks; `creator becomes owner` asserts the actor's ID; `foreign workspace is inaccessible` expects 404; `settings use optimistic concurrency` expects 409 for a stale version.
- [ ] Run `node --experimental-strip-types --test tests/workspaces.test.ts`; expect failures for missing services before implementing them.
- [ ] Define tables for all spec records, foreign keys, workspace slugs, unique `(challenge_id, submitter_id)`, unique `(challenge_id, rank)`, unique `(workspace_id,user_id)` membership, and a partial unique index on nonarchived assignments by entry. Add `version`, audit events, invitation hashes, and demo flags. Generate and inspect migrations with `npm run db:generate`.
- [ ] Implement the service interfaces, server identity adapter, same-origin request checks, and protected shell. Requests without identity cannot create records. Workspace settings validate IANA timezone, a lowercase unique slug, and six-digit hex brand color.
- [ ] Re-run workspace tests; expect PASS. Commit the task's code, tests, and migrations with `feat: add protected persistent workspaces`.

### Task 2: Editor membership and invitations

**Files:** `lib/server/invitations.ts`, invitation routes/page, settings membership components, `tests/invitations.test.ts`.

**Interfaces:** Consume Task 1 context and owner checks. Produce `createInvitation(ctx,workspaceId): Promise<{id:string;token:string;expiresAt:string}>`, `revokeInvitation(ctx,id): Promise<void>`, `redeemInvitation(ctx,token): Promise<Membership>`, `revokeEditor(ctx,workspaceId,userId): Promise<void>`.

- [ ] Write failing tests: `hash only persisted` asserts the raw token is absent from stored rows/audit; `single-use redemption` runs two redemptions and asserts one active membership and one successful use; `expiry boundary` rejects at expiry; `revoked invitation rejects`; `editor cannot invite`; `owner membership cannot be revoked by editor controls`.
- [ ] Run `node --experimental-strip-types --test tests/invitations.test.ts`; expect FAIL for unimplemented operations.
- [ ] Implement random 32-byte base64url tokens, SHA-256 hash storage, seven-day expiry, atomic redemption/member creation, and revocation. Return the raw invitation only once; omit it from logs. The redemption page requires sign-in and a deliberate POST, not a state-changing GET. Use no-referrer policy on invitation pages.
- [ ] Add copy-link and revoke controls; clearly explain that platform access is separately required for the private preview. Re-check active membership on every protected service call.
- [ ] Re-run invitation tests; expect PASS. Commit with `feat: add scoped editor invitations`.

### Task 3: Challenge creation, deadlines, and publishing

**Files:** `lib/domain/validation.ts`, `lib/domain/time.ts`, `lib/server/challenges.ts`, challenge routes/pages/form components, `tests/challenges.test.ts`, `tests/time.test.ts`.

**Interfaces:** Produce `createChallenge(ctx,workspaceId,input:ChallengeInput): Promise<Challenge>`, `updateChallenge(ctx,id,input,expectedVersion): Promise<Challenge>`, `transitionChallenge(ctx,id,action:'publish'|'close',expectedVersion): Promise<Challenge>`, `resolveDeadline(localTime,timezone,offsetMinutes?): string`, and `formatDeadline(utc,timezone): string`. Challenge states are `draft|published|closed|results_published`.

- [ ] Write failing tests: `publish needs required fields`; `viewer cannot publish`; `stale edit rejects`; `deadline extension is audited`; `deadline equality closes submissions`; `nonexistent Chicago time rejects` with 2026-03-08 02:30; `ambiguous Chicago time needs offset` with 2026-11-01 01:30; assert explicit offsets resolve that repeated time to 06:30Z and 07:30Z.
- [ ] Run `node --experimental-strip-types --test tests/challenges.test.ts tests/time.test.ts`; expect FAIL.
- [ ] Implement validation and timezone conversion with explicit offset selection for repeated local times; use Intl to verify candidates. Record UTC and timezone, show timezone beside inputs/deadlines, and derive accepting status from `state === published && now < deadline` on the server.
- [ ] Build draft editor, three editable templates, publish/close actions, challenge list, deadline-extension notice, and audit-backed updates. Forms preserve values on validation, network failure, and version conflict. No state-changing requests run during render.
- [ ] Re-run tests; expect PASS. Commit with `feat: add challenge publishing and deadline rules`.

### Task 4: Viewer entries and private judging

**Files:** `lib/server/entries.ts`, entry API routes, viewer challenge page, submission form and review queue components, `tests/entries.test.ts`, `tests/urls.test.ts`.

**Interfaces:** Produce `submitEntry(ctx,challengeId,input:EntryInput): Promise<Entry>`, `editOwnEntry(ctx,id,input,expectedVersion): Promise<Entry>`, `reviewEntry(ctx,id,{state,privateNote,viewerExplanation,brokenLink},expectedVersion): Promise<Entry>`, `listEntries(ctx,challengeId,{page,pageSize}): Promise<Page<EntryReview>>`, and `getOwnEntry(ctx,challengeId): Promise<ViewerEntry|null>`. Entry states: `pending|accepted|rejected|shortlisted`.

- [ ] Write failing tests: `duplicate and concurrent submission rejected`; `late entry rejected even while challenge remains published`; `consent required`; `judged entry cannot be edited`; `viewer sees only their own status and explanation`; `private note excluded`; `foreign IDs denied`; `Unicode survives but markup remains text`; `excessive lengths reject`.
- [ ] Write URL cases that accept HTTPS clip/video paths from `clips.twitch.tv`, `twitch.tv`, `www.twitch.tv`, `youtube.com`, `www.youtube.com`, `youtu.be`, and `medal.tv`, and reject spoofed suffixes, credentials, non-HTTPS schemes, unsupported paths, and URLs over 2048 characters. No link is fetched by the server.
- [ ] Run `node --experimental-strip-types --test tests/entries.test.ts tests/urls.test.ts`; expect FAIL.
- [ ] Implement transactional entry/audit writes and database-backed duplicate constraints. Enforce owner-only judging and paginated owner queues. Project viewer responses explicitly; never serialize the full entry row into viewer pages.
- [ ] Add link flagging: while submissions remain open, owner can return a broken-link entry to pending and request replacement with an audit record; after the deadline, show the issue without allowing a replacement that bypasses the deadline. Provide a clear rejected/excluded path.
- [ ] Build submission, saved status, owner review controls, filter/search within authorized records, and pagination. Links open safely with `noopener noreferrer`; no automatic players or embeds.
- [ ] Re-run tests; expect PASS. Commit with `feat: add viewer submissions and judging`.

### Task 5: Results and broadcast overlay

**Files:** `lib/server/results.ts`, results API route, results/overlay pages, `tests/results.test.ts`.

**Interfaces:** Produce `setResultRanks(ctx,challengeId,ranks:Array<{entryId:string;rank:number}>,expectedVersion): Promise<Result[]>`, `publishResults(ctx,challengeId,expectedVersion): Promise<Challenge>`, `reopenResults(ctx,challengeId,expectedVersion): Promise<Challenge>`, `getPublishedResults(challengeId): Promise<PublicResult[]>`. `PublicResult` contains only rank, displayName, description, approved clip URL, and safe challenge branding/title.

- [ ] Write failing tests: `only shortlisted entries rank`; `duplicate rank rejects and batch rolls back`; `foreign challenge entry rejects`; `results require closed challenge`; `published ranks freeze`; `reopen is audited and hides public results until republished`; `public projection omits userId, consent, privateNote, and tokens`.
- [ ] Run `node --experimental-strip-types --test tests/results.test.ts`; expect FAIL.
- [ ] Implement atomic rank replacement/publication and explicit result reopening (`results_published` to `closed`), preserving entry closure. Handle stale versions with 409 and reload guidance.
- [ ] Build ordered winner cards and a transparent-background OBS page containing only published results. Refresh the overlay on a modest interval with failure tolerance. Show that private Site access must be solved before use in an external OBS browser source; do not expose a bypass credential in a URL.
- [ ] Re-run tests; expect PASS. Commit with `feat: publish challenge results and overlay`.

### Task 6: ClipCrew editorial workflow

**Files:** `lib/server/assignments.ts`, assignment routes/pages, board/task components, `tests/assignments.test.ts`.

**Interfaces:** Produce `createAssignment(ctx,entryId,input:AssignmentInput): Promise<Assignment>`, `transitionAssignment(ctx,id,action:'start'|'submit'|'request_changes'|'approve',input,expectedVersion): Promise<Assignment>`, `reassignAssignment(ctx,id,editorId,expectedVersion): Promise<Assignment>`, `archiveAssignment(ctx,id,expectedVersion): Promise<Assignment>`, `addComment(ctx,id,text): Promise<AssignmentComment>`, and `listAssignments(ctx,workspaceId): Promise<Assignment[]>`. States: `assigned|editing|in_review|approved` plus independent nullable `archivedAt`.

- [ ] Write failing tests: `pending/rejected entry cannot be assigned`; `inactive/nonmember editor rejected`; `concurrent active assignment rejects`; `editor reads only their assignments`; `revoked editor immediately denied`; `owner requests changes with feedback`; `editor cannot approve`; `deliverable required for review`; `archiving frees active-entry constraint`; `publication URL does not imply automatic publishing`.
- [ ] Run `node --experimental-strip-types --test tests/assignments.test.ts`; expect FAIL.
- [ ] Implement authorized transitions, atomic audit writes, task-scoped comments, owner reassign/archive, and creator attribution. Validate deliverable/publication URLs as HTTPS, bounded, no credentials; display as links without fetching or embedding. Approvals require an owner distinct from the assigned editor.
- [ ] Build accessible status controls and responsive columns/list view; drag and drop is not required. Provide explicit review, request-changes, and approve actions with saved-state feedback. Editors cannot alter assignment scope or the original entry.
- [ ] Re-run tests; expect PASS. Commit with `feat: add ClipCrew assignment and approval workflow`.

### Task 7: Cohesive product experience and demo workspace

**Files:** landing page, dashboard/settings, shared UI/styles, `features/workspaces/demo.ts`, `tests/demo.test.ts`, `scripts/check-source.mjs`.

**Interfaces:** Produce `createDemoWorkspace(ctx): Promise<Workspace>` as an explicit idempotent owner action with clearly labeled sample records; real `createWorkspace` remains empty. Produce `getDashboard(ctx,workspaceId): Promise<{activeChallenges:number;submissionCount:number;shortlistedCount:number;awaitingReviewCount:number}>` using role-appropriate queries.

- [ ] Write failing tests: `demo seed is isolated and idempotent`; `new real workspace remains empty`; `dashboard counts match stored state`; `editor overview contains no owner-only metrics/records`. Run `node --experimental-strip-types --test tests/demo.test.ts`; expect FAIL.
- [ ] Implement the dark navy/cyan/violet design, original geometric graphics, clear empty/loading/error states, field labels, focus states, reduced-motion behavior, and mobile navigation. Dashboard CTAs lead to working forms/queues.
- [ ] Add honest preview pricing ($0, $19/month, $49/month), and sign-in/open-workspace actions. Mark payment availability and sample content clearly. Do not create checkout, fake testimonials, invented usage counts, or notification success messages.
- [ ] Implement optional demo creation with sample labels and no external actions. Keep sample identities and data confined to the demo workspace; no role-switching auth bypass exists in production.
- [ ] Check source routes/links and production boundaries with `node scripts/check-source.mjs`; run demo tests; expect PASS. Commit with `feat: finish CreatorArcade product experience`.

### Task 8: Full workflow verification and private deployment

**Files:** `tests/workflow.test.ts`, `tests/http.test.ts`, `docs/verification.md`, final hosting configuration.

**Interfaces:** Consume all prior service interfaces through real database migrations and thin request adapters. No new product features.

- [ ] Add end-to-end service tests with separate owner, viewer, editor, revoked editor, and outsider actors: create -> publish -> submit -> shortlist -> close -> rank -> publish results -> assign -> edit -> review -> request changes -> resubmit -> approve. Assert saved rows, audit history, and public projections at each stage.
- [ ] Add request checks for missing identity, cross-origin writes, malformed/oversized JSON, client-supplied role spoofing, and unauthorized object IDs. Verify the same policy is applied by every write route.
- [ ] Run `node --experimental-strip-types --test tests/*.test.ts`, `npx tsc --noEmit`, and `node scripts/check-source.mjs`; all must pass. Review generated SQL for uniqueness/foreign-key behavior and confirm no credentials/demo bypass are in production source.
- [ ] Build through the Sites build helper, apply pending local migrations once, and run browser QA only if supported control-browser tooling is available. Exercise landing, creation, submission, judging, results, settings, invitations, and ClipCrew at desktop/mobile widths with keyboard controls. Otherwise record the browser verification limit, retaining server checks.
- [ ] Perform the final independent review required by the selected execution skill; fix material issues and re-run affected checks. Complete `docs/verification.md` with exact passed checks, remaining platform-access constraints, and the distinction between harness multi-user tests and live multi-account verification.
- [ ] Package and synchronize through the Sites source helper, preserving the returned project ID/commit/archive. Publish with the owner-private deployment tool and poll only pending/building/publishing states. Do not broaden audience or purchase a domain.
- [ ] Return the verified private preview URL and concise limitations: ChatGPT sign-in, owner-private access, payments/integrations deferred, external OBS access subject to Site access, and any browser/live-multi-user checks unavailable. Commit final verification documentation through the same supported workflow.

## Coverage and handoff

All spec screens map to Tasks 1–7; permissions and durable records map to Tasks 1–6; timezone/link rules map to Tasks 3–4; commercial boundaries and visual direction map to Task 7; deployment and all ten acceptance criteria map to Task 8. Pilot recruitment and payment setup are future work, not silently included as completed product capabilities.

The requested result is a usable private preview, not a public commercial launch. This plan is ready for review. After approval, choose Native or Subagent-driven execution; implementation begins with the chosen execution skill.
