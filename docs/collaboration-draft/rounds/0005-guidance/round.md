# Round 0005 — Guidance

**Decision:** Where should the rule that makes the agent open a round sit — in the policy
region, or inside the tool description?
**Variant A:** *Section* — an always-on system section at order 2950, in the tool-section
region, with the timing rule and nothing else.
**Variant B:** *Description* — the same sentences folded into the `clarity_round` tool
description, no new section and no new config.
**Accepted:** A.
**Forecloses:** A is read on every turn of every session that enables the plugin, including
sessions that never make a design choice, and it is a second prompt surface that can drift
from the tool it describes. B keeps one place to read and edit, but the rule then competes
with every other tool description and is read as a capability rather than as an order.

## Why this round

The tool worked and the agent still reached for it too late: it argued a visual choice in
prose, implemented it, and opened a round only when told to. The missing information was
not *what* the tool does but *when* to call it, and that belonged somewhere the model reads
before it decides what to do.

## What the round had to show

The two shelves, with the same words on them, so the choice was about placement and cost
rather than about wording. Both artifacts listed the prompt as an ordered stack and
highlighted the block that would change.

## Outcome

Implemented as `clarity:guidance`, order `2950`, registered through
`ctx.get('systemPrompt')` so a composition without the prompt service keeps the tools. The
tool description keeps the mechanism only: what a variant is, that it blocks, and what it
returns.

This round's artifacts were sent inline and were not copied to disk — the last round that
does that. From 0006 the artifact is a file the round references by `path`.
