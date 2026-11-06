<div align="right">English | <a href="README.zh-CN.md">中文</a></div>

# Collaborative Clarity

<p>
  <a href="https://www.npmjs.com/package/@ds-hu/dsh-collaborative-clarity"><img src="https://img.shields.io/npm/v/@ds-hu/dsh-collaborative-clarity" alt="npm"></a>
  <a href="https://www.npmjs.com/package/@ds-hu/dsh-collaborative-clarity"><img src="https://img.shields.io/npm/dm/@ds-hu/dsh-collaborative-clarity" alt="downloads"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue" alt="license"></a>
  <img src="https://img.shields.io/badge/DeepSeek%20Harness-plugin-5b4bd6" alt="DeepSeek Harness plugin">
</p>

*A right-sidebar tab where the agent shows you a decision instead of describing one — and
waits, inside the tool call, until you have answered it.*

## What goes wrong when you vibe code

Handing the build to an agent is fast, and three things go wrong in the same way each time.
None of them is a badly worded prompt; each is a missing object.

- **You meet the interface late.** The agent decides how a screen behaves, builds it, and you
  see it when it is finished — so the disagreement arrives as rework. *A round puts the screen
  in front of you before it is built.*
- **The architecture becomes someone else's.** Hand the code over wholesale and you lose the
  map: which choice is risky, what it costs, and why it was made stay invisible until a user
  finds them for you. *A round carries the ten lines that matter, a recommendation, and what
  that recommendation forecloses.*
- **Green tests stand in for a real test.** A unit test asserts what its author imagined. The
  repeated, hands-on checking a developer does while building does not survive as a test case.
  *A round ends at a gate a human has to run.*

This plugin supplies the object. The agent writes the smallest file that makes one decision
concrete — a screen, a type, a function — opens it in the right sidebar, names the variant it
recommends, and says what that choice forecloses. Then it waits.

The unit of collaboration becomes a **round**: one decision, one artifact set, one wait, one
record. Everything else here follows from that sentence.

## Why it works

**The artifact does not have to be your product.** HTML is the cheapest thing to render and the
widest: a terminal, a diff, a table, a screen. A project that is not a web app can still be shown
as one — at real size, without building a demo app in order to demo it. The file is evidence, not
inventory.

**The two halves are good at opposite things.** An agent is weak at long tool loops: every turn
re-reads a growing context — a cache hit is a discount, not a refund — and drifts a little. It is
very good at producing a whole screen in one pass. A person is the reverse: nobody writes a
finished HTML page from nothing in one sitting, and nobody wants to rewrite one that already
exists. The round spends the agent's first pass on the thing it is good at, and spends your
attention on the judgement it cannot supply.

**And the last mile is a person.** Whatever ships ends up in front of a user, so somebody has to
have used it first — on the real build, with their own eyes, before the user does. That is why the
real test is a gate and not a checkbox.

## A round, end to end

1. **The agent puts the decision on screen.** Two variants at most, each a real file rather
   than a description of one.
2. **You point at what you disagree with.** Click an element, drag-select a phrase, or click a
   line. The comment keeps its location, so "this label is wrong" arrives with the label
   attached.
3. **You decide.** Accept, revise, reject, or decide later. Your annotations and the chosen
   variant come back to the agent as structured data, not prose it has to interpret.
4. **The agent writes the decision down.** The verdict, the foreclosures you accepted, and
   every comment still open land in the repository beside the artifact.

## The last step is a real test

`clarity_test` opens the gate after the build. The agent records the build it has already run,
hands you one command to bring the app up, and writes down a scenario of three to seven steps.
You run it, you look, and you record what happened — pass, fail, or blocked — with screenshots
when the words alone are ambiguous. Until then the change is *built*, not *tested*.

## Install

```powershell
dsh plugin --profile web add @ds-hu/dsh-collaborative-clarity
```

Requires DeepSeek Harness with the web profile. From a checkout, add
`link:D:/path/to/dsh-collaborative-clarity` instead; from GitHub,
`github:ds-hu/dsh-collaborative-clarity`. There is no build step and one runtime dependency
(`markdown-it`). Non-blocking rounds also need `@deepseek-ai/dsh-tool-jobs` in the profile.

The version is 0.x, and what works is written down rather than implied:
[docs/collaboration-draft/06-implementation.md](docs/collaboration-draft/06-implementation.md)
lists the verified surfaces and the remaining gaps.

<details>
<summary>Coming from the <code>plugin/</code> layout (≤ 0.1.0)?</summary>

The installed link points at a directory that no longer exists, so remove and re-add:

```powershell
dsh plugin --profile web remove @ds-hu/dsh-collaborative-clarity
dsh plugin --profile web add @ds-hu/dsh-collaborative-clarity
```

</details>

## What a round leaves behind

- **Round record** — the decision, the recommendation, and the foreclosures you accepted.
- **Annotations** — what you pointed at, and whether it was resolved.
- **Test record** — who ran the scenario, and what they saw.

The artifact itself is disposable evidence. The tab is not a document store.

## Read more

- [AGENTS.md](AGENTS.md) — the architecture, the invariants, and how to run the tests.
- [docs/collaboration-draft/](docs/collaboration-draft/README.md) — why this exists, in six
  documents and an ADR.
- [CHANGELOG.md](CHANGELOG.md) — what each version changed.

---

Apache License 2.0. See [LICENSE](LICENSE).
