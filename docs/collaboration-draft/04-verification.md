# 04 — Verification: the cold build and the real test

This document is normative for how a change becomes `tested` and `done`. It separates
three gates that are usually collapsed into the word "tested": contract tests, a cold
build, and a real test.

The short version: **a green unit suite is a claim about functions; it is not a claim
about the product.** Only a human running the built change in the real environment can
make the second claim.

## The three gates

| Gate | Proves | Does not prove | Owner |
|---|---|---|---|
| **Contract tests** | A function honors its contract for the cases the author imagined | Integration, environment, timing, permissions, copy, feel, unknown edges | Agent |
| **Cold build** | The candidate builds from pinned inputs with no incremental state | That it behaves | Agent |
| **Real test** | The built change behaves in the real environment for a recorded scenario | Scale, every edge, every platform | User, observed and recorded |

A change may be `built` after the first gate and `cold-built` after the second. It becomes
`tested` only after the third. It becomes `done` only when `tested` and merged or shipped.

## What contract tests can and cannot do

They can:

- pin a pure function's behavior, including error paths;
- catch a regression in a type or a boundary;
- document the intended contract for the next reader;
- run in seconds, on every change.

They cannot:

- prove the feature works end to end;
- see the gateway timeout, the expired token, the narrow window, the empty database, the
  user's locale, or the word that means the wrong thing;
- replace the judgment of a person looking at the result.

The failure mode is not that agents write unit tests. It is that the suite becomes the
**evidence** of done, and the human stops doing the one thing the suite cannot do.

### Test the contract, not the wiring

A contract test that mocks the thing under test proves only that the mock works. Mock the
boundary (the network, the clock, the filesystem), not the function you are testing. If a
test cannot fail for a reason the user would care about, it is documentation, not
verification.

## The cold build

### Definition

A cold build is a build from pinned inputs with no incremental state that could hide a
missing dependency or a stale artifact:

- the candidate is a commit SHA, or a recorded dirty-tree hash;
- dependencies resolve from the lockfile, not from a warm `node_modules`;
- build outputs and caches that could mask a missing step are removed;
- no dev server, no watch mode, no previously running process;
- the command is the one a new contributor would run, not a private shortcut.

"Cold" does not mean "slow for its own sake". It means "nothing in the environment is
doing work the repository does not describe".

### Record

Every cold build writes a record before a test round can open:

```md
## Cold build
- candidate: 4f2a1c9 (dirty: no)
- lockfile: sha256:9c1e…
- command: `pnpm install --frozen-lockfile && pnpm build`
- cwd: D:\Projects\acme
- env: Node 24.19.0, pnpm 10.4.1, Windows 11 26100
- started: 2026-10-29T17:46:12+08:00
- finished: 2026-10-29T18:04:03+08:00
- exit: 0
- artifacts: `dist/` (41 files, 2.3 MB), `dist/server.js`
- notes: removed `dist/`, `node_modules/.cache/`, `.turbo/`
```

If the tree is dirty, the candidate is `dirty:<hash>` and the record says which files
differ. A cold build of a dirty tree is allowed for a test; it is not allowed to be
reported as a build of the commit.

### What it does not prove

The build can pass and the product can still be broken. That is not a reason to skip the
build; it is the reason it is the **second** gate, not the last.

## The real test

### Definition

A real test is a human running the built change in the real runtime or environment,
following a recorded scenario, observing the result, and recording it.

- "Real environment" means the app or binary the user would actually use, with the real
  integration points (or a staging copy whose differences are stated).
- "Observed" means a person saw the result, not only a log line. A person may observe an
  automated run; the point is that the real thing ran and someone judged the outcome.
- "Recorded" means the test record below exists before the status changes.

A test that runs the mock artifact is not a real test. A screenshot of the mock is not a
real test. A unit test with a mocked transport is not a real test, even if it is called an
integration test.

### The scenario card

Before the test round opens, the agent writes a scenario a person can follow without
asking questions:

```md
## Scenario: retry after a gateway timeout
Preconditions:
- a project with one file, signed in as the owner
- network throttled to 3G in devtools
Steps:
1. Open the project.
2. Click Upload and choose a 20 MB file.
3. When the progress bar reaches ~80%, disable the network for 5 seconds, then re-enable.
4. Wait for the upload to finish or fail.
Expected:
- one retry, not a second upload
- the progress bar never exceeds 100%
- on success, one toast: "Uploaded"
- on failure, one error with a Retry action; no duplicate file
Failure signature:
- two files with the same name, or a progress bar stuck at 99%, or a silent failure
Rollback:
- delete the uploaded file; no schema change
```

