import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

const code = readFileSync(new URL('../client.js', import.meta.url), 'utf8')

class FakeEventSource {
  static last = null
  constructor(url) {
    this.url = url
    this.handlers = new Map()
    this.closed = false
    FakeEventSource.last = this
  }
  addEventListener(name, handler) {
    this.handlers.set(name, handler)
  }
  emit(name, data) {
    const handler = this.handlers.get(name)
    if (handler) handler({ data: JSON.stringify(data) })
  }
  close() {
    this.closed = true
  }
}

/** The little of sessionStorage the panel uses, per tab. */
function fakeStorage() {
  const data = new Map()
  return {
    get length() {
      return data.size
    },
    key(index) {
      return [...data.keys()][index] ?? null
    },
    getItem(key) {
      return data.has(key) ? data.get(key) : null
    },
    setItem(key, value) {
      data.set(key, String(value))
    },
    removeItem(key) {
      data.delete(key)
    },
  }
}

function loadClient(ReactOverride, fetchImpl, storage, documentImpl) {
  let registration
  const sandbox = {
    window: {
      __ModuleLoader__: {
        load(value) {
          registration = value
        },
      },
      // A test that leaves this out is a host with no storage at all.
      sessionStorage: storage,
    },
    EventSource: FakeEventSource,
    console,
    fetch: fetchImpl || (async () => ({ ok: true, json: async () => ({}) })),
    // The page has timers; a sandbox without them fails a panel the browser runs.
    setTimeout,
    clearTimeout,
  }
  // A test that leaves this out is a host with no `document`: the panel must run
  // there too, so nothing may touch it unguarded.
  if (documentImpl) sandbox.document = documentImpl
  vm.runInNewContext(code, sandbox, { filename: 'client.js' })
  assert.ok(registration, 'the bundle registers itself')
  assert.equal(registration.id, '@ds-hu/dsh-collaborative-clarity')

  const React = ReactOverride || {
    createElement: () => null,
    Fragment: 'Fragment',
    useState: () => [undefined, () => {}],
    useEffect: () => {},
    useRef: () => ({ current: null }),
  }
  return registration.factory((specifier) => {
    if (specifier === 'react') return React
    throw new Error(`unexpected require: ${specifier}`)
  })
}

/**
 * A very small hook runtime for one component. It validates the `style` prop on
 * every element, which is the failure React reports as error #62.
 */
function statefulReact() {
  const hooks = []
  let cursor = 0
  function element(type, props, ...children) {
    if (props && props.style !== undefined && props.style !== null && typeof props.style !== 'object') {
      const name = typeof type === 'string' ? type : type && type.name ? type.name : 'component'
      throw new Error(`style prop on <${name}> is ${typeof props.style}, not an object`)
    }
    return { type, props: props || {}, children }
  }
  const React = {
    Fragment: 'Fragment',
    createElement: element,
    useState(initial) {
      const index = cursor++
      if (!(index in hooks)) hooks[index] = initial
      return [
        hooks[index],
        (next) => {
          hooks[index] = typeof next === 'function' ? next(hooks[index]) : next
        },
      ]
    },
    useRef(initial) {
      const index = cursor++
      if (!(index in hooks)) hooks[index] = { current: initial }
      return hooks[index]
    },
    useEffect() {
      cursor += 1
    },
  }
  return {
    React,
    render(component, props) {
      cursor = 0
      return component(props)
    },
    // What the sidebar does when it shows another tab: every hook is dropped.
    unmount() {
      hooks.length = 0
      cursor = 0
    },
  }
}

/**
 * A hook runtime that runs effects once and lets their async state updates
 * settle, so a component's own data path can be asserted after one render.
 */
function effectReact() {
  const hooks = []
  let cursor = 0
  let effects = []
  const React = {
    Fragment: 'Fragment',
    createElement: (type, props, ...children) => ({ type, props: props || {}, children }),
    useState(initial) {
      const index = cursor++
      if (!(index in hooks)) hooks[index] = initial
      return [
        hooks[index],
        (next) => {
          hooks[index] = typeof next === 'function' ? next(hooks[index]) : next
        },
      ]
    },
    useRef(initial) {
      const index = cursor++
      if (!(index in hooks)) hooks[index] = { current: initial }
      return hooks[index]
    },
    useEffect(fn) {
      const index = cursor++
      if (!(index in hooks)) {
        hooks[index] = true
        effects.push(fn)
      }
    },
  }
  return {
    React,
    async render(component, props) {
      cursor = 0
      effects = []
      let tree = component(props)
      for (const effect of effects) effect()
      for (let i = 0; i < 20; i += 1) await Promise.resolve()
      cursor = 0
      tree = component(props)
      return tree
    },
  }
}

function findNode(tree, predicate) {
  if (tree === null || tree === undefined || typeof tree !== 'object') return null
  if (Array.isArray(tree)) {
    for (const child of tree) {
      const found = findNode(child, predicate)
      if (found) return found
    }
    return null
  }
  if (predicate(tree)) return tree
  for (const child of tree.children || []) {
    const found = findNode(child, predicate)
    if (found) return found
  }
  return null
}

function textOf(tree) {
  if (tree === null || tree === undefined || tree === false) return ''
  if (typeof tree === 'string' || typeof tree === 'number') return String(tree)
  if (Array.isArray(tree)) return tree.map(textOf).join('')
  // A function-type node is an unrendered component (the fake React does not
  // invoke them); render it by hand to reach its text.
  if (typeof tree.type === 'function') return textOf(tree.type(tree.props))
  return (tree.children || []).map(textOf).join('')
}

/**
 * A value from the bundle, brought into this realm.
 *
 * The client runs in its own `vm` context, so an array it built has that
 * context's `Array.prototype`, and `deepStrictEqual` (which is what
 * `node:assert/strict` makes of `deepEqual`) reads the two as different. The
 * host's own boundary is JSON anyway; compare the way the host does.
 */
function plain(value) {
  return JSON.parse(JSON.stringify(value))
}

test('the recommendation and its cost sit inside the card, above the fidelity rows', () => {
  const runtime = statefulReact()
  const client = loadClient(runtime.React)
  const round = {
    id: 'r1',
    kind: 'decision',
    sessionId: 'session-1',
    decision: 'Should this ship?',
    context: '',
    variants: [
      {
        id: 'a',
        label: 'A',
        html: '<h1>A</h1>',
        note: '',
        real: ['the panel'],
        mocked: [],
        omitted: [],
        recommendation: 'It is the smaller change.',
        cost: ['B is lost.', 'C waits.'],
      },
      { id: 'b', label: 'B', html: '<h1>B</h1>', note: '', real: [], mocked: [], omitted: [] },
    ],
    status: 'open',
    createdAt: Date.now(),
  }
  const tree = runtime.render(client.__test.DecisionView, { round, sent: null, onSent() {} })
  const card = findNode(tree, (node) => node.props && node.props.role === 'button' && node.props['aria-pressed'] === true)
  assert.ok(card, 'the variant that carries the recommendation starts selected')
  const text = textOf(card)
  const why = text.indexOf('why')
  const cost = text.indexOf('cost')
  const real = text.indexOf('real')
  assert.ok(why !== -1, `the card carries the recommendation: ${text}`)
  assert.ok(text.includes('It is the smaller change.'), 'the reason reads inside the card')
  assert.ok(cost > why, 'the cost follows the reason')
  assert.ok(text.includes('C waits.'), 'every cost line is shown, not just the first')
  assert.ok(real > cost, 'the fidelity rows come last')
})

function makeCtx() {
  const calls = { openTab: [], registered: [], bodies: [], titles: [], nodes: [] }
  let mounted = 'session-1'
  const mountedListeners = new Set()
  const ctx = {
    effect(fn) {
      const dispose = fn()
      return typeof dispose === 'function' ? dispose : () => {}
    },
    sidebarRightTabs: {
      register(definition) {
        calls.registered.push(definition)
        return () => {}
      },
    },
    slots: {
      inject(_name, callback) {
        const dispose = callback()
        return typeof dispose === 'function' ? dispose : () => {}
      },
      register(options, component) {
        if (options.name === 'sidebar.right.pane.tab') calls.bodies.push({ options, component })
        if (options.name === 'sidebar.right.pane.tab.title') calls.titles.push({ options, component })
        if (options.name === 'conversation.chat.node') calls.nodes.push({ options, component })
        return () => {}
      },
    },
    sidebarRight: {
      mounted: {
        getSnapshot: () => mounted,
        subscribe(listener) {
          mountedListeners.add(listener)
          return () => mountedListeners.delete(listener)
        },
      },
      openTab(kind, options) {
        calls.openTab.push({ kind, options })
      },
    },
    uiSession: {
      registerPendingInteraction() {
        return () => () => {}
      },
    },
  }
  return {
    ctx,
    calls,
    /** Switch the conversation the main column shows, as the seat reports it. */
    select(sessionId) {
      mounted = sessionId
      for (const listener of mountedListeners) listener()
    },
  }
}

test('the bundle registers a per-conversation tab, a body, a title, and a guide entry', () => {
  const client = loadClient()
  assert.deepEqual([...client.inject].sort(), ['sidebarRight', 'sidebarRightTabs', 'slots', 'uiSession'])
  const { ctx, calls } = makeCtx()
  client.apply(ctx)

  assert.equal(calls.registered.length, 1)
  const definition = calls.registered[0]
  assert.equal(definition.id, 'dsh-collaborative-clarity')
  assert.equal(definition.kind, 'clarity')
  // One tab per conversation: a second round navigates the existing tab so a
  // restored tab cannot stay pinned to an older round id.
  assert.equal(definition.multiple, false)
  assert.equal(definition.guide.length, 1)
  assert.equal(definition.guide[0].id, 'clarity')

  assert.equal(calls.bodies.length, 1)
  assert.equal(calls.bodies[0].options.key, 'dsh-collaborative-clarity')
  assert.equal(calls.titles.length, 1)
  assert.equal(calls.titles[0].options.key, 'dsh-collaborative-clarity')
})

test('the artifact bridge is injected and anchor labels are stable', () => {
  const client = loadClient()
  const internals = client.__test
  assert.ok(internals)
  const html = internals.withBridge('<html><body><h1>Save</h1></body></html>', 'a')
  assert.match(html, /window\.__CLARITY_VARIANT__="a"/)
  assert.equal((html.match(/<script>/g) || []).length, 2)
  assert.match(html, /function clarityBridge/)
  assert.equal(internals.contentHash('abc'), internals.contentHash('abc'))
  assert.notEqual(internals.contentHash('abc'), internals.contentHash('abd'))
  assert.equal(internals.anchorLabel({ kind: 'variant' }), 'Whole variant')
  assert.equal(internals.anchorLabel({ kind: 'element', text: 'Save' }), 'Element · Save')
  assert.equal(internals.anchorLabel({ kind: 'text', quote: 'Continue' }), '“Continue”')
  assert.equal(internals.anchorLabel({ kind: 'line', start: 12, end: 14 }), 'Lines 12–14')
  assert.equal(internals.isAnchor({ kind: 'element', selector: '#save' }), true)
  assert.equal(internals.isAnchor({ kind: 'element', text: 'Save' }), false)
  assert.equal(internals.isAnchor({ kind: 'line', path: 'src/a.ts', start: 3, end: 2 }), false)
})

test('adding a comment never passes a string style to a host element', () => {
  const runtime = statefulReact()
  const client = loadClient(runtime.React)
  const round = {
    id: 'r1',
    kind: 'decision',
    sessionId: 'session-1',
    decision: 'Should this ship?',
    context: '',
    variants: [{ id: 'a', label: 'A', html: '<h1>A</h1>', note: '', real: [], mocked: [], omitted: [], recommendation: 'It is the smaller change.', cost: ['B is lost.'] }],
    status: 'open',
    createdAt: Date.now(),
  }
  const props = { round, sent: null, onSent() {} }
  let tree = runtime.render(client.__test.DecisionView, props)
  const input = findNode(
    tree,
    (node) =>
      node.type === 'textarea' &&
      typeof node.props.placeholder === 'string' &&
      node.props.placeholder.startsWith('What should change?'),
  )
  assert.ok(input, 'the comment composer is a textarea')
  assert.equal(input.props.rows, 2, 'it starts two lines tall')
  input.props.onChange({ target: { value: 'This should change.' } })
  tree = runtime.render(client.__test.DecisionView, props)
  const add = findNode(
    tree,
    (node) => node.type === 'button' && Array.isArray(node.children) && node.children.includes('Add'),
  )
  assert.ok(add, 'the Add button is rendered')
  add.props.onClick()
  assert.doesNotThrow(() => {
    runtime.render(client.__test.DecisionView, props)
  })
})

test('Ctrl+Enter adds the comment and plain Enter does not', () => {
  const runtime = statefulReact()
  const client = loadClient(runtime.React)
  const round = {
    id: 'r1',
    kind: 'decision',
    sessionId: 'session-1',
    decision: 'Should this ship?',
    context: '',
    variants: [{ id: 'a', label: 'A', html: '<h1>A</h1>', note: '', real: [], mocked: [], omitted: [], recommendation: 'It is the smaller change.', cost: ['B is lost.'] }],
    status: 'open',
    createdAt: Date.now(),
  }
  const props = { round, sent: null, onSent() {} }
  let tree = runtime.render(client.__test.DecisionView, props)
  const composer = findNode(
    tree,
    (node) =>
      node.type === 'textarea' &&
      typeof node.props.placeholder === 'string' &&
      node.props.placeholder.startsWith('What should change?'),
  )
  composer.props.onChange({ target: { value: 'line one\nline two' } })

  let prevented = 0
  tree = runtime.render(client.__test.DecisionView, props)
  const next = findNode(
    tree,
    (node) =>
      node.type === 'textarea' &&
      typeof node.props.placeholder === 'string' &&
      node.props.placeholder.startsWith('What should change?'),
  )
  next.props.onKeyDown({ key: 'Enter', preventDefault: () => { prevented += 1 } })
  assert.equal(prevented, 0, 'plain Enter inserts a newline')

  next.props.onKeyDown({ key: 'Enter', ctrlKey: true, preventDefault: () => { prevented += 1 } })
  assert.equal(prevented, 1, 'Ctrl+Enter adds instead')
})

