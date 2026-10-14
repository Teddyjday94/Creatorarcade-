# CreatorArcade: first-release design

Prepared for Thomas Day | October 13, 2026

Status: proposed written design for review. The product direction was approved in conversation; this specification requires review before implementation planning. CreatorArcade is a working name, with domain and brand availability unverified.

## Product goal

Give gaming creators one workflow for running viewer challenges and turning selected submissions into publishable content. ChallengeHub attracts and organizes entries; ClipCrew handles the editorial handoff. The paying customer is the creator or community owner. Viewers participate free.

The first release should let a creator complete one real challenge without managing submissions or assignments in a spreadsheet. GTA VI is the initial marketing theme; the product must also work for existing games without game APIs, multiplayer support, or automatic access to player statistics.

## Release approach

Build a functional private preview, then prepare a small invited pilot. ChallengeHub is the primary experience. ClipCrew is a lightweight assignment and approval module using the same entries. These are not separate applications or a video-processing platform.

The preview uses durable server storage. Sample data is clearly marked and isolated in a demo workspace. Creating a real workspace starts empty. No success messages imply that payments, external messages, or social posts occurred unless those actions are actually implemented.

An integrated workflow is preferable to two separate products because an approved entry can become an editing assignment without copying its details. Launching two fully independent platforms would increase setup and sales complexity. A clipping engine would add substantial processing costs before validating the coordination problem.

## Roles and access

| Role | Permissions |
| --- | --- |
| Owner | Manage workspace, membership, challenges, judging, assignments, and final editorial approval |
| Editor | View accepted entries assigned to them, update their assignments, submit deliverable links, read and respond to feedback |
| Viewer | View published challenges and results; submit and inspect their own entries |

Every server operation checks signed-in identity and membership. Knowing an entry ID or workspace slug never grants access. Editors cannot view pending/rejected entries or other editors' private tasks. Viewer contact/account data does not appear on public results or overlays.

For the Sites preview, use platform-managed ChatGPT sign-in. This requires a ChatGPT account and is a pilot limitation, not a final decision about consumer authentication. No separate email/password, Discord, or Twitch login is included in this release. The initial deployment stays owner-private. Wider participant access must be configured deliberately before inviting testers; a private deployment cannot be advertised as a public submission portal.

Owners can create single-use invitation links for editors. Store only token hashes with expiry and workspace/role scope. Redeeming a link requires sign-in; redemption and membership creation happen atomically. Revocation blocks future redemption. Invitation acceptance cannot make a private Site accessible by itself: platform audience and app membership are separate controls.

## Screens and navigation

1. Landing page: explain the workflow with a concrete challenge example, feature overview, proposed plans, and a functional sign-in/dashboard action.
2. Workspace overview: active challenges, submission counts, shortlisted entries, and editing tasks awaiting attention. Numbers come from stored records.
3. Challenges: draft, published, and closed challenges, with create/edit controls.
4. Creator challenge detail: rules, deadline, submissions, judging, and results controls.
5. Viewer challenge page: game, rules, deadline, permitted clip sources, entry form, and own-entry status.
6. ClipCrew: assignments in Assigned, Editing, In review, and Approved columns, with feedback and deliverable links.
7. Results and overlay: ordered finalists/winners using creator-chosen ranks and display names.
8. Settings: workspace title, slug, brand color, owner/editor membership, and invitation management.

Primary navigation is Overview, Challenges, ClipCrew, and Settings. Keep creator administration separate from the viewer-facing challenge page. Small screens use compact navigation and accessible lists instead of a cramped horizontal board.

## ChallengeHub workflow

Owner creates a challenge with title, game, description, rules, closing date/time, and judging criteria. Initial templates are Funniest moment, Best stunt, and Best screenshot/clip moment; templates are editable prompts, not verified game mechanics.

Challenge states are Draft -> Published -> Closed -> Results published. Publishing requires a title, rules, deadline, and judging criteria. Once published, the owner can correct description/rules with an audit record; deadline extensions are visible. Publishing results freezes ranks until the owner explicitly reopens result editing, which is logged.

Viewers submit a display name, short description, and HTTPS clip link from Twitch, YouTube, or Medal. A required checkbox confirms ownership or permission and consent for the creator to feature the submission. The owner sees the recorded consent timestamp. One entry per signed-in viewer per challenge is the initial rule. Viewers can edit their entry before the deadline while it is pending. They cannot change an entry after it has been reviewed or the challenge has closed.

Server time enforces deadlines even if an owner has not manually closed the challenge. Store timestamps in UTC, collect the creator's IANA timezone, and display deadlines with the timezone. Default Thomas's workspace to America/Chicago.

Entry states are Pending, Accepted, Rejected, and Shortlisted. Judges can record private notes and an optional viewer-visible explanation. Winners are ranked shortlisted entries; duplicate ranks are rejected. No public voting or cash-prize handling is included.

The judging interface uses click-to-open clip links. Do not fetch submitted URLs, download footage, or automatically embed third-party players. Validate exact permitted hostnames, HTTPS, length, and URL structure; reject credential-bearing URLs and unsupported schemes. Broken/deleted clips can be flagged and the entrant can be asked to replace the link before judging proceeds.

