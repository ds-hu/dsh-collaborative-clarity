# Round 0006 — Source files

**Decision:** Should a referenced file be rendered by its type, or shown exactly as it is on
disk?
**Variant A:** *Rendered* — HTML passes through, Markdown becomes prose, anything else
becomes numbered source carrying its path.
**Variant B:** *Verbatim* — one renderer for every type: the file, its path, its line
numbers, no conversion.
**Accepted:** A.
**Forecloses:** A owns a converter, so a mis-rendered block misrepresents the very copy
under review and every Markdown edge case becomes our bug. In A a selector points into
generated DOM the file does not contain, so prose comments degrade to quotes; B keeps every
comment on an exact line range but never shows prose as prose.

## Why this round

The previous round established that a variant is a file. The question it left open was what
the panel does with a file that is not HTML — and the answer decides whether a changelog
draft or a TypeScript sketch is something the user can judge by reading, or something they
have to reconstruct in their head.

## Fidelity

**Real:** the file chips, the heading and list rhythm, the numbered source block with its
path, the line gutter.
**Mocked:** the Markdown conversion was hand-drawn in the artifact; the real one is code.
**Omitted:** tables, nested lists, front matter, and what a badly-formed file looks like.

## Outcome

`html` is gone from the variant schema; `path` is required. `artifacts.js` renders by
extension: `.html`/`.htm` verbatim, Markdown through a small converter, everything else as
numbered source with `data-path` and `data-line-start="1"`.

Two defects surfaced while building it, and both were fixed before the commit:

- a list item's continuation line escaped the `<li>` and became its own paragraph, because
  the list loop only matched item lines;
- the round declared `additionalProperties: false` but nothing enforced it — passing an
  invented field was dropped in silence. Arguments and variants now reject unknown fields.

The source wrapper was verified in a browser at 360px: the gutter is a CSS counter, so
`pre.textContent` stays one newline-separated line per source line, and a click at the
middle of line 20 resolves to 20 (probed at 1, 2, 3, 20, 41, and 120 in a 255-line file).
