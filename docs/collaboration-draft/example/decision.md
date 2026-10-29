# Decision 0001 — Delete recovery

**Status:** decided (illustrative example; not built, not tested)
**Verdict:** accept
**Selected:** B · Move to Trash
**Artifact:** [variant-b.html](variant-b.html) — example version, no commit hash
**Round:** [round.md](round.md)

## The decision

Deleting a project moves it to Trash for 30 days. Boards, files, and history are kept.
The user can restore it from Trash, or empty Trash explicitly. The copy says that Trash
is emptied automatically after 30 days and the project is then deleted permanently.

## Why B

- The action is destructive and easy to trigger by mistake; a recoverable path matches the
  cost of the mistake.
- The product already has a Trash concept; the new flow reuses it instead of inventing a
  second recovery model.
- The permanent-delete flow (A) requires typing the project name, which is team-safety
  friction on a solo plan and does not match the rest of the product.

## Accepted foreclosures

- **Immediate storage reclamation is gone.** Trashed projects keep their storage for 30
  days; the purge job must be reliable.
- **A simple `DELETE` endpoint is gone.** Every delete path writes a Trash record, and
  every restore path must revalidate the project's relations.
- **Links to a trashed project must resolve.** They cannot 404 while the project is
  recoverable; this is deferred to a follow-up round.

## Annotation resolutions

| Id | Severity | Resolution |
|---|---|---|
| n1 | note | Carried to the plan-gate checklist. A is not selected; if it returns, the typed confirmation is gated by plan. |
| n2 | note | Carried to implementation. 30 days is the v1 default; the retention interval becomes a workspace setting. The copy names automatic deletion. |
| n3 | note | Accepted as a layout constraint. Trash stays beside Projects; restore is reachable in one click. |

No blocking annotations were open at accept.

## Follow-ups

- **Round 0002 — Link handling.** A direct link to a trashed project shows the project in
  a trashed state with a Restore action, not a 404. Owner: agent; due before `done`.
- **Retention setting.** Workspace setting, default 30 days, validated 1–90. Not part of
  v1; recorded here so the copy does not promise a control that does not exist.
- **Purge job.** Must be idempotent and must emit one audit event per purged project.

## Evidence

This is an example, not a real decision. There is no cold build and no test record. A real
decision record would cite the artifact version, the annotation file, and the test record.