The scenario has 3–7 steps, one expected observable per step, a failure signature, and a
rollback. "Works" is not an expected observable.

### At least one adversarial case

Each test scenario includes one case designed to break the change, chosen from the edges
the decision touched: empty, huge, slow, denied, concurrent, narrow, non-default locale,
first run, upgrade from the previous version. The case is named in the record, not left to
improvisation.

### Test record

```md
## Real test
- round: 0007-empty-state
- candidate: 4f2a1c9 (cold build 18:04, exit 0)
- environment: Windows 11 26100, Chrome 141, local
- scenario: retry after a gateway timeout (3G, 5s offline)
- adversarial case: duplicate filename in the same folder
- observed: one retry; no duplicate; toast appeared twice (bug)
- verdict: fail
- evidence: `test/0007/upload-retry.mp4`, `test/0007/console.log`
- tester: Jason
- date: 2026-10-29T18:22:41+08:00
```

A failure is a successful test. It found the thing the suite did not.

## The trigger

The page trigger is the only way to start a real test from the round tab. It is not a
generic "run" button; it runs the command recorded in the test round.

### Contract

```ts
type TestStatus =
  | { state: "not-planned" }
  | { state: "cold-build-pending"; candidate: string }
  | { state: "cold-build-failed"; candidate: string; exitCode: number; log: string }
  | { state: "ready"; candidate: string; builtAt: string }
  | { state: "running"; startedAt: string; command: string }
  | { state: "finished"; verdict: "pass" | "fail" | "blocked"; record: string };

// The tab calls these; it never composes a command.
testStatus(roundId: string): Promise<TestStatus>;
startTest(roundId: string): Promise<{ runId: string }>;
cancelTest(runId: string): Promise<void>;
```

- `startTest` runs `trigger.command` in `trigger.cwd` with `trigger.timeoutSec`, in a
  terminal tab, with the environment recorded (non-secret).
- The confirmation sheet shows the command, the scenario, the expected observable, the
  failure signature, and the rollback before anything runs.
- The button is disabled unless `state === "ready"` at the current candidate.
- The command is not editable in the tab. If it is wrong, the agent fixes the test round;
  the user does not become the build engineer.
- On exit, the tab asks for the verdict and a note. It never auto-passes on exit 0.
- Logs are retained with the test record. A failed run does not delete the previous pass.

### Pressing the user

The agent must make the test the next action, not a reminder in a wall of text. The
message is short, specific, and states the cost of not testing:

> Cold build passed at `4f2a1c9` (18:04, exit 0). I need four minutes at the machine:
> 1. Open the project, upload a 20 MB file.
> 2. Throttle to 3G; go offline for 5 seconds at ~80%.
> 3. Tell me whether you see one retry, a duplicate file, or a stuck bar.
>
> Expected: one retry, no duplicate, one toast. If you see two files, that is the bug.
> The **I’m ready to test** button is in the round tab. If you cannot test now, say so;
> the change stays `unverified`.

One ask. No repeated nagging while the status is visible. "Press" means remove every
obstacle between the user and the test, not send more messages.

### When the user cannot test

- **No runtime access.** Use a staging clone with production-like data; record what
  differs. A unit test is still not a substitute.
- **No human available.** The change stays `built` or `cold-built`, with a residual-risk
  list. Release notes must not describe it as tested.
- **The test is unsafe or destructive.** Provide a fixture and a rollback. If neither is
  possible, the test is not ready; do not ask the user to improvise on production.
- **The user declines.** Record `declined` with the reason. The change stays `unverified`.
  That is an honest state; it is not a failure of the process, and it is not a pass.

## Anti-patterns

| Anti-pattern | Why it fails | Instead |
|---|---|---|
| "All tests pass" | Contract tests do not run the product | Say `built`; open a test round |
| A screenshot of the mock | The mock is not the build | Test the built candidate |
| CI as the real test | CI is rarely the real environment or the real data | Name what CI proves; test the rest |
| "Looks good" from an image | A static image hides focus, timing, and state | Run the scenario |
| Testing after merge | The first real test is in the main branch | Test before merge, or mark unverified |
| Reusing an old build | The candidate changed | Cold-build the named candidate |
| A cold build that reuses caches | It hides a missing dependency | Remove the caches the record names |
| A test with no expected observable | Any result can be called a pass | Write the observable first |

## Edge cases the scenario should reach

- first run vs upgrade from the previous version;
- empty, one item, and many items;
- slow network, offline, timeout, retry;
- denied permission, expired session, read-only mode;
- narrow window, keyboard-only, non-default locale;
- concurrent action from a second window;
- destructive action with an undo path and without one.

Not every test covers all of them. The round names which ones the decision touched, and
the scenario includes at least one.
