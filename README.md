# Collaborative Clarity

Artifact rounds for DeepSeek Harness. The agent opens a decision in the right sidebar, shows
the smallest file that makes it concrete, and waits inside a tool call while the user
annotates the artifact and chooses. The decision returns as structured data.

This is a prototype. The verified scope and the remaining gaps are recorded in
[docs/collaboration-draft/06-implementation.md](docs/collaboration-draft/06-implementation.md).

## Install

The package is the repository root, so every route installs the same files:

```powershell
# from npm — the shortest route
dsh plugin --profile web add @ds-hu/dsh-collaborative-clarity

# this checkout
dsh plugin --profile web add link:D:/Projects/dsh-collaborative-clarity

# any machine, straight from GitHub
dsh plugin --profile web add github:ds-hu/dsh-collaborative-clarity
```

`dsh.bundle.patch` contributes one Loader row (`collaborative-clarity`) and `dsh.client`
declares the browser half. There is no build step and no dependency outside the harness, so
there is no `prepare` script for pnpm to block and no `allowBuilds` line to approve.

**Coming from the `plugin/` layout (≤ 0.1.0):** the installed link points at a directory that
no longer exists, so remove and re-add:

```powershell
dsh plugin --profile web remove @ds-hu/dsh-collaborative-clarity
dsh plugin --profile web add link:D:/Projects/dsh-collaborative-clarity
```

The client half hot-reloads. A change to the host half needs a restart of the DSH web process.

## The prompt

The plugin publishes one system section, `clarity:guidance` at order `2950` — inside the
tool-section region, between `tool:report` and `tool:computer_use`. It carries the timing rule
only: open a round when a request leaves a visual or behavioural choice open, and do not open
one once a direction is accepted. The tool description carries the mechanism, so each fact is
stated once.

The section is registered through `ctx.get('systemPrompt')` rather than an inject
requirement: a composition without the prompt service keeps the tools and loses only the
section. There is no switch — disable the plugin to drop it.

## Tools

### `clarity_round`

Opens a decision round and waits, or returns a job id.

- one decision and one or two variants;
- every variant is a file, named by `path` (relative paths resolve against the session working
  directory); the round records the `source` it read, so the artifact is also the record and
  can be edited and reopened without resending it;
- a named recommendation and at least one stated foreclosure;
- the user selects, comments, revises, rejects, or cancels;
- each comment may carry an `anchor` (`element`, `text`, `line`, or `variant`) and an
  `artifactHash`; the composer is a two-line textarea — Enter writes a new line, Ctrl/Cmd+Enter
  adds the comment;
- blocking (default) returns `{ status, verdict, selected, comments, note }`;
- `blocking: false` returns `{ status: "pending", roundId, jobId, recommendation }` at once and
  registers the round as a background job. The user's decision settles it, `job_output` collects
  the JSON result, and killing the job cancels the round.

Arguments are refused, not dropped: a field the schema does not declare fails the call with
`<where>.<field> is not a field`. The registry hands arguments over unvalidated, so this is
where the schema is enforced.

### Non-blocking rounds

`blocking: false` registers the round with the harness `jobs` service (`ctx.jobs`). The job is
owned by the calling conversation, so it is listed and collected with the ordinary
`job_output` / `job_kill` tools, and its completion notice wakes the agent when the user
decides. If the backend finishes first, the agent implements the recommendation and says so;
a late decision still arrives as a notice and can be honoured or turned into a new round.

This needs `@deepseek-ai/dsh-tool-jobs` in the profile: without it `ctx.jobs` is absent and a
non-blocking request is refused before any round is published.

### What a variant file renders as

| Extension | Rendering |
| --- | --- |
| `.html`, `.htm`, `.svg` | the document, unchanged |
| `.md`, `.markdown`, `.mdown` | prose: headings, lists, quotes, rules, fenced code, inline code, bold, italic, links |
| anything else | numbered source, `data-line-start="1"`, path on every line anchor |

