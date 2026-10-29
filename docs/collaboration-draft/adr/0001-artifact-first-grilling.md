# ADR-0001: Artifact rounds replace prose questions in grilling

**Status:** proposed · 2026-10-29
**Supersedes:** the use of `ask_user_question` inside the grilling mode
**Does not supersede:** `ask_user_question` outside grilling

## Context

Grilling with docs interviews the user one question at a time. The interview produces
documents, but not a shared object: the user cannot see the thing being decided, annotate
the word that is wrong, or test the result before conceding requirements. The documents
drift into defensive scope notes and contradict each other, the agent's unit tests become
the evidence of correctness, and the programmer loses familiarity with the code.

DSH already has the two surfaces this decision needs: a right Sidebar that can host tabs,
two panes, and sandboxed HTML; and a blocking human-interaction tool that waits without
consuming tokens. The missing piece is a decision object between the question and the
document.

## Decision

In grilling, the only blocking human interaction is an **artifact round**, exposed as the
`grill` tool:

- one decision, one to two minimal artifacts, a named recommendation, and at least one
  stated foreclosure;
- the round opens in a dedicated Sidebar tab; the user annotates the artifact, chooses a
  variant, edits the file, or rejects the framing;
- the tool returns a structured decision record, not prose;
- `ask_user_question` is not in the tool list in the grilling preset, because an agent
  given both will take the cheaper prose path exactly when the artifact matters most;
- a change is `done` only after a human-run real test, with a recorded scenario and a
  cold build prepared in advance.

The artifacts are plain files: HTML for surfaces, typed TypeScript for mechanisms,
pseudo-code for logic, a memo for decisions that cannot be shown. Drafts are kept and
superseded, never deleted.

## Consequences

**Positive.**

- The user's feedback is anchored to the object, so "this word" is actionable without a
  written specification.
- The agent cannot converge on a narrowed product without showing what it is narrowing.
- Rejected variants and failed tests stay as evidence; the ledger can be audited.
- The programmer keeps a code map and a pseudo-code spine, so the codebase does not become
  agent-only.
- The real test is a gate, not a hope.

**Negative.**

- A round costs more than a prose question. Small confirmations should stay outside
  grilling.
- Artifacts can drift from the implementation. The fidelity map and the real test are the
  guards, not a proof.
- A new tab type, an annotation channel, and a host service are real implementation work.
- The round cap is a guess; without it, the mode can become the interview it replaces.

**Neutral.**

- The decision record is text; it can be exported, reviewed, and linked like any other
  document.
- The tool name and the seam are reversible. The tracked record is not, by design.

## Considered options

1. **Improve `ask_user_question` with attachments.** Rejected: the composer card is a
   takeover; it cannot host a side-by-side comparison, an annotation overlay, or a test
   trigger. Attachments would be decoration on a prose answer.
2. **Keep chat grilling and write better docs.** Rejected: the missing object is the
   problem. Better prose does not let the user point at a word or run the change.
3. **Spec-first: write a complete specification before any artifact.** Rejected: it
   reproduces the interview at a larger scale and defers the first real feedback until
   after the expensive document.
4. **A full artifact IDE with an embedded editor and live app.** Rejected for v1: too
   heavy, and it would make the artifact a destination rather than a disposable decision
   aid.
5. **Use the stock document preview and collect free-text comments.** Kept as a fallback
   (see [OPEN-QUESTIONS](../OPEN-QUESTIONS.md) Q3), but it splits annotation from action
   and cannot show two variants with one decision bar.

## Reversibility

The tool, the tab, and the preset swap are reversible. The ledger and the kept drafts are
not: once decisions are recorded this way, deleting them would destroy the audit trail
that makes the mode worth using. That asymmetry is intentional.