## ClipCrew workflow

An owner selects an accepted/shortlisted entry and creates an assignment. Each assignment has an editor, brief, target format, due date, status, and feedback thread. The entry's creator attribution is carried into the task.

Status transitions: Assigned -> Editing -> In review -> Approved. Owner-requested changes move In review back to Editing. An editor submits a validated HTTPS deliverable link; actual source files and rendered videos remain in the team's chosen external tools. An owner approves or requests changes with feedback. Editors cannot approve their own deliverables.

Prevent duplicate active assignments for the same entry with a server-side constraint. Owners can reassign or archive tasks, with an audit record. Approved means the deliverable has passed owner review; it does not mean it has been posted to a social network. An optional publication URL can record where the owner later posted it.

## Visual direction

Use a clean dark gaming interface: near-black/navy backgrounds, crisp white typography, cyan primary actions, and restrained violet accents. Challenge cards should feel energetic; review tables and task details should remain calm and legible. Use original geometric graphics and user-provided branding rather than unlicensed game artwork or misleading publisher logos.

The dashboard's most prominent actions are Create challenge, Review submissions, and Review edits. Avoid decorative charts without meaningful data. Clearly distinguish sample entries, empty states, saved changes, and real submissions. Include visible focus states, keyboard-operable controls, readable contrast, reduced-motion support, and mobile layouts.

## Data and architecture

Use the supported Sites Vinext starter for server-rendered pages and server endpoints, deployed as a Cloudflare Worker. Use D1 for persistent structured data. No R2/video storage is required for this link-based release. Authentication stays in the platform's server-only helpers; client-supplied identities are never trusted.

Core records:

- Workspaces: owner identity, name, slug, brand color, timezone.
- Memberships: workspace, user identity, role, status.
- Invitations: workspace, role, token hash, expiry, redemption/revocation state.
- Challenges: workspace, creator, title, game, rules, judging criteria, deadline, state.
- Entries: challenge, submitter identity, display name, clip URL, description, consent timestamp, state, review notes.
- Results: challenge, entry, unique rank, publication state.
- Assignments: workspace, entry, editor, brief, format, due date, status, deliverable URL, publication URL.
- Assignment comments: assignment, author, text, timestamp.
- Audit events: workspace, actor, action, target record, timestamp, minimal change metadata.

All reads and writes include workspace/role checks. State transitions and related audit writes are atomic. Pagination prevents large submission queues from rendering unbounded records. Database migrations are generated and committed; schema changes never run during a normal request.

Persisted writes must return the saved server record. Forms retain entered values after validation/network failures. Repeated submissions should not create duplicate entries or assignments. Errors disclose only the information the caller is authorized to see. No arbitrary URL previews or external fetches are performed.

## Commercial scope

Display proposed Free, Creator ($19/month), and Team ($49/month) plans as preview pricing, with payments not yet available. Use an honest pilot-access call to action; no fake checkout or subscription state. Pilot participants are granted access manually. Paid-plan enforcement and billing are a later release, after workflow validation.

Not included in this release: automatic clip detection, video uploads/rendering, AI transcription, direct social publishing, Twitch/Discord account connections, public voting, prize payouts, game-stat ingestion, or automated email/Discord notifications.

## Validation and acceptance

The build is ready for private review when:

1. An owner can create, publish, and close a challenge, reload, and find the same saved state.
2. A viewer can submit a valid entry and inspect their own status; duplicate and late entries are rejected server-side.
3. An owner can shortlist entries, assign unique winner ranks, and publish results.
4. An owner can invite an editor, assign an accepted entry, request changes, and approve a submitted deliverable.
5. An editor cannot access unrelated private entries or approve their own work.
6. A viewer cannot mutate judging, results, membership, or tasks; guessed IDs do not bypass authorization.
7. Results/overlay output includes only published display data and never contact information, private notes, or invitation tokens.
8. UTC storage and America/Chicago display handle deadlines correctly, including daylight-saving transitions.
9. Forms, navigation, judging, and assignments work with keyboard input and narrow/mobile layouts.
10. Build and meaningful checks for authorization, transitions, deadlines, link validation, and duplicate prevention pass. Browser verification is performed only through supported preview tooling; any unavailable browser verification is disclosed.

Multi-user acceptance requires an accessible invited pilot audience and actual separate identities or a controlled test harness for server authorization. An owner clicking through seeded demo roles alone is not proof of multi-user isolation.

## Pilot success criteria

Recruit creators who already organize viewer events. Aim for three paid-pilot commitments before enabling subscriptions, with no guarantee of conversion. Measure completed challenges, organizer review time, repeat challenge creation, entries that become approved deliverables, and why participants stop using the tool.

The key retention question is whether a creator wants to run the next event through the same workspace. GTA interest is an acquisition hypothesis; ongoing community operations are the recurring-value hypothesis.

## Review checkpoint

Approve this written specification or identify changes to scope, workflow, visual direction, or authentication. Written-spec approval permits preparation of the implementation plan. Implementation begins after the written plan is reviewed and its execution method is selected.
