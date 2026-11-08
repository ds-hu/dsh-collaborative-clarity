# AGENTS.md

For an agent or a contributor working **on** this plugin. The
[README](README.md) is for someone deciding whether to install it; this file is the mechanism,
the rules that must not drift, and the loop for changing them.

## Layout

| Path | What it is |
| --- | --- |
| [index.js](index.js) | Host half: the two tools, the round store, `/clarity/api`, the wait, the guidance section |
| [client.js](client.js) | Browser half: the `Clarity` tab, the artifact iframe and its bridge, the session-row mark, the decision row in the transcript |
| [artifacts.js](artifacts.js) | Renders a variant file by extension: document, prose, or numbered source |
| [cordis.patch.yml](cordis.patch.yml) | The one Loader row this package contributes |
| [locale/](locale/) | Plugins-panel title and description |
| [tests/](tests/) | Seven files, one per surface; [scripts/run-tests.mjs](scripts/run-tests.mjs) runs them all |
| [docs/collaboration-draft/](docs/collaboration-draft/) | The design, the vocabulary, the ledger, and every round record |

There is no build step. `index.js`, `client.js` and `artifacts.js` are the shipped files.

## Two halves, two lifetimes

The host half runs in the DSH process. The browser half is a classic script loaded through
`window.__ModuleLoader__.load({ id, factory })`; it is not bundled and not imported.

- **A change to `client.js` hot-reloads.** Reload the page if the bundle looks stale.
- **A change to `index.js` needs a restart of the DSH web process.** Until then the old code
  answers, and a route probe is the only honest way to know which one you are talking to.

## Invariants

These are guarded by tests. If a change makes one of them false, the test is the finding, not
the obstacle.

1. **The tab owns no process.** There is no route that starts, reads, or stops one, and no
   `start` field on a round. `tests/api.test.mjs` asserts `/test/start`, `/test/cancel` and
   `/test/output` stay `404`; `tests/store.test.mjs` asserts `warmStart` is a hard error;
   `tests/client.test.mjs` asserts an old record draws no process control. Why: `ctx.shell`
   returns a handle with no pid, so the tree cannot be swept, and a measured Windows run left a
   sandboxed descendant serving its port after **Stop**. A tab that cannot stop what it started
   must not start it — see [round 0010](docs/collaboration-draft/rounds/0010-withdraw-process-management/round.md).
2. **A variant is a file, and the file is the record.** The round stores the path it read, so an
   artifact can be edited and reopened without being resent. Nothing about a variant lives only
   in the round document.
3. **Nothing inside an artifact makes a network request.** The iframe is sandboxed without
   same-origin; the bridge is injected into `srcDoc` and speaks to the panel by `postMessage`;
   the panel checks `event.source`; the host validates every anchor before the model sees it.
   Markdown is parsed with `html: false`, and an image becomes a link to its source.
4. **`/clarity/api` sits outside the auth fence.** That is why the browser half can call it at
   all. Never add a route there that takes a filesystem path, spawns anything, or answers about
   a conversation the caller is not in.
5. **Arguments are refused, not dropped.** The registry hands arguments over unvalidated;
   `refuseUnknown` is where the schema is enforced. A retired field must fail loudly, not be
   ignored — that is how `warmStart` and `coldBuild` were removed.
6. **A claim may not exceed its evidence.** `proposed`, `agreed`, `built`, `prepared`, `tested`,
   `verified`. Only a human-run real test promotes a change to `tested`; the vocabulary is
   normative in [CONTEXT.md](docs/collaboration-draft/CONTEXT.md).