test('the test gate shows prepared and the command to run, then the observation', () => {
  const runtime = statefulReact()
  const client = loadClient(runtime.React)
  const round = {
    id: 't1',
    kind: 'test',
    sessionId: 'session-1',
    decision: 'Real test',
    candidate: 'dirty:abc',
    prepared: { command: 'node build.mjs', exitCode: 0, builtAt: '2026-10-30T10:00:00+08:00' },
    runThis: 'node serve.mjs',
    scenario: {
      preconditions: [],
      steps: ['Do the thing.'],
      expected: ['It works.'],
      failureSignature: 'It does not.',
      rollback: 'Revert.',
    },
    status: 'open',
    createdAt: Date.now(),
  }
  const props = { round, sent: null, onSent() {} }
  let tree = runtime.render(client.__test.TestView, props)
  const prepared = findNode(tree, (node) => Array.isArray(node.children) && node.children.includes('Prepared '))
  assert.ok(prepared, 'prepared is a line before the trigger, not a gate of its own')
  const command = findNode(tree, (node) => node.type === 'code' && node.children.includes('node serve.mjs'))
  assert.ok(command, 'the command to run is shown as text')
  const copy = findNode(
    tree,
    (node) => node.type === 'button' && Array.isArray(node.children) && node.children.includes('Copy'),
  )
  assert.ok(copy, 'and it can be copied instead of retyped')
  const start = findNode(
    tree,
    (node) => node.type === 'button' && Array.isArray(node.children) && node.children.includes('Start'),
  )
  assert.equal(start, null, 'the tab never starts the app itself')
  const ready = findNode(
    tree,
    (node) => node.type === 'button' && Array.isArray(node.children) && node.children.includes('I’m ready to test'),
  )
  ready.props.onClick()
  tree = runtime.render(client.__test.TestView, props)
  const add = findNode(tree, (node) => node.props && node.props['aria-label'] === 'Add screenshot')
  assert.ok(add, 'the observation form opens directly')
})

test('a test round without a prepared record and without a run command still opens the observation', () => {
  const runtime = statefulReact()
  const client = loadClient(runtime.React)
  const round = {
    id: 't0',
    kind: 'test',
    sessionId: 'session-1',
    decision: 'Real test',
    scenario: {
      preconditions: [],
      steps: ['Do the thing.'],
      expected: ['It works.'],
      failureSignature: 'It does not.',
      rollback: 'Revert.',
    },
    status: 'open',
    createdAt: Date.now(),
  }
  let tree = runtime.render(client.__test.TestView, { round, sent: null, onSent() {} })
  const note = findNode(tree, (node) => Array.isArray(node.children) && node.children.includes('No prepared build recorded.'))
  assert.ok(note, 'a round from an older host says why it has no prepared line')
  const command = findNode(tree, (node) => node.type === 'code')
  assert.equal(command, null, 'no run command, no line for it')
  const gate = findNode(
    tree,
    (node) => node.type === 'button' && Array.isArray(node.children) && node.children.includes('I’m ready to test'),
  )
  assert.ok(gate, 'the gate is still drawn')
  assert.equal(gate.props.disabled, false, 'such a round is still testable')
  gate.props.onClick()
  tree = runtime.render(client.__test.TestView, { round, sent: null, onSent() {} })
  const add = findNode(tree, (node) => node.props && node.props['aria-label'] === 'Add screenshot')
  assert.ok(add, 'the observation form opens')
})

test('a round from the old host never draws a process control', () => {
  const runtime = statefulReact()
  const client = loadClient(runtime.React)
  const round = {
    id: 't3',
    kind: 'test',
    sessionId: 'session-1',
    decision: 'Real test',
    prepared: { command: 'node build.mjs', exitCode: 0, builtAt: '2026-11-03T12:40:00+08:00' },
    warmStart: { command: 'node serve.mjs' },
    start: { at: Date.parse('2026-11-03T12:50:00+08:00'), command: 'node serve.mjs' },
    scenario: {
      preconditions: [],
      steps: ['Do the thing.'],
      expected: ['It works.'],
      failureSignature: 'It does not.',
      rollback: 'Revert.',
    },
    status: 'open',
    createdAt: Date.now(),
  }
  const tree = runtime.render(client.__test.TestView, { round, sent: null, onSent() {} })
  const labels = ['Started ', 'Stop', 'Output', 'Hide output']
  for (const label of labels) {
    const found = findNode(
      tree,
      (node) => (node.type === 'button' || Array.isArray(node.children)) && node.children.includes(label),
    )
    assert.equal(found, null, `${label} belongs to a process the tab no longer owns`)
  }
  const gate = findNode(
    tree,
    (node) => node.type === 'button' && Array.isArray(node.children) && node.children.includes('I’m ready to test'),
  )
  assert.ok(gate, 'the record is still testable: it asks for the observation, not a start')
})

test('a round event opens a tab only for the mounted conversation', () => {
  const client = loadClient()
  const { ctx, calls } = makeCtx()
  client.apply(ctx)

  const source = FakeEventSource.last
  assert.equal(source.url, '/clarity/api/events')
  source.emit('round', { id: 'r1', sessionId: 'session-1' })
  source.emit('round', { id: 'r2', sessionId: 'session-2' })

  assert.equal(calls.openTab.length, 1)
  assert.equal(calls.openTab[0].kind, 'clarity')
  assert.equal(calls.openTab[0].options.params.roundId, 'r1')
})

test('a round that opened in the background surfaces when its conversation comes back', () => {
  const client = loadClient()
  const { ctx, calls, select } = makeCtx()
  client.apply(ctx)

  const source = FakeEventSource.last
  source.emit('round', { id: 'r1', sessionId: 'session-1', decision: 'One?' })
  source.emit('round', { id: 'r2', sessionId: 'session-2', decision: 'Two?' })
  assert.equal(calls.openTab.length, 1, 'the background round did not steal the tab')
  calls.openTab.length = 0

  select('session-3')
  assert.equal(calls.openTab.length, 0, 'a conversation with no round opens nothing')

  select('session-2')
  assert.equal(calls.openTab.length, 1, 'the waiting round opens with its conversation')
  assert.equal(calls.openTab[0].options.params.roundId, 'r2')
})

test('answering one conversation leaves another conversation waiting', () => {
  const client = loadClient()
  const { ctx, calls, select } = makeCtx()
  client.apply(ctx)

  const source = FakeEventSource.last
  source.emit('round', { id: 'r1', sessionId: 'session-1', decision: 'One?' })
  source.emit('round', { id: 'r2', sessionId: 'session-2', decision: 'Two?' })
  calls.openTab.length = 0

  source.emit('decided', { roundId: 'r2' })
  select('session-2')
  assert.equal(calls.openTab.length, 0, 'the answered round no longer opens')

  select('session-1')
  assert.equal(calls.openTab.length, 1, 'the untouched conversation still waits')
  assert.equal(calls.openTab[0].options.params.roundId, 'r1')
})

test('reconnecting re-reads the host open rounds instead of trusting the page', async () => {
  const rounds = [{ id: 'r7', sessionId: 'session-1', decision: 'Recovered?', status: 'open', createdAt: 1 }]
  const seen = []
  const client = loadClient(undefined, async (url) => {
    seen.push(url)
    return { ok: true, json: async () => ({ rounds }) }
  })
  const { ctx, calls } = makeCtx()
  client.apply(ctx)
  calls.openTab.length = 0

  FakeEventSource.last.emit('open', {})
  await new Promise((resolve) => setTimeout(resolve, 0))

  assert.ok(seen.some((url) => url === '/clarity/api/rounds'), 'the whole open set is read')
  assert.equal(calls.openTab.length, 1, 'the recovered round opens in the mounted conversation')
  assert.equal(calls.openTab[0].options.params.roundId, 'r7')
})

test('a Clarity tab with no round id asks the host for this conversation’s round', async () => {
  const round = {
    id: 'r9',
    kind: 'decision',
    sessionId: 's2',
    decision: 'Which one?',
    context: '',
    variants: [{ id: 'a', label: 'A', html: '<h1>A</h1>', recommendation: 'It is the smaller change.', cost: ['B is lost.'] }],
    status: 'open',
    createdAt: 1,
  }
  const seen = []
  const runtime = effectReact()
  const client = loadClient(runtime.React, async (url) => {
    seen.push(url)
    if (url.includes('/rounds?')) return { ok: true, json: async () => ({ rounds: [round] }) }
    return { ok: false, status: 404, json: async () => ({ error: { message: 'unknown round' } }) }
  })

  const tree = await runtime.render(client.__test.RoundPanel, {
    sessionId: 's2',
    useTabInfo: () => ({ tab: { navigation: { params: {} } } }),
  })

  assert.ok(seen.some((url) => url.includes('/rounds?sessionId=s2')), 'the host is asked, not localStorage')
  const header = findNode(tree, (node) => node.props && node.props.round && node.props.round.id === 'r9')
  assert.ok(header, 'the conversation’s round is shown')
})

test('a comment typed but never added travels with the decision', async () => {
  const runtime = statefulReact()
  const bodies = []
  const client = loadClient(runtime.React, async (path, init) => {
    bodies.push({ path, body: JSON.parse(init.body) })
    return { ok: true, json: async () => ({ ok: true, result: { verdict: 'accept' } }) }
  })
  const round = {
    id: 'r1',
    kind: 'decision',
    sessionId: 'session-1',
    decision: 'Should this ship?',
    context: '',
    variants: [{ id: 'a', label: 'A', html: '<h1>A</h1>', note: '', real: [], mocked: [], omitted: [], recommendation: 'It is the smaller change.', cost: ['B is lost.'] }],
    status: 'open',
    createdAt: Date.now(),
  }
  const props = { round, sent: null, onSent() {} }
  const composer = (tree) =>
    findNode(
      tree,
      (node) =>
        node.type === 'textarea' &&
        typeof node.props.placeholder === 'string' &&
        node.props.placeholder.startsWith('What should change?'),
    )

  let tree = runtime.render(client.__test.DecisionView, props)
  composer(tree).props.onChange({ target: { value: 'Typed but never added.' } })

  tree = runtime.render(client.__test.DecisionView, props)
  const accept = findNode(tree, (node) => node.type === 'button' && textOf(node) === 'Accept A')
  assert.ok(accept, 'the accept button names the recommended variant')
  await accept.props.onClick()

  assert.equal(bodies.length, 1)
  const sent = bodies[0].body.comments
  assert.equal(sent.length, 1, 'the unsent comment is sent instead of dropped')
  assert.equal(sent[0].text, 'Typed but never added.')
  assert.deepEqual(sent[0].anchor, { kind: 'variant' })

  tree = runtime.render(client.__test.DecisionView, props)
  assert.equal(composer(tree).props.value, '', 'the box is cleared once the decision lands')
})

test('the action row names the variant each verb acts on', () => {
  const runtime = statefulReact()
  const client = loadClient(runtime.React)
  const round = {
    id: 'r1',
    kind: 'decision',
    sessionId: 'session-1',
    decision: 'Which one?',
    context: '',
    variants: [
      { id: 'a', label: 'A', html: '<h1>A</h1>', note: '', real: [], mocked: [], omitted: [] },
      { id: 'b', label: 'B', html: '<h1>B</h1>', note: '', real: [], mocked: [], omitted: [], recommendation: 'It is the smaller change.', cost: ['A is lost.'] },
    ],
    status: 'open',
    createdAt: Date.now(),
  }
  const tree = runtime.render(client.__test.DecisionView, { round, sent: null, onSent() {} })

  const labels = []
  const walk = (node) => {
    if (!node || typeof node !== 'object') return
    if (node.type === 'button' && Array.isArray(node.children)) {
      const text = textOf(node)
      if (text !== '') labels.push(text)
    }
    for (const child of node.children || []) walk(child)
  }
  walk(tree)

  assert.ok(labels.includes('Accept B'), 'accept names the recommendation')
  assert.ok(labels.includes('Revise B'), 'revise names the variant it would revise')
  assert.ok(labels.includes('Reject A&B'), 'reject names every variant it would reject')
  assert.ok(labels.includes('Cancel this round'), 'leaving the round says that it cancels it')
  assert.equal(labels.includes('Cancel'), false, 'the bare word alone reads as a safe undo')

  // The three answers are one choice, so they live in one frame, in order of
  // commitment; leaving is not an answer and stays outside it.
  const frame = findNode(tree, (node) => node.props && node.props.className === 'clarity-seg')
  assert.ok(frame, 'the verbs share a frame')
  assert.deepEqual(frame.children.map(textOf), ['Accept B', 'Revise B', 'Reject A&B'])
  assert.equal(
    findNode(frame, (node) => node.type === 'button' && textOf(node) === 'Cancel this round'),
    null,
    'leaving sits outside the question',
  )
})

