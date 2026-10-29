# 03 — The surface and the artifacts

This document is normative for the round tab and for what counts as an artifact. It
assumes the DSH 0.2.1-rc.2 Web client and its right Sidebar; the grounding section at the
end names what is verified and what is assumed.

## The round tab

A round opens in a dedicated tab in the right Sidebar. The tab is the decision surface:
the decision, the objects, the annotations, the actions, and the test trigger are in one
place. It is not a chat card and not two stock document previews.

```
┌ 0007 · Empty-state action ───────────────────────────  [fullscreen]  [×] ┐
│ Which action should the empty state lead with?           Recommended: A  │
│ Forecloses: a one-click path for template-first users.                   │
├───────────────────────────────────┬──────────────────────────────────────┤
│ A · Verb-first  (recommended)     │ B · Outcome-first                    │
│ ┌───────────────────────────────┐ │ ┌──────────────────────────────────┐ │
│ │                               │ │ │                                  │ │
│ │        rendered artifact      │ │ │        rendered artifact         │ │
│ │                               │ │ │                                  │ │
│ └───────────────────────────────┘ │ └──────────────────────────────────┘ │
│ real: layout, copy   mock: data   │ real: layout, copy   mock: data      │
├───────────────────────────────────┴──────────────────────────────────────┤
│ Annotations 2 blocking · 1 note                                          │
│  ① B · “Create” is vague → “New project”              blocking  [jump]   │
│  ② A · button below the fold at 360px                  note      [jump]   │
├──────────────────────────────────────────────────────────────────────────┤
│ [Accept A]  [Revise]  [Reject]  [Decide later]                           │
├──────────────────────────────────────────────────────────────────────────┤
│ Cold build passed 18:04 at 4f2a1c · [I’m ready to test]                  │
└──────────────────────────────────────────────────────────────────────────┘
```

### Why one tab with an internal split

The Sidebar already supports two docked panes and a fullscreen presentation. The round
tab deliberately does **not** use two dock tabs:

- the decision, the actions, and the annotation rail must span both variants;
- a third surface (the test log or a memo) would exceed the two-pane budget;
- the user may want the round beside a file or a terminal, which uses the dock split for
  that, not for the variants.

The internal split is a CSS grid, not a second docking surface. It can be one column
(a single variant, a memo, or code) or two equal columns.

### Regions

| Region | Contents | Always visible |
|---|---|---|
| Header | Round id, decision, recommendation, foreclosures | Yes |
| Variant viewport | One or two artifacts, each with label and fidelity footer | Yes |
| Annotation rail | Annotations grouped by variant, blocking first; resolution state | Collapsible |
| Action bar | Accept, Revise, Reject, Decide later | Yes |
| Test bar | Cold-build status and the **I’m ready to test** trigger | Only for a built round |

The header is the decision's title, not a marketing headline. It is one sentence. The
foreclosure line is always visible; it is not behind an info icon. If the user accepts
without reading it, that is a failure of the surface, not of the user.

### Responsive behavior

| Width | Behavior |
|---|---|
| ≥ 840px | Two variants side by side; annotation rail on the right of the viewports or below, at the user's choice |
| 720–839px | Two variants side by side, rail below; labels and fidelity footers compact |
| < 720px | Variants stack in one column; each keeps its label and fidelity footer; the decision header stays at the top |
| Fullscreen | The same tree, wider; used for dense code or a wide UI artifact |

The artifact must be designed at 360px first. A round tab that only works fullscreen is a
desktop-only decision pretending to be general.

## What the user can do

| Action | Result |
|---|---|
| Hover / focus an element | The element is outlined; its annotation, if any, is highlighted |
| Click an element in annotate mode | A composer opens with an element anchor |
| Select text | A composer opens with a text-quote anchor |
| Drag line numbers (code) | A composer opens with a line-range anchor |
| Comment on the variant | A composer opens with a variant anchor |
| Type a replacement | The artifact previews the proposed text in place; the file is untouched |
| **Accept A/B** | Returns `verdict: "accept"`, `selected`, and all annotations |
| **Revise** | Returns `verdict: "revise"`; the agent opens a new version |
| **Reject** | Returns `verdict: "reject"`; the round closes as abandoned |
| **Decide later** | Parks the round (`timeout` path); no decision |
| **Open in editor** | Opens the artifact file in the user's editor; the tab reloads on save |
| **I’m ready to test** | Runs the recorded trigger command; never composes a command |