7. **The transcript row is a projection, not a store.** `decisionNode` derives it from the recorded
   `tool/call` and `tool/result`; it never reads the plugin store and never answers a request. Each
   kind words only its own verbs — `accept` / `revise` / `reject` for a `clarity_round`,
   `pass` / `fail` / `blocked` for a `clarity_test` — and anything else (cancelled, pending, errored,
   unreadable, or the other kind's verb) draws no row and leaves the tool row where it was. A
   screenshot is a file name with its path in the title, opened through the chat's `openFile`; the
   row never builds a URL or a filesystem read of its own. `tests/client.test.mjs` folds events
   through the definition and asserts both halves; removing either verb list reddens it.

## The host half

- **Tools.** `clarity_round` (one decision, one or two variant files, a recommendation, at least
  one foreclosure) and `clarity_test` (candidate, the prepared build, an optional command to
  copy, a 3–7 step scenario). Both block by default; `blocking: false` registers the round with
  `ctx.jobs` and returns `{ status: "pending", roundId, jobId, recommendation }`. Without
  `@deepseek-ai/dsh-tool-jobs` in the profile, `ctx.jobs` is absent and a non-blocking request is
  refused before any round is published.
- **Routes.** `GET /rounds`, `GET /round`, `POST /decide`, `POST /test`, `GET /events` (SSE),
  `GET /health`. Everything is under `API_PREFIX = '/clarity/api'`; the router slices that prefix
  and dispatches on the remainder. A round is created by the tool, never by the browser, so there
  is no write route that publishes one.
- **The store.** One round per conversation, keyed by the session ID the tools already carry. A
  round survives leaving the conversation; the client holds no round id and asks on every mount,
  reconnect, and round event.
- **The prompt section.** `clarity:guidance` at order `2950`, inside the tool-section region. It
  carries the timing rule only; the mechanism lives in the tool description. It is registered
  through `ctx.get('systemPrompt')` rather than an inject requirement, so a composition without
  the prompt service keeps the tools and loses only the section.

## The browser half

- **Registration.** `TAB_ID = 'dsh-collaborative-clarity'`, registered under
  `sidebar.right.pane.tab` (and `.title`), one tab per conversation, with a guide entry.
- **Attention.** While a round waits, the session row gets a runtime `pendingInteraction` of
  kind `question`, which is what draws the shared warning dot and the trailing `Answer` label.
  It is not a custom pill.
- **Language.** Every user-visible string lives in the `MESSAGES` table at the top of
  `client.js` — `en` and `zh` with identical key sets, which a test enforces. `apply` registers
  the `collaborativeClarity` namespace through `ctx.locale` when that service is present and
  rebinds `t`; without it, `t` reads the English table, so the plugin still runs on an older
  harness. Add copy to both tables; never inline a literal in a render function.
- **Annotation.** Click an element (or an ancestor with `data-anchor` / `data-clarity-anchor`),
  drag-select text, or click a line in a `<pre>`. A range needs **Annotate** again and a
  Shift-click on the second line. After a click the target keeps a 2px outline and annotation
  turns off, so the artifact is released for normal clicking.
- **The decision row.** `decisionNode` is a `ConversationNodeDefinition` registered through
  `ctx.uiConversation.events.register` — the seam `ask_user_question` uses for its answered
  batches — and `DecisionBubble` occupies the keyed `conversation.chat.node` slot under
  `key: 'clarity-decision'`. `groupTree: 'turn'` keeps the row outside whole-Turn folding. The
  bubble is the chat's own `UserMessageBubble` when the host has it and our box when it does not,
  so a missing primitive costs the styling, never the row. Both mounts are optional: without
  `uiConversation` or the slot, the tab is unaffected. A decided round and a settled real test
  both draw a row (the test one carries its observation and one line of screenshot file names);
  `blocking: false` decisions and PTC (`tool/ptc-dispatch`) calls draw none. See
  [round 0021](docs/collaboration-draft/rounds/0021-decision-bubble/round.md) and
  [round 0025](docs/collaboration-draft/rounds/0025-shots-one-line/round.md).

## Tests and the loop

```powershell
pnpm test       # node scripts/run-tests.mjs
pnpm verify     # the same, then scripts/verify-package.mjs
pnpm check      # node --check on the three shipped files
```

Each test file runs in its own Node process with inherited stdio. `node --test` is avoided
because this sandbox denies the child process it spawns. Client tests run `client.js` in a `vm`
with fake React runtimes rather than a DOM.

A contract test that guards a rule should be shown to fail against the violation it guards, and
the violation reverted byte-exact.

## Release

A release is a tag push, not a local publish. `.github/workflows/publish.yml` runs on `v*`,
refuses a tag that disagrees with `package.json`, runs the tests, and publishes with OIDC
trusted publishing — the repository stores no npm token. Bump `package.json`, move the
`Unreleased` section of [CHANGELOG.md](CHANGELOG.md) under the new version, then push the tag.

## Where the decisions live

Every round that changed this plugin has a record under
[docs/collaboration-draft/rounds/](docs/collaboration-draft/rounds/): the decision, the variants,
the fidelity map, the outcome, and the verification. [LEDGER.md](docs/collaboration-draft/LEDGER.md)
indexes them and carries the state of each claim. Rejected variants and superseded rounds stay —
a decision without its alternative is folklore.

Open work is not tracked in this file. A gap that a decision produced is written down in that
decision's round record — what is built but not yet tested, what a rejected variant would have cost,
what a document is still waiting for.
