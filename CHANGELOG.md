# Changelog

## Unreleased

`clarity_test` takes a **prepared** build and an optional **command to run** instead of a "cold
build" — and the tab no longer owns a process at all. This is a breaking schema change twice over:
`coldBuild` became `prepared`, and `warmStart` became `runThis`.

- `prepared: { command, exitCode, builtAt }`; a non-zero exit refuses the round.
- `runThis: string` replaces `warmStart`, and is **text**: the tab shows it with a copy button and
  never executes it. Whoever starts the app — the agent as a background job, or the user in their
  own terminal — ends it.
- `POST /clarity/api/test/start`, `POST /test/cancel` and `GET /test/output` are gone, with the
  running state, **Stop**, the output pane, and `round.start`. Nothing is spawned, so leaving the
  conversation and coming back cannot desync a phase: there is no phase.
- Why: `ctx.shell` returns a handle with no pid, so the process tree cannot be swept, and a
  measured Windows run left a sandboxed descendant serving its port after **Stop** and after the
  verdict. A tab that cannot stop what it started must not start it — see
  `docs/collaboration-draft/rounds/0010-withdraw-process-management`.
- A test round opened by an older host (no `prepared` record) stays testable: the bar says so and
  the trigger opens the observation.
- The docs no longer ask the agent to remove caches: a clean environment is reached by building in a
  scratch checkout, and the clean-machine claim belongs to CI.
- **Docs.** The README is now a short *why + how* page — three ways vibe coding goes wrong, one
  round end to end, one real-test gate — with badges and a language switch. The mechanisms moved to
  the new `AGENTS.md`, and `README.zh-CN.md` is the same page in Chinese. See
  `docs/collaboration-draft/rounds/0011-readme`.
- A comment typed into the composer but never added now travels with the decision instead of being
  dropped. The box clears only after the request lands, so a failed send keeps the text.
- The action row says what it acts on: `Revise B` names the selected variant, `Reject A&B` names
  both, and `Cancel` is now `Decide later`. See `docs/collaboration-draft/rounds/0012-unsent-comment`.
- The panel speaks the GUI's language. Every user-visible string now lives in one `MESSAGES` table
  (`en` and `zh`, identical key sets), registered as the `collaborativeClarity` namespace through
  `ctx.locale`, so Settings → General switches the tab without a reload. A composition without the
  locale service keeps the English table. See `docs/collaboration-draft/rounds/0013-ui-chinese`.
- A visual review of the Chinese panel then rewrote most of it: 「推荐：」 and 「代价：」 end in a
  colon and the foreclosures and fidelity notes are one line each, the anchored notes are
  「批注」, the reject and revise buttons read 「都不要」 and 「继续修改 A」, and the last button
  says 「取消这一轮」 because that is what it does. See
  `docs/collaboration-draft/rounds/0014-naming`.
- The anchor labels follow the GUI language too. `Whole variant`, `Element · …`, `Line 3` and
  `Lines 12–14` were the last English literals on a render path — they leaked into the comment rows
  and the 「正在批注」 line of a Chinese panel — and now come from `anchor.*` keys.
- The test gate ends one way: **Pass**, **Fail**, or **Cancel this test** — cancelling closes the
  round without a verdict, and the prepared build and command stay on screen while you observe. A
  test round's title is its kind rather than `Real test: <candidate>`, and the fidelity map under
  each variant is three aligned rows instead of one dotted line. See
  `docs/collaboration-draft/rounds/0015-test-gate-fixes`.
- **The advice belongs to the variant, not to the round.** `variants[].recommendation` (whichever
  variant carries it is the recommendation; exactly one must) and `variants[].cost` replace
  `round.recommendation` and `round.foreclosures`, which are now **refused** rather than ignored.
  A card reads 产物 → 推荐/代价 → 真实/模拟/省略, and the round-level cost block is gone. Breaking
  for any caller still sending the old fields. See
  `docs/collaboration-draft/rounds/0016-recommendation-place`.
- **An added comment can be rewritten where it sits.** 「编辑」 turns that row's own text into an
  input with 保存 / 取消; the anchor, the variant and the place in the list all survive, an empty
  save is refused instead of deleting the comment, and an edit typed but not saved travels with the
  decision the same way an unsent comment does. See
  `docs/collaboration-draft/rounds/0017-edit-added-comments`.

## 0.3.2 — 2026-10-31

Markdown artifacts are parsed by `markdown-it` instead of a local subset, so a table now reaches
the panel as a table. Published to npm as `@ds-hu/dsh-collaborative-clarity@0.3.2`.

- GFM tables render with their alignment, and a cell's inline syntax (`code`, bold, links)
  behaves as it does everywhere else. A row without its `--- | ---` delimiter line is still
  prose, and an escaped `\|` stays inside its cell.
- The rest of CommonMark/GFM arrives with it: nested lists, setext headings, strikethrough, and
  bare URLs as links — all of which used to leak through as literal text.
- The security shape is unchanged: raw HTML stays escaped (`html: false`), a
  `javascript:`/`vbscript:`/`file:` destination never reaches an `href`, and an image becomes a
  link to its source rather than a fetch from the sandboxed document.
- The hand-written block parser is gone; `artifacts.js` keeps only the document wrappers. The
  package now has one runtime dependency, `markdown-it` (pure JavaScript), and the publish
  workflow installs it before running the tests.

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
