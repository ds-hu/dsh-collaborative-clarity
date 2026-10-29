# Collaborative Clarity — Context

The vocabulary of a working mode where one decision is shown as a small artifact, the
user annotates that artifact, and the agent waits for a structured answer.

Terms here are normative for this directory. If another document uses a term differently,
that is a bug in the document, not a second definition.

## Language

### The loop

**Round**:
One decision, one artifact set, one blocking wait.
_Avoid_: question, ticket, grill session, Q&A batch.

**Grill**:
The mode specified here, in which every blocking question is a round and the agent waits
inside a tool call. It inherits the one-question-at-a-time discipline of the
`grill-with-docs` skill, but a question is now an artifact, not a paragraph.
_Avoid_: interview, interrogation, chat.

**Variant**:
One candidate answer inside a round, backed by exactly one artifact. Two variants may be
shown side by side; a third needs a switcher and a reason.
_Avoid_: option, choice, mock (a variant may be typed code or pseudo-code, not a mock).

**Recommendation**:
The variant the agent would choose, named before the user answers, with the reason in the
same breath. It is a position, not a default.
_Avoid_: default, suggestion.

**Foreclosure**:
What the recommended variant makes hard, expensive, or impossible later. Every round
states at least one; "nothing" is not an answer.
_Avoid_: trade-off (too vague), limitation (reads as an excuse), risk (a different thing).

**Annotation**:
A comment anchored to a location in an artifact: an element, a text range, a line range,
or the whole variant. It is the user's unit of feedback.
_Avoid_: comment (unqualified means a chat comment), feedback, note.

**Blocking annotation**:
An annotation that must be resolved before the round can be accepted. A note may be
carried into the implementation as a follow-up; a blocking annotation may not.
_Avoid_: issue, ticket.

**Decision record**:
The durable output of a round: the verdict, the selected variant, the resolutions of
every annotation, and the foreclosures the user accepted. It is not the chat transcript.
_Avoid_: answer, response, result (unqualified).

**Park**:
The state in which a waiting tool returns `pending` at a deadline while the round stays
open and answerable. A park is not a rejection and not an answer.
_Avoid_: timeout (that is the mechanism), cancel.

### The objects

**Artifact**:
The smallest viewable or executable object that makes one decision concrete: an HTML file
for a surface, a typed TypeScript file for a mechanism, or a pseudo-code block for logic.
_Avoid_: mock (only one kind of artifact), session artifact (a DSH storage concept; when
the ambiguity matters, write **draft artifact**).

**Draft**:
The status of an artifact, document, or decision that is explicitly not final. A draft is
kept and versioned; it is not a folder.
_Avoid_: WIP, scratch, temp.

**Fidelity map**:
The three-line declaration at the top of every artifact: what is **real**, what is
**mocked**, and what is **omitted**. It is how a reader knows not to mistake the artifact
for the product.
_Avoid_: scope (that is about the product, not the artifact's truthfulness).

**Round tab**:
The right Sidebar tab that hosts a round: decision header, variant viewports, annotation
rail, action bar, and test bar.
_Avoid_: side panel, drawer, preview.

**Ledger**:
The append-only index of every round and its decision, with the evidence that supports
its status.
_Avoid_: log, changelog, history.

### Evidence

**Claim state**:
One of `proposed`, `agreed`, `built`, `cold-built`, `tested`, `verified`, `abandoned`.
A document may not claim a stronger state than its evidence supports.
_Avoid_: status (overloaded with round status), confidence.

**Cold build**:
A build from pinned inputs with no incremental state that could hide a missing dependency
or a stale artifact. It proves the candidate can be built, not that it behaves.
_Avoid_: clean build (ambiguous: clean what?), CI build.

**Real test**:
A human running the built change in the real runtime or environment, following a recorded
scenario, observing the result, and recording it. Only a real test can promote a change to
`tested` or `verified`.
_Avoid_: manual test (sounds optional), QA, smoke test (a kind of real test, not a synonym).

**Test record**:
The durable evidence of a real test: environment, candidate, steps, expected, observed,
verdict, and who ran it. It lives beside the decision.
_Avoid_: test report, test log (logs are inputs to the record).

## Relationships

- A **Round** contains one or more **Variants**; each **Variant** is backed by one **Artifact**.
- A **Round** produces exactly one **Decision record**.
- A **Decision record** resolves zero or more **Annotations**; no blocking annotation may remain open.
- A **Round** occupies exactly one row in the **Ledger**.
- A **Cold build** is a precondition for a **Real test**; a **Real test** produces a **Test record**.
- A **Test record** is the only evidence that can raise a claim to `tested` or `verified`.
- A **Park** leaves the **Round** open; it does not produce a **Decision record**.

## Example dialogue

> **Agent:** "Round 0007. Deleting a project can be permanent or recoverable. Variant B is
> my recommendation: move it to Trash for 30 days. That forecloses immediate storage
> reclamation and adds a purge job. Annotate what you disagree with."
>
> **User:** "On B, '30 days' is a policy decision, not copy. Make it 'until you empty the
> trash', and show me where the trash lives."
>
> **Agent:** "That is one blocking annotation on copy and one on navigation. I will revise
> B to v2 and keep A for comparison. The decision record will say the retention rule is
> user-controlled, not time-controlled."

## Flagged ambiguities

- **"Artifact"** is also a DSH storage term for a session file. Resolved: in this
  directory an artifact is a **draft artifact** unless the sentence says "session
  artifact".
- **"Test"** is used for contract tests, cold builds, and real tests. Resolved: always
  qualify. An unqualified "test" in a status claim means a real test.
- **"Done"** is used for "code exists" and "shipped". Resolved: `built` means code exists;
  `done` means tested and merged. The two are never interchangeable.
- **"Side tab"** could mean a browser tab. Resolved: the right Sidebar's tab system.
- **"Grill"** collides with the `grill-with-docs` skill. Resolved: the skill supplies the
  conversational discipline; this mode supplies the object, the wait, and the record.
