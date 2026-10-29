# Round 0001 — Delete recovery

**Status:** decided (illustrative)
**Opened:** 2026-10-29T18:05:00+08:00
**Decided:** 2026-10-29T18:16:00+08:00

This is the manifest the `grill` tool would receive. It is an example, not a real round.

## Decision

Should deleting a project be permanent, or move it to a 30-day Trash?

## Context

Atlas is a live project. The current menu says “Delete”. The choice decides whether the
next mistake is recoverable, and whether every delete path needs a Trash record.

## Recommendation

**B · Move to Trash.** The action is destructive and easy to trigger by mistake; the
product already has a Trash concept; the permanent flow's typed confirmation is
team-safety friction on a solo plan.

## Foreclosures

- Immediate storage reclamation. Trashed projects keep storage for 30 days, and the purge
  job must be reliable.
- A simple `DELETE` endpoint. Every delete path writes a Trash record; every restore path
  revalidates relations.
- Direct links to a trashed project cannot 404 while it is recoverable. That is a
  follow-up round, not a detail to discover in production.

## Variants

| Id | Label | Artifact | Format | Real | Mocked | Omitted |
|---|---|---|---|---|---|---|
| A | Permanent delete | [variant-a.html](variant-a.html) | HTML | dialog, copy, focus order | project data | empty Trash |
| B | Move to Trash | [variant-b.html](variant-b.html) | HTML | dialog, copy, toast, Trash entry | project data | purge job |

## Annotations

Three notes, no blocking annotations: [annotations.jsonl](annotations.jsonl).

| Id | Variant | Anchor | Note |
|---|---|---|---|
| n1 | A | “Type Atlas to confirm” | Gate the typed confirmation by plan if A ever returns |
| n2 | B | “30 days” | Keep 30 days for v1; make it a workspace setting; keep the copy honest |
| n3 | B | Trash entry | Keep Trash beside Projects; restore must be reachable |

## Decision

[decision.md](decision.md) — accept B, with the three notes carried as implementation
constraints and one follow-up round for link handling.

## Test

None. This round is a decision, not a built change. A real round would add `test.md` after
the cold build and the human test.