"Accept" is disabled while a blocking annotation is open. A note does not block accept,
but it must name an owner and a follow-up before the round closes.

## Annotation

An annotation is a comment anchored to the artifact, not to the agent's summary. The
anchor is one of four kinds:

```ts
type Anchor =
  | { kind: "element"; selector: string; text?: string }
  | { kind: "text"; quote: string; prefix?: string; suffix?: string }
  | { kind: "line"; path: string; start: number; end: number }
  | { kind: "variant" };
```

The anchor is stored with the artifact's content hash. When the artifact changes, anchors
are reconciled in this order:

1. exact selector / quote / line range;
2. selector with the same text, or quote with the same prefix and suffix;
3. fuzzy text match within the same variant;
4. **orphaned** — shown in the rail as unresolved, never silently dropped.

An orphaned blocking annotation prevents accept until the user re-anchors or resolves it.
A silent drop is how a review loses the one comment that mattered.

### The annotation composer

The composer has four fields:

- **Comment** — required, one or two sentences.
- **Proposal** — optional replacement copy or code. This is the text-edit path: the user
  points at the word, types the replacement, and sees it previewed without touching the
  file.
- **Severity** — `blocking` or `note`. Blocking is the default for a correctness, policy,
  or copy problem; note is for a follow-up.
- **Scope** — implied by the anchor; not a separate control.

The agent must answer every annotation. "Applied" and "declined with a reason" are both
valid; silence is not.

### Why the annotations live in files

Each round writes `annotations.jsonl`, append-only, next to the artifacts. The tab renders
it; the user can open it in an editor like any other text file. The decision record cites
the annotation ids it resolved.

This is the answer to "friendly to text editing": the source of truth is plain text. The
tab is a view and a composer, not a lock-in.

## Editing the artifact

There are three levels, in increasing cost:

1. **Propose a change in an annotation.** The file is untouched; the preview shows the
   proposal; the agent applies it in the next version. This is the normal path for copy.
2. **Edit the file in the user's editor.** The tab watches the file, shows "edited on
   disk", and includes the diff as an `Edit` in the result. The next submit creates a new
   version. This is the normal path for code or a structural change.
3. **Ask the agent to revise.** The agent creates version `n+1` from the annotations.
   The old version stays readable.

The tab does not embed a code editor in v1. A 500px editor is a worse editor than the one
the user already has, and a proprietary canvas would break the "plain text is the source
of truth" rule. Inline text editing is limited to the proposal preview.

## Artifact formats

Every artifact has a header comment or a top block with the same five facts:

```html
<!--
  round: 0007-empty-state
  variant: a
  decision: Which action should the empty state lead with?
  fidelity:
    real: layout, copy, focus order
    mocked: project list, account menu
    omitted: loading state, error state (not part of this decision)
  run: open this file; no build, no network
-->
```

The fidelity map is also rendered in the variant footer. It is not a comment for the agent
only; the user needs it to know what they are judging.

### HTML (surfaces)

The default for a UI, copy, or interaction decision.

- One self-contained file. Inline CSS. No framework, no build, no CDN, no web fonts.
- No network requests. Local images only if they are part of the decision and small.
- One screen or one flow. The surrounding app is a static frame; data is hard-coded.
- Real copy. No lorem, no "TBD", no placeholder button labels.
- `data-anchor` on elements that can receive comments, with stable ids.
- Responsive at 360px, 520px, and 840px.
- Semantic HTML, visible focus, labels for every control, no color-only state.
- Disclosure (`<details>`, a "show edge cases" toggle) for states that are not the
  decision but must be inspectable.
- Budget: **≤ 250 lines and ≤ 30 KB**. If it does not fit, the decision is too big or the
  artifact is mocking too much.

Minimality test: delete every element that is not needed to answer the decision. If the
artifact still answers, it was not minimal. If it stops answering, the deleted element was
part of the decision.

### TypeScript (mechanisms)

The default for a logic, data, or API-shape decision.

```ts
// round: 0009-retry-policy
// variant: a
// fidelity: real: the policy function; mocked: the clock and the transport.

export type Attempt = { at: number; error: string };

export function nextDelay(attempts: readonly Attempt[]): number | null {
  if (attempts.length >= 4) return null;
  return Math.min(30_000, 500 * 2 ** attempts.length);
}
```

- One file, `strict`, no `any`, no non-null assertion without a comment.
- Discriminated unions for outcomes; `readonly` inputs; no ambient state.
- A `cases` array of typed inputs and expected outputs, and a `run()` that prints a table
  and exits non-zero on a mismatch.
