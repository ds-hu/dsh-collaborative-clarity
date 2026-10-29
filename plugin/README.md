# dsh-collaborative-clarity

Artifact rounds in the DSH right Sidebar. The agent calls a tool, the round opens beside
the conversation, and the tool waits until the user chooses, comments, or records a real
test.

This is a prototype. The verified scope and the gaps are in
[docs/collaboration-draft/06-implementation.md](../docs/collaboration-draft/06-implementation.md).

## Install

Use the plugin manager; do not hand-edit the profile.

```text
plugin_manager install_bundle  target: link:D:/Projects/dsh-collaborative-clarity/plugin
plugin_manager remove_bundle   target: dsh-collaborative-clarity
```

The package is a bundle (`dsh.bundle.patch`) and a Web Client half (`dsh.client`), with no
build step and no dependencies outside the harness.

## Tools

### `clarity_round`

Opens a decision round and waits.

- one decision, one or two self-contained HTML variants;
- a named recommendation and at least one stated foreclosure;
- the user selects, comments, revises, rejects, or cancels;
- each comment may carry an `anchor` (`element`, `text`, `line`, or `variant`) and an
  `artifactHash`;
- returns `{ status, verdict, selected, comments, note }`.

### `clarity_test`

Opens a real-test gate and waits.

- candidate, cold-build command and exit code, and a 3–7 step scenario;
- the user presses **I’m ready to test**, runs the scenario, and records pass, fail, or
  blocked;
- returns `{ status, verdict, observed }`.

Both tools block without consuming tokens. The model sees the structured result; it does
not see the UI activity.

## The sidebar

The `Clarity` tab is registered under `sidebar.right.pane.tab`, is `multiple: true`, and
has a guide entry. A round opens automatically on the mounted conversation and can also be
opened from the guide; the guide tab falls back to the last round remembered for that
session.

While a round waits, the session row gets a runtime `pendingInteraction` of kind
`question`, so the shared warning dot and the trailing `Answer` label appear. The row also
gets a yellow leading dot when it is otherwise idle. There is no bottom-right pill.

### Annotating an artifact

Press **Annotate** above the variants, then point at what should change:

- click an element (or an ancestor with `data-anchor` / `data-clarity-anchor`) to anchor to
  its selector;
- drag-select text to anchor to the quote;
- click a line in a `<pre>`, then Shift-click another line for a range. Put `data-path` and
  `data-line-start` on the `<pre>` for a file path and a real first line number.

The click does not open a second editor inside the artifact. The comment field at the
bottom of the tab shows the anchor chip and sends the comment with the decision. Clicking a
sent comment flashes the spot in the artifact. A comment without an anchor is a
`variant`-level comment.

The artifact iframe is sandboxed without same-origin. The bridge is injected into `srcDoc`
and talks to the panel by `postMessage`; the panel checks `event.source`, and the host
validates every anchor before the model sees it.

## Tests

```powershell
node --check plugin/index.js
node --check plugin/client.js
node plugin/test/store.test.mjs
node plugin/test/client.test.mjs
node plugin/test/api.test.mjs
```

`node --test` is avoided because this sandbox denies the child process it spawns.