test('cancelling a test gate sends cancel and needs no observation', async () => {
  const runtime = statefulReact()
  const bodies = []
  const client = loadClient(runtime.React, async (path, init) => {
    bodies.push(JSON.parse(init.body))
    return { ok: true, json: async () => ({ ok: true, result: { status: 'cancelled' } }) }
  })
  const round = {
    id: 't1',
    kind: 'test',
    sessionId: 'session-1',
    candidate: '4f2a1c9',
    prepared: { command: 'pnpm build', exitCode: 0, builtAt: 1 },
    runThis: 'pnpm preview',
    scenario: {
      preconditions: ['signed in'],
      steps: ['open'],
      expected: ['one toast'],
      failureSignature: 'two toasts',
      rollback: 'none',
    },
    status: 'open',
    createdAt: 1,
  }
  const props = { round, sent: null, onSent() {} }
  const button = (tree, label) => findNode(tree, (node) => node.type === 'button' && textOf(node) === label)

  let tree = runtime.render(client.__test.TestView, props)
  assert.ok(button(tree, 'I’m ready to test'), 'the gate opens on the prepared build')
  button(tree, 'I’m ready to test').props.onClick()

  tree = runtime.render(client.__test.TestView, props)
  assert.ok(button(tree, 'Cancel this test'), 'the gate offers one way out, not two')
  assert.equal(button(tree, 'Blocked'), null, 'blocked is no longer a button of its own')
  assert.equal(button(tree, 'Back'), null, 'and neither is going back')
  await button(tree, 'Cancel this test').props.onClick()

  assert.equal(bodies.length, 1)
  assert.equal(bodies[0].verdict, 'cancel', 'the button cancels instead of inventing a verdict')
  assert.equal('observed' in bodies[0], false, 'an empty observation is left out, not sent as an empty string')
})

test('a pass with an empty observation is sent as no observation at all', async () => {
  const runtime = statefulReact()
  const bodies = []
  const client = loadClient(runtime.React, async (path, init) => {
    bodies.push(JSON.parse(init.body))
    return { ok: true, json: async () => ({ ok: true, result: { status: 'tested', verdict: 'pass' } }) }
  })
  const round = {
    id: 't1',
    kind: 'test',
    sessionId: 'session-1',
    candidate: '4f2a1c9',
    prepared: { command: 'pnpm build', exitCode: 0, builtAt: 1 },
    runThis: null,
    scenario: {
      preconditions: ['signed in'],
      steps: ['open'],
      expected: ['one toast'],
      failureSignature: 'two toasts',
      rollback: 'none',
    },
    status: 'open',
    createdAt: 1,
  }
  const props = { round, sent: null, onSent() {} }
  const button = (tree, label) => findNode(tree, (node) => node.type === 'button' && textOf(node) === label)

  let tree = runtime.render(client.__test.TestView, props)
  button(tree, 'I’m ready to test').props.onClick()
  tree = runtime.render(client.__test.TestView, props)
  await button(tree, 'Pass').props.onClick()

  assert.equal(bodies.length, 1, 'the pass went out')
  assert.equal(bodies[0].verdict, 'pass')
  assert.equal('observed' in bodies[0], false, 'the empty box is not sent as an empty string')
})

test('a whitespace-only observation is sent as nothing at all', async () => {
  const runtime = statefulReact()
  const bodies = []
  const client = loadClient(runtime.React, async (path, init) => {
    bodies.push(JSON.parse(init.body))
    return { ok: true, json: async () => ({ ok: true, result: { status: 'tested', verdict: 'pass' } }) }
  })
  const round = {
    id: 't1',
    kind: 'test',
    sessionId: 'session-1',
    candidate: '4f2a1c9',
    prepared: { command: 'pnpm build', exitCode: 0, builtAt: 1 },
    runThis: null,
    scenario: {
      preconditions: ['signed in'],
      steps: ['open'],
      expected: ['one toast'],
      failureSignature: 'two toasts',
      rollback: 'none',
    },
    status: 'open',
    createdAt: 1,
  }
  const props = { round, sent: null, onSent() {} }
  const button = (tree, label) => findNode(tree, (node) => node.type === 'button' && textOf(node) === label)

  let tree = runtime.render(client.__test.TestView, props)
  button(tree, 'I’m ready to test').props.onClick()
  tree = runtime.render(client.__test.TestView, props)
  // A stray space and a newline: the box looks empty and means the same thing.
  findNode(tree, (node) => node.type === 'textarea').props.onChange({ target: { value: '  \n ' } })
  tree = runtime.render(client.__test.TestView, props)
  await button(tree, 'Pass').props.onClick()

  assert.equal(bodies.length, 1, 'the pass went out')
  assert.equal('observed' in bodies[0], false, 'blank is not sent as an empty string either')
})

test('the copied note reads in the row’s language, colon and all', () => {
  const client = loadClient()
  const text = client.__test.bubbleText({
    decision: 'Which row?',
    verdict: 'accept',
    variantLabel: 'B',
    comments: [{ text: 'One size smaller.', anchor: { kind: 'variant' } }],
    note: 'Ship it.',
  })
  assert.equal(
    text,
    'Which row?\nAccepted · variant B\nWhole variant — One size smaller.\nNote: Ship it.',
    'the English copy keeps an ASCII colon; the label comes from the table, not from a literal',
  )
})

test('the English and Chinese tables carry the same keys', () => {
  const { MESSAGES } = loadClient().__test
  assert.deepEqual(Object.keys(MESSAGES.zh).sort(), Object.keys(MESSAGES.en).sort())
  for (const [key, value] of Object.entries(MESSAGES.zh)) {
    assert.equal(typeof value, 'string', `zh ${key} is a string`)
    assert.notEqual(value, '', `zh ${key} is not empty`)
  }
})

