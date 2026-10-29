# Open questions

Only questions that change the work. Each has a recommendation; a recommendation is not a
decision until it appears in [LEDGER.md](LEDGER.md).

## Q1 — What is the tool called?

**Recommendation:** `grill`.

It matches the mode and the skill, and it is a verb the agent can use naturally ("call
grill"). The risk is that it sounds like interrogation rather than collaboration.

**Alternatives:** `round` (accurate, bland), `collaborate` (clear, long), `show` (short,
but collides with `present`).

**Blocks:** the model-facing schema name, not the design. Can be renamed late.

## Q2 — Is the first deliverable a plugin, or documents plus a mock?

**Recommendation:** documents plus a mock first. Build the plugin only after one real
round has been run by hand with the HTML artifacts and the sidecar annotations. The mock
is how we learn whether the surface is right before paying for the tab type, the tool
seam, and the host service.

**If not:** the plugin becomes a large bet on an unvalidated interaction, and the docs
become a specification for something nobody has used.

**Blocks:** the scope of this repository. It is the first question to settle.

## Q3 — Does the round tab embed the artifacts, or delegate to the stock preview?

**Recommendation:** embed, with a sandboxed iframe per variant and an injected annotation
channel.

The stock document preview is read-only and cannot host the decision bar, the two-up
comparison, or the annotation overlay. Delegating would mean the user annotates in one
place and acts in another, which is the split this mode is trying to remove.

**Cost:** a custom tab type, an iframe policy, and a `postMessage` protocol. The stock
preview already proves the sandbox policy is viable; the annotation channel is the new
part.

**If not:** ship a v0 that opens two document-preview tabs and collects annotations as a
free-text list. It is worse, but it can validate the round before the tab exists.

**Blocks:** the surface implementation.

## Q4 — Is there an inline editor in the tab?

**Recommendation:** no code editor in v1. Two text paths:

1. **Propose** — select a word, type the replacement, see it previewed; the agent applies
   it in the next version.
2. **Open in editor** — the artifact is a file; the tab watches it and includes the diff
   in the result.

A 500px code editor is worse than the user's editor, and a proprietary canvas would break
the plain-text rule. The question in the brief ("friendly to text editing?") is answered
by making the file the source of truth, not by embedding a textarea.

**If not:** add a copy-only inline editor first; leave code to the external editor.

**Blocks:** no. The annotation `proposal` field covers v1.

## Q5 — Where do the drafts live: with the product, or in a separate docs repo?

**Recommendation:** with the product, under `docs/collaboration/`, because artifacts
reference code, tests, and commits, and because a decision that lives in another repository
will be stale the first time the code moves. This draft lives in its own repository only
because it is a draft.

**If not:** a separate repo works for cross-cutting product decisions, but every artifact
link becomes a cross-repo link and the test record cannot cite a commit.

**Blocks:** no; it is a convention.

## Q6 — What happens to a decision that cannot be shown?

**Recommendation:** a `memo` artifact: one page, options, recommendation, foreclosures,
and the reason it cannot be shown. It is still a round; it is not a silent exception.

Pricing, legal, org, and some policy decisions are real. The failure is pretending they
are visual, not admitting they are not.

**If not:** those decisions fall back to prose in chat, and the mode develops a hole
exactly where the stakes are highest.

**Blocks:** no; the `memo` format is already in [03](03-surface.md).

## Q7 — Is the round cap three?

**Recommendation:** three, counted as attempts to frame the same decision, not minutes.
A fourth requires a written reason and the user's agreement.

Three is a guess. It should be revisited after ten real rounds, with the ledger as the
data. The point is not the number; the point is that a loop without a cap becomes the
quarter-long interview this mode replaces.

**If not:** a lower cap forces a decision earlier; a higher cap tolerates more framing
attempts. Either is better than no cap.

**Blocks:** no; it can change without changing the design.

## Q8 — Does `ask_user_question` remain outside grilling?

**Recommendation:** yes. A confirmation, a missing fact, or a choice with no artifact is
still a good fit for the composer card. The supersession is scoped to grilling.

**If not:** every small confirmation grows a round, and the mode becomes ceremony.

**Blocks:** no; the preset composition decides it.

## Q9 — Is the first implementation single-user?

**Recommendation:** yes. One user, one session, one round at a time. Multi-user
annotation, presence, and assignment are out of scope; the annotation file format leaves
room for an author field, but the UI does not show one.

**If not:** the first implementation carries collaboration infrastructure before the
single-user interaction is proven.

**Blocks:** no.

---

**The two that block the first prototype:** Q2 (scope) and Q3 (embed vs delegate). The
rest can be settled while building.
