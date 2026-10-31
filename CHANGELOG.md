# Changelog

## 0.3.1 — 2026-10-31

A round waiting in a conversation you left is no longer lost when you come back. Published to
npm as `@ds-hu/dsh-collaborative-clarity@0.3.1`.

- The Clarity tab no longer depends on the tab's navigation `params` or a `localStorage`
  pointer. It asks the host for the conversation's open round on every mount, and re-reads
  the whole open set on every SSE reconnect, so a reload, a layout switch, a second window,
  or a guide-opened tab all resolve to the same round.
- Any `decided`/`tested` event used to delete every `clarity.lastRound.*` key, which wiped the
  pointer for conversations that had nothing to do with the answer. The pointer is gone; the
  host is the source of truth.
- Opening a conversation whose round is still waiting now opens that round's tab. Previously
  only a round that arrived while its conversation was already on screen opened anything, so
  background rounds only ever showed a dot.
- The tab type is one tab per conversation (`multiple: false`) instead of one tab per round,
  so a restored tab cannot stay pinned to an older round id.
- Aborting a tool call now closes its round and broadcasts `decided`. Before, the round stayed
  `open` forever: still listed by `/rounds`, still dotted in the session row, answerable by a
  browser whose tool call had already returned.

## 0.3.0 — 2026-10-30

A round no longer has to hold the turn, and a test gate can show its evidence rather than
describe it. Published to npm as `@ds-hu/dsh-collaborative-clarity@0.3.0`.

- `clarity_round` accepts `blocking: false`: the round is registered in `ctx.jobs` and the call
  returns `{ status: "pending", roundId, jobId, recommendation }` immediately. The user's
  decision settles that job, so the completion notice wakes the agent and `job_output` returns
  the decision JSON; `job_kill` cancels the round. Blocking stays the default, and several
  non-blocking rounds may be open at once.
- `clarity_test` accepts up to four screenshots by picker, drop, or paste. The chosen one is
  shown large with a filmstrip; files are written to `.clarity/screenshots/<roundId>/` and
  returned as `{ path, bytes }` so the agent can open one with `read_image`. Paste reads both
  `clipboardData.files` and file items, and drop stops propagation so the harness's
  document-level drop target does not also attach the file to the chat composer.
- The comment composer is a two-line textarea: Enter writes a new line, Ctrl/Cmd+Enter adds the
  comment, and comments render with their line breaks.
- Guidance asks for one blocking pseudocode round before a non-trivial implementation, and says
  when a UI round may be non-blocking and resolved with the recommendation instead of waiting.

## 0.2.0 — 2026-10-30

The package is the repository root. What the harness loads sits beside `package.json`
instead of inside `plugin/`, so the repository installs by name:

```powershell
dsh plugin --profile web add link:D:/Projects/dsh-collaborative-clarity
dsh plugin --profile web add github:ds-hu/dsh-collaborative-clarity
```

- Moved `index.js`, `client.js`, `artifacts.js`, `cordis.patch.yml`, `icon.svg` and
  `locale/` to the root; `plugin/test/` became `tests/`.
- Added `scripts/run-tests.mjs` and `pnpm test`: every test file runs, and one red file no
  longer hides the rest.
- Added `./package.json` to `exports`, so the Plugins panel reads the manifest's `icon`
  instead of falling back to the `<package>/icon` resource.
- Dropped the duplicate `plugin/LICENSE` (byte-identical to the root one) and folded
  `plugin/README.md` into the root README.
- No build step and no dependencies: there is no `prepare` script, so a GitHub install needs
  no `allowBuilds` approval.

**Upgrading from 0.1.0:** the installed link points at `…/plugin`, which no longer exists.
Remove and re-add the plugin; the Loader row id and the browser bundle id are unchanged.

## 0.1.0 — 2026-10-29

First installable version, verified in a real round.

- `clarity_round`: one decision, one or two variants, a named recommendation, at least one
  stated foreclosure; blocks until the user chooses, comments, revises, rejects, or cancels.
- `clarity_test`: a real-test gate with a cold-build record and a 3–7 step scenario; only a
  human-run pass marks a feature tested.
- Variants are files, not inline HTML, rendered by extension: document, prose, or numbered
  source with line anchors.
- The `Clarity` tab in the right sidebar, element / quote / line-range annotations, and a
  runtime `pendingInteraction` dot on the session row while a round waits.
- `clarity:guidance`, an always-on system section at order 2950, states the timing rule.
