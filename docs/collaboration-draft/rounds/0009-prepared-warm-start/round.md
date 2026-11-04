# Round 0009 — Prepared build and warm start

> **Superseded by [round 0010](../0010-withdraw-process-management/round.md)** on 2026-11-04: the
> `prepared` half stands, the `warmStart` half was withdrawn after a real test showed the tab could
> not stop what it started. This record is kept as written — it is what was decided that day.

**Decision:** 「I’m ready to test」遇到需要联网或管理员的启动命令时，应该由谁决定越出沙箱？
**Variant A:** *Confined start* — the tab runs the warm start under the agent's sandbox; a start that
needs more degrades to a copyable command.
**Variant B:** *Consent to leave the sandbox* — a one-time checkbox in the confirmation sheet routes
the run through the host's approval.
**Recommendation:** A.
**Accepted:** A.
**Forecloses:** A 让「需要联网或管理员」的启动只能交给用户自己的终端：插件看不到它是否启动、
拿不到日志，那一次测试的 `started` 只能由人声明。B 则让 tab 成为第二条执行 agent 提交命令的
提权路径——记录里的命令可以是任意内容，而勾选是最弱的同意形式，且审计要问两处。

## Why this round

The review of [04](../../04-verification.md) found that "cold build" was doing two incompatible
jobs: proving a candidate builds from pinned inputs (needs a clean machine, the network, and
privileges the agent does not have), and letting the user start testing immediately (needs an
incremental, offline, in-workspace step). Charging the first to every round made the agent either
fail on permissions or delete the developer's caches — the one sentence that licensed it was
"build outputs and caches that could mask a missing step are removed".

The split this round settles:

- **prepared** — the agent runs the build before the gate opens and passes the command, exit code,
  and time. The tab shows it as one secondary line.
- **warm start** — the tab runs the start command (no install, no build) under the same sandbox as
  the agent, and stops it when the verdict is recorded.
- The remaining question, and the only one the two variants disagree on, is what happens when the
  start needs more than that sandbox.

## Fidelity

**Real:** the test panel's structure, type scale, and spacing; the prepared line sits where the old
cold-build line was; the confirmation sheet's field order.
**Mocked:** the commands are examples and were not executed; the sandbox refusal is described, not
performed.
**Omitted:** the failed-prepared state, the running panel and its log, dark mode.

## Outcome

Accepted A. `clarity_test` now takes `prepared: { command, exitCode, builtAt }` and
`warmStart?: { command, cwd? }` instead of `coldBuild`. It refuses a non-zero prepared
exit and a warm start that repeats the prepared command, so "the user's start rebuilds" is not
expressible. `warmStart` is optional because a change that is already running — a client bundle the
browser reloads — has no start step; the tab then skips the sheet and opens the observation.

`POST /clarity/api/test/start` resolves the recorded command through `ctx.shell` under the round
session's own sandbox policy (`ctx.sandboxPolicy.resolve({ session })`), with `onExpiry: "none"`;
the handle is killed when the verdict is posted, when the round is abandoned, or when the plugin is
disposed. A host without a shell service answers `503 no-shell`, and the client shows the same sheet
as a copyable command with **Record what I saw**, never an elevation prompt. The start is recorded
on the round (`round.start`) so a remount resumes it; **Stop** ends it without a verdict.

The client shows `Prepared 18:04 · pnpm build` above the trigger, and a sheet with the warm start,
the prepared build, and the first scenario step.

## Verification

Contract tests: 76 pass across eight files (`node tests/<file>.test.mjs` each). The new guards have
tests of their own: a warm start equal to the prepared command is refused; a start without a shell
service is a `503`, and the round stays open; a start runs under the session policy, not the
deployment default; an abandoned round kills a start that was still preparing; the start is
resolved with `onExpiry: "none"`; posting the verdict kills the handle.

The guard is load-bearing: removing the `warmStart === prepared` throw makes
`tests/store.test.mjs` hang on the refusal case (the round opens and waits instead of rejecting), and
the file was restored byte-exact (sha256 `f6c4a64b…`).

**Tested** at `dirty:6e0fa279090f` — the round's own gate, opened from this conversation, passed:
the prepared line rendered, pressing the trigger went straight to the observation (no start sheet,
because `warmStart` was omitted), and the verdict returned. Record: [test.md](test.md).

What that gate does not cover: the live `POST /clarity/api/test/start` path against `ctx.shell` was
never called, since this change has no start step; it is covered only by contract tests with a fake
shell. The `manual` fallback and the long-command wrap are likewise still assumptions.
