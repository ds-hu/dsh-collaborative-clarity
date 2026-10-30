import assert from 'node:assert/strict'
import test from 'node:test'

import { RoundStore, decisionTool } from '../index.js'

/** The tool arguments, with a real fixture artifact. */
function args(overrides = {}) {
  return {
    decision: 'Which surface?',
    variants: [{ id: 'a', path: 'tests/fixtures/outcome-first.html' }],
    recommendation: 'a',
    foreclosures: ['B is gone.'],
    ...overrides,
  }
}

/** A jobs registry that records the spec and runs it, like the real one. */
function fakeJobs() {
  const starts = []
  return {
    starts,
    start(spec) {
      const hooks = spec.run({ append() {}, updateProgress() {} })
      starts.push({ spec, hooks })
      return `clarity-${starts.length}`
    },
  }
}

/** The minimal execution context a tool call carries. */
function execFor(id = 'session-1') {
  return { agent: { id }, signal: new AbortController().signal }
}

test('blocking:false registers a job and settles it with the decision', async () => {
  const store = new RoundStore()
  const jobs = fakeJobs()
  const tool = decisionTool(store, { get: (name) => (name === 'jobs' ? jobs : undefined) })

  const pending = await tool.execute(args({ blocking: false }), execFor())
  assert.equal(pending.status, 'pending')
  assert.equal(pending.jobId, 'clarity-1')
  assert.equal(pending.recommendation, 'a')

  assert.equal(jobs.starts.length, 1)
  assert.equal(jobs.starts[0].spec.kind, 'clarity')
  assert.equal(jobs.starts[0].spec.owner, 'session-1')
  assert.match(jobs.starts[0].spec.label, /Which surface\?/)

  const round = store.get(pending.roundId)
  assert.equal(round.status, 'open', 'the round is still answerable while the job runs')

  store.decide(round.id, { verdict: 'accept', selected: 'a', comments: [], note: '' })
  const outcome = await jobs.starts[0].hooks.done
  assert.equal(outcome.status, 'completed')
  assert.equal(outcome.detail, 'accept')

  const payload = JSON.parse(outcome.result)
  assert.equal(payload.status, 'decided')
  assert.equal(payload.selected, 'a')
})

test('killing the job cancels the round without a browser verdict', async () => {
  const store = new RoundStore()
  const jobs = fakeJobs()
  const tool = decisionTool(store, { get: (name) => (name === 'jobs' ? jobs : undefined) })

  const pending = await tool.execute(args({ blocking: false }), execFor())
  jobs.starts[0].hooks.cancel('stopped by the model')

  const outcome = await jobs.starts[0].hooks.done
  assert.equal(outcome.status, 'killed')
  assert.equal(outcome.detail, 'stopped by the model')
  const round = store.get(pending.roundId)
  assert.equal(round.status, 'cancelled')
  assert.deepEqual(round.result, {
    status: 'cancelled',
    roundId: pending.roundId,
    reason: 'stopped by the model',
  })
})

test('a cancel verdict settles the job as killed', async () => {
  const store = new RoundStore()
  const jobs = fakeJobs()
  const tool = decisionTool(store, { get: (name) => (name === 'jobs' ? jobs : undefined) })

  const pending = await tool.execute(args({ blocking: false }), execFor())
  store.decide(pending.roundId, { verdict: 'cancel', comments: [], note: '' })
  const outcome = await jobs.starts[0].hooks.done
  assert.equal(outcome.status, 'killed')
  assert.equal(JSON.parse(outcome.result ?? '{}').status, undefined, 'a cancel carries no decision payload')
})

test('blocking is still the default and returns the structured verdict', async () => {
  const store = new RoundStore()
  const jobs = fakeJobs()
  const tool = decisionTool(store, { get: (name) => (name === 'jobs' ? jobs : undefined) })

  const call = tool.execute(args(), execFor())
  for (let attempt = 0; attempt < 200 && store.openRounds().length === 0; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 5))
  }
  assert.equal(jobs.starts.length, 0, 'no job is registered for a blocking round')
  const [round] = store.openRounds()
  assert.ok(round, 'the blocking round is published')
  store.decide(round.id, { verdict: 'accept', selected: 'a', comments: [], note: 'ship it' })

  const result = await call
  assert.equal(result.status, 'decided')
  assert.equal(result.verdict, 'accept')
  assert.equal(result.note, 'ship it')
})

test('a composition without jobs refuses non-blocking before publishing a round', async () => {
  const store = new RoundStore()
  const tool = decisionTool(store, { get: () => undefined })
  await assert.rejects(tool.execute(args({ blocking: false }), execFor()), /jobs service/)
  assert.equal(store.openRounds().length, 0, 'nothing was published for the browser to answer')
})

test('a rejected registration closes the round it already published', async () => {
  const store = new RoundStore()
  const jobs = {
    start() {
      throw new Error('no controller serves this agent')
    },
  }
  const tool = decisionTool(store, { get: (name) => (name === 'jobs' ? jobs : undefined) })
  await assert.rejects(tool.execute(args({ blocking: false }), execFor()), /could not register/)
  assert.equal(store.openRounds().length, 0)
})

test('a round decided after the job settles is not settled twice', async () => {
  const store = new RoundStore()
  const jobs = fakeJobs()
  const tool = decisionTool(store, { get: (name) => (name === 'jobs' ? jobs : undefined) })

  const pending = await tool.execute(args({ blocking: false }), execFor())
  store.decide(pending.roundId, { verdict: 'accept', selected: 'a', comments: [], note: '' })
  const outcome = await jobs.starts[0].hooks.done

  // A second settlement attempt must not replace the first outcome.
  jobs.starts[0].hooks.cancel('late')
  assert.equal(await jobs.starts[0].hooks.done, outcome)
})