test('no copy key is written twice in one table', () => {
  // A repeated key silently wins, so the earlier line is dead copy that the next
  // editor will edit by mistake. Both tables carried four of them once.
  const [en, zh] = code.split(/^ {6}zh: \{$/m)
  const doubled = (source) => {
    const counts = new Map()
    for (const match of source.matchAll(/^ {8}'([\w.]+)':/gm)) {
      counts.set(match[1], (counts.get(match[1]) ?? 0) + 1)
    }
    return [...counts].filter(([, count]) => count > 1).map(([key]) => key)
  }
  assert.deepEqual(doubled(en), [], 'the English table declares no key twice')
  assert.deepEqual(doubled(zh), [], 'the Chinese table declares no key twice')
})

test('the panel speaks the GUI language, and English without the service', () => {
  const runtime = statefulReact()
  const client = loadClient(runtime.React)
  const round = {
    id: 'r1',
    kind: 'decision',
    sessionId: 'session-1',
    decision: 'Which one?',
    context: '',
    variants: [{ id: 'a', label: 'A', html: '<h1>A</h1>', note: '', real: [], mocked: [], omitted: [], recommendation: 'It is the smaller change.', cost: ['B is lost.'] }],
    status: 'open',
    createdAt: Date.now(),
  }
  const props = { round, sent: null, onSent() {} }
  const buttonText = (tree) => {
    const found = []
    const walk = (node) => {
      if (!node || typeof node !== 'object') return
      if (node.type === 'button' && Array.isArray(node.children)) {
        const text = textOf(node)
        if (text !== '') found.push(text)
      }
      for (const child of node.children || []) walk(child)
    }
    walk(tree)
    return found
  }

  assert.ok(buttonText(runtime.render(client.__test.DecisionView, props)).includes('Accept A'))

  const registered = []
  const { ctx } = makeCtx()
  const asked = []
  ctx.inject = (deps, callback) => {
    // The array comes from the vm realm, so compare its contents, not its prototype.
    assert.equal(deps.length, 1)
    asked.push(deps[0])
    // The callback runs only for a service this composition actually has, which
    // is how the host behaves: this arena offers the locale and nothing else.
    if (deps[0] !== 'locale') return { then() {} }
    callback({
      locale: {
        register(namespace, messages) {
          registered.push({ namespace, messages })
        },
        bind() {
          return (key) => client.__test.MESSAGES.zh[key] ?? key
        },
      },
      effect(fn) {
        fn()
      },
    })
    return { then() {} }
  }
  client.apply(ctx)

  assert.ok(asked.includes('locale'), `the panel asks for the locale service: ${asked.join(', ')}`)
  assert.equal(registered[0].namespace, 'collaborativeClarity')
  assert.equal(registered[0].messages.zh['action.accept'], '接受')
  assert.ok(buttonText(runtime.render(client.__test.DecisionView, props)).includes('接受 A'))
})

function editableRound() {
  return {
    id: 'r1',
    kind: 'decision',
    sessionId: 'session-1',
    decision: 'Should this ship?',
    context: '',
    variants: [
      { id: 'a', label: 'A', html: '<h1>A</h1>', note: '', real: [], mocked: [], omitted: [], recommendation: 'It is the smaller change.', cost: ['B is lost.'] },
      { id: 'b', label: 'B', html: '<h1>B</h1>', note: '', real: [], mocked: [], omitted: [], cost: ['A is lost.'] },
    ],
    status: 'open',
    createdAt: Date.now(),
  }
}

function composerOf(tree) {
  return findNode(
    tree,
    (node) =>
      node.type === 'textarea' &&
      typeof node.props.placeholder === 'string' &&
      node.props.placeholder.startsWith('What should change?'),
  )
}

function buttonsNamed(tree, label) {
  const found = []
  const walk = (node) => {
    if (!node || typeof node !== 'object') return
    // A `.map` puts its rows in one array child, so arrays are walked too.
    if (Array.isArray(node)) {
      for (const child of node) walk(child)
      return
    }
    if (node.type === 'button' && textOf(node) === label) {
      found.push(node)
    }
    for (const child of node.children || []) walk(child)
  }
  walk(tree)
  return found
}

/** The input a comment turns into while it is being rewritten. */
function editBoxOf(tree) {
  return findNode(tree, (node) => node.type === 'textarea' && node.props.autoFocus === true)
}

/** Click a button the way the panel does: rows and buttons stop propagation. */
function click(node) {
  return node.props.onClick({ stopPropagation() {} })
}

/** Add a comment through the composer, the way a person would. */
function addComment(runtime, client, props, text) {
  let tree = runtime.render(client.__test.DecisionView, props)
  composerOf(tree).props.onChange({ target: { value: text } })
  tree = runtime.render(client.__test.DecisionView, props)
  click(buttonsNamed(tree, 'Add')[0])
  return runtime.render(client.__test.DecisionView, props)
}

test('an added comment is rewritten in place, keeping its place in the list', () => {
  const runtime = statefulReact()
  const client = loadClient(runtime.React)
  const props = { round: editableRound(), sent: null, onSent() {} }

  let tree = addComment(runtime, client, props, 'First thing.')
  tree = addComment(runtime, client, props, 'Second thing.')

  const edits = buttonsNamed(tree, 'Edit')
  assert.equal(edits.length, 2, 'every added comment offers an edit')

  click(edits[1])
  tree = runtime.render(client.__test.DecisionView, props)
  const box = editBoxOf(tree)
  assert.ok(box, 'the comment turns into an input')
  assert.equal(box.props.value, 'Second thing.', 'it opens holding the text it had')
  box.props.onChange({ target: { value: 'Second thing, reworded.' } })

  tree = runtime.render(client.__test.DecisionView, props)
  click(buttonsNamed(tree, 'Save')[0])

  tree = runtime.render(client.__test.DecisionView, props)
  assert.equal(editBoxOf(tree), null, 'the row is text again once saved')
  const flat = textOf(tree)
  assert.ok(flat.includes('Second thing, reworded.'), 'the list shows the rewritten text')
  assert.ok(!flat.includes('Second thing.'), 'the text it had is gone')
  assert.ok(
    flat.indexOf('First thing.') < flat.indexOf('Second thing, reworded.'),
    'the rewritten comment keeps its place in the list',
  )
})

test('saving an empty edit is refused instead of deleting the comment', () => {
  const runtime = statefulReact()
  const client = loadClient(runtime.React)
  const props = { round: editableRound(), sent: null, onSent() {} }

  let tree = addComment(runtime, client, props, 'Keep me.')
  click(buttonsNamed(tree, 'Edit')[0])
  tree = runtime.render(client.__test.DecisionView, props)

  editBoxOf(tree).props.onChange({ target: { value: '   ' } })
  tree = runtime.render(client.__test.DecisionView, props)
  click(buttonsNamed(tree, 'Save')[0])

  tree = runtime.render(client.__test.DecisionView, props)
  const alert = findNode(tree, (node) => node.props && node.props.role === 'alert')
  assert.ok(alert, 'the refusal is said out loud')
  assert.equal(textOf(alert), 'Write a comment first.')
  assert.ok(editBoxOf(tree), 'the input stays open so the edit is not lost')

  click(buttonsNamed(tree, 'Cancel')[0])
  tree = runtime.render(client.__test.DecisionView, props)
  assert.ok(textOf(tree).includes('Keep me.'), 'the comment kept the text it had')
})

test('an edit typed but not saved travels with the decision, anchor and place intact', async () => {
  const runtime = statefulReact()
  const bodies = []
  const client = loadClient(runtime.React, async (path, init) => {
    bodies.push({ path, body: JSON.parse(init.body) })
    return { ok: true, json: async () => ({ ok: true, result: { verdict: 'accept' } }) }
  })
  const props = { round: editableRound(), sent: null, onSent() {} }

  let tree = addComment(runtime, client, props, 'Before the edit.')
  click(buttonsNamed(tree, 'Edit')[0])
  tree = runtime.render(client.__test.DecisionView, props)
  editBoxOf(tree).props.onChange({ target: { value: 'After the edit.' } })

  tree = runtime.render(client.__test.DecisionView, props)
  await click(buttonsNamed(tree, 'Accept A')[0])

  assert.equal(bodies.length, 1)
  const sent = bodies[0].body.comments
  assert.equal(sent.length, 1, 'the edit replaces the comment, it does not add a second one')
  assert.equal(sent[0].text, 'After the edit.')
  assert.deepEqual(sent[0].anchor, { kind: 'variant' }, 'the anchor survives the rewrite')

  tree = runtime.render(client.__test.DecisionView, props)
  assert.equal(editBoxOf(tree), null, 'the edit closes once the decision lands')
})

test('an anchor is named in the panel\u2019s language, not in hardcoded English', () => {
  const runtime = statefulReact()
  const client = loadClient(runtime.React)
  assert.equal(client.__test.anchorLabel({ kind: 'variant' }), 'Whole variant', 'English until a locale arrives')
  assert.equal(client.__test.anchorLabel({ kind: 'line', start: 3, end: 3 }), 'Line 3')

  const { ctx } = makeCtx()
  ctx.inject = (deps, callback) => {
    callback({
      locale: {
        register() {},
        bind() {
          return (key, vars) =>
            (client.__test.MESSAGES.zh[key] ?? key).replace(/\{(\w+)\}/g, (match, name) =>
              vars && name in vars ? String(vars[name]) : match,
            )
        },
      },
      effect(fn) {
        fn()
      },
    })
    return { then() {} }
  }
  client.apply(ctx)

  assert.equal(client.__test.anchorLabel({ kind: 'variant' }), '整条变体')
  assert.equal(client.__test.anchorLabel({ kind: 'element', text: '提交' }), '元素 · 提交')
  assert.equal(client.__test.anchorLabel({ kind: 'text', quote: '继续' }), '“继续”')
  assert.equal(client.__test.anchorLabel({ kind: 'line', start: 3, end: 3 }), '第 3 行')
  assert.equal(client.__test.anchorLabel({ kind: 'line', start: 12, end: 14 }), '第 12–14 行')
})

test('a draft survives the panel unmounting, which is what a tab switch does', () => {
  const runtime = statefulReact()
  const client = loadClient(runtime.React)
  const props = { round: editableRound(), sent: null, onSent() {} }

  let tree = addComment(runtime, client, props, 'A comment worth keeping.')
  composerOf(tree).props.onChange({ target: { value: 'and a half-written one.' } })
  tree = runtime.render(client.__test.DecisionView, props)
  assert.ok(textOf(tree).includes('A comment worth keeping.'))

  runtime.unmount()
  tree = runtime.render(client.__test.DecisionView, props)
  assert.ok(textOf(tree).includes('A comment worth keeping.'), 'the added comment comes back')
  assert.equal(
    composerOf(tree).props.value,
    'and a half-written one.',
    'so does the text that was never added',
  )

  runtime.unmount()
  tree = runtime.render(client.__test.DecisionView, {
    ...props,
    round: { ...editableRound(), id: 'r2' },
  })
  assert.ok(
    !textOf(tree).includes('A comment worth keeping.'),
    'a draft belongs to one round, not to the tab',
  )
})

test('the draft is spent once the decision lands, tab and storage alike', async () => {
  const storage = fakeStorage()
  const runtime = statefulReact()
  const client = loadClient(
    runtime.React,
    async () => ({ ok: true, json: async () => ({ ok: true, result: { verdict: 'accept' } }) }),
    storage,
  )
  const props = { round: editableRound(), sent: null, onSent() {} }

  let tree = addComment(runtime, client, props, 'Sent with the decision.')
  assert.ok(storage.getItem('clarity.draft.r1') !== null, 'the draft is written as it is typed')
  tree = runtime.render(client.__test.DecisionView, props)
  await click(buttonsNamed(tree, 'Accept A')[0])

  assert.equal(storage.getItem('clarity.draft.r1'), null, 'the stored draft goes with the decision')
  runtime.unmount()
  tree = runtime.render(client.__test.DecisionView, props)
  assert.ok(
    !textOf(tree).includes('Sent with the decision.'),
    'a comment that went out is not left behind for the next visit',
  )
})

test('a draft survives a page reload, because it is kept in sessionStorage', () => {
  const storage = fakeStorage()
  const props = { round: editableRound(), sent: null, onSent() {} }

  const before = statefulReact()
  const clientBefore = loadClient(before.React, undefined, storage)
  const written = addComment(before, clientBefore, props, 'Written before the reload.')
  composerOf(written).props.onChange({ target: { value: 'and a half sentence' } })
  before.render(clientBefore.__test.DecisionView, props)

  // A reload is a new page: new client, empty hook memory, the same tab.
  const after = statefulReact()
  const clientAfter = loadClient(after.React, undefined, storage)
  const treeAfter = after.render(clientAfter.__test.DecisionView, props)
  assert.ok(textOf(treeAfter).includes('Written before the reload.'), 'the comment comes back')
  assert.equal(
    composerOf(treeAfter).props.value,
    'and a half sentence',
    'so does the text that was never added',
  )
})

test('junk in storage costs the draft, never the panel', () => {
  const storage = fakeStorage()
  storage.setItem('clarity.draft.r1', 'not json at all')
  const runtime = statefulReact()
  const client = loadClient(runtime.React, undefined, storage)

  const tree = runtime.render(client.__test.DecisionView, {
    round: editableRound(),
    sent: null,
    onSent() {},
  })
  assert.ok(composerOf(tree), 'the panel draws anyway')
  assert.ok(!textOf(tree).includes('not json at all'), 'and nothing of the junk is shown')
})

// --- the transcript row -----------------------------------------------------

function toolCallEvent(name, callId, args) {
  return {
    type: 'tool/call',
    seq: 10,
    time: 1762000000000,
    data: { name, callId, arguments: JSON.stringify(args) },
  }
}

function toolResultEvent(callId, payload, options) {
  const opts = options || {}
  return {
    type: 'tool/result',
    seq: opts.seq || 12,
    time: 1762000060000,
    surfaceOp: opts.surfaceOp || 'append',
    data: {
      message: {
        ...(opts.isError ? { isError: true } : {}),
        content: [{ type: 'text', text: typeof payload === 'string' ? payload : JSON.stringify(payload) }],
        source: { callId },
      },
    },
  }
}

/**
 * Drive a Definition the way the assembler does: initialize from the earliest
 * loaded start, then apply every later match in ascending order.
 */
function foldDecision(definition, events) {
  let context = null
  for (const event of events) {
    const match = definition.match(event)
    if (match === null) continue
    if (match.role === 'start') {
      if (context !== null) continue
      const start = { ...match, event, location: { kind: 'step' } }
      const key = 'clarity-round/' + match.id
      context = {
        key,
        id: match.id,
        matches: [start],
        start,
        current: new Map(),
        state: definition.start({ key, id: match.id, matches: [start], start, current: new Map() }, start),
      }
      continue
    }
    if (context === null) continue
    context = { ...context, state: definition.update(context, { ...match, event, location: { kind: 'step' } }) }
  }
  if (context === null) return null
  return { context, node: definition.buildViewNode(context) }
}

const DECIDED_ARGS = {
  decision: 'Which row?',
  variants: [
    { id: 'a', label: 'A — two lines' },
    { id: 'b', label: 'B — with reasons' },
  ],
}

function decidedPayload(overrides) {
  return {
    status: 'decided',
    roundId: 'clarity-mw61y3rn-e8183f',
    verdict: 'accept',
    selected: 'b',
    comments: [
      { text: 'Round the button to the card radius.', anchor: { kind: 'element', selector: '#save', text: 'Save' } },
      { text: 'One size smaller.', anchor: { kind: 'variant' } },
    ],
    note: 'Ship it.',
    ...(overrides || {}),
  }
}

test('our round folds into one transcript row, and the labels come from the call', () => {
  const client = loadClient()
  const definition = client.__test.decisionNode
  const folded = foldDecision(definition, [
    toolCallEvent('clarity_round', 'call-1', DECIDED_ARGS),
    toolResultEvent('call-1', decidedPayload()),
  ])

  const node = folded.node
  assert.equal(node.kind, 'clarity-decision')
  assert.equal(node.target, 'chat')
  assert.equal(node.anchorSeq, 12)
  // The same seat an answered ask_user_question batch takes.
  assert.equal(node.groupTree, 'turn')
  assert.equal(node.visibility, 'visible')
  assert.equal(node.data.decision, 'Which row?')
  assert.equal(node.data.verdict, 'accept')
  assert.equal(node.data.variantLabel, 'B — with reasons', 'the label from the arguments, not the id')
  assert.equal(node.data.comments.length, 2)
  assert.equal(node.data.comments[0].anchor.kind, 'element')
  assert.equal(node.data.comments[1].text, 'One size smaller.')
  assert.equal(node.data.note, 'Ship it.')
  assert.equal(node.data.time, 1762000060000)
})

test('a round the user did not decide draws no row', () => {
  const client = loadClient()
  const definition = client.__test.decisionNode

  const cancelled = foldDecision(definition, [
    toolCallEvent('clarity_round', 'call-1', DECIDED_ARGS),
    toolResultEvent('call-1', { status: 'cancelled', roundId: 'clarity-x', reason: 'the user cancelled the round' }),
  ])
  assert.equal(cancelled.node, null, 'a cancelled round is not a decision')

  const pending = foldDecision(definition, [
    toolCallEvent('clarity_round', 'call-1', DECIDED_ARGS),
    toolResultEvent('call-1', { status: 'pending', roundId: 'clarity-x', jobId: 'job-1', recommendation: 'a' }),
  ])
  assert.equal(pending.node, null, 'a non-blocking round decides later, outside this log')

  const tested = foldDecision(definition, [
    toolCallEvent('clarity_round', 'call-1', DECIDED_ARGS),
    toolResultEvent('call-1', { status: 'tested', roundId: 'clarity-x', verdict: 'pass', observed: 'It drew.' }),
  ])
  assert.equal(tested.node, null, 'a test verdict on a decision round is a kind mismatch, not a row')

  // Contract drift: the enum grows a value, or a payload is forged. A verdict
  // this row cannot word is no row, never half of one.
  const drifted = foldDecision(definition, [
    toolCallEvent('clarity_round', 'call-1', DECIDED_ARGS),
    toolResultEvent('call-1', decidedPayload({ verdict: 'partial' })),
  ])
  assert.equal(drifted.node, null)

  const errored = foldDecision(definition, [
    toolCallEvent('clarity_round', 'call-1', DECIDED_ARGS),
    toolResultEvent('call-1', decidedPayload(), { isError: true }),
  ])
  assert.equal(errored.node, null, 'a failed call decided nothing')

  const unreadable = foldDecision(definition, [
    toolCallEvent('clarity_round', 'call-1', DECIDED_ARGS),
    toolResultEvent('call-1', 'not json at all'),
  ])
  assert.equal(unreadable.node, null, 'a payload we cannot read costs the row, never an error')

  // A result whose call was never loaded stays pending, as the assembler says.
  assert.equal(foldDecision(definition, [toolResultEvent('call-1', decidedPayload())]), null)
})

test('another tool’s result is not claimed, and the first decision stands', () => {
  const client = loadClient()
  const definition = client.__test.decisionNode

  assert.equal(definition.match(toolResultEvent('call-9', { status: 'completed', result: 'ok' })), null)
  assert.equal(definition.match(toolCallEvent('read_image', 'call-9', {})), null)
  assert.equal(
    definition.match(
      toolResultEvent('call-9', decidedPayload(), { surfaceOp: { op: 'replace', startSeq: 3, endSeq: 4 } }),
    ),
    null,
    'a replacement copy is model-only, never the human transcript',
  )
  const call = definition.match(toolCallEvent('clarity_round', 'call-1', DECIDED_ARGS))
  assert.deepEqual({ ...call }, { id: 'call-1', role: 'start' })

  const once = foldDecision(definition, [
    toolCallEvent('clarity_round', 'call-1', DECIDED_ARGS),
    toolResultEvent('call-1', decidedPayload()),
  ])
  const twice = foldDecision(definition, [
    toolCallEvent('clarity_round', 'call-1', DECIDED_ARGS),
    toolResultEvent('call-1', decidedPayload()),
    toolResultEvent('call-1', decidedPayload({ verdict: 'reject', selected: undefined }), { seq: 14 }),
  ])
  assert.equal(twice.node.data.verdict, 'accept', 'a second result cannot rewrite a recorded decision')
  assert.notEqual(once.node, twice.node, 'the fold returns a node, not the one it forgot')
})

test('the row reads as the decision, the reasons, and a copy action', () => {
  const runtime = statefulReact()
  const client = loadClient(runtime.React)
  const folded = foldDecision(client.__test.decisionNode, [
    toolCallEvent('clarity_round', 'call-1', DECIDED_ARGS),
    toolResultEvent('call-1', decidedPayload()),
  ])

  const tree = runtime.render(client.__test.DecisionBubble, { node: folded.node })
  const text = textOf(tree)
  assert.ok(text.includes('Which row?'), `the decision sentence leads: ${text}`)
  assert.ok(text.includes('Accepted'), 'the verdict reads as a word')
  assert.ok(text.includes('variant B — with reasons'), 'the answer names the variant it chose')
  assert.ok(text.includes('Round the button to the card radius.'), 'every comment travels with the row')
  assert.ok(text.includes('Element · Save'), 'the anchor is named in the anchor vocabulary')
  assert.ok(text.includes('Whole variant'), 'a whole-variant comment says so')
  assert.ok(text.includes('Ship it.'), 'the note travels too')
  assert.ok(text.includes('Copy'), 'the copy action is there')

  const rejected = foldDecision(client.__test.decisionNode, [
    toolCallEvent('clarity_round', 'call-1', DECIDED_ARGS),
    toolResultEvent('call-1', decidedPayload({ verdict: 'reject', selected: undefined, comments: [] })),
  ])
  const rejectedText = textOf(runtime.render(client.__test.DecisionBubble, { node: rejected.node }))
  assert.ok(rejectedText.includes('Turned it down'), 'a rejection is recorded as one')
  assert.ok(!rejectedText.includes('variant'), `and names no variant: ${rejectedText}`)
})

test('a real-test verdict folds into one row with its observation and its shots', () => {
  const client = loadClient()
  const folded = foldDecision(client.__test.decisionNode, [
    toolCallEvent('clarity_test', 'call-7', {
      candidate: 'dirty:8c90b5af',
      prepared: { command: 'pnpm run verify', exitCode: 0, builtAt: 'now' },
      scenario: {},
    }),
    toolResultEvent('call-7', {
      status: 'tested',
      roundId: 'clarity-test-mw64t9es-706efa',
      verdict: 'pass',
      observed: 'The bubble appeared and stayed.',
      screenshots: [
        { path: '.clarity/screenshots/mw64/shot-1.png', bytes: 10 },
        { path: '.clarity/screenshots/mw64/shot-2.png', bytes: 10 },
      ],
    }),
  ])

  const node = folded.node
  assert.equal(node.data.kind, 'test')
  assert.equal(node.data.candidate, 'dirty:8c90b5af')
  assert.equal(node.data.verdict, 'pass')
  assert.equal(node.data.observed, 'The bubble appeared and stayed.')
  assert.deepEqual(
    [...node.data.shots],
    ['.clarity/screenshots/mw64/shot-1.png', '.clarity/screenshots/mw64/shot-2.png'],
  )
  assert.equal(node.groupTree, 'turn')

  const blocked = foldDecision(client.__test.decisionNode, [
    toolCallEvent('clarity_test', 'call-7', { candidate: 'abcd123' }),
    toolResultEvent('call-7', { status: 'tested', roundId: 'x', verdict: 'blocked', observed: 'No build.' }),
  ])
  assert.equal(blocked.node.data.verdict, 'blocked', 'a blocked gate is a verdict too')
  assert.deepEqual([...blocked.node.data.shots], [], 'no screenshots is an empty list, not a crash')

  const cancelled = foldDecision(client.__test.decisionNode, [
    toolCallEvent('clarity_test', 'call-7', { candidate: 'abcd123' }),
    toolResultEvent('call-7', { status: 'cancelled', roundId: 'x', reason: 'the user cancelled the test' }),
  ])
  assert.equal(cancelled.node, null, 'a cancelled gate decided nothing')
})

test('the test row names each screenshot, and each name opens it in the sidebar', () => {
  const runtime = statefulReact()
  const client = loadClient(runtime.React)
  const folded = foldDecision(client.__test.decisionNode, [
    toolCallEvent('clarity_test', 'call-7', { candidate: 'dirty:8c90b5af' }),
    toolResultEvent('call-7', {
      status: 'tested',
      roundId: 'clarity-test-mw64t9es-706efa',
      verdict: 'pass',
      observed: 'The bubble appeared and stayed.',
      screenshots: [
        { path: '.clarity/screenshots/mw64/shot-1.png', bytes: 10 },
        { path: '.clarity/screenshots/mw64/shot-2.png', bytes: 10 },
      ],
    }),
  ])

  const opened = []
  const tree = runtime.render(client.__test.DecisionBubble, {
    node: folded.node,
    openFile: (path) => opened.push(path),
  })
  const text = textOf(tree)
  assert.ok(text.includes('dirty:8c90b5af'), `the candidate leads: ${text}`)
  assert.ok(text.includes('Passed'), 'the verdict reads as a word')
  assert.ok(text.includes('The bubble appeared and stayed.'), 'the observation travels with the row')
  assert.ok(text.includes('Screenshots'), 'the screenshot line is labelled')
  assert.ok(text.includes('shot-1.png') && text.includes('shot-2.png'), 'the line is file names, not paths')

  const link = findNode(
    tree,
    (node) => node.type === 'button' && node.props.title === '.clarity/screenshots/mw64/shot-1.png',
  )
  assert.ok(link, 'the file name carries its full path in the title')
  assert.equal(link.props['aria-label'], 'Open shot-1.png in the sidebar')
  link.props.onClick()
  assert.deepEqual(opened, ['.clarity/screenshots/mw64/shot-1.png'])
})

test('the chat row is contributed where the chat exists, and nowhere else', () => {
  const client = loadClient()
  const contributed = []
  const { ctx, calls } = makeCtx()
  ctx.inject = (deps, callback) => {
    assert.equal(deps.length, 1)
    // This arena has the chat and no locale service, so only one callback runs.
    if (deps[0] !== 'uiConversation') return { then() {} }
    callback({
      uiConversation: {
        events: {
          register(definition) {
            contributed.push(definition)
            return () => {}
          },
        },
      },
      effect(fn) {
        fn()
      },
    })
    return { then() {} }
  }
  client.apply(ctx)

  assert.equal(contributed.length, 1)
  assert.equal(contributed[0].target, 'chat')
  assert.equal(contributed[0].kind, 'clarity-round')
  assert.equal(calls.nodes.length, 1, 'the renderer is registered for the kind the definition emits')
  assert.equal(calls.nodes[0].options.key, 'clarity-decision')
  assert.equal(calls.registered.length, 1, 'the tab is registered with or without the chat')
})

// ---------------------------------------------------------------------------
// History (round 0030): the tab's history is the fold read back; the cursor
// is the tab's own navigation; the host's settled copy stands in for one breath.
// ---------------------------------------------------------------------------

/** A chat snapshot holding exactly these nodes. */
function chatOf(nodes) {
  return { nodes: { values: () => nodes } }
}

/** An observable over one snapshot, whose `emit` is the chat publishing. */
function historyOf(snapshot) {
  const listeners = new Set()
  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    emit() {
      for (const listener of [...listeners]) listener()
    },
  }
}

