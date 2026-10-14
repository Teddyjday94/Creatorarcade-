# CreatorArcade verification

Private preview build, October 14, 2026 UTC.

## Verified

- 28 tests pass using `node --experimental-strip-types --test tests/*.test.ts`.
- The tests use the actual generated migration SQL in SQLite with an atomic adapter matching D1's null results and batch rollback.
- Separate owner, viewer, editor, outsider, and revoked-editor identities exercise the services without adding a production role-switching bypass.
- The complete create/publish/submit/shortlist/close/rank/publish-results/assign/edit/review/request-changes/approve workflow passes.
- Deadline equality, America/Chicago daylight-saving gaps and repeated times, consent, duplicate submissions, assignment uniqueness, single-use/expired/revoked invitations, private-note projection, cross-origin writes, malformed JSON, and request size checks pass.
- TypeScript checks and core-route/production-boundary source checks pass.
- The Sites Worker production build completed successfully with all required app and API routes.

## Limits

- Supported browser-control tooling is unavailable in this managed environment. Desktop/mobile rendering, keyboard interactions, and live browser hydration have not been visually tested.
- Live multi-account behavior has not been tested. Identity isolation was verified with the controlled database/service harness.
- Initial deployment is owner-private and requires ChatGPT sign-in. Editor invites and viewer links cannot bypass the platform audience restriction.
- External OBS browser sources require authorized access to the private Site. No access credential is embedded in overlay URLs.
- Billing, video processing, AI clip detection, social publishing, and platform account connections are deferred.
- Demo entries are illustrative and use an official trailer as a sample media reference. They are clearly separated from empty real workspaces.

## Implementation decisions

- Native execution was selected following approval of that recommendation. If the intended choice was per-task subagents, the cost is less independent review during implementation; a final independent review is required.
- Feature services were implemented in task order and their UI was completed together. The cost is that visual issues become apparent later in the build; browser QA remains a disclosed limit.
- The published-results service accepts an injected Context in addition to its ID so tests and production use the same database path. This changes an internal function signature only.

## Independent review

A fresh reviewer found no Critical issues and two Important issues. Both were verified and fixed in one test-backed pass:

- Withdrawing acceptance (pending/rejected) or marking a source broken now atomically archives active editing tasks. Editor reads and mutation guards independently require an accepted/shortlisted working source. Replacement unreviewed clips cannot become visible through old assignments.
- Text input drafts are controlled independently from refreshed server versions. Version-based form remounts were removed. Fields are locked while saving, and explicit refresh recovery preserves drafts.

Four added regression tests failed before the corresponding fixes and passed afterward. The full suite passes 28/28 tests, TypeScript checks pass, and source checks pass. Browser interaction remains unverified; reducer tests establish the draft state behavior, not full live browser behavior.

No minor findings were deferred. The reviewer set aside browser/live-platform behavior because tooling is unavailable, paid/public-launch capabilities because they are outside the approved scope, and unmodified starter assets because this was a feature review. Those boundaries remain explicit verification limits.

The final corrected source will be rebuilt and published through the supported private Sites workflow.
