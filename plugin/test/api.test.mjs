import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { Readable } from 'node:stream'
import test from 'node:test'

import { registerApi, RoundStore } from '../index.js'

/** A fake server response that records status and body. */
function fakeResponse() {
  const response = new EventEmitter()
  response.status = 0
  response.chunks = []
  response.headers = {}
  response.writeHead = (status, headers) => {
    response.status = status
    response.headers = headers ?? {}
  }
  response.write = (text) => {
    response.chunks.push(text)
  }
  response.end = (text) => {
    if (text !== undefined) response.chunks.push(text)
  }
  return response
}

/** A fake request that is async-iterable, as the handler expects. */
function fakeRequest(method, url, body) {
  const request = Readable.from(body === undefined ? [] : [Buffer.from(body, 'utf8')])
  request.method = method
  request.url = url
  return request
}

/** Register the API on a fake webServer and return its handler. */
function mount(store) {
  let handler
  const ctx = {
    webServer: {
      register(options) {
        handler = options.handler
        return () => {}
      },
    },
  }
  registerApi(ctx, store)
  assert.equal(typeof handler, 'function')
  return handler
}

/** Read the JSON body a response collected. */
function json(response) {
  return JSON.parse(response.chunks.join(''))
}

test('health, round read, and decision write go through the routes', async () => {
  const store = new RoundStore()
  store.open({
    id: 'r1',
    kind: 'decision',
    sessionId: 's1',
    decision: 'A or B?',
    context: '',
    variants: [{ id: 'a', label: 'A', html: '<h1>A</h1>' }],
    recommendation: 'a',
    foreclosures: ['B is lost.'],
    status: 'open',
    createdAt: Date.now(),
  })
  const handler = mount(store)

  const health = fakeResponse()
  await handler(fakeRequest('GET', '/clarity/api/health'), health)
  assert.equal(health.status, 200, JSON.stringify(json(health)))
  assert.equal(json(health).ok, true)
  assert.equal(json(health).openRounds, 1)

  const read = fakeResponse()
  await handler(fakeRequest('GET', '/clarity/api/round?id=r1'), read)
  assert.equal(read.status, 200)
  assert.equal(json(read).round.id, 'r1')

  const decide = fakeResponse()
  await handler(
    fakeRequest(
      'POST',
      '/clarity/api/decide',
      JSON.stringify({ roundId: 'r1', verdict: 'accept', selected: 'a', comments: [], note: '' }),
    ),
    decide,
  )
  assert.equal(decide.status, 200)
  assert.equal(json(decide).result.status, 'decided')
  assert.equal(store.get('r1').status, 'accepted')
})

test('anchored comments pass validation and malformed anchors are refused', async () => {
  const store = new RoundStore()
  const base = {
    kind: 'decision',
    sessionId: 's1',
    decision: 'A or B?',
    context: '',
    variants: [{ id: 'a', label: 'A', html: '<h1>A</h1>' }],
    recommendation: 'a',
    foreclosures: ['B is lost.'],
    status: 'open',
    createdAt: Date.now(),
  }
  store.open({ ...base, id: 'r2' })
  const handler = mount(store)
  const comments = [
    {
      variantId: 'a',
      text: 'This label should say Save.',
      anchor: { kind: 'element', selector: '[data-anchor="save"]', text: 'Save' },
      artifactHash: 'a1b2c3d4',
    },
    {
      variantId: 'a',
      text: 'Too vague.',
      anchor: { kind: 'text', quote: 'Continue', prefix: 'Press ', suffix: ' to go on' },
      artifactHash: 'a1b2c3d4',
    },
    {
      variantId: 'a',
      text: 'This loop never backs off.',
      anchor: { kind: 'line', path: 'src/retry.ts', start: 12, end: 14 },
      artifactHash: 'a1b2c3d4',
    },
    { variantId: 'a', text: 'Whole variant.', anchor: { kind: 'variant' }, artifactHash: 'a1b2c3d4' },
  ]
  const accepted = fakeResponse()
  await handler(
    fakeRequest(
      'POST',
      '/clarity/api/decide',
      JSON.stringify({ roundId: 'r2', verdict: 'accept', selected: 'a', comments, note: '' }),
    ),
    accepted,
  )
  assert.equal(accepted.status, 200, JSON.stringify(json(accepted)))
  assert.deepEqual(json(accepted).result.comments, comments)
  assert.equal(json(accepted).result.comments[2].anchor.end, 14)

  store.open({ ...base, id: 'r3' })
  const badAnchor = fakeResponse()
  await handler(
    fakeRequest(
      'POST',
      '/clarity/api/decide',
      JSON.stringify({
        roundId: 'r3',
        verdict: 'accept',
        selected: 'a',
        comments: [{ variantId: 'a', text: 'No selector.', anchor: { kind: 'element', text: 'Save' } }],
      }),
    ),
    badAnchor,
  )
  assert.equal(badAnchor.status, 400)
  assert.equal(json(badAnchor).error.code, 'bad-request')
  assert.match(json(badAnchor).error.message, /selector/)

  store.open({ ...base, id: 'r4' })
  const badField = fakeResponse()
  await handler(
    fakeRequest(
      'POST',
      '/clarity/api/decide',
      JSON.stringify({
        roundId: 'r4',
        verdict: 'accept',
        selected: 'a',
        comments: [{ variantId: 'a', text: 'Extra.', anchor: { kind: 'text', quote: 'Continue', color: 'red' } }],
      }),
    ),
    badField,
  )
  assert.equal(badField.status, 400)
  assert.match(json(badField).error.message, /not allowed/)
})

test('unknown rounds and failed cold builds are refused with the API error shape', async () => {
  const store = new RoundStore()
  store.open({
    id: 't1',
    kind: 'test',
    sessionId: 's1',
    decision: 'Real test',
    status: 'open',
    createdAt: Date.now(),
  })
  const handler = mount(store)

  const unknown = fakeResponse()
  await handler(fakeRequest('GET', '/clarity/api/round?id=nope'), unknown)
  assert.equal(unknown.status, 404)
  assert.equal(json(unknown).error.code, 'unknown-round')

  const badTest = fakeResponse()
  await handler(
    fakeRequest('POST', '/clarity/api/test', JSON.stringify({ roundId: 't1', verdict: 'fail', observed: '' })),
    badTest,
  )
  assert.equal(badTest.status, 400)
  assert.equal(json(badTest).error.code, 'bad-request')

  const badAccept = fakeResponse()
  await handler(
    fakeRequest('POST', '/clarity/api/decide', JSON.stringify({ roundId: 't1', verdict: 'accept' })),
    badAccept,
  )
  assert.equal(badAccept.status, 400)
})