const ADVISED_ARGS = {
  decision: 'Which row?',
  context: 'Two shapes, one seat.',
  variants: [
    {
      id: 'a',
      path: 'docs/rounds/0001/a.html',
      recommendation: 'Smaller.',
      cost: ['B is lost.'],
      real: ['The bar'],
      mocked: [],
      omitted: ['Dark theme'],
    },
    { id: 'b', label: 'B — with reasons', path: 'docs/rounds/0001/b.html', cost: ['Two lines taller.'] },
  ],
}

/** One folded record, with the round id and the result time the caller names. */
function foldedRecord(client, callId, roundId, time) {
  const result = toolResultEvent(callId, decidedPayload({ roundId }))
  if (time !== undefined) result.time = time
  const folded = foldDecision(client.__test.decisionNode, [toolCallEvent('clarity_round', callId, ADVISED_ARGS), result])
  return folded.node
}

test('the folded row carries what a record reads back: the advice as given, and which variant was taken', () => {
  const client = loadClient()
  const data = foldedRecord(client, 'call-1', 'clarity-mw61y3rn-e8183f').data
  assert.equal(data.roundId, 'clarity-mw61y3rn-e8183f')
  assert.equal(data.selected, 'b', 'the record names the variant, not only its label')
  assert.equal(data.context, 'Two shapes, one seat.')
  assert.equal(data.variants.length, 2)
  assert.deepEqual(plain(data.variants[0]), {
    id: 'a',
    // A variant the call did not label is named by its file, as the host names it.
    label: 'a.html',
    path: 'docs/rounds/0001/a.html',
    note: '',
    recommendation: 'Smaller.',
    cost: ['B is lost.'],
    real: ['The bar'],
    mocked: [],
    omitted: ['Dark theme'],
  })
  assert.equal(data.variants[1].label, 'B — with reasons')
  assert.equal(data.variants[1].recommendation, '', 'only the recommended variant carries a sentence')

  const placed = foldDecision(client.__test.decisionNode, [
    toolCallEvent('clarity_round', 'call-1', ADVISED_ARGS),
    toolResultEvent('call-1', decidedPayload({ comments: [{ variantId: 'b', text: 'On B.', anchor: { kind: 'variant' } }] })),
  ])
  assert.equal(placed.node.data.comments[0].variantId, 'b', 'a comment keeps the variant it was made on')
  assert.equal(data.comments[0].variantId, undefined, 'a comment without one claims none')
})

test('the history is the fold read back: our nodes only, oldest first, and the same array for the same snapshot', () => {
  const client = loadClient()
  const older = foldedRecord(client, 'call-1', 'clarity-first', 1762000060000)
  const newer = foldedRecord(client, 'call-2', 'clarity-second', 1762000070000)
  const snapshot = chatOf([
    { kind: 'tool', data: { name: 'read_file' } },
    newer,
    { kind: 'clarity-decision', data: { kind: 'decision', verdict: 'accept' } },
    older,
  ])
  const records = client.__test.recordsFromChat(snapshot)
  assert.deepEqual(
    plain(records.map((record) => record.roundId)),
    ['clarity-first', 'clarity-second'],
    'oldest first, and a node without a round id is not a record',
  )
  assert.equal(client.__test.recordsFromChat(snapshot), records, 'the read is memoised on the snapshot')
  assert.deepEqual(plain(client.__test.recordsFromChat(null)), [])
  assert.deepEqual(plain(client.__test.recordsFromChat({})), [], 'a snapshot without a node store is an empty history')
})

test('a round the host just settled is shaped as the fold would have shaped it', () => {
  const client = loadClient()
  const round = {
    id: 'r1',
    kind: 'decision',
    sessionId: 's',
    decision: 'Which?',
    context: 'Why now.',
    createdAt: 5,
    status: 'accepted',
    variants: [
      {
        id: 'a',
        label: 'A',
        source: 'docs/rounds/0001/a.html',
        html: '<h1>A</h1>',
        recommendation: 'Smaller.',
        cost: ['B is lost.'],
        real: [],
        mocked: [],
        omitted: [],
        note: '',
      },
    ],
    result: {
      status: 'decided',
      roundId: 'r1',
      verdict: 'accept',
      selected: 'a',
      comments: [{ variantId: 'a', text: 'On A.', anchor: { kind: 'variant' } }],
      note: 'Ship it.',
    },
  }
  const record = client.__test.recordFromHost(round)
  assert.deepEqual(
    plain(Object.keys(record).sort()),
    ['comments', 'context', 'decision', 'kind', 'note', 'roundId', 'selected', 'time', 'variantLabel', 'variants', 'verdict'],
    'the same keys the fold emits, so one view reads both',
  )
  assert.equal(record.roundId, 'r1')
  assert.equal(record.verdict, 'accept')
  assert.equal(record.selected, 'a')
  assert.equal(record.time, 5)
  assert.equal(record.decision, 'Which?')
  assert.equal(record.context, 'Why now.')
  assert.equal(record.variantLabel, 'A')
  assert.equal(record.variants[0].path, 'docs/rounds/0001/a.html', 'the path comes from `source`, where the host keeps it')
  assert.equal(record.variants[0].recommendation, 'Smaller.')
  assert.equal(record.variants[0].html, undefined, 'the artifact is not carried into a record')
  assert.equal(record.comments[0].variantId, 'a')
  assert.equal(record.note, 'Ship it.')

  const test = client.__test.recordFromHost({
    id: 't1',
    kind: 'test',
    sessionId: 's',
    decision: 'Real test: abc123',
    candidate: 'abc123',
    createdAt: 6,
    status: 'tested',
    result: {
      status: 'tested',
      roundId: 't1',
      verdict: 'fail',
      observed: 'It broke.',
      screenshots: [{ path: '.clarity/screenshots/t1/shot-1.png', bytes: 1 }],
    },
  })
  assert.equal(test.kind, 'test')
  assert.equal(test.candidate, 'abc123')
  assert.equal(test.observed, 'It broke.')
  assert.deepEqual(plain(test.shots), ['.clarity/screenshots/t1/shot-1.png'])

  const cancelled = client.__test.recordFromHost({ ...round, status: 'cancelled', result: { status: 'cancelled', roundId: 'r1', reason: 'x' } })
  assert.equal(cancelled.verdict, '', 'a cancelled round words no verdict')
})

test('the log wins a duplicate, so the host’s stand-in retires itself', () => {
  const client = loadClient()
  const log = [{ roundId: 'a', time: 1, decision: 'from the log' }, { roundId: 'c', time: 3 }]
  const standIns = new Map([
    ['b', { id: 'b', kind: 'test', createdAt: 2, candidate: 'abc', result: { verdict: 'pass' } }],
    ['a', { id: 'a', kind: 'decision', createdAt: 1, decision: 'stale copy', result: { verdict: 'accept' } }],
  ])
  const merged = client.__test.mergeRecords(log, standIns)
  assert.deepEqual(
    plain(merged.map((record) => record.roundId)),
    ['a', 'b', 'c'],
  )
  assert.equal(merged[0].decision, 'from the log', 'the log record, never the stand-in')
})

