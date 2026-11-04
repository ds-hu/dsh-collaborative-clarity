# Real test — prepared line, no start step

> Kept as recorded. Round 0010 later withdrew the `warmStart` half of this change.

- round: 0009-prepared-warm-start
- candidate: dirty:6e0fa279090f (17 files changed; the host was already running the new half)
- prepared: `node --check index.js && node --check client.js && node scripts/verify-package.mjs` — exit 0 at 12:39
- start: none (this change is already running; `warmStart` omitted)
- environment: DSH web, local, this conversation's Clarity tab
- scenario: prepared line renders, pressing the trigger opens the observation without a start sheet
- observed: "OK" (pass)
- verdict: pass
- evidence: this record; the agent-side tool result `{ status: "tested", verdict: "pass" }`
- tester: the user
- date: 2026-11-03T12:40+08:00

## What this proves

- The host accepts the new schema (`prepared`, no `warmStart`) and settles the gate.
- The client renders the prepared line and the no-start path: pressing the trigger goes to the
  observation form instead of a confirmation sheet, and the verdict returns to the agent.

## What it does not prove

- The `POST /clarity/api/test/start` path against the real `ctx.shell`. No start step was recorded,
  so the route was never called; it is covered only by contract tests with a fake shell.
- The `manual` fallback (no shell, or a sandbox refusal). It needs a round with a `warmStart` that
  the sandbox denies.
- The prepared line's behaviour with a command long enough to wrap was not called out in the
  observation; "OK" does not distinguish "wrapped" from "short enough".
