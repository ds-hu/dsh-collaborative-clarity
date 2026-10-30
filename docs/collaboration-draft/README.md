# Collaborative Clarity

**Status:** draft + prototype · 2026-10-29
**Grounding:** DSH 0.2.1-rc.2, as shipped in this machine's profile
**Implementation:** [package root](../../package.json) — the decision and test paths work; the gaps are listed in [06-implementation.md](06-implementation.md).

Collaborative Clarity is a working mode for human–agent product work. It replaces the
interview with a decision surface: the agent shows the smallest artifact that makes one
decision concrete, the user annotates that artifact in the right sidebar, and the agent
waits inside a tool call until the decision is submitted. Drafts stay in the repository.
A feature is not "done" until a human has run a real test of the built thing.

The unit of collaboration is no longer a sentence. It is a **round**: one decision, one
artifact set, one blocking wait, one durable record.

## Read this first

| Order | Document | Answers |
|---|---|---|
| 1 | [01-diagnosis.md](01-diagnosis.md) | What exactly goes wrong with grilling, unit tests, UX, and lost code familiarity? |
| 2 | [02-protocol.md](02-protocol.md) | What replaces `ask_user_question`, and what are the rules of a round? |
| 3 | [03-surface.md](03-surface.md) | What does the side tab look like, and what is an artifact? |
| 4 | [04-verification.md](04-verification.md) | What counts as a real test, and how does the trigger work? |
| 5 | [05-draft-integrity.md](05-draft-integrity.md) | How are drafts tracked so the docs cannot lie? |
| 6 | [06-implementation.md](06-implementation.md) | What was built, what was verified, and what is still a gap? |
| — | [CONTEXT.md](CONTEXT.md) | The vocabulary, normative for this directory. |
| — | [LEDGER.md](LEDGER.md) | Every decision made while writing these docs. |
| — | [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md) | What is still genuinely undecided, with recommendations. |
| — | [adr/0001](adr/0001-artifact-first-grilling.md) | The hard-to-reverse decision: artifacts replace prose questions in grilling. |
| — | [example/](example/) | One mocked round, two variants, annotations, a decision, and a clickable shell. |
| — | [rounds/0001](rounds/0001-tab-variant-budget/round.md) | The first real round, run through the plugin. |
| — | [rounds/0002](rounds/0002-session-attention/round.md) | The session-row attention mark, including the two failed gates. |
| — | [rounds/0003](rounds/0003-anchors/round.md) | The anchor round: element, text, and line comments. |

Read 01 for the argument, 02–05 for the rules, and 06 for what actually runs. The example
is the shortest explanation of what the mode feels like.

## The four failures this mode answers

| Failure | What it looks like today | Response in this draft |
|---|---|---|
| Grilling drifts | Quarters of prose questions; the product is the intersection of answers; documents turn defensive and contradict each other | Every question becomes a round with an artifact, a recommendation, and a stated foreclosure. Three rounds per decision, then decide or abandon. |
| Unit tests replace real tests | The suite is green, the human never runs the product, production finds the edges | Contract tests, a cold build, and a human-run real test are separate gates. Only the last one can mark a feature tested. |
| UX and wording are discovered late | Copy is written in code by the agent; the user sees it when it ships; the agent does not remind | Copy is part of the artifact, at real size, in context. UX debt is a blocking annotation, not a footnote. |
| The programmer loses the codebase | The agent turns code into prose and asks for wishes; pseudo-code disappears | Every round carries a code map and a pseudo-code spine. The default is to show ten lines, not describe a hundred. |

## The loop in one minute

1. **Inspect.** The agent reads the code and the existing decisions before asking anything.
2. **Open a round.** It writes one to two minimal artifacts, names a recommendation, and states what that choice forecloses.
3. **Wait.** It calls `clarity_round` (or `clarity_test`). The round opens in the right sidebar. The tool call blocks; waiting costs no tokens.
4. **Annotate.** The user selects a word, an element, or a line; comments, proposes replacement text, or edits the file. They choose a variant or ask for a revision.
5. **Decide.** The tool returns a structured decision, not prose. The agent resolves every annotation and writes the decision and ledger row.
6. **Build, then prove.** The agent implements, runs the cold build, and enables the page's **I'm ready to test** trigger. A recorded human test is the only path to `done`.

## What this is not

- Not a chat redesign. The chat transcript stays; it is just not the decision record.
- Not a replacement for `ask_user_question` everywhere. The supersession is scoped to grilling.
- Not a demand that every change has a mock. Decisions that cannot be shown use a written decision memo, explicitly marked `no-artifact`.
- Not production code. Artifacts are disposable evidence; only the decision and the test record survive.
- Not a promise that HTML is always right. HTML is the default for surfaces; typed code is the default for mechanisms; pseudo-code is the default for logic.

## How the claims in these docs are marked

This draft tries to practise what it specifies. A claim is only as strong as its evidence:

- **Proposed** — an argument or design choice in this draft.
- **Agreed** — a decision recorded in [LEDGER.md](LEDGER.md).
- **Built** — code exists; not yet verified.
- **Cold-built** — builds from pinned inputs on a clean state.
- **Tested** — a human ran the recorded scenario and observed the result.
- **Verified** — tested for a named scenario, not for everything.

The plugin is `built`, and one decision round plus one test gate are `tested` by the user:
see [06-implementation.md](06-implementation.md). Everything else here is still
`proposed`. The HTML in `example/` is a mock; the round in `rounds/0001/` is real.

## Open decisions

The two questions that shaped the first build are settled: the round tab embeds the
artifacts itself, and the first implementation is a DSH plugin, not documents alone. The
remaining questions in [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md) are smaller; each still has
a recommendation.

## License

Apache License 2.0. See [LICENSE](../../LICENSE).
