# Ledger

This directory now has one real round and one implemented plugin. The first table records
the decisions taken **while writing the draft**; the second records the round that was run
through the plugin. The plugin's verified scope is in
[06-implementation.md](06-implementation.md).

## Draft decisions

| # | Decision | State | Evidence |
|---|---|---|---|
| D1 | The unit of collaboration is a round: one decision, one artifact set, one blocking wait | proposed | [README](README.md), [02](02-protocol.md) |
| D2 | In grill, `ask_user_question` is hidden and `grill` is the only blocking human tool | proposed | [02 §Visibility](02-protocol.md#visibility-and-supersession) |
| D3 | The round opens in a dedicated right-Sidebar tab with an internal split, not two dock tabs | proposed | [03 §Why one tab](03-surface.md#why-one-tab-with-an-internal-split) |
| D4 | Every variant declares a fidelity map: real, mocked, omitted | proposed | [03 §Artifact formats](03-surface.md#artifact-formats) |
| D5 | Every round names a recommendation and at least one foreclosure | proposed | [02 R3–R4](02-protocol.md#round-rules) |
| D6 | Contract tests, cold build, and real test are separate gates; only a real test yields `tested` | proposed | [04](04-verification.md) |
| D7 | The test trigger runs a recorded command, never a composed one | proposed | [04 §The trigger](04-verification.md#the-trigger) |
| D8 | Drafts are never deleted; superseded rounds and rejected variants stay | proposed | [05](05-draft-integrity.md) |
| D9 | Artifacts are plain files and annotations are a text sidecar, so any editor works | proposed | [03 §Why the annotations live in files](03-surface.md#why-the-annotations-live-in-files) |
| D10 | Three rounds per decision, then decide or abandon | proposed | [02 §The round cap](02-protocol.md#the-round-cap) |
| D11 | The docs live in `docs/collaboration-draft/` | agreed | The brief's path; the directory exists |
| D12 | The first deliverable is documents plus a mock, not a plugin | superseded | The plugin was built first; see [06](06-implementation.md) and [OPEN-QUESTIONS](OPEN-QUESTIONS.md) Q2 |
| D13 | A waiting round is marked on the session row, not with a bottom-right pill | agreed | User feedback in real test 1; implemented as the runtime warning dot + `Answer` |
| D14 | The waiting mark is the runtime `pendingInteraction` of kind `question`, so it appears even when the row is busy | agreed | Real test 3 passed with "Good!" |
| D15 | A comment can anchor to an element, a text quote, a line range, or the whole variant, and the anchor is returned with the decision | built | [03 §As built](03-surface.md#as-built), [06 §Anchors](06-implementation.md#anchors), `node plugin/test/*.test.mjs` |

## Round ledger

A real round appends one row.

| Date | Round | Decision | Verdict | Selected | Forecloses | Evidence | Status |
|---|---|---|---|---|---|---|---|
| 2026-10-29 | [0001](rounds/0001-tab-variant-budget/round.md) | Two variants side by side, or three behind a switcher? | accept | A | A third option needs a second round; no simultaneous comparison of three | [decision](rounds/0001-tab-variant-budget/decision.md); tool round `clarity-mvtlhcdo-c26616` | decided |
| 2026-10-29 | [0002](rounds/0002-session-attention/round.md) | Where does the waiting mark go, and does it survive a busy row? | pass | session row warning dot | A bottom-right pill; a custom dot that does not enter the runtime status | [test](rounds/0002-session-attention/test.md); three real-test gates | tested |

## What would move a row

- `proposed` → `agreed` requires the user's explicit acceptance in this session, with the
  decision id.
- `agreed` → `built` requires code and a decision record.
- `built` → `cold-built` requires the cold-build record from [04](04-verification.md).
- `cold-built` → `tested` requires a test record from the user.
- Any row may move to `abandoned` or `superseded` with a reason; it never disappears.
