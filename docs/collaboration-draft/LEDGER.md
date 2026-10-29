# Ledger

This directory is a draft. No round has been run, no artifact has been accepted, and no
claim here is `built`. The first table records the decisions taken **while writing the
draft**; they are `proposed` until the user accepts them. The second table is the empty
ledger a real adoption would fill.

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
| D11 | The docs live in `docs/collaboration-draft/` | proposed | The brief's path; the name may change |
| D12 | The first deliverable is documents plus a mock, not a plugin | proposed | [OPEN-QUESTIONS](OPEN-QUESTIONS.md) Q2 |

## Round ledger

A real adoption appends one row per round. The table starts empty; an empty ledger is a
truthful ledger.

| Date | Round | Decision | Verdict | Selected | Forecloses | Evidence | Status |
|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — | — |

## What would move a row

- `proposed` → `agreed` requires the user's explicit acceptance in this session, with the
  decision id.
- `agreed` → `built` requires code and a decision record.
- `built` → `cold-built` requires the cold-build record from [04](04-verification.md).
- `cold-built` → `tested` requires a test record from the user.
- Any row may move to `abandoned` or `superseded` with a reason; it never disappears.
