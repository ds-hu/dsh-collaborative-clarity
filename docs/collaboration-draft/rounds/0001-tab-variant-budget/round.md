# Round 0001 — Variant budget

**Status:** decided
**Tool round:** `clarity-mvtlhcdo-c26616`
**Opened / decided:** 2026-10-29
**Artifacts:** [variant-a.html](variant-a.html), [variant-b.html](variant-b.html)

This is the first real round run through the plugin. It also settles the first version's
variant budget.

## Decision

Should the first version show two variants side by side, or three behind a switcher?

## Context

The round tab is being tested end to end. Two panes preserve comparison; a third option
adds a switcher and removes the simultaneous comparison.

## Recommendation

**A · Two, compared at once.** The decision is a comparison; a third option can be a
second round. The tool schema already caps a call at two variants.

## Foreclosures

- A third option has to be a second round.
- The user cannot compare three variants at once.

## Variants

| Id | Label | Artifact | Real | Mocked | Omitted |
|---|---|---|---|---|---|
| A | Two, compared at once | [variant-a.html](variant-a.html) | two-column comparison, final labels | artifact content | a third variant |
| B | Three, behind a switcher | [variant-b.html](variant-b.html) | switcher, final labels | artifact content | side-by-side comparison |

## Annotations

None. The user accepted A without comments: [annotations.jsonl](annotations.jsonl) is empty.

## Result

`{"status":"decided","roundId":"clarity-mvtlhcdo-c26616","verdict":"accept","selected":"a"}`

The full decision is in [decision.md](decision.md).

## Test

None. This round is a decision, not a built change. The plugin itself has contract tests
and one live user interaction; see [06-implementation.md](../../06-implementation.md).
