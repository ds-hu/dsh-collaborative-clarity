# 06 — Implementation

**Status:** prototype · 2026-10-29
**Package:** [plugin/](../../plugin/) · `dsh-collaborative-clarity@0.1.0`
**Verified:** one decision round accepted, one real-test gate passed (third attempt),
anchors captured in a contract test and a browser harness
**Not yet:** preset-level `ask_user_question` removal, anchor reconciliation across
versions, command-running test trigger, a human pass on the anchor round

This document records what exists in the repository, what was actually observed, and
what remains a gap. It is written after the build, not as a promise before it.

## What was built

A two-half DSH plugin with no build step and no runtime dependencies outside the
harness:

| Half | File | What it does |
|---|---|---|
| Host | [plugin/index.js](../../plugin/index.js) | Registers `clarity_round` and `clarity_test`, keeps rounds in memory, serves `/clarity/api`, waits on a promise, and resolves it from the browser's submit |
| Client | [plugin/client.js](../../plugin/client.js) | Registers the `clarity` tab type, its body and chip, the session-row pending dot, and one SSE connection; renders the round and posts decisions |
| Bundle | [plugin/package.json](../../plugin/package.json), [plugin/cordis.patch.yml](../../plugin/cordis.patch.yml) | `dsh.bundle.patch` + `dsh.client` declaration; one Loader row |
| Metadata | [plugin/icon.svg](../../plugin/icon.svg), [plugin/locale/en.json](../../plugin/locale/en.json) | Plugin Manager title, description, and icon |

The host imports nothing from `@deepseek-ai/*`; it uses `ctx.tools` and `ctx.webServer`
directly. The client imports only `react` from the browser module table. That avoids the
duplicate-module problem a `link:` install would create if the plugin pulled its own copy
of a harness package.

## The flow

```
clarity_round / clarity_test
        │
        ▼
  RoundStore.open(round)
        │  SSE /clarity/api/events
        ▼
  client opens the Clarity tab
        │
        ▼
  user chooses / comments / tests
        │  POST /clarity/api/decide or /test
        ▼
  RoundStore.settle → the tool call returns
```

The model is blocked on the tool promise; there is no polling and no token cost while
waiting. If the tool call is aborted, the waiter resolves `{status:"cancelled"}`.

## What was verified

### Contract checks

| Check | Command | Result |
|---|---|---|
| Host store and tool bodies | `node plugin/test/store.test.mjs` | 6 passed |
| Client facade, bridge injection, anchor labels | `node plugin/test/client.test.mjs` | 3 passed |
| HTTP routes, anchor validation, error shapes | `node plugin/test/api.test.mjs` | 3 passed |
| Syntax | `node --check plugin/index.js`, `node --check plugin/client.js` | passed |

`node --test` cannot run in this sandbox (it spawns a child process and dies with
`spawn EPERM`), so the tests are plain `node <file>` runs with the built-in `node:test`
harness.

### Live checks

- The bundle is installed in the web profile as
  `dsh-collaborative-clarity: link:D:/Projects/dsh-collaborative-clarity/plugin`.
- The Loader row `include:collaborative-clarity` is `active`.
- `Tool.listTools` returns `clarity_round` and `clarity_test` with their schemas.
- `Slots.listSubTree` shows the body under `sidebar.right.pane.tab`, the chip under
  `sidebar.right.pane.tab.title`, and `clarity-pending` under
  `sidebar.session.row.leading`.
- `GET /clarity/api/health` returns `200 {"ok":true}`.
- **Round 0001** (`clarity-mvtlhcdo-c26616`) was accepted through the sidebar:
  `{"status":"decided","verdict":"accept","selected":"a"}`. The decision is tracked in
  [rounds/0001-tab-variant-budget](rounds/0001-tab-variant-budget/round.md).
- **Real test 1** failed on the attention indicator: the bottom-right pill was rejected.
- **Real test 2** failed: the session row showed no dot while the tool waited.
- **Real test 3** passed with "Good!" after the plugin registered a runtime
  `pendingInteraction` of kind `question` and the row showed the shared warning dot and
  the trailing `Answer` label. The record is
  [rounds/0002-session-attention/test.md](rounds/0002-session-attention/test.md).

The third test is the one that matters: it is a human observation of the running plugin,
not a green contract test.

## The attention indicator

The first implementation added a bottom-right `Round waiting` pill. The user rejected it:
the mark belongs on the session row, visible while multitasking.

The final implementation does two things:

1. **Publishes a pending interaction** through `ctx.uiSession.registerPendingInteraction`
   with `kind: "question"`. The workspace row then renders the shared warning dot and
   replaces the trailing time with `Answer`; this works even while the row is otherwise
   busy.
2. **Registers a leading-cell occupant** under `sidebar.session.row.leading` that shows a
   yellow dot when a round for that session is pending. The seat only mounts when the
   row's primary status is idle, so it never competes with the shared warning dot.

No bottom-right pill remains.

## Anchors