test('the open round on screen is the one the cursor names, else the newest of this conversation', () => {
  const client = loadClient()
  const rounds = [
    { id: 'old', sessionId: 's', status: 'open', createdAt: 1 },
    { id: 'new', sessionId: 's', status: 'open', createdAt: 2 },
    { id: 'other', sessionId: 'x', status: 'open', createdAt: 3 },
    { id: 'shut', sessionId: 's', status: 'accepted', createdAt: 4 },
  ]
  assert.equal(client.__test.pickOpen(rounds, 's', 'old').id, 'old')
  assert.equal(client.__test.pickOpen(rounds, 's', undefined).id, 'new')
  assert.equal(client.__test.pickOpen(rounds, 's', 'nowhere').id, 'new', 'a cursor naming no open round still finds the newest')
  assert.equal(client.__test.pickOpen([], 's', undefined), null)
  assert.equal(client.__test.pickOpen(undefined, 's', undefined), null)
})

/** A RoundPanel client whose fetch is recorded, with a history source and a cursor. */
async function renderPanel(history, cursor, fetchFor) {
  const seen = []
  const runtime = effectReact()
  const client = loadClient(
    runtime.React,
    async (url) => {
      seen.push(url)
      return fetchFor(url)
    },
  )
  const props = {
    sessionId: 's',
    history,
    useTabInfo: () => ({ tab: { navigation: { params: cursor === undefined ? {} : { roundId: cursor } } } }),
  }
  const tree = await runtime.render(client.__test.RoundPanel, props)
  return { client, runtime, props, seen, tree }
}

const emptyFetch = () => ({ ok: true, json: async () => ({ rounds: [] }) })

test('a tab with history and nothing waiting shows the last decision, not an empty state', async () => {
  const client = loadClient()
  const history = historyOf(chatOf([foldedRecord(client, 'call-1', 'clarity-mw61y3rn-e8183f')]))
  const { seen, tree, client: panel } = await renderPanel(history, undefined, emptyFetch)

  const text = textOf(tree)
  assert.ok(text.includes('Which row?'), 'the question that was asked')
  assert.ok(text.includes('Ship it.'), 'the note that travelled with it')
  assert.ok(!text.includes('No round is open'), 'history is not an empty tab')
  assert.ok(findNode(tree, (node) => node.type === panel.__test.RecordView), 'a record, read-only')
  assert.equal(findNode(tree, (node) => node.type === panel.__test.DecisionView), null, 'nothing to answer')
  assert.deepEqual(
    seen.filter((url) => url.includes('/rounds?')),
    ['/clarity/api/rounds?sessionId=s'],
    'the host is asked once whether anything waits',
  )
})

test('the cursor in the tab’s navigation picks the record, not the newest one', async () => {
  const client = loadClient()
  const history = historyOf(chatOf([foldedRecord(client, 'call-1', 'clarity-first', 1), foldedRecord(client, 'call-2', 'clarity-second', 2)]))
  // Both records ask "Which row?"; the second differs by its round id in the key.
  const { tree, client: rendered } = await renderPanel(history, 'clarity-first', emptyFetch)
  const view = findNode(tree, (node) => node.type === rendered.__test.RecordView)
  assert.equal(view.props.record.roundId, 'clarity-first')
})

test('the newest record is the one shown when the cursor is absent', async () => {
  const client = loadClient()
  const history = historyOf(chatOf([foldedRecord(client, 'call-1', 'clarity-first', 1), foldedRecord(client, 'call-2', 'clarity-second', 2)]))
  const { tree, client: rendered } = await renderPanel(history, undefined, emptyFetch)
  assert.equal(findNode(tree, (node) => node.type === rendered.__test.RecordView).props.record.roundId, 'clarity-second')
})

test('the history is resolved on every render, so a binding that lands late is not lost', async () => {
  // The tab body can mount before the seat has bound this conversation's chat:
  // the resolver answers null on the first render and the source afterwards, and
  // a plain re-render — no remount — is enough to pick it up.
  const client = loadClient()
  let source = null
  const runtime = effectReact()
  const panel = loadClient(runtime.React, async () => ({ ok: true, json: async () => ({ rounds: [] }) }))
  const props = {
    sessionId: 's',
    history: () => source,
    useTabInfo: () => ({ tab: { navigation: { params: {} } } }),
  }

  const first = await runtime.render(panel.__test.RoundPanel, props)
  assert.ok(textOf(first).includes('No round is open'), 'an unbound chat is an honest empty tab')

  source = historyOf(chatOf([foldedRecord(client, 'call-1', 'clarity-late', 3)]))
  const second = await runtime.render(panel.__test.RoundPanel, props)
  assert.ok(textOf(second).includes('Which row?'), 'the same props, a later render, and the record is there')
})

test('a round the log has not landed yet is read from the host once, and a 404 falls back to the latest', async () => {
  const client = loadClient()
  const older = foldedRecord(client, 'call-1', 'clarity-older', 1)
  const settled = {
    id: 'clarity-just',
    kind: 'decision',
    sessionId: 's',
    decision: 'Just decided?',
    context: '',
    createdAt: 9,
    status: 'revise',
    variants: [{ id: 'a', label: 'A', source: 'docs/a.html', recommendation: '', cost: [], real: [], mocked: [], omitted: [], note: '' }],
    result: {
      status: 'decided',
      roundId: 'clarity-just',
      verdict: 'revise',
      selected: 'a',
      comments: [{ text: 'Again.', anchor: { kind: 'variant' } }],
    },
  }

  const held = await renderPanel(historyOf(chatOf([older])), 'clarity-just', (url) =>
    url.includes('/round?') ? { ok: true, json: async () => ({ round: settled }) } : emptyFetch(),
  )
  assert.ok(textOf(held.tree).includes('Just decided?'), 'the host’s copy stands in')
  assert.ok(textOf(held.tree).includes('Again.'))
  assert.equal(held.seen.filter((url) => url === '/clarity/api/round?id=clarity-just').length, 1, 'asked once')

  // The same cursor after a restart: the host has nothing, so the latest record is the answer.
  const gone = await renderPanel(historyOf(chatOf([older])), 'clarity-just', (url) =>
    url.includes('/round?') ? { ok: false, status: 404, json: async () => ({ error: { message: 'unknown round' } }) } : emptyFetch(),
  )
  assert.equal(findNode(gone.tree, (node) => node.type === gone.client.__test.RecordView).props.record.roundId, 'clarity-older')
  assert.ok(!textOf(gone.tree).includes('unknown round'), 'a 404 is a fallback, never an error on screen')
})

test('a round the log already has is not asked of the host', async () => {
  const client = loadClient()
  const record = foldedRecord(client, 'call-1', 'clarity-known', 1)
  const { seen } = await renderPanel(historyOf(chatOf([record])), 'clarity-known', emptyFetch)
  assert.equal(seen.some((url) => url.includes('/round?')), false, 'the log is enough')
})

test('deciding in the tab turns the round into its record at once, from the round and the result', async () => {
  const open = {
    id: 'r-live',
    kind: 'decision',
    sessionId: 's',
    decision: 'Which row?',
    context: '',
    variants: [
      { id: 'a', label: 'A', html: '<h1>A</h1>', source: 'docs/a.html', recommendation: 'Smaller.', cost: ['B is lost.'], real: [], mocked: [], omitted: [], note: '' },
      { id: 'b', label: 'B — with reasons', html: '<h1>B</h1>', source: 'docs/b.html', recommendation: '', cost: [], real: [], mocked: [], omitted: [], note: '' },
    ],
    status: 'open',
    createdAt: 7,
  }
  const { tree, seen, props, runtime, client: panel } = await renderPanel(historyOf(chatOf([])), 'r-live', () => ({ ok: true, json: async () => ({ rounds: [open] }) }))
  const view = findNode(tree, (node) => node.type === panel.__test.DecisionView)
  assert.ok(view, 'the waiting round is on screen')
  assert.equal(view.props.sent, undefined, 'the panel no longer keeps a second "sent" state')

  view.props.onSent(decidedPayload({ roundId: 'r-live' }), open)
  const after = await runtime.render(panel.__test.RoundPanel, props)
  const text = textOf(after)
  assert.ok(text.includes('Which row?'))
  assert.ok(text.includes('Accepted'), 'the verdict is the record’s first line')
  assert.ok(text.includes('Ship it.'), 'the note is read back')
  assert.ok(!text.includes('Decision sent to the agent.'), 'the "sent" card is gone; the record is what remains')
  assert.ok(findNode(after, (node) => node.type === panel.__test.RecordView))
  assert.equal(seen.some((url) => url.includes('/round?')), false, 'no second fetch: the round and the result were already in hand')
})

test('a change in the log re-reads the snapshot, never the network', async () => {
  const client = loadClient()
  const history = historyOf(chatOf([]))
  const first = await renderPanel(history, undefined, emptyFetch)
  assert.equal(first.seen.length, 1)

  // The chat publishes (the `tool/result` landed); nothing is waiting, so the
  // record appears from the snapshot alone.
  const snapshot = chatOf([foldedRecord(client, 'call-1', 'clarity-late', 3)])
  history.getSnapshot = () => snapshot
  history.emit()
  const after = await first.runtime.render(first.client.__test.RoundPanel, first.props)
  assert.ok(textOf(after).includes('Which row?'), 'the landed record is on screen')
  assert.equal(first.seen.length, 1, 'a chat change never reaches the host')
})

test('a record carries the advice as given and the path of each artifact, and no artifact', async () => {
  const runtime = effectReact()
  const client = loadClient(runtime.React)
  const data = foldedRecord(client, 'call-1', 'clarity-mw61y3rn-e8183f').data
  const tree = await runtime.render(client.__test.RecordView, { record: data })
  const text = textOf(tree)
  assert.ok(text.includes('Two shapes, one seat.'), 'the context')
  assert.ok(text.includes('Smaller.'), 'the recommendation, as it was given')
  assert.ok(text.includes('B is lost.'), 'and its cost')
  assert.ok(text.includes('The bar'), 'what was real')
  assert.ok(text.includes('docs/rounds/0001/a.html'), 'the file is the record, so its path is named')
  assert.ok(text.includes('B — with reasons'), 'the label of the variant that was taken')
  assert.ok(text.includes('Round the button to the card radius.'), 'and what was said about it')
  assert.equal(findNode(tree, (node) => node.type === 'iframe'), null, 'the log never held the HTML')
  assert.equal(findNode(tree, (node) => node.type === 'textarea'), null, 'a record answers nothing')
})

test('a cancelled round reads as cancelled, with no verdict to fill in', async () => {
  const runtime = effectReact()
  const client = loadClient(runtime.React)
  const tree = await runtime.render(client.__test.RecordView, {
    record: client.__test.recordFromHost({
      id: 'r9',
      kind: 'decision',
      sessionId: 's',
      decision: 'Gone?',
      context: '',
      createdAt: 1,
      status: 'cancelled',
      variants: [],
      result: { status: 'cancelled', roundId: 'r9', reason: 'the user cancelled the round' },
    }),
  })
  const text = textOf(tree)
  assert.ok(text.includes('This round was cancelled.'))
  assert.ok(!text.includes('Verdict: accept'), 'no verb is invented for a round nobody answered')
})

test('the tab is handed the chat snapshot of its conversation when the composition has the chat', () => {
  const client = loadClient()
  const { ctx, calls } = makeCtx()
  const sources = new Map([['s1', { getSnapshot: () => chatOf([]), subscribe: () => () => {} }]])
  ctx.inject = (deps, callback) => {
    if (deps[0] !== 'uiConversation') return { then() {} }
    callback({
      uiConversation: {
        events: { register: () => () => {} },
        binding(id) {
          const source = sources.get(id)
          if (source === undefined) throw new Error('no binding for ' + id)
          return { target: (target) => (target === 'chat' ? source : undefined) }
        },
      },
      effect(fn) {
        fn()
      },
    })
    return { then() {} }
  }
  client.apply(ctx)
  assert.deepEqual([...client.inject].sort(), ['sidebarRight', 'sidebarRightTabs', 'slots', 'uiSession'], 'the chat stays optional, not injected')

  const inject = calls.bodies[0].options.inject
  const props = inject('s1')
  assert.equal(props.sessionId, 's1')
  assert.equal(typeof props.history, 'function', 'the body is handed a resolver, not a snapshot')
  assert.equal(props.history(), sources.get('s1'), 'the resolver finds this conversation’s chat')
  assert.equal(inject('s1').history(), props.history(), 'one source per conversation, so the props stay stable')
  assert.equal(inject('unknown').history(), null, 'an unbound session is an empty history, never an error')
  assert.equal(inject('unknown').history(), null, 'and stays empty for the tick instead of throwing on every render')
  assert.equal(client.__test.historySourceFor('s1'), sources.get('s1'))
})

test('without the chat service the history is empty, and the tab still opens', () => {
  const client = loadClient()
  assert.equal(client.__test.historySourceFor('s1'), null)
  const { ctx } = makeCtx()
  client.apply(ctx)
  assert.equal(client.__test.historySourceFor('s1'), null, 'applying without the arena leaves it empty')
})

test('a binding that is not ready yet is asked again, not remembered as a miss', () => {
  // The panel retries a missing history; that only works if a miss is not cached.
  // With a remembered miss every retry reopened the same "not yet" answer.
  const client = loadClient()
  const { ctx } = makeCtx()
  const source = { getSnapshot: () => chatOf([]), subscribe: () => () => {} }
  let ready = false
  ctx.inject = (deps, callback) => {
    if (deps[0] !== 'uiConversation') return { then() {} }
    callback({
      uiConversation: {
        events: { register: () => () => {} },
        binding() {
          if (!ready) throw new Error('not adopted yet')
          return { target: (target) => (target === 'chat' ? source : undefined) }
        },
      },
      effect(fn) {
        fn()
      },
    })
    return { then() {} }
  }
  client.apply(ctx)

  assert.equal(client.__test.historySourceFor('s1'), null, 'before the seat adopts, there is nothing')
  ready = true
  assert.equal(client.__test.historySourceFor('s1'), source, 'and the next ask finds it')
  assert.equal(client.__test.historySourceFor('s1'), source, 'a hit stays cached')
})

