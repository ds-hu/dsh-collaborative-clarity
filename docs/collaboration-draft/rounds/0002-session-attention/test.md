# Round 0002 — Session attention

**Status:** tested
**Kind:** implementation fix, prompted by real-test feedback
**Tool rounds:** `clarity-test-mvtlpwsc-6f6fb1` (fail), `clarity-test-mvtlw1pj-9ef46f` (fail),
`clarity-test-mvtmfewz-d12052` (pass)

## What changed

The first attention indicator was a bottom-right pill. The user rejected it: the mark
belongs on the session row in the left panel, where it is visible while multitasking. The
second attempt registered a leading-cell dot but did not mark the runtime's pending
interaction, so the row did not show it while the tool was waiting. The third attempt
publishes a `pendingInteraction` of kind `question` through `ctx.uiSession`, so the shared
warning dot and the trailing `Answer` label appear.

## Test record

- **Candidate:** `worktree:dsh-collaborative-clarity@0.1.0+pending-interaction`
- **Cold build:** `node --check plugin/index.js && node --check plugin/client.js` — exit 0
- **Environment:** DSH 0.2.1-rc.2 Web, Windows 11, the user's authenticated page
- **Scenario:** open a real-test gate; look at the session row while it waits; confirm the
  warning dot and `Answer`; open the Clarity tab; record the result.
- **Observed:**
  1. Bottom-right pill: fail — "I do not want one at the bottom-right. I want one on the
     left workspaces ... indicator."
  2. Leading dot without runtime status: fail — "No yellow dot in the session row."
  3. Runtime `pendingInteraction`: pass — "Good!"
- **Verdict:** pass on the third run.
- **Tester:** the user
- **Date:** 2026-10-29

## What this proves

The attention mark is not a custom decoration that competes with the row; it is the
runtime's existing warning state. That is why it survives a busy row and why the trailing
time becomes `Answer`.

## What it does not prove

- It does not prove the mark renders in a second workspace or while another agent is
  running; that is follow-up work.
- It does not prove the same mark appears when the page is reloaded while a round is open;
  the SSE snapshot is designed for that, but it was not part of this test.