A comment can now point at a location instead of only at a variant. The four kinds match
[03 §Annotation](03-surface.md#annotation):

```ts
type Anchor =
  | { kind: "element"; selector: string; text?: string }
  | { kind: "text"; quote: string; prefix?: string; suffix?: string }
  | { kind: "line"; path: string; start: number; end: number }
  | { kind: "variant" }
```

The client injects a bridge into each `srcDoc` before the iframe loads. The iframe is
sandboxed with `allow-scripts` and no same-origin, so the bridge cannot read the parent and
the parent cannot read the iframe. They use `postMessage`:

- parent → iframe: `{ __clarity: true, type: "mode", enabled }`
- iframe → parent: `{ __clarity: true, type: "anchor", variantId, anchor }`
- parent → iframe: `{ __clarity: true, type: "focus", anchor }` to flash a comment's spot

The parent accepts a message only when `event.source` is the iframe it rendered for that
variant. It does not trust `event.origin`: a sandboxed iframe has an opaque origin, so the
source comparison is the identity check.

The host validates every anchor before it reaches the model. An element needs a non-empty
`selector`; text needs a non-empty `quote`; a line needs a `path` and `start <= end`; a
variant has no fields beyond `kind`. Unknown fields are refused, so a malformed anchor is a
`400` rather than a silent drop. Each comment also carries an 8-hex `artifactHash` computed
from the variant HTML.

### What the browser harness proved

A generated harness embedded the **exact** `clarityBridge` source extracted from
`client.js`, opened it in Chromium through the Playwright MCP, and logged the messages:

| Action | Message |
|---|---|
| Click `<button data-anchor="save">` | `{kind:"element", selector:"[data-anchor=\"save\"]", text:"Save"}` |
| Drag-select the intro | `{kind:"text", quote:"Press Continue to go on.", prefix:"", suffix:""}` |
| Click line 1, Shift-click line 2 | `{kind:"line", path:"src/retry.ts", start:10, end:11}` |

The harness is generated, not committed; the generator is the `clarity-bridge` markers in
`client.js` plus the same `withBridge` used by the panel. The unit test asserts that the
injection adds the config and bridge scripts and that the labels stay stable.

What this does **not** prove: the parent panel's message handler, the composer, and the
`/decide` round-trip in the actual DSH page. Those need the human gate in
[rounds/0003-anchors](rounds/0003-anchors/round.md).

## What is not built

These are gaps against the specification, not hidden features:

- **`ask_user_question` is not hidden.** The plugin adds tools; it does not compose a
  preset that removes the old one. The tool descriptions tell the agent not to use it for
  a round, but the composition does not enforce that. Closing this needs a preset (or a
  scoped restriction) that swaps the two.
- **Anchors are captured but not reconciled.** A revised variant is a new artifact, so an
  anchor from the previous version is not re-found, not shown as orphaned, and does not
  block accept. The reconciliation order in [03](03-surface.md#annotation) is still a
  target. `annotations.jsonl` is also not written automatically; the anchors live in the
  decision result.
- **The line anchor is click, not gutter drag.** It needs a `<pre>` in the artifact (with
  optional `data-path` and `data-line-start`); a UI-only artifact has no line anchor.
- **The text anchor needs a drag.** A plain click on text becomes an element anchor, which
  is deliberate: a click should not silently become a one-word quote.
- **The test gate records a result; it does not run a command.** The agent supplies the
  cold-build record and the scenario; the user presses the trigger and records pass, fail,
  or blocked. The "run the recorded command" part of [03](03-surface.md) and
  [04](04-verification.md) is still a target.
- **Rounds are in-memory.** A restart loses open rounds. The decision remains in the
  session log and the tracked round folder, but the live tab cannot survive a restart.
- **Host changes need a restart.** Client changes hot-reload. The anchor schema was added
  to `plugin/index.js` after the installed host started, so the current process validates
  comments with the old schema and drops `anchor` and `artifactHash` from the result. The
  client will show the controls after a browser reload, but the round-trip is only complete
  after the DSH web process is restarted.
- **Single-user, single-browser.** There is no multi-user presence or assignment.
- **No real cold-build runner.** "Cold build" is evidence passed to `clarity_test`; the
  plugin does not execute it.

## Install and remove

The sanctioned path is the plugin manager, not hand-editing the profile:

```text
plugin_manager install_bundle  target: link:D:/Projects/dsh-collaborative-clarity/plugin
plugin_manager remove_bundle   target: dsh-collaborative-clarity
```

The profile currently contains the link and the bundle in `dsh.profile.bundles`.

## Tests

```powershell
node --check plugin/index.js
node --check plugin/client.js
node plugin/test/store.test.mjs
node plugin/test/client.test.mjs
node plugin/test/api.test.mjs
```

## Next

1. Add a grilling preset that hides `ask_user_question` and exposes `clarity_round` /
   `clarity_test`, so the agent cannot take the prose path.
2. Reconcile anchors when a variant is revised: exact selector/quote/line, then same text or
   prefix/suffix, then fuzzy, then show the anchor as orphaned. A blocking orphan must stop
   accept instead of disappearing.
3. Write `annotations.jsonl` next to the round's tracked artifacts, append-only, and cite the
   annotation ids in the decision record.
4. Make the test trigger run the recorded cold-build command in a terminal tab and write
   `test.md`.
5. Persist round manifests and decisions to `docs/collaboration/rounds/` automatically.
6. Re-test the session-row dot in a second workspace and while another agent is running.
