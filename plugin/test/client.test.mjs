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

function loadClient(ReactOverride) {
  let registration
  const sandbox = {
    window: {
      __ModuleLoader__: {
        load(value) {
          registration = value
        },
      },
    },
    EventSource: FakeEventSource,
    console,
    fetch: async () => ({ ok: true, json: async () => ({}) }),
  }
  vm.runInNewContext(code, sandbox, { filename: 'client.js' })
  assert.ok(registration, 'the bundle registers itself')
  assert.equal(registration.id, 'dsh-collaborative-clarity')

  const React = ReactOverride || {
    createElement: () => null,
    Fragment: 'Fragment',
    useState: () => [undefined, () => {}],
    useEffect: () => {},
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

function makeCtx() {
  const calls = { openTab: [], registered: [], bodies: [], titles: [] }
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
        return () => {}
      },
    },
    sidebarRight: {
      mounted: { getSnapshot: () => 'session-1' },
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
  return { ctx, calls }
}

test('the bundle registers a multiple tab, a body, a title, and a guide entry', () => {
  const client = loadClient()
  assert.deepEqual([...client.inject].sort(), ['sidebarRight', 'sidebarRightTabs', 'slots', 'uiSession'])
  const { ctx, calls } = makeCtx()
  client.apply(ctx)

  assert.equal(calls.registered.length, 1)
  const definition = calls.registered[0]
  assert.equal(definition.id, 'dsh-collaborative-clarity')
  assert.equal(definition.kind, 'clarity')
  assert.equal(definition.multiple, true)
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
    variants: [{ id: 'a', label: 'A', html: '<h1>A</h1>', note: '', real: [], mocked: [], omitted: [] }],
    recommendation: 'a',
    foreclosures: ['B is lost.'],
    status: 'open',
    createdAt: Date.now(),
  }
  const props = { round, sent: null, onSent() {} }
  let tree = runtime.render(client.__test.DecisionView, props)
  const input = findNode(tree, (node) => node.type === 'input' && node.props.placeholder === 'What should change?')
  assert.ok(input, 'the comment input is rendered')
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
