# Real test — the tab owns no process

- round: 0010-withdraw-process-management
- candidate: dirty:6377605990c2 (73 files tracked by the hash; host reloaded before the gate)
- prepared: `node --check index.js && node --check client.js && node scripts/verify-package.mjs` — exit 0 at 00:29
- run this: none — this change has no command to run; a browser reload is the whole deployment
- environment: DSH web, local, this conversation's Clarity tab
- scenario: prepared line only, the trigger opens the observation directly, Back toggles, no process control anywhere
- observed: "只看到结论表单，没有任何进程控制"
- verdict: pass
- evidence: this record; the agent-side tool result `{ status: "tested", verdict: "pass" }`;
  `GET /clarity/api/test/start` → `404 {"code":"not-found","message":"no route: /test/start"}` on the
  same host (and the same for `/test/cancel` and `/test/output`)
- tester: the user
- date: 2026-11-05T00:30+08:00

## What this proves

- The tab renders `prepared` and the trigger, and nothing else: no **Start**, no **Stop**, no output
  pane, no elapsed clock, no second "Run" line for a round without a command.
- Pressing the trigger opens the observation form directly — the confirmation sheet that used to sit
  in front of **Start** is gone.
- **Back** returns to `prepared` + trigger and the form comes back, so the two phases are local and
  cheap, not a host round trip.
- The three process routes answer `404 no route` on the running host, so a stale tab cannot reach a
  start, a cancel, or an output read.

## What it does not prove

- The `Run <command>` line with **Copy** was not seen in this gate: this plugin has no command to
  hand over, so the line is correctly absent. It is covered by
  `tests/client.test.mjs` (*the test gate shows prepared and the command to run*) only.
- The old-host record guard (a round carrying `warmStart` + `start` draws no process control) is a
  contract test, not an observation.
- Nothing about what a leaked process does now: the tab no longer creates one, so a leak belongs to
  whoever started it.