The Markdown subset is deliberately small: no tables, no HTML passthrough (it is escaped), no
nested lists. The source view keeps one text node per line and draws its gutter with a CSS
counter, so `pre.textContent` still maps a click to the line the user pointed at.

### `clarity_test`

Opens a real-test gate and waits.

- candidate, cold-build command and exit code, and a 3–7 step scenario;
- the user presses **I’m ready to test**, runs the scenario, and records pass, fail, or blocked;
- up to four screenshots can be attached by picker, drop, or paste (both scoped to the panel: the
  harness's document drop target would otherwise add the file to the chat composer as well); the
  selected one is shown at full width with a thumbnail strip, and the files land in
  `.clarity/screenshots/<roundId>/shot-N.<png|jpg|webp>` inside the session directory;
- returns `{ status, verdict, observed, screenshots }`, where each screenshot is
  `{ path, bytes }` — open it with `read_image` when the words alone are ambiguous.

A blocking call waits without consuming tokens; a non-blocking round returns at once and settles
as a job. The model sees the structured result, not the UI activity.

## The sidebar

The `Clarity` tab is registered under `sidebar.right.pane.tab`, is `multiple: true`, and has a
guide entry. A round opens automatically on the mounted conversation and can also be opened
from the guide; the guide tab falls back to the last round remembered for that session.

While a round waits, the session row gets a runtime `pendingInteraction` of kind `question`, so
the shared warning dot and the trailing `Answer` label appear. The row also gets a yellow
leading dot when it is otherwise idle. There is no bottom-right pill.

### Annotating an artifact

Annotation is on when the round opens. Point at what should change:

- click an element (or an ancestor with `data-anchor` / `data-clarity-anchor`) to anchor to its
  selector;
- drag-select text to anchor to the quote;
- click a line in a `<pre>` for one line. For a range, press **Annotate** again and Shift-click
  a second line. Put `data-path` and `data-line-start` on the `<pre>` for a file path and a
  real first line number.

After the click, the target keeps a 2px outline and **Annotate turns off**. The artifact is
then released for normal clicking, so the user can test the control they just commented on.
Press **Annotate** to pick another target.

The click does not open a second editor inside the artifact. The comment field at the bottom of
the tab shows the anchor chip and sends the comment with the decision. Clicking a sent comment
flashes the spot in the artifact. A comment without an anchor is a `variant`-level comment.

The artifact iframe is sandboxed without same-origin. The bridge is injected into `srcDoc` and
talks to the panel by `postMessage`; the panel checks `event.source`, and the host validates
every anchor before the model sees it.

## What is here

| Path | What it is |
| --- | --- |
| [index.js](index.js) | Host half: `clarity_round`, `clarity_test`, the round store, `/clarity/api`, the wait |
| [client.js](client.js) | Browser half: the `Clarity` tab, the artifact iframe and bridge, the session-row dot |
| [artifacts.js](artifacts.js) | Renders a variant file by extension: document, prose, or numbered source |
| [cordis.patch.yml](cordis.patch.yml) | The one Loader row this package contributes |
| [icon.svg](icon.svg), [locale/](locale/) | Plugins-panel icon, title and description |
| [tests/](tests/) | Six files, one per surface; `scripts/run-tests.mjs` runs them all |
| [docs/collaboration-draft/](docs/collaboration-draft/) | The diagnosis, protocol, surface design, verification rules, and the real round records |

## Tests

```powershell
pnpm test              # or: node scripts/run-tests.mjs
```

Each file runs in its own Node process with inherited stdio. `node --test` is avoided because
this sandbox denies the child process it spawns.

## Read the design

Start with [docs/collaboration-draft/README.md](docs/collaboration-draft/README.md). The short
version: the unit of collaboration is a round, not a sentence; a round has one decision, an
artifact, a recommendation, and a stated foreclosure; a human-run real test is the only thing
that marks a feature tested.

## License

Apache License 2.0. See [LICENSE](LICENSE).
