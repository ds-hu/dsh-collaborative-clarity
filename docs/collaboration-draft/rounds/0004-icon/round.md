# Round 0004 — Icon

**Decision:** Which glyph carries the plugin at 14 px, on a light *and* a dark toolbar?
**Variant A:** *Jewel* — a solid blue squircle with a white speech bubble and a faceted gem
inside it.
**Variant B:** *Stone* — a thin monoline bubble with a separate gem mark, no tile.
**Accepted:** A.
**Forecloses:** A is visible the moment it loads, light or dark, because the tile supplies its
own contrast; it is a filled, colourful mark in a row of monoline outline icons. B sits natively
in that monoline row, but as a 1.4 px stroke it thins to a smudge at 14 px and disappears on a
dark toolbar — the exact failure the previous icon had.

## Why this round

The preceding icon was a three-dot bubble drawn in `currentColor` at stroke 1.4. On the dark
toolbar the dots read as noise, so the entry could not be found. The fix is not "a nicer
drawing" but "a mark that does not depend on the toolbar colour for its contrast".

## What the decision had to survive

- 14 px in the sidebar tab strip, 24 px in a plugin list, 64 px in this round's own preview.
- Light and dark toolbars side by side, at the same scale.
- One colour family: blue, to stay in the harness's own accent range.

## Fidelity

**Real:** the two glyphs, the tile gradient, the rim, the three scale steps, and both toolbar
backgrounds.
**Mocked:** the surrounding tab strip is a still, not the live sidebar.
**Omitted:** hover, focus and selected states — the tab chrome already supplies them.
