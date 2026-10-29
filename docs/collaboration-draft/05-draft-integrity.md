# 05 — Draft integrity: how the record stays honest

This document is normative for tracking drafts, decisions, and claims. It exists because
the first three failures are not only interaction problems; they are memory problems. A
document that quietly rewrites what was decided, or a draft that disappears after the
implementation, makes every later statement suspect.

The rule behind the rest: **a draft is evidence of a decision, not a draft of the truth.**
Keep the evidence; state only what it supports.

## What "tracked" means

A draft is tracked when all five hold:

1. It is a file in the repository, not an attachment in a chat.
2. It has a stable round id and a version (a commit or a content hash).
3. Its status is explicit (`open`, `decided`, `built`, `cold-built`, `tested`, `done`,
   `abandoned`, `superseded`).
4. It is linked from the ledger.
5. It is never deleted, only superseded.

Chat history is not tracking. A transcript cannot be cited, diffed, reviewed, or trusted
after the session ends.

## Layout

The convention this draft proposes for a product repository:

```
docs/collaboration/
  CONTEXT.md                 # the vocabulary, one per repo
  LEDGER.md                  # append-only index of every round
  rounds/
    0001-delete-recovery/
      round.md               # manifest: decision, variants, recommendation, foreclosures
      variant-a.html         # artifact, versioned by commit
      variant-b.html
      annotations.jsonl      # append-only; one JSON object per line
      decision.md            # verdict, selected, resolutions, accepted foreclosures
      test.md                # cold build + real test record
    0002-upload-retry/
      ...
```

This directory (`docs/collaboration-draft/`) is the draft of that convention, not a
product adoption of it. The example under `example/` is illustrative only.

### Why the round is a directory

- The artifacts, the annotations, the decision, and the test record have different
  lifetimes. A single file forces one to overwrite another.
- Rejected variants stay readable next to the accepted one; that is the evidence of the
  trade-off.
- A round directory can be copied into a bug report or an ADR without losing links.
- Git already versions the files; the round folder gives them a home.

### Versioning

- The artifact path is stable; the version is the commit or content hash recorded in
  `round.md`.
- A revision is a new commit and a new entry in `round.md`; it is not a new round id.
- A material change to the decision after it was accepted is a **new round**, not a new
  version. The ledger shows the reversal.
- The working tree may change while the user edits; the submitted version is the hash in
  the result, and the decision record cites that hash.

## Statuses

Round status is one value:

| Status | Meaning | Next |
|---|---|---|
| `open` | Waiting for the user; no decision yet | `decided`, `abandoned` |
| `decided` | A verdict is recorded | `built` |
| `built` | Code exists; contract tests may pass | `cold-built` |
| `cold-built` | Cold build at the candidate exited 0 | `tested` |
| `tested` | A human ran the scenario; a test record exists | `done` |
| `done` | Tested and merged or shipped | — |
| `abandoned` | Rejected or dropped, with a reason | — |
| `superseded` | Replaced by a later round | The later round |

A round that is `decided` but never built is still a valid decision. A round that is
`built` but never tested is not done. The status is the first thing a reader sees.

## The ledger

`LEDGER.md` is append-only. One row per round. An example row:

| Date | Round | Decision | Verdict | Selected | Forecloses | Evidence | Status |
|---|---|---|---|---|---|---|---|
| 2026-10-29 | `0001` | Permanent delete or 30-day trash? | accept | B | Purge job; delayed storage reclaim | `decision.md`, `test.md` | tested |

Rules:

- A row is added when the decision is recorded, not when the code is written.
- The row is updated only for status and evidence. The decision text, verdict, and
  selected variant never change. A reversal is a new row.
- The ledger is the index, not the argument. The argument lives in `decision.md`.
- A round without a ledger row is not a decision; it is a conversation.

## Claim discipline

Every statement about a change carries one of these states. A document may not use a verb
stronger than its state.