test('the strip’s dot follows the verdict instead of calling everything but a fail green', () => {
  const client = loadClient()
  assert.equal(client.__test.verdictTone('accept'), 'var(--dsw-alias-state-success-primary)')
  assert.equal(client.__test.verdictTone('pass'), 'var(--dsw-alias-state-success-primary)')
  assert.equal(client.__test.verdictTone('fail'), 'var(--dsw-alias-state-error-primary)')
  assert.equal(client.__test.verdictTone('reject'), 'var(--dsw-alias-state-error-primary)')
  assert.equal(client.__test.verdictTone('revise'), '#d4a72c', 'a revise asked for changes; it was not kept')
  assert.equal(client.__test.verdictTone('blocked'), '#d4a72c', 'and a blocked gate never ran')
  assert.equal(client.__test.verdictTone(''), 'var(--dsw-alias-label-tertiary)', 'a cancelled round is neither')
})

// ---------------------------------------------------------------------------
// The strip and the overview (rounds 0032–0035): numbered chronologically,
// waiting in front, the overview pinned at the right end of the strip.
// ---------------------------------------------------------------------------

function openRoundOf(id, createdAt, decision) {
  return { id, kind: 'decision', sessionId: 's', decision, createdAt, status: 'open', variants: [] }
}

test('rounds are numbered in the order they happened, waiting or settled alike', () => {
  const client = loadClient()
  const older = foldedRecord(client, 'call-1', 'r-old', 100).data
  const newer = foldedRecord(client, 'call-2', 'r-new', 300).data
  const items = client.__test.entriesOf([older, newer], [openRoundOf('r-wait', 200, 'Still open?')], 's')
  assert.deepEqual(
    plain(items.map((item) => [item.number, item.roundId])),
    [[1, 'r-old'], [2, 'r-wait'], [3, 'r-new']],
    'chronological, over the log and the host together',
  )
  assert.equal(items[1].round.id, 'r-wait', 'an open round carries its round')
  assert.equal(items[0].record.roundId, 'r-old', 'a settled one carries its record')

  const foreign = client.__test.entriesOf([], [openRoundOf('r-x', 1, 'Other')], 'another-session')
  assert.deepEqual(plain(foreign), [], 'another conversation’s round is not in this strip')

  const twice = client.__test.entriesOf([older], [openRoundOf('r-old', 100, 'Same')], 's')
  assert.equal(twice.length, 1, 'a round in both places is one entry, and the record wins')
  assert.equal(twice[0].record.roundId, 'r-old')
})

test('the strip puts whoever is waiting first, then the newest settled', () => {
  const client = loadClient()
  const records = [foldedRecord(client, 'call-1', 'r1', 1).data, foldedRecord(client, 'call-2', 'r2', 2).data]
  const items = client.__test.entriesOf(records, [openRoundOf('r9', 9, 'Later?')], 's')
  const ordered = client.__test.stripOrder(items)
  assert.deepEqual(plain(ordered.map((item) => item.roundId)), ['r9', 'r2', 'r1'])
})

test('a strip cell is the question itself, truncated — never a summary', () => {
  const client = loadClient()
  assert.equal(
    client.__test.cellLabel({ question: 'Should the package be the repository root as it stands, or the root with a build?' }),
    'Should the package be the repository root…',
    'the first characters of the question, ellipsised',
  )
  assert.equal(client.__test.cellLabel({ question: 'Short?' }), 'Short?')
})

test('the copied design process is numbered, and carries what was said about each round', () => {
  const client = loadClient()
  const records = [foldedRecord(client, 'call-1', 'r-old', 1).data, foldedRecord(client, 'call-2', 'r-new', 2).data]
  const items = client.__test.stripOrder(client.__test.entriesOf(records, [], 's'))
  const markdown = client.__test.markdownOf(items)
  assert.ok(markdown.startsWith('# Design process'), 'one heading')
  assert.ok(markdown.includes('- **#2** Accepted · Which row?'), 'numbered, newest first, with the verdict word')
  assert.ok(markdown.includes('chose B — with reasons'), 'the variant that was taken, by its label')
  assert.ok(markdown.includes('Element · Save — Round the button to the card radius.'), 'the comment, with its anchor')
  assert.ok(markdown.includes('Note — Ship it.'), 'and the note')
})

test('the downloaded report is one self-contained document, and escapes what it carries', () => {
  const client = loadClient()
  const record = foldedRecord(client, 'call-1', 'r-old', 1).data
  record.decision = 'Is <script>alert(1)</script> safe?'
  const items = client.__test.stripOrder(client.__test.entriesOf([record], [], 's'))
  const html = client.__test.reportHtmlOf(items, 'session-1', '2026-11-24 20:31')
  assert.ok(html.startsWith('<!doctype html>'), 'a document, not a fragment')
  assert.ok(html.includes('#1'), 'the number')
  assert.ok(html.includes('Is &lt;script&gt;alert(1)&lt;/script&gt; safe?'), 'the question is escaped')
  assert.equal(html.includes('<script>alert(1)</script>'), false, 'and never lands as markup')
  assert.ok(html.includes('session-1') && html.includes('2026-11-24 20:31'), 'it says which conversation and when')
})

/** Render the tab with props the caller controls, and a fetch that answers with `rounds`. */
async function renderTab(props, rounds) {
  const runtime = effectReact()
  const client = loadClient(runtime.React, async () => ({ ok: true, json: async () => ({ rounds: rounds || [] }) }))
  const tree = await runtime.render(client.__test.RoundPanel, props)
  return { client, runtime, props, tree }
}

test('the tab draws a numbered strip with the overview pinned at its right end', async () => {
  const client = loadClient()
  const history = historyOf(chatOf([foldedRecord(client, 'call-1', 'r-old', 1)]))
  const props = { sessionId: 's', history, navigate() {}, useTabInfo: () => ({ tab: { navigation: { params: {} } } }) }
  const { tree, client: panel } = await renderTab(props, [openRoundOf('r-wait', 9, 'Still open?')])

  const strip = findNode(tree, (node) => node.type === panel.__test.Strip)
  assert.ok(strip, 'a strip is drawn above the round')
  // The fake React does not invoke function components, so the strip's own
  // output is rendered by hand — the same way `textOf` reaches it.
  const stripTree = strip.type(strip.props)
  const text = textOf(strip)
  assert.ok(text.includes('#2'), 'the waiting round is numbered')
  assert.ok(text.includes('#1'), 'and so is the settled one')
  assert.ok(text.includes('Waiting'), 'the waiting cell says so in words')
  assert.ok(!text.includes('Needs a decision'), 'and not in the words the gate rejected')
  assert.ok(text.includes('Overview'), 'and the overview is pinned at its end')
  assert.equal(strip.props.items[0].roundId, 'r-wait', 'waiting first')
  assert.ok(findNode(stripTree, (node) => node.type === 'button' && textOf(node).includes('#1')), 'the cells are buttons')
})

test('a strip cell navigates to its round; the overview chip opens the overview', async () => {
  const client = loadClient()
  const history = historyOf(chatOf([foldedRecord(client, 'call-1', 'r-old', 1)]))
  const visited = []
  const props = { sessionId: 's', history, navigate: (id) => visited.push(id), useTabInfo: () => ({ tab: { navigation: { params: {} } } }) }
  const { tree, runtime, client: panel } = await renderTab(props, [openRoundOf('r-wait', 9, 'Still open?')])

  const strip = findNode(tree, (node) => node.type === panel.__test.Strip)
  const stripTree = strip.type(strip.props)
  const cell = findNode(stripTree, (node) => node.type === 'button' && textOf(node).includes('#1'))
  cell.props.onClick()
  assert.deepEqual(visited, ['r-old'], 'the cell asks the tab to navigate to that round')

  const overview = findNode(stripTree, (node) => node.type === 'button' && textOf(node).includes('Overview'))
  overview.props.onClick()
  const shown = await runtime.render(panel.__test.RoundPanel, props)
  const view = findNode(shown, (node) => node.type === panel.__test.Overview)
  assert.ok(view, 'the same tab now shows the overview')
  assert.equal(findNode(shown, (node) => node.type === panel.__test.DecisionView), null, 'and not the round')
})

test('the overview lists every round with its verdict, comments and note, and goes back', async () => {
  const client = loadClient()
  const history = historyOf(chatOf([foldedRecord(client, 'call-1', 'r-old', 1)]))
  const props = { sessionId: 's', history, navigate() {}, useTabInfo: () => ({ tab: { navigation: { params: {} } } }) }
  const { tree, runtime, client: panel } = await renderTab(props, [openRoundOf('r-wait', 9, 'Still open?')])

  const strip = findNode(tree, (node) => node.type === panel.__test.Strip)
  const stripTree = strip.type(strip.props)
  findNode(stripTree, (node) => node.type === 'button' && textOf(node).includes('Overview')).props.onClick()
  const shown = await runtime.render(panel.__test.RoundPanel, props)
  const view = findNode(shown, (node) => node.type === panel.__test.Overview)
  const viewTree = view.type(view.props)
  const text = textOf(view)
  assert.ok(text.includes('This conversation'), 'what the overview is')
  assert.ok(text.includes('2 rounds'), 'how many')
  assert.ok(text.includes('1 decided · 1 waiting'), 'and how they stand')
  assert.ok(text.includes('Round the button to the card radius.'), 'the comment, spelled out')
  assert.ok(text.includes('Ship it.'), 'and the note')
  // The anchor and the words are two lines, not one: the gate read them as one
  // grey sentence when they shared a row.
  const anchorLine = findNode(viewTree, (node) => node.type === 'div' && textOf(node) === 'Element · Save')
  assert.ok(anchorLine, 'the anchor is its own line')
  const words = findNode(viewTree, (node) => node.type === 'div' && textOf(node) === 'Round the button to the card radius.')
  assert.ok(words, 'and the words are theirs')
  assert.ok(text.includes('Copy Markdown') && text.includes('Download HTML'), 'both export actions')

  findNode(viewTree, (node) => node.type === 'button' && textOf(node).includes('Back to this round')).props.onClick()
  const back = await runtime.render(panel.__test.RoundPanel, props)
  assert.ok(findNode(back, (node) => node.type === panel.__test.DecisionView), 'back is the round itself')
})

test('an overview with nothing decided says so instead of drawing an empty list', async () => {
  const client = loadClient()
  const history = historyOf(chatOf([]))
  const props = { sessionId: 's', history, navigate() {}, useTabInfo: () => ({ tab: { navigation: { params: {} } } }) }
  const { runtime, client: panel } = await renderTab(props, [])
  const view = await runtime.render(panel.__test.Overview, { items: [], sessionId: 's', onBack() {} })
  const text = textOf(view)
  assert.ok(text.includes('Nothing has been decided in this conversation yet.'))
  assert.ok(text.includes('0 rounds'))
})

test('cancelling a round leaves no record behind, so the strip does not renumber after a reload', async () => {
  // The fold draws no row for a cancelled round (invariant 7). A stand-in would
  // show it in the strip until the reload and then shift every number after it.
  const client = loadClient()
  const open = {
    id: 'r-live',
    kind: 'decision',
    sessionId: 's',
    decision: 'Which row?',
    context: '',
    variants: [{ id: 'a', label: 'A', html: '<h1>A</h1>', source: 'docs/a.html', recommendation: 'Because.', cost: [], real: [], mocked: [], omitted: [], note: '' }],
    status: 'open',
    createdAt: 7,
  }
  const props = { sessionId: 's', history: historyOf(chatOf([])), navigate() {}, useTabInfo: () => ({ tab: { navigation: { params: { roundId: 'r-live' } } } }) }
  const { tree, runtime, client: panel } = await renderTab(props, [open])
  const view = findNode(tree, (node) => node.type === panel.__test.DecisionView)
  assert.ok(view, 'the round is on screen')

  view.props.onSent({ status: 'cancelled', roundId: 'r-live', reason: 'the user cancelled the round' }, open)
  const after = await runtime.render(panel.__test.RoundPanel, props)
  assert.equal(findNode(after, (node) => node.type === panel.__test.RecordView), null, 'nothing to read back')
  const strip = findNode(after, (node) => node.type === panel.__test.Strip)
  assert.ok(strip === null || !textOf(strip).includes('#1'), 'and nothing numbered in the strip')
})

test('a record keeps its own bottom padding, because no decision bar follows it', async () => {
  const client = loadClient()
  const history = historyOf(chatOf([foldedRecord(client, 'call-1', 'r-old', 1)]))
  const props = { sessionId: 's', history, navigate() {}, useTabInfo: () => ({ tab: { navigation: { params: {} } } }) }
  const { tree } = await renderTab(props, [])
  const root = findNode(
    tree,
    (node) => node.type === 'div' && typeof node.props.className === 'string' && node.props.className.includes('clarity-arrival'),
  )
  assert.ok(root, 'the record has a root')
  assert.ok(String(root.props.style.padding).endsWith('18px'), 'and it pads its own foot: ' + root.props.style.padding)
})

