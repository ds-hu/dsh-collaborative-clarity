# Decision 0001 — Variant budget

**Status:** decided
**Verdict:** accept
**Selected:** A · Two, compared at once
**Artifact:** [variant-a.html](variant-a.html)
**Round:** [round.md](round.md)

## The decision

The first version of the round tab shows two variants side by side. A third option is a
second round, not a third pane or a switcher.

## Why A

- The round exists to compare; a switcher hides the comparison behind a click.
- The tool schema already caps one call at two variants, so the surface and the tool agree.
- A third option can be opened as a new round with the accepted variant as context; the
  ledger keeps the chain.

## Accepted foreclosures

- A third option cannot be compared in the same view.
- Adding a third variant later is a new round, not a new pane.

## Annotation resolutions

No annotations were submitted. The empty [annotations.jsonl](annotations.jsonl) is the
record.

## Evidence

- The live tool call returned `accept` and selected `a`: `clarity-mvtlhcdo-c26616`.
- The round was answered through the plugin's sidebar tab, not through chat.
- The plugin's host tests, client facade tests, and route tests are recorded in
  [06-implementation.md](../../06-implementation.md).

## Follow-ups

- Keep the tool schema's two-variant maximum. If a real decision needs three, open two
  rounds rather than widening the surface.
- If the side-by-side layout becomes too narrow below 720px, stack the two cards; do not
  introduce a third tab.
