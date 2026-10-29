# 06 — Implementation

**Status:** prototype · 2026-10-29
**Package:** [plugin/](../../plugin/) · `dsh-collaborative-clarity@0.1.0`
**Verified:** one decision round accepted, one real-test gate passed (third attempt)
**Not yet:** preset-level `ask_user_question` removal, element/text anchors, command-running test trigger

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
| Host store and tool bodies | `node plugin/test/store.test.mjs` | 5 passed |
| Client facade and slot registrations | `node plugin/test/client.test.mjs` | 2 passed |
| HTTP routes and error shapes | `node plugin/test/api.test.mjs` | 2 passed |
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

## What is not built

These are gaps against the specification, not hidden features:

- **`ask_user_question` is not hidden.** The plugin adds tools; it does not compose a
  preset that removes the old one. The tool descriptions tell the agent not to use it for
  a round, but the composition does not enforce that. Closing this needs a preset (or a
  scoped restriction) that swaps the two.
- **Annotations are variant-level only.** The panel supports comments on a variant and a
  note to the agent; it does not yet support element, text-quote, or line anchors, and it
  does not reconcile anchors across versions.
- **The test gate records a result; it does not run a command.** The agent supplies the
  cold-build record and the scenario; the user presses the trigger and records pass, fail,
  or blocked. The "run the recorded command" part of [03](03-surface.md) and
  [04](04-verification.md) is still a target.
- **Rounds are in-memory.** A restart loses open rounds. The decision remains in the
  session log and the tracked round folder, but the live tab cannot survive a restart.
- **Host changes need a restart.** Client changes hot-reload. The `/clarity/api/rounds`
  route was added after the installed host started and is therefore not live in the
  current process; the client does not depend on it. It uses `/round` and a localStorage
  fallback for the guide tab.
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
2. Add element and text anchors to the artifact iframe, using the `postMessage` protocol
   described in [03](03-surface.md).
3. Make the test trigger run the recorded cold-build command in a terminal tab and write
   `test.md`.
4. Persist round manifests and decisions to `docs/collaboration/rounds/` automatically.
5. Re-test the session-row dot in a second workspace and while another agent is running.