- No network, no database, no filesystem. Mock at the seam; the fidelity map says so.
- Use the repo's existing runner and compiler; pin the command in the header.
- Budget: **≤ 200 lines**. A type-heavy design is fine; a framework is not.

### Pseudo-code (logic and architecture)

The default when the decision is about a sequence, an invariant, or a boundary, and the
language would add noise.

```
on submit(request):
  assert request.id is new                 # invariant: one decision per id
  draft = load(request.id)
  assert draft.status is "open"            # a decided round never reopens in place
  annotations = collect(draft)
  blocking = annotations.filter(a => a.severity == "blocking")
  if blocking.notEmpty: return "revise"    # cannot accept past a blocking note
  record(decision(draft, request.choice))
  return "decided"
```

- 10–30 lines, numbered or named steps, invariants called out.
- Data shapes and error paths; no language syntax unless it clarifies.
- Always paired with a code map that names the real files and functions.

### Memo (decisions that cannot be shown)

Pricing, legal, org, or policy decisions may have no artifact. A memo is a one-page
Markdown file with options, a recommendation, foreclosures, and the reason it cannot be
shown. It is a `memo` variant, explicitly marked `no-artifact`, not a silent exception.

## The code map and the pseudo-code spine

Every mechanism round carries both:

```md
## Code map
- Entry: src/http/upload.ts:41 (`handleUpload`)
- Changed: `handleUpload`, `retryPolicy` (new), `ProgressBar` (props only)
- Invariant: one upload id is never retried after a 4xx
- Blast radius: upload route, progress UI, telemetry event `upload_retry`
- Not touched: storage adapter, auth

## Spine
1. accept the request; assign id
2. attempt the write
3. on 5xx or timeout: backoff, at most 3 attempts
4. on 4xx: stop; surface the error; do not retry
5. on success: emit one telemetry event
```

The map is how the programmer stays oriented without reading the whole diff. The spine is
how they audit the logic without reading the whole implementation.

## Security and isolation

- Artifacts render in a sandboxed iframe with `allow-scripts` and **without**
  `allow-same-origin`, matching the document preview's scripted HTML policy. The artifact
  cannot reach the application origin, its storage, or its file reader.
- No network. The artifact's CSP blocks external connections. An artifact that needs a
  live service is not an artifact; it is a test environment, and it belongs in the test
  round.
- The test trigger runs a **recorded** command from `test.md`, not a command composed by
  the page or the model. The command is shown before it runs.
- Secrets are never placed in an artifact. The fidelity map and the test record must not
  include tokens, cookies, or customer data.

## The test bar

The test bar appears only when the round has a `test` payload. Its states:

| State | What it shows | Action |
|---|---|---|
| `not-planned` | "No real test planned" | The agent must plan one before the round can be `done` |
| `cold-build-pending` | "Cold build not run at this candidate" | Disabled; the agent must run it |
| `cold-build-failed` | The failing command and exit | Disabled; the agent must fix it |
| `ready` | "Cold build passed at <candidate> · <time>" | **I’m ready to test** |
| `running` | Live output, elapsed, cancel | Cancel |
| `passed` / `failed` / `blocked` | The recorded verdict and evidence | View record |

Pressing the button opens a confirmation sheet with the scenario, the expected observable,
the failure signature, and the rollback. Only then does it run. This is the moment the
protocol is designed around: the user is at the machine, the build is already done, and
the test is one action away.

## Grounding

Verified from the shipped DSH 0.2.1-rc.2 documentation:

- The right Sidebar has per-session docking, two horizontal panes, tabs registered through
  `ctx.sidebarRightTabs`, split/fullscreen presentations, and a persisted layout.
- The document preview renders local HTML in a sandboxed iframe (`allow-scripts`, no
  `allow-same-origin`) and supports scripted vs static policies.
- `present` opens delivered files in the Sidebar preview; it is a delivery card, not a
  round surface.
- `ask_user_question` is a composer takeover card; it cannot host an artifact or an
  annotation.

Assumed, not built:

- A new tab type can host two sandboxed iframes plus a rail at the widths above. This is
  the normal tab body contract, but no such tab exists yet.
- A `postMessage` annotation protocol can run inside the sandbox without same-origin
  access. This is standard for cross-origin iframes, but it is a design assumption.
- A host service can expose the cold-build status and run the recorded test command in a
  terminal tab. The terminal controller and jobs exist; the wiring does not.

These three assumptions are the first thing a prototype must prove.
