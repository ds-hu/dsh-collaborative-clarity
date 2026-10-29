# Round 0003 — Anchors

**Decision:** Should the retry policy be visible under the connection test, or behind a disclosure?
**Variant A:** Inline code block. **Variant B:** One-line summary and a `View retry policy` disclosure.
**Recommended:** A.
**Forecloses:** A keeps the policy in the primary reading path; the card grows by four lines. B keeps the card short, but the policy is invisible until the user opens it.

## Why this round

The previous round proved that the tab can carry a decision and that the session row marks a
waiting round. This round tests the new annotation path in the same surface: an element
anchor, a text-quote anchor, and a line anchor should arrive at the tool as structured data,
not as prose.

## What to do

1. The round opens with **Annotating** on. If it does not, press **Annotate**.
2. Click **Test connection** in A. The comment should attach to that button, not the whole
   variant.
3. Select a phrase in the intro paragraph. The comment should carry the selected quote.
4. Click a line in the retry policy code block. For a range, press **Annotate** again and
   Shift-click a second line. The comment should carry the line range and
   `src/sync/retry.ts`.
5. Add a note if the decision needs one, then accept A. After each anchor the target keeps
   its outline and annotation turns off, so the card can be clicked normally.

## What the result must show

- `comments[0].anchor.kind === "element"` with a selector for the button.
- `comments[1].anchor.kind === "text"` with the quote.
- `comments[2].anchor.kind === "line"` with `path: "src/sync/retry.ts"` and two line numbers.
- A `variant` anchor remains available for a comment on the whole draft.

## Fidelity

**Real:** the card, its controls, the retry-policy copy, and the code block.
**Mocked:** the endpoint is a fake host; no request is made.
**Omitted:** error and loading states, because this decision is about policy placement.

## Evidence

The tool call and its returned comments are the evidence. The human test record is written
after the user submits; it is not pre-filled.