| State | You may write | You may not write |
|---|---|---|
| `proposed` | "We propose…", "The draft argues…" | "supports", "works", "is designed to" (as a fact) |
| `agreed` | "We decided…", "The round accepted…" | "works", "is implemented" |
| `built` | "Implemented; not yet verified" | "done", "works", "tested" |
| `cold-built` | "Builds from clean at `<sha>`" | "tested", "verified" |
| `tested` | "Tested by `<name>` on `<env>`: `<result>`" | "production-ready", "all cases" |
| `verified` | "Verified for `<scenario>`" | "verified" without the scenario |
| `abandoned` | "Rejected because…" | omit it from the record |

### Banned without evidence

These words are not forbidden forever; they are forbidden without the state that earns
them:

`works`, `supports`, `done`, `complete`, `production-ready`, `robust`, `seamless`,
`handles all`, `tested` (unqualified), `verified` (unqualified).

Replace them with the specific claim:

- not "supports retries" but "retries once on a 5xx or timeout; tested for the 3G/offline
  scenario on 2026-10-29".
- not "done" but "`tested`, not yet merged".
- not "verified" but "verified for the empty-state copy at 360px".

### The asymmetry

A negative claim needs evidence too. "Does not support shared boards" is a decision only
if a round rejected shared boards and the ledger says why. Otherwise it is a missing
decision, not a scope note. This is the specific failure the brief names as "defensive in
wording": a document that lists what v1 will not do, without the decisions that make those
limits intentional.

## Clean documents

- **One normative source per fact.** The ledger for status; `decision.md` for the
  argument; `test.md` for the evidence. Other documents link, not restate.
- **No transcripts.** A quotation from the chat is not a decision record. If a sentence
  mattered, it belongs in an annotation or a decision.
- **No open blocking annotations** in a `done` round. Notes may remain if they name an
  owner and a follow-up.
- **No "as discussed"** without a link to the round and the annotation.
- **No duplicate tables** of the same decision in two docs. If a summary is necessary,
  mark it as a summary and link to the source.
- **No silent edits** to a decided document. A typo fix is fine; a change of meaning is a
  new round.
- **No orphan scope claims.** Every "v1 does not…" links to the rejection that made it so.
- **No dead drafts.** A superseded round is marked, not deleted.

## Supersession and deletion

- A superseded draft stays in place with `status: superseded` and `superseded_by: <round>`.
- A rejected variant stays in the round folder. It is the evidence that the choice was
  real, and the next person will ask why it was rejected.
- A failed test record stays. It is the most useful document in the folder.
- Deleting a draft is allowed only for a file that was never part of a decision (a
  scratch artifact that was never submitted). Once submitted, it is evidence.

## When documents conflict

Precedence, strongest first:

1. `LEDGER.md` for status and what was decided.
2. `decision.md` for the argument and the accepted foreclosures.
3. `test.md` for what was observed.
4. Other documents.
5. Chat history.

If code and docs disagree:

- the code is the current behavior;
- the ledger is the intent;
- the gap is a bug, and it gets a round or a fix, not a footnote.

If two documents disagree, fix it in the same change that noticed it. A known
contradiction left in place is worse than a missing document.

## Review checklist

Before a round is marked `done`, or a doc is merged:

- [ ] The round id is unique and the decision is one sentence.
- [ ] A recommendation and at least one foreclosure are present.
- [ ] Every variant has a fidelity map.
- [ ] Every artifact opens cold, with no network or build step.
- [ ] Every blocking annotation is resolved; every note has an owner and a follow-up.
- [ ] The ledger row exists and its status matches the evidence.
- [ ] The claim states match the table above; no banned word is unearned.
- [ ] The decision record cites the artifact version it decided.
- [ ] The test record exists, or the status is honestly `built`/`cold-built`.
- [ ] Rejected variants and failed tests are still present.
- [ ] No document contradicts the ledger; every scope claim links to its decision.
- [ ] The links resolve.

## A note on the draft you are reading

This directory is `draft`. Its claims about DSH are read from the shipped documentation,
not from a working plugin. Its example is a mock, not a decision. If it says "the round
tab does X", read that as **proposed**, unless the grounding section marks it verified.

That is the discipline applied to itself. A draft that pretends to be a product is the
first failure this mode is meant to prevent.
