# Round 0002 — Session attention

**Status:** tested
**Artifacts:** none; this round fixed the attention surface, not a product decision
**Test record:** [test.md](test.md)

## Decision

Where should the "a round is waiting" mark appear, and how should it survive a row that is
not idle?

## Result

The mark is the runtime's pending-interaction warning: a `question`-kind interaction
published through `ctx.uiSession` renders the shared warning dot and the trailing `Answer`
label on the session row. A leading-cell yellow dot covers the idle case; the bottom-right
pill was removed.

## Evidence

Three real-test gates: two failures and one pass. See [test.md](test.md) for the
observations and the candidate.