test('a strip cell stays a button: no role replaces the one that says it acts', async () => {
  const client = loadClient()
  const history = historyOf(chatOf([foldedRecord(client, 'call-1', 'r-old', 1)]))
  const props = { sessionId: 's', history, navigate() {}, useTabInfo: () => ({ tab: { navigation: { params: {} } } }) }
  const { tree, client: panel } = await renderTab(props, [openRoundOf('r-wait', 9, 'Still open?')])
  const strip = findNode(tree, (node) => node.type === panel.__test.Strip)
  assert.equal(strip.props.items.length, 2)
  const stripTree = strip.type(strip.props)
  const cells = []
  const collect = (node) => {
    if (Array.isArray(node)) {
      node.forEach(collect)
      return
    }
    if (!node || typeof node !== 'object') return
    if (node.type === 'button' && String(textOf(node)).includes('#')) cells.push(node)
    if (node.children) node.children.forEach(collect)
  }
  collect(stripTree)
  assert.equal(cells.length, 2, 'one button per round')
  for (const cell of cells) {
    assert.notEqual(cell.props.role, 'listitem', 'a button must keep the button role')
  }
  const row = findNode(stripTree, (node) => node.props && node.props['aria-label'] === 'Rounds')
  assert.ok(row, 'the group names itself')
})

/** A document that records what the plugin puts in its head. */
function fakeDocument() {
  const head = {
    children: [],
    appendChild(node) {
      this.children.push(node)
    },
  }
  return {
    head,
    doc: {
      head,
      getElementById(id) {
        return head.children.find((node) => node.id === id) ?? null
      },
      createElement(tag) {
        return {
          tagName: String(tag).toUpperCase(),
          id: '',
          textContent: '',
          remove() {
            const at = head.children.indexOf(this)
            if (at !== -1) head.children.splice(at, 1)
          },
        }
      },
    },
  }
}

test('the motion stylesheet goes in once, and only where there is a document', () => {
  const { doc, head } = fakeDocument()

  // Without a document — a test host, an older embedding — apply must still work.
  const bare = loadClient()
  bare.apply(makeCtx().ctx)
  assert.equal(head.children.length, 0, 'nothing outside a browser gets a stylesheet')

  const client = loadClient(undefined, undefined, undefined, doc)
  const { ctx } = makeCtx()
  client.apply(ctx)
  client.apply(ctx)

  assert.equal(head.children.length, 1, 'a second activation adds no second sheet')
  assert.equal(head.children[0].tagName, 'STYLE')
  const rules = head.children[0].textContent
  assert.match(rules, /prefers-reduced-motion/, 'the system preference is obeyed')
  assert.match(rules, /clarity-arrival/, 'the entrance is declared')
  assert.match(rules, /--clarity-ease/, 'the timings are tokens, not numbers scattered through the rules')
  assert.match(rules, /\[role=button\]:focus-visible\{outline:1px solid/, 'the card gets a ring of its own')
})

test('every class and keyframe in the sheet is namespaced', () => {
  // The sheet reaches the whole page for as long as the plugin is applied, so a bare
  // `.row` or a bare `rise` would be a collision waiting to happen.
  const { doc, head } = fakeDocument()
  loadClient(undefined, undefined, undefined, doc).apply(makeCtx().ctx)
  const rules = head.children[0].textContent

  const classes = [...new Set(rules.match(/\.[a-zA-Z][\w-]*/g) || [])]
  assert.ok(classes.includes('.clarity-scope'), 'the sheet has selectors to check')
  assert.ok(classes.length >= 6, 'and it has more than the scope itself')
  for (const token of classes) {
    assert.ok(token.startsWith('.clarity-'), `a class in the sheet is not namespaced: ${token}`)
  }
  const cut = [...new Set(rules.match(/@keyframes\s+([\w-]+)/g) || [])]
  assert.ok(cut.length > 0, 'the sheet declares its keyframes')
  for (const token of cut) {
    const name = token.split(/\s+/)[1]
    assert.ok(name.startsWith('clarity-'), `a keyframe is not namespaced: ${name}`)
  }
})

test('a hot reload cannot take the stylesheet away from the instance using it', () => {
  const { doc, head } = fakeDocument()
  const activate = (client) => {
    const disposers = []
    const { ctx } = makeCtx()
    ctx.effect = (fn) => {
      const dispose = fn()
      disposers.push(typeof dispose === 'function' ? dispose : () => {})
      return dispose
    }
    client.apply(ctx)
    return disposers
  }

  // A reload evaluates a fresh bundle, so a counter that lived in that bundle's scope
  // would not be shared with the instance the page is still running on.
  const older = activate(loadClient(undefined, undefined, undefined, doc))
  const newer = activate(loadClient(undefined, undefined, undefined, doc))

  assert.equal(head.children.length, 1, 'the reload reuses the sheet already on the page')
  older[0]() // the old instance goes away, after the new one is already up
  assert.equal(head.children.length, 1, 'without taking the live instance’s sheet with it')
  newer[0]()
  assert.equal(head.children.length, 0, 'the last one out removes it')
})

test('the decision bar is pinned, and the card’s states belong to the stylesheet', () => {
  const runtime = statefulReact()
  const client = loadClient(runtime.React)
  const props = { round: editableRound(), sent: null, onSent() {} }
  const tree = runtime.render(client.__test.DecisionView, props)

  const bar = findNode(tree, (node) => node.props && node.props.style && node.props.style.position === 'sticky')
  assert.ok(bar, 'the decision bar sticks to the bottom of the pane')
  assert.equal(bar.props.style.bottom, 0, 'it holds the bottom edge')

  const card = findNode(tree, (node) => node.props && node.props.role === 'button')
  assert.equal(card.props.className, 'clarity-card', 'the selected card is drawn by the stylesheet')
  assert.equal(card.props.style.transform, undefined, 'no inline transform for the stylesheet to fight')
  assert.equal(card.props.style.outline, undefined, 'and no inline outline to suppress the focus ring')
  assert.equal(card.props.style.boxShadow, undefined, 'no inline ring either')
})

test('the variant a comment belongs to is a chip, and the chip decides it', async () => {
  const runtime = statefulReact()
  const bodies = []
  const client = loadClient(runtime.React, async (path, init) => {
    bodies.push({ path, body: JSON.parse(init.body) })
    return { ok: true, json: async () => ({ ok: true, result: { verdict: 'revise' } }) }
  })
  const props = { round: editableRound(), sent: null, onSent() {} }

  let tree = runtime.render(client.__test.DecisionView, props)
  const chips = buttonsNamed(tree, 'B')
  assert.equal(chips.length, 1, 'the other variant is one button, not a dropdown')
  assert.equal(chips[0].props['aria-pressed'], false)
  click(chips[0])

  tree = runtime.render(client.__test.DecisionView, props)
  assert.equal(buttonsNamed(tree, 'B')[0].props['aria-pressed'], true, 'the chip is the choice')

  tree = addComment(runtime, client, props, 'Name it.')
  // The card still says A: the chip decides which variant the comment belongs to,
  // which is a separate choice from which one the round selects.
  await click(buttonsNamed(tree, 'Revise A')[0])

  assert.equal(bodies.length, 1)
  assert.equal(bodies[0].body.comments[0].variantId, 'b', 'the comment went to the variant the chip named')
})

test('an empty comment list is the composer, not a paragraph about it', () => {
  const runtime = statefulReact()
  const client = loadClient(runtime.React)
  const props = { round: editableRound(), sent: null, onSent() {} }
  const tree = runtime.render(client.__test.DecisionView, props)

  assert.equal(textOf(tree).includes('No comments yet'), false, 'the empty list adds no prose')
  assert.ok(composerOf(tree), 'the composer itself is the invitation')
})

test('only the row this session added rises into place', () => {
  const runtime = statefulReact()
  const client = loadClient(runtime.React)
  const props = { round: editableRound(), sent: null, onSent() {} }

  addComment(runtime, client, props, 'First thing.')
  const tree = addComment(runtime, client, props, 'Second thing.')
  const rows = []
  const walk = (node) => {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) {
      for (const child of node) walk(child)
      return
    }
    if (node.props && node.props.className === 'clarity-row') rows.push(node)
    for (const child of node.children || []) walk(child)
  }
  walk(tree)

  assert.equal(rows.length, 2)
  assert.equal(rows[0].props['data-new'], undefined, 'the row that was already there sits still')
  assert.equal(rows[1].props['data-new'], 'true', 'the row just added arrives')
})

test('a working button is not drawn as an unavailable one', () => {
  const runtime = statefulReact()
  const client = loadClient(runtime.React, () => new Promise(() => {}))
  const props = { round: editableRound(), sent: null, onSent() {} }

  let tree = runtime.render(client.__test.DecisionView, props)
  const rest = buttonsNamed(tree, 'Accept A')[0]
  // Nothing sits beside the label, at rest or in flight: the label is the whole
  // content of the cell, so no send can change the bar's width or rewrap the row.
  assert.equal(rest.children.length, 1, 'the button holds its label and nothing else')
  assert.equal(rest.children[0].props.className, 'clarity-verb-label')
  assert.equal(
    findNode(tree, (node) => node.props && node.props.className === 'clarity-spin'),
    null,
    'the reserved spinner box is gone',
  )

  rest.props.onClick()
  tree = runtime.render(client.__test.DecisionView, props)

  const busy = findNode(tree, (node) => node.type === 'button' && node.props['data-busy'] === 'true')
  assert.ok(busy, 'the pressed button says it is working')
  assert.equal(busy.children.length, 1, 'and says it without adding a node beside the label')
  assert.equal(busy.props.disabled, true, 'and is locked while it works')
  // The disabled style it would otherwise carry is inline, so the exemption has to be
  // inline too: a stylesheet rule cannot reach an inline declaration.
  assert.equal(busy.props.style.opacity, undefined, 'no 0.45 opacity that would read as unavailable')
  assert.equal(busy.props.style.cursor, 'progress', 'the cursor says which one is in flight')
  assert.equal(textOf(busy), 'Accept A', 'the label still says what is being sent, not a shorter one')
})

test('the working label is the indicator, and the sheet adds no box to the bar', () => {
  const rules = loadClient(statefulReact().React).__test.STYLE_RULES
  assert.match(
    rules,
    /data-busy='true'\] \.clarity-verb-label\{[^}]*background-clip:text/,
    'the verb you pressed says it in its own letters',
  )
  assert.equal(rules.includes('clarity-spin'), false, 'and nothing is reserved beside them')
  assert.equal(/data-busy='true'\]::after/.test(rules), false, 'nor laid over them')
  assert.match(
    rules,
    /prefers-reduced-motion:reduce\)\{[\s\S]*clarity-verb-label\{animation:none/,
    'without motion the label still dims, so working is still said',
  )
})

test('the decision bar reports the verb you pressed, not the accept button', () => {
  const runtime = statefulReact()
  const client = loadClient(runtime.React, () => new Promise(() => {}))
  const props = { round: editableRound(), sent: null, onSent() {} }

  let tree = addComment(runtime, client, props, 'Name it.')
  buttonsNamed(tree, 'Revise A')[0].props.onClick()
  tree = runtime.render(client.__test.DecisionView, props)

  const working = (label) => buttonsNamed(tree, label)[0].props['data-busy'] === 'true'
  assert.equal(working('Revise A'), true, 'the verb you pressed is the one that says it is working')
  assert.equal(working('Accept A'), false, 'and the accept button does not claim a send nobody asked for')
  assert.equal(textOf(buttonsNamed(tree, 'Accept A')[0]), 'Accept A')
})

test('a sheet left by an earlier bundle is refreshed in place', () => {
  const { doc, head } = fakeDocument()
  // The state a hot reload produces: the previous bundle's node is already on the page.
  const stale = doc.createElement('style')
  stale.id = 'clarity-motion'
  stale.textContent = '/* an earlier bundle */'
  head.appendChild(stale)

  loadClient(undefined, undefined, undefined, doc).apply(makeCtx().ctx)

  assert.equal(head.children.length, 1, 'the node is reused, not duplicated')
  assert.equal(head.children[0].textContent.includes('an earlier bundle'), false, 'its rules are this bundle’s')
  assert.match(head.children[0].textContent, /clarity-arrival/)
})

test('the test bar says which verb is working, and only that one', () => {
  const runtime = statefulReact()
  const client = loadClient(runtime.React, () => new Promise(() => {}))
  const round = {
    id: 't1',
    kind: 'test',
    sessionId: 'session-1',
    candidate: '4f2a1c9',
    prepared: { command: 'pnpm build', exitCode: 0, builtAt: 1 },
    runThis: null,
    scenario: {
      preconditions: ['signed in'],
      steps: ['open'],
      expected: ['one toast'],
      failureSignature: 'two toasts',
      rollback: 'none',
    },
    status: 'open',
    createdAt: 1,
  }
  const props = { round, sent: null, onSent() {} }
  const byLabel = (tree, label) => findNode(tree, (node) => node.type === 'button' && textOf(node) === label)

  let tree = runtime.render(client.__test.TestView, props)
  byLabel(tree, 'I’m ready to test').props.onClick()
  tree = runtime.render(client.__test.TestView, props)
  byLabel(tree, 'Pass').props.onClick()
  tree = runtime.render(client.__test.TestView, props)

  const working = (label) => byLabel(tree, label).props['data-busy'] === 'true'
  assert.equal(working('Pass'), true, 'the pressed verb says it is working')
  assert.equal(working('Fail'), false, 'the others do not claim to be')
  assert.equal(working('Cancel this test'), false)
  assert.equal(byLabel(tree, 'Pass').props.style.opacity, undefined, 'and it is not greyscaled either')
})

