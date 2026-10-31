import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { decisionTool, RoundStore, testTool } from '../index.js'

/** The directory holding this test's artifact fixtures. */
const HERE = fileURLToPath(new URL('./', import.meta.url))

/** A context whose only conversation works in this test directory. */
function ctx() {
  return {
    get: (name) => (name === 'sessions' ? { get: () => ({ header: { cwd: HERE } }) } : undefined),
  }
}

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
      { id: 'a', label: 'Verb-first', path: 'fixtures/verb-first.html' },
      { id: 'b', label: 'Outcome-first', path: 'fixtures/outcome-first.html' },
    ],
    recommendation: 'a',
    foreclosures: ['The outcome-first framing is lost.'],
  }
}

/** Wait for the round the tool is about to open, since artifacts may be read from disk. */
async function firstRound(store) {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const round = store.openRounds()[0]
    if (round) return round
    // A real timer, not `setImmediate`: the artifact read happens on the
    // threadpool, and fifty immediate turns can pass before it lands on a
    // loaded machine — which made this helper the only flaky thing in the suite.
    await new Promise((resolve) => setTimeout(resolve, 5))
  }
  throw new Error('the tool opened no round')
}

test('a decision round resolves with the selected variant and comments', async () => {
  const store = new RoundStore()
  const pending = decisionTool(store, ctx()).execute(decisionArgs(), exec())
  const round = await firstRound(store)
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

test('a decision result keeps element, text, and line anchors', async () => {
  const store = new RoundStore()
  const pending = decisionTool(store, ctx()).execute(decisionArgs(), exec())
  const round = await firstRound(store)
  const comments = [
    {
      variantId: 'a',
      text: 'Rename this button.',
      anchor: { kind: 'element', selector: '[data-anchor="save"]', text: 'Save' },
      artifactHash: 'a1b2c3d4',
    },
    {
      variantId: 'a',
      text: 'This phrase is vague.',
      anchor: { kind: 'text', quote: 'New project', prefix: '', suffix: ' and start' },
      artifactHash: 'a1b2c3d4',
    },
    {
      variantId: 'b',
      text: 'This loop never backs off.',
      anchor: { kind: 'line', path: 'src/retry.ts', start: 12, end: 14 },
      artifactHash: 'e5f6a7b8',
    },
  ]
  store.decide(round.id, { verdict: 'revise', selected: 'a', comments, note: '' })
  const result = await pending
  assert.equal(result.verdict, 'revise')
  assert.deepEqual(result.comments, comments)
  assert.equal(result.comments[0].anchor.kind, 'element')
  assert.equal(result.comments[1].anchor.quote, 'New project')
  assert.equal(result.comments[2].anchor.start, 12)
})

test('a round rejects a recommendation that names no variant', async () => {
  const store = new RoundStore()
  const args = decisionArgs()
  args.recommendation = 'missing'
  await assert.rejects(decisionTool(store, ctx()).execute(args, exec()), /does not match a variant id/)
})

test('a round rejects an argument the schema does not declare', async () => {
  const store = new RoundStore()
  const args = { ...decisionArgs(), source: 'docs/a.md' }
  await assert.rejects(decisionTool(store, ctx()).execute(args, exec()), /arguments\.source is not a field/)
})

test('an aborted wait resolves cancelled, not a rejection', async () => {
  const store = new RoundStore()
  const run = exec()
  const pending = decisionTool(store, ctx()).execute(decisionArgs(), run)
  run.controller.abort()
  const result = await pending
  assert.equal(result.status, 'cancelled')
  assert.match(result.reason, /aborted/)
  // Nobody can collect this round any more; leaving it open would keep it on
  // screen and in `/rounds` forever.
  assert.equal(store.get(result.roundId).status, 'cancelled')
  assert.equal(store.openRounds().length, 0)
})

test('aborting a waiting round closes it and tells the browser', async () => {
  const store = new RoundStore()
  const run = exec()
  const pending = decisionTool(store, ctx()).execute(decisionArgs(), run)
  const round = await firstRound(store)

  const frames = []
  let release
  const response = {
    writeHead() {},
    write(frame) {
      frames.push(frame)
    },
    end() {},
    on(name, fn) {
      if (name === 'close') release = fn
    },
  }
  store.subscribe(response)

  try {
    run.controller.abort()
    const result = await pending
    assert.equal(result.status, 'cancelled')
    assert.equal(store.get(round.id).status, 'cancelled')
    assert.equal(store.openRounds().length, 0)
    assert.match(frames.join(''), /event: decided/)
  } finally {
    release?.()
  }
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
  const round = await firstRound(store)
  assert.equal(round.kind, 'test')
  store.test(round.id, { verdict: 'pass', observed: 'One toast, no duplicate.' })
  const result = await pending
  assert.equal(result.status, 'tested')
  assert.equal(result.verdict, 'pass')
  assert.equal(result.observed, 'One toast, no duplicate.')
})
