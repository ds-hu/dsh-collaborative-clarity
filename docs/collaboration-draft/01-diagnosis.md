# 01 — Why grilling with docs fails

The current loop is an interview. One side asks, the other answers, and a document is
written about a product that neither side has seen. The interview is not the problem by
itself; the problem is that the thing being decided never becomes an object that either
side can point at, run, or test.

This document names the four failures in the brief, traces them to that missing object,
and states what would count as a fix. It is explanatory, not normative. The rules are in
[02-protocol.md](02-protocol.md).

## 1. The interview narrows the product

**What happens.** The agent asks what it needs to implement. The user answers. Each answer
becomes a constraint. After enough rounds the document reads as a list of concessions:
"v1 will not support shared boards", "v1 will not notify on mentions", "v1 will not import".
The product is the intersection of the answers, not the user's intention.

**A composite scenario.** An agent is asked to design notifications. It asks about
channels, retries, templates, permissions, quiet hours, and delivery guarantees. Forty
answers later it has a competent alert system. The user wanted a calm weekly digest, not a
firehose with better retries. No question ever asked what the notification should feel
like, and no screen was ever shown, so the mismatch survived every round.

**Why the loop produces it.** A prose question can only contain options the agent already
imagined. The user's answer is bounded by the question. The loop rewards unblocking, not
imagination: the fastest way to continue is to accept the framing and answer. The agent's
plan grows narrower with every answer, and the document records the narrowing as if it
were the design.

**Why the documents turn defensive and contradictory.** A document written after the
implementation has to justify what exists. "Not supported" is safer than "we chose not to",
so scope limits lose their reasons. Each answer was local; the next answer did not see the
whole. The result is a document that is defensive in wording and inconsistent in fact, and
a refactor or a v1-denied feature arrives as a surprise because the decision that excluded
it was never written down as a decision.

**Cost.** Quarters of interviewing, a timid product, and documents that cannot be trusted
as a description of intent.

## 2. The green suite replaces the real test

**What happens.** Agents are trained to write unit tests, and they are good at it. The
suite grows. The report says "tested". The human, who has been answering questions for
weeks, stops doing the manual pass. Production becomes the first environment where the
whole thing runs.

**Why unit tests cannot carry that weight.** A unit test proves the author's model of a
function under cases the author imagined. It does not prove integration, environment,
timing, permissions, copy, feel, or the edge nobody imagined. Those are exactly where
production fails.

**A composite scenario.** An upload flow has two hundred unit tests and a mocked storage
adapter. On a slow connection the request exceeds a gateway timeout; the retry doubles the
upload; the progress bar sits at 99%. No unit test owns the gateway, the network, or the
person watching the bar.

**Cost.** The first real test is the customer's. The failure is expensive precisely
because the suite was reassuring.

## 3. UX and wording are discovered in production

**What happens.** Copy is written in code, last, by the agent. The user sees it when it
ships. The agent does not remind anyone, because its definition of done is a green suite,
not an experience.

**Why wording is not decoration.** "Delete" and "Move to Trash" are not two phrasings of
one action. They encode different data-retention policies, different recovery paths, and
different promises. A label decision is often a product decision wearing a short word.

**A composite scenario.** A settings page ships with "Disable" where the product means
"Pause". Users assume their data is gone and open support tickets. The tests pass; the
word was never reviewed at real size, in the real layout, next to the real consequence.

**Cost.** Rework, support load, and a quiet loss of trust that no test catches.

## 4. The programmer loses the codebase

**What happens.** The agent translates code into prose. The human reads the prose. The
agent assumes the human cannot read code, so it asks for wishes instead of showing a diff.
Pseudo-code, the shared language between a programmer and an implementer, disappears.

**Why this is a loss.** Familiarity is not nostalgia. It is the ability to predict where a
change will hurt, to review a diff, to maintain the thing after the agent is gone, and to
refactor without a guide. A programmer who only reads summaries cannot do any of that.

**A composite scenario.** The agent reports "refactored the auth middleware" in five
bullets. The user cannot find the token-refresh path, cannot tell whether the session
cookie changed, and cannot review the next change without asking the agent to explain the
codebase again. The agent, adapted to "programming by wishing", does not notice that the
user would have understood twelve lines of pseudo-code in less time than the summary.

**Cost.** The human becomes dependent on the agent for navigation, and the agent becomes a
single point of failure for the code.

## The common cause

In all four failures, the unit of collaboration is a **sentence**.

A sentence cannot be pointed at. It cannot be run. It cannot be diffed. It cannot be
annotated at the word that is wrong. It cannot fail in a way that teaches something. When
the sentence is the only object, the document becomes the only artifact, and the document
drifts from the code, the test, and the user's intention.

The fix is not a better sentence. It is a different object: a small, honest artifact that
shows the decision, plus a record that survives it.

## What the old loop gets right

The replacement should keep these:

- **One question at a time.** A batch of questions lets the user answer the easy ones and
  postpone the hard one.
- **Domain language.** Naming the thing precisely is half the decision.
- **Recorded decisions.** A decision that is not written down will be re-litigated.
- **Inspection before asking.** Most questions about code can be answered by reading code.

What it gets wrong is treating the question, rather than the decision object, as the unit.

## The design response

| Failure | Response | Rule |
|---|---|---|
| The interview narrows the product | A round shows the decision as an artifact, names a recommendation, and states what it forecloses | One decision per round; three rounds, then decide or abandon |
| The suite replaces the real test | Contract tests, cold build, and a human real test are separate gates | Only a test record can mark `tested` |
| UX is discovered late | Copy lives in the artifact at real size; UX debt is a blocking annotation | No lorem, no "TBD"; show the states the decision touches |
| The programmer loses the code | Every round carries a code map and a pseudo-code spine | Show ten lines rather than describe a hundred |

## What success looks like

- A round closes with one decision record and zero open blocking annotations.
- The user can point at the exact word, element, or line that is wrong.
- A feature is `done` only with a test record from a human who ran it.
- A newcomer can reconstruct why a decision was made from the ledger, without the chat.
- Code review starts from a twenty-line spine, not a two-thousand-line diff.

## What would falsify this

This mode should be abandoned, or narrowed, if any of these hold after a real trial:

- Rounds take longer than prose interviews **and** produce no better decisions.
- Users ignore the artifacts and ask for prose answers; the side tab becomes decoration.
- Artifacts drift from the implementation often enough that reviewers stop trusting them.
- The real-test gate blocks shipping without finding anything a cheaper review would miss.
- The overhead lands on small changes, where a sentence really was enough.

The protocol has an explicit escape hatch for decisions that cannot be shown
(`no-artifact`), and a round cap for decisions that will not converge. Those are not
exceptions to the argument; they are what keeps the argument honest.
