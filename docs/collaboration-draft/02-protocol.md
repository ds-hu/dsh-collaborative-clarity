# 02 — The protocol

This document is normative. It defines the round, the waiting tool, the rules the agent
and the user follow, and the scope in which `ask_user_question` is superseded.

The protocol assumes a Web client with a right Sidebar. The surface is specified in
[03-surface.md](03-surface.md); the evidence rules are in [04-verification.md](04-verification.md).

## Roles

| Role | Owns | Does not own |
|---|---|---|
| **Agent** | Preparing the round, the recommendation, the foreclosures, the code map; resolving annotations; implementing; preparing the cold build and the test scenario | Choosing for the user; declaring a feature tested |
| **User** | Annotating, choosing or editing, accepting foreclosures, running the real test | Writing a specification in prose; guessing what the artifact omits |
| **Tool** | Publishing the round, blocking the turn, returning the structured decision | Interpreting the decision; deciding when the round is done |

## Invariants

1. **In grilling, every blocking question is a round.** There is no prose-only question.
2. **A round decides exactly one thing.** Two decisions are two rounds.
3. **A recommendation is named before the user answers.**
4. **A foreclosure is named before the user answers.**
5. **The agent waits inside the tool call.** It does not poll, sleep, or ask again in chat.
6. **A change is not done until a human has run a real test.** Code plus a green suite is `built`, not `done`.

## The round state machine

```
                 submit                     implement              cold build
   open ───────────────▶ decided ───────────────▶ built ───────────────▶ cold-built
     │  ▲                    │                                            │
     │  └──── revise ────────┘                                            │ real test
     │                                                                   ▼
     ├──── reject ─────────────────────────────────────────────────▶ abandoned
     │                                                                   │
     └──── park ──▶ open (answerable, no decision)                       ▼
                                                                       tested ──▶ done
```

`revise` opens a new version of the same round; it does not create a new round id.
`reject` closes the round as abandoned and records why. `park` leaves the round open with
no decision; a later submission is still valid.

## The `grill` tool

Working name: `grill`. The name is open; see [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md).

### Visibility and supersession

In the Collaborative Clarity preset, `ask_user_question` is **not in the tool list**.
`grill` is. The swap is per preset (or per session), not per call, because an agent given
both will take the cheaper prose path exactly when the artifact would have been most
useful.

Outside grilling, `ask_user_question` remains the right tool for a confirmation, a
missing fact, or a choice with no artifact behind it. The supersession is scoped, not a
deprecation.

### Two kinds

`grill` has two kinds, because both are blocking human interactions over an artifact:

- **`decision`** — the user chooses, annotates, or edits a variant.
- **`test`** — the user runs the built candidate and records what happened.

Both open a round tab. Both block. Both return a structured record. Neither returns
prose that the agent has to reinterpret.

### Input: `decision`

```ts
type DecisionRound = {
  kind: "decision";
  id: string;                    // "0007-empty-state", unique in the project
  decision: string;              // one sentence, interrogative
  context: string;               // <= 3 sentences: why now, what changes
  variants: Variant[];           // 1-2 visible; a third needs a switcher and a reason
  recommendation: string;        // variant id
  forecloses: string[];          // at least one; what the recommendation gives up
  annotationMode: "element" | "text" | "line" | "none";
  timeout?: number;              // seconds; default -1 (wait indefinitely)
};

type Variant = {
  id: string;                    // "a" | "b"
  label: string;                 // human label, not a filename
  artifact: string;              // repo-relative path
  format: "html" | "ts" | "pseudo" | "memo";
  fidelity: {
    real: string[];              // what the artifact actually is
    mocked: string[];            // what is faked
    omitted: string[];           // what is not shown, and why
  };
  note?: string;                 // one sentence of framing
};
```

### Input: `test`

