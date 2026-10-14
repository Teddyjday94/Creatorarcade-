# CreatorArcade functionality upgrade

Approved scope: repeat challenges, bulk judging, ClipCrew filters/overdue labels, and owner-only submission CSV exports.

## Resulting behavior

- Repeating any owned challenge creates a fresh draft with a unique link, copied rules/content, and a new deadline seven days from creation. Entries, results, and tasks are not inherited. A stale source version prevents duplication.
- Owners can select entries on the current review page and accept, shortlist, or reject them together. Notes, viewer explanations, permission timestamps, and broken-link flags stay intact. The server validates every selected version and challenge relationship before applying one atomic batch. Rejection archives active editing assignments through the same transaction.
- ClipCrew filters combine literal text search, task state, editor, and overdue status. Editors remain restricted to their own eligible assignments. Approved work is not labeled overdue. The existing 100-task result cap remains unchanged.
- CSV exports stream all entries, beyond the visible page, in database chunks. They contain contributor names, descriptions, clip links, decisions, consent timestamps, and submission timestamps. Private notes and account identities are excluded. Quoting handles commas/newlines/quotes and leading spreadsheet formula characters are neutralized.

## Verification

The original 28 tests passed before changes. Nine new tests were observed failing before the implementation and passing afterward. The combined suite passes 37/37 tests. TypeScript and source checks pass.

Independent review verified the services, including a 501-entry streamed export and revocation blocking later chunks. One Important usability finding was fixed: editor filter options and owner board cards now identify editors with stable account identifiers, consistent with the existing assignment picker, rather than membership-order numbers. A regression test verifies stable labels across reordering and revocation. No Critical or Minor findings were reported. Production packaging follows these checks. No database migration or new dependency is needed. Audience remains owner-private.

## Verification limits

Supported browser-control tooling remains unavailable in the managed environment. No browser/hydration or live multi-account verification is claimed. Existing private preview access requirements and deferred billing/integrations remain unchanged.
