import assert from 'node:assert/strict'
import test from 'node:test'

import { decisionTool, RoundStore, testTool } from '../index.js'

/** A tool execution face with one conversation. */
function exec(sessionId = 'session-1') {
  const controller = new AbortController()
  return { agent: { id: sessionId }, signal: controller.signal, controller }
}

/** One valid decision argument set. */
function decisionArgs() {
  return {
    decision: 'Should the empty state lead with a verb?',
    context: 'New users land here with no projects.',
    variants: [
      { id: 'a', label: 'Verb-first', html: '<!doctype html><h1>New project</h1>' },
      { id: 'b', label: 'Outcome-first', html: '<!doctype html><h1>Start something</h1>' },
    ],
    recommendation: 'a',
    foreclosures: ['The outcome-first framing is lost.'],
  }
}

test('a decision round resolves with the selected variant and comments', async () => {
  const store = new RoundStore()
  const pending = decisionTool(store).execute(decisionArgs(), exec())
  const round = store.openRounds()[0]
  assert.equal(round.kind, 'decision')
  assert.equal(round.sessionId, 'session-1')

  store.decide(round.id, {
    verdict: 'accept',
    selected: 'a',
    comments: [{ variantId: 'a', text: 'Keep the word "New".' }],
    note: '',
  })
  const result = await pending
  assert.equal(result.status, 'decided')
  assert.equal(result.verdict, 'accept')
  assert.equal(result.selected, 'a')
  assert.deepEqual(result.comments, [{ variantId: 'a', text: 'Keep the word "New".' }])
})

test('a round rejects a recommendation that names no variant', async () => {
  const store = new RoundStore()
  const args = decisionArgs()
  args.recommendation = 'missing'
  await assert.rejects(decisionTool(store).execute(args, exec()), /does not match a variant id/)
})

test('an aborted wait resolves cancelled, not a rejection', async () => {
  const store = new RoundStore()
  const run = exec()
  const pending = decisionTool(store).execute(decisionArgs(), run)
  run.controller.abort()
  const result = await pending
  assert.equal(result.status, 'cancelled')
  assert.match(result.reason, /aborted/)
})

test('a test gate refuses a cold build that did not pass', async () => {
  const store = new RoundStore()
  const args = {
    candidate: '4f2a1c9',
    coldBuild: { command: 'pnpm build', exitCode: 1, builtAt: '2026-10-29T18:04:00+08:00' },
    scenario: {
      preconditions: ['signed in'],
      steps: ['open', 'click'],
      expected: ['one toast'],
      failureSignature: 'two toasts',
      rollback: 'none',
    },
  }
  await assert.rejects(testTool(store).execute(args, exec()), /did not exit 0/)
})

test('a test gate resolves pass with the observation', async () => {
  const store = new RoundStore()
  const args = {
    candidate: '4f2a1c9',
    coldBuild: { command: 'pnpm build', exitCode: 0, builtAt: '2026-10-29T18:04:00+08:00' },
    scenario: {
      preconditions: ['signed in'],
      steps: ['open', 'click'],
      expected: ['one toast'],
      failureSignature: 'two toasts',
      rollback: 'none',
    },
  }
  const pending = testTool(store).execute(args, exec())
  const round = store.openRounds()[0]
  assert.equal(round.kind, 'test')
  store.test(round.id, { verdict: 'pass', observed: 'One toast, no duplicate.' })
  const result = await pending
  assert.equal(result.status, 'tested')
  assert.equal(result.verdict, 'pass')
  assert.equal(result.observed, 'One toast, no duplicate.')
})