```ts
type TestRound = {
  kind: "test";
  id: string;                    // usually the same round id as the decision
  candidate: string;             // commit SHA, or "dirty:<hash>"
  coldBuild: {
    command: string;             // the exact command that was run
    startedAt: string;           // ISO 8601
    finishedAt: string;
    exitCode: number;            // must be 0
    artifacts: string[];         // what the build produced
  };
  scenario: {
    preconditions: string[];
    steps: string[];             // 3-7 steps
    expected: string[];          // observable, not "works"
    failureSignature: string;    // what the user should report
    rollback: string;
  };
  trigger: {
    command: string;             // the command the page's button runs
    cwd: string;
    timeoutSec: number;
  };
  timeout?: number;
};
```

The `coldBuild` record is evidence, not a promise. The tool refuses a `test` round whose
cold build did not exit 0 at the named candidate.

### Result

```ts
type GrillResult =
  | {
      kind: "decision";
      status: "decided";
      round: string;
      verdict: "accept" | "revise" | "reject";
      selected?: string;         // required for accept
      annotations: Annotation[];
      edits: Edit[];             // files the user changed on disk during the round
      note?: string;             // the user's summary, optional
    }
  | {
      kind: "decision";
      status: "parked";
      round: string;
      callId: string;
      message: string;           // what the agent may do while parked
    }
  | {
      kind: "test";
      status: "tested";
      round: string;
      verdict: "pass" | "fail" | "blocked";
      observed: string;
      evidence: string[];        // screenshot/log paths the user attached
      note?: string;
    }
  | {
      status: "cancelled";
      round: string;
      reason: string;
    };

type Annotation = {
  id: string;
  variant: string;
  anchor:
    | { kind: "element"; selector: string; text?: string }
    | { kind: "text"; quote: string; prefix?: string; suffix?: string }
    | { kind: "line"; path: string; start: number; end: number }
    | { kind: "variant" };
  comment: string;
  proposal?: string;             // the user's replacement copy or code
  severity: "blocking" | "note";
};

type Edit = {
  variant: string;
  path: string;
  beforeSha: string;
  afterSha: string;
};
```

### Waiting semantics

- The call **blocks the turn**. The model consumes no tokens while waiting.
- The tool opens the round tab and expands the Sidebar. If the tab was closed, the tool
  call row in the transcript reopens it.
- Closing the tab does not cancel the wait. The transcript row shows **waiting**.
- `timeout: -1` (the default) waits indefinitely. A positive timeout returns `parked`;
  the round stays answerable, and a later submission arrives as a user message, the same
  way a timed `ask_user_question` answer does.
- **Cancel** is an explicit action in the tab ("Cancel round"). It returns `cancelled`
  with a reason and no decision. Closing a browser tab is not a cancel.
- A disconnect does not lose the round. The decision is recorded on the Host; reconnecting
  and submitting resolves the wait.
- A chat message sent while the round waits does not resolve it. It is appended to the
  round as a free annotation and the user still submits, or cancels. The agent never has
  to reconcile two input channels.

### What the agent does with the result

1. Read every annotation. A blocking annotation must be **applied** or **declined with a
   reason**; silence is not a resolution.
2. If `revise`, open version `n+1` of the same round and state what changed. Do not
   silently overwrite version `n`.
3. If `accept`, write `decision.md` and the ledger row before writing implementation code.
4. If `reject`, write the rejection and stop; do not implement a rejected variant.
5. If `test` returns `fail`, the feature is not done. Fix, rebuild cold, and open another
   test round. A failure is evidence, not a setback to explain away.

## Round rules

**R1 — One decision.** If you have two questions, open two rounds. A round whose title
contains "and" is suspect.

**R2 — Artifact-backed.** Every variant is a file at a repo-relative path. No inline
blobs, no screenshots of a design tool, no "imagine a screen". An exception is allowed
only for a `memo` artifact with a written reason why the decision cannot be shown.

**R3 — Recommendation first.** The agent names its choice and the reason before the user
answers. The recommended variant is listed first and labelled.

**R4 — Foreclosure non-empty.** "Nothing" is not a foreclosure. If the agent cannot name
what the choice gives up, it has not understood the choice.

**R5 — Two at most.** Two variants may be shown side by side. A third requires a switcher
and a reason; a fifth is a sign the decision is not framed.

**R6 — Change, not app.** The artifact mocks only the change and its immediate context.
Hard-code the rest. "Expand on demand" uses disclosure, not a fuller replica.

**R7 — Real copy.** Every visible string is the proposed final string. No lorem, no "TBD",
no "Button text here". If the copy is not decided, that is the decision.

**R8 — States.** A UI artifact shows the states the decision touches: default, empty,
error, loading, disabled, narrow width. A state that is out of scope is named as omitted
in the fidelity map, not silently absent.

**R9 — Cold-open.** An artifact opens from a clean checkout without a dev server, network,
package install, or build step. If it needs a build, it is code, not a surface, and the
build command is in its header.

**R10 — Immutable versions.** A submitted artifact is never edited in place. A revision
is a new version with a new content hash; the old version stays readable. The user may
edit the file directly, but that becomes an `Edit` in the result and a new version, not a
silent mutation.

**R11 — Resolve before close.** A round cannot be accepted with a blocking annotation
open. Notes may be carried, but each note names an owner and a follow-up.

**R12 — Record before build.** The decision record and ledger row exist before
implementation starts. If the implementation reveals that the decision was wrong, open a
new round; do not rewrite the old record.

## Agent obligations

**A1 — Inspect before asking.** Read the code, the tests, and the decisions. A question
that inspection can answer is a defect.

**A2 — Never ask for syntax or location.** Do not ask the user where a function lives or
which type to use. Read it, propose it, show it.

**A3 — Show the spine.** Every mechanism round carries a code map (entry points, changed
functions, invariants, blast radius) and a pseudo-code spine of 10-30 lines.

**A4 — Show ten lines, not a hundred words.** When the decision is about logic, the
artifact is the logic. Prose is for the framing, not for the code.

**A5 — Flag UX debt.** Strings, empty states, errors, destructive actions, keyboard paths,
and narrow widths are part of the round. If one is unresolved, it is a blocking annotation
the agent raised, not a silence.

**A6 — Prepare the test before asking for it.** The cold build, the scenario, the expected
observable, the failure signature, and the rollback exist before the test round opens.

**A7 — Never claim a stronger state than the evidence.** `built` until the cold build;
`cold-built` until the test; `tested` only with a test record. The claim states are defined
in [05-draft-integrity.md](05-draft-integrity.md).

**A8 — Keep the drafts.** Never delete a rejected variant, a superseded decision, or a
failed test. They are the evidence that the choice was real.

## User obligations

**U1 — Annotate the object, not the agent.** Point at the word, the element, or the line.
"The vibe is off" is a valid start; the agent must turn it into an anchor.

**U2 — Choose, edit, or reject.** "Looks fine" is not a decision. If the artifact is
right, accept it; if it is nearly right, annotate or edit it; if it is wrong, reject it.

**U3 — Say what is reversible.** A decision that is cheap to reverse deserves less
ceremony than one that is not. Tell the agent which kind it is.

**U4 — Test or say you cannot.** A feature without a real test stays `unverified`. That is
an honest state, not a failure of the process.

## The round cap

Three rounds per decision. A fourth requires a written reason and the user's explicit
agreement; otherwise the agent must either implement the current recommendation or abandon
the decision.

A round that cannot produce an artifact after two attempts becomes a `memo`: a one-page
decision with options, a recommendation, foreclosures, and the reason it could not be
shown. The exception is recorded, not hidden.

The cap is not a timer. The user may take a day to annotate. The cap counts attempts to
frame the same decision, not minutes.

## When the framing is wrong

If the user rejects every variant, the next round must change the **framing**, not the
styling. The agent states what it learned, what it will not try again, and what new
question the rejection opened. A fourth round that is the third round with different
colors is a failure of the protocol.

If the user rejects the premise ("we should not build this at all"), the round closes as
`abandoned` with that reason. That is a successful round.

## Definition of done

| State | Evidence |
|---|---|
| `decided` | A decision record and a ledger row |
| `built` | Code exists; contract tests may pass |
| `cold-built` | A cold build at the named candidate exited 0 |
| `tested` | A human ran the scenario and a test record exists |
| `done` | `tested`, plus merged or shipped |

`tested` without merge is the ceiling for a change that is not shipped. `done` without a
test record is not a state this protocol recognizes.
