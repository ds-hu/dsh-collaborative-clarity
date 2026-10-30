/**
 * Collaborative Clarity — host half.
 *
 * A tool opens a round, publishes it to the browser half, and then waits. The
 * browser submits a structured decision, which resolves the tool call. No
 * polling: the browser holds one SSE connection, and the wait is a promise in
 * this process.
 *
 * This file deliberately imports nothing from `@deepseek-ai/*`. The plugin is
 * installed with `link:`, so Node would resolve such imports from this checkout
 * instead of the running harness; using the `ctx` services directly keeps one
 * module identity and lets the plugin ship without a build or dependency tree.
 */

import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { basename, isAbsolute, relative, resolve } from 'node:path'

import { renderArtifact } from './artifacts.js'

/** The route prefix the browser half fetches from. */
export const API_PREFIX = '/clarity/api'

/** Cordis plugin name, used by loader diagnostics. */
export const name = 'collaborative-clarity'

/** Services this half needs. Both are required: a round without a waiter or a surface is not a round. */
export const inject = ['tools', 'webServer']

/** The two model-facing tool names. */
export const ROUND_TOOL = 'clarity_round'
export const TEST_TOOL = 'clarity_test'

/** Largest artifact file a round will read. */
const MAX_ARTIFACT_BYTES = 400_000

/**
 * The timing rule, published as an always-on system section.
 *
 * It sits in the policy region rather than inside the tool description: the
 * model meets it while deciding what to do, not while scanning a schema. The
 * description keeps the mechanism, so the rule is stated in one place only.
 */
export const GUIDANCE_SECTION = 'clarity:guidance'
export const GUIDANCE_ORDER = 2950
export const GUIDANCE_TEXT = [
  'Open a clarity_round when a request leaves a visual or behavioural choice open — "make it nicer", "A or B", which layout — or when it criticises something already rendered: show the choice, name your recommendation, and wait, before writing any implementation.',
  'Once a direction is accepted, finish the work and report. Do not open a round to confirm a decided thing, to ask permission, or to split one task into approvals. One decision per round.',
].join('\n\n')

/** One variant the user can choose. */
const VARIANT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    id: { type: 'string', description: 'Stable id used in the result; "a" and "b" are conventional.' },
    label: { type: 'string', description: 'The label shown above the artifact. Defaults to the file name.' },
    path: {
      type: 'string',
      description:
        'The artifact file, relative to the session working directory. `.html` renders as a document, Markdown as prose, and every other text file as numbered source whose lines can be annotated.',
    },
    note: { type: 'string', description: 'One sentence of framing shown under the label.' },
    real: { type: 'array', items: { type: 'string' }, description: 'What this artifact actually is.' },
    mocked: { type: 'array', items: { type: 'string' }, description: 'What is faked.' },
    omitted: { type: 'array', items: { type: 'string' }, description: 'What is deliberately not shown.' },
  },
  required: ['id', 'path'],
}

/** The fields a variant may carry — the same list the schema declares. */
const VARIANT_FIELDS = ['id', 'label', 'path', 'note', 'real', 'mocked', 'omitted']

/**
 * Where a comment points inside an artifact.
 *
 * `variant` is the whole draft; the other three name a location so the agent does
 * not have to infer which element, phrase, or line the user meant.
 */
const ANCHOR_SCHEMA = {
  oneOf: [
    {
      type: 'object',
      additionalProperties: false,
      properties: {
        kind: { type: 'string', enum: ['element'] },
        selector: { type: 'string' },
        text: { type: 'string' },
      },
      required: ['kind', 'selector'],
    },
    {
      type: 'object',
      additionalProperties: false,
      properties: {
        kind: { type: 'string', enum: ['text'] },
        quote: { type: 'string' },
        prefix: { type: 'string' },
        suffix: { type: 'string' },
      },
      required: ['kind', 'quote'],
    },
    {
      type: 'object',
      additionalProperties: false,
      properties: {
        kind: { type: 'string', enum: ['line'] },
        path: { type: 'string' },
        start: { type: 'number' },
        end: { type: 'number' },
      },
      required: ['kind', 'path', 'start', 'end'],
    },
    {
      type: 'object',
      additionalProperties: false,
      properties: {
        kind: { type: 'string', enum: ['variant'] },
      },
      required: ['kind'],
    },
  ],
}

/** One comment the user attached to a variant (or to the round when variantId is absent). */
const COMMENT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    variantId: { type: 'string' },
    text: { type: 'string' },
    anchor: ANCHOR_SCHEMA,
    artifactHash: { type: 'string' },
  },
  required: ['text'],
}

/** The canonical result of either tool. */
const RESULT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    status: { type: 'string', enum: ['decided', 'tested', 'cancelled'] },
    roundId: { type: 'string' },
    verdict: { type: 'string', enum: ['accept', 'revise', 'reject', 'pass', 'fail', 'blocked'] },
    selected: { type: 'string' },
    comments: { type: 'array', items: COMMENT_SCHEMA },
    note: { type: 'string' },
    observed: { type: 'string' },
    reason: { type: 'string' },
  },
  required: ['status', 'roundId'],
}

/**
 * The in-process round store.
 *
 * A round is ephemeral by design: its durable record is the decision in the
 * session log. Persisting the HTML would make a stale surface survive a restart.
 */
export class RoundStore {
  constructor() {
    /** @type {Map<string, object>} */
    this.rounds = new Map()
    /** @type {Map<string, object>} */
    this.waiters = new Map()
    /** @type {Set<import('node:http').ServerResponse>} */
    this.clients = new Set()
  }

  /**
   * Publish one round and notify the connected browser.
   * @param {object} round - the round to publish.
   * @returns {object} the same round.
   */
  open(round) {
    this.rounds.set(round.id, round)
    this.broadcast('round', round)
    return round
  }

  /**
   * Read one round.
   * @param {string} id - the round id.
   * @returns {object | undefined} the round.
   */
  get(id) {
    return this.rounds.get(id)
  }

  /**
   * Every round still waiting for an answer.
   * @returns {object[]} open rounds, oldest first.
   */
  openRounds() {
    return [...this.rounds.values()]
      .filter((round) => round.status === 'open')
      .sort((a, b) => a.createdAt - b.createdAt)
  }

  /**
   * Wait for the user to answer one round.
   * @param {string} roundId - the round to wait on.
   * @param {AbortSignal | undefined} signal - the tool call's cancellation.
   * @returns {Promise<object>} the result handed back to the model.
   */
  wait(roundId, signal) {
    return new Promise((resolve) => {
      const entry = { resolve, signal, onAbort: undefined }
      const onAbort = () => {
        if (this.waiters.get(roundId) !== entry) return
        this.waiters.delete(roundId)
        signal?.removeEventListener('abort', onAbort)
        resolve({ status: 'cancelled', roundId, reason: 'the tool call was aborted' })
      }
      entry.onAbort = onAbort
      this.waiters.set(roundId, entry)
      if (signal?.aborted) {
        this.waiters.delete(roundId)
        resolve({ status: 'cancelled', roundId, reason: 'the tool call was aborted' })
        return
      }
      signal?.addEventListener('abort', onAbort, { once: true })
    })
  }

  /**
   * Resolve one waiter, if it is still waiting.
   * @param {string} roundId - the round to settle.
   * @param {object} value - the result to hand the model.
   * @returns {void}
   */
  settle(roundId, value) {
    const entry = this.waiters.get(roundId)
    if (entry === undefined) return
    this.waiters.delete(roundId)
    entry.signal?.removeEventListener('abort', entry.onAbort)
    entry.resolve(value)
  }

  /**
   * Record a decision and resolve the waiting tool call.
   * @param {string} roundId - the round id.
   * @param {object} payload - sanitised verdict, selected, comments, note.
   * @returns {object} the canonical result.
   */
  decide(roundId, payload) {
    const round = this.requireOpen(roundId)
    const value = {
      status: payload.verdict === 'cancel' ? 'cancelled' : 'decided',
      roundId,
      ...(payload.verdict === 'cancel' ? { reason: 'the user cancelled the round' } : { verdict: payload.verdict }),
      ...(payload.selected === undefined ? {} : { selected: payload.selected }),
      ...(payload.comments.length === 0 ? {} : { comments: payload.comments }),
      ...(payload.note === '' ? {} : { note: payload.note }),
    }
    round.status = payload.verdict === 'accept' ? 'accepted' : payload.verdict === 'cancel' ? 'cancelled' : payload.verdict
    round.result = value
    this.settle(roundId, value)
    this.broadcast('decided', { roundId, status: round.status })
    return value
  }

  /**
   * Record a real-test verdict and resolve the waiting tool call.
   * @param {string} roundId - the round id.
   * @param {object} payload - sanitised verdict and observed text.
   * @returns {object} the canonical result.
   */
  test(roundId, payload) {
    const round = this.requireOpen(roundId)
    const value = {
      status: 'tested',
      roundId,
      verdict: payload.verdict,
      ...(payload.observed === '' ? {} : { observed: payload.observed }),
    }
    round.status = 'tested'
    round.result = value
    this.settle(roundId, value)
    this.broadcast('tested', { roundId, status: 'tested' })
    return value
  }

  /**
   * Throw a stable error when a round is missing or no longer answerable.
   * @param {string} roundId - the round id.
   * @returns {object} the open round.
   */
  requireOpen(roundId) {
    const round = this.rounds.get(roundId)
    if (round === undefined) throw new HttpError(404, 'unknown-round', `unknown round: ${roundId}`)
    if (round.status !== 'open') throw new HttpError(409, 'round-closed', `round is already ${round.status}`)
    return round
  }

  /**
   * Attach one SSE client and keep it alive until it disconnects.
   * @param {import('node:http').ServerResponse} res - the response to stream on.
   * @returns {void}
   */
  subscribe(res) {
    res.writeHead(200, {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    })
    res.write('retry: 1000\n\n')
    this.clients.add(res)
    const ping = setInterval(() => {
      try {
        res.write(': ping\n\n')
      } catch {
        cleanup()
      }
    }, 25_000)
    const cleanup = () => {
      clearInterval(ping)
      this.clients.delete(res)
    }
    res.on('close', cleanup)
    res.on('error', cleanup)
  }

  /**
   * Send one named event to every connected browser.
   * @param {string} event - the SSE event name.
   * @param {object} data - the JSON payload.
   * @returns {void}
   */
  broadcast(event, data) {
    for (const res of [...this.clients]) {
      try {
        sendEvent(res, event, data)
      } catch {
        this.clients.delete(res)
      }
    }
  }

  /** Close every stream and release every waiter when the plugin unloads. */
  close() {
    for (const res of [...this.clients]) {
      try {
        res.end()
      } catch {
        // The connection is already gone.
      }
    }
    this.clients.clear()
    for (const roundId of [...this.waiters.keys()]) {
      this.settle(roundId, { status: 'cancelled', roundId, reason: 'the plugin was unloaded' })
    }
  }
}

/** One HTTP failure with a code the client can show. */
class HttpError extends Error {
  /**
   * @param {number} status - HTTP status.
   * @param {string} code - stable machine code.
   * @param {string} message - human message.
   */
  constructor(status, code, message) {
    super(message)
    this.status = status
    this.code = code
  }
}

/**
 * Publish the timing rule into the system prompt.
 *
 * The prompt service is read without an inject requirement, so a composition
 * without it keeps the tools and loses only the section.
 * @param {object} ctx - the plugin context.
 * @returns {() => void} the disposer.
 */
export function registerGuidance(ctx) {
  const systemPrompt = ctx.get('systemPrompt')
  if (systemPrompt === undefined || typeof systemPrompt.section !== 'function') return () => {}
  return systemPrompt.section({ name: GUIDANCE_SECTION, order: GUIDANCE_ORDER, text: GUIDANCE_TEXT })
}

/**
 * Mount the host half.
 * @param {import('@deepseek-ai/cordis').Context} ctx - the plugin context.
 */
export function apply(ctx) {
  const store = new RoundStore()
  ctx.effect(() => registerApi(ctx, store), 'collaborative-clarity api')
  ctx.effect(() => registerGuidance(ctx), 'collaborative-clarity guidance')
  ctx.effect(() => {
    const disposeRound = ctx.tools.register(decisionTool(store, ctx))
    const disposeTest = ctx.tools.register(testTool(store))
    return () => {
      disposeRound()
      disposeTest()
    }
  }, 'collaborative-clarity tools')
}

/**
 * Define the decision tool.
 * @param {RoundStore} store - the shared round store.
 * @param {object} ctx - the plugin context, used to find the session directory.
 * @returns {object} a registry-ready tool definition.
 */
export function decisionTool(store, ctx) {
  return {
    name: ROUND_TOOL,
    description: [
      'Open a decision round in the user\'s right Sidebar and wait for their decision.',
      'One decision, one or two variants, a named recommendation, and at least one stated foreclosure.',
      'Each variant names one file: `.html` renders as a document, Markdown as prose, any other text file as numbered source whose lines can be annotated. Keep it self-contained — no network, no external assets, no build; show final copy, mock only the change and its immediate context, and design at 360px first. The file is the record, so it can be edited and reopened without resending it.',
      'The tool blocks until the user accepts, requests a revision, rejects, or cancels. The result is structured: { status, verdict, selected, comments, note }.',
      'In this mode, do not use ask_user_question for the decision: the round is the question.',
      'If the user requests a revision, open a new round with the changed artifact; never silently rewrite the accepted one.',
    ].join(' '),
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        decision: { type: 'string', description: 'One interrogative sentence. The tab header is this sentence.' },
        context: { type: 'string', description: 'At most three sentences: why now, and what changes.' },
        variants: {
          type: 'array',
          items: VARIANT_SCHEMA,
          description: 'One or two variants. Two is the maximum shown side by side; one is fine when the decision is a yes/no.',
        },
        recommendation: { type: 'string', description: 'The variant id the agent recommends. Must match a variant.' },
        foreclosures: {
          type: 'array',
          items: { type: 'string' },
          description: 'At least one: what the recommendation makes hard, expensive, or impossible later. "Nothing" is not an answer.',
        },
      },
      required: ['decision', 'variants', 'recommendation', 'foreclosures'],
    },
    output: {
      schema: RESULT_SCHEMA,
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }],
    },
    async execute(args, exec) {
      refuseUnknown(args ?? {}, ['decision', 'context', 'variants', 'recommendation', 'foreclosures'], 'arguments')
      const sessionId = sessionOf(exec)
      const variants = await normaliseVariants(args.variants, workingDirectoryOf(ctx, exec))
      const recommendation = requireString(args.recommendation, 'recommendation', 200)
      if (!variants.some((variant) => variant.id === recommendation)) {
        throw new Error(`recommendation "${recommendation}" does not match a variant id`)
      }
      const foreclosures = normaliseStrings(args.foreclosures, 'foreclosures', 10_000, 1)
      const round = {
        id: `clarity-${Date.now().toString(36)}-${randomUUID().slice(0, 6)}`,
        kind: 'decision',
        sessionId,
        decision: requireString(args.decision, 'decision', 500),
        context: args.context === undefined ? '' : requireString(args.context, 'context', 3_000),
        variants,
        recommendation,
        foreclosures,
        status: 'open',
        createdAt: Date.now(),
      }
      store.open(round)
      return await store.wait(round.id, exec.signal)
    },
  }
}

/**
 * Define the real-test tool.
 * @param {RoundStore} store - the shared round store.
 * @returns {object} a registry-ready tool definition.
 */
export function testTool(store) {
  return {
    name: TEST_TOOL,
    description: [
      'Open a real-test gate in the user\'s right Sidebar and wait for the result.',
      'Use it only after the candidate has been built cold successfully: pass the commit or dirty hash, the exact cold-build command and its exit code, and a 3-7 step scenario with an expected observable, a failure signature, and a rollback.',
      'The tool blocks while the user runs the scenario. They press "I\'m ready to test", then record pass, fail, or blocked with what they observed.',
      'A pass is the only evidence that can mark the change tested. A fail is evidence too: fix, rebuild cold, and open a new test gate. Never call a feature done because contract tests are green.',
    ].join(' '),
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        candidate: { type: 'string', description: 'Commit SHA, or "dirty:<hash>" when the tree is dirty.' },
        coldBuild: {
          type: 'object',
          additionalProperties: false,
          properties: {
            command: { type: 'string' },
            exitCode: { type: 'number' },
            builtAt: { type: 'string' },
          },
          required: ['command', 'exitCode', 'builtAt'],
          description: 'Evidence of the cold build that preceded this gate. exitCode must be 0.',
        },
        scenario: {
          type: 'object',
          additionalProperties: false,
          properties: {
            preconditions: { type: 'array', items: { type: 'string' } },
            steps: { type: 'array', items: { type: 'string' } },
            expected: { type: 'array', items: { type: 'string' } },
            failureSignature: { type: 'string' },
            rollback: { type: 'string' },
          },
          required: ['preconditions', 'steps', 'expected', 'failureSignature', 'rollback'],
          description: 'A person must be able to follow this without asking questions.',
        },
      },
      required: ['candidate', 'coldBuild', 'scenario'],
    },
    output: {
      schema: RESULT_SCHEMA,
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }],
    },
    async execute(args, exec) {
      refuseUnknown(args ?? {}, ['candidate', 'coldBuild', 'scenario'], 'arguments')
      const sessionId = sessionOf(exec)
      const candidate = requireString(args.candidate, 'candidate', 200)
      const coldBuild = args.coldBuild
      if (coldBuild === null || typeof coldBuild !== 'object') throw new Error('coldBuild is required')
      if (coldBuild.exitCode !== 0) throw new Error('the cold build did not exit 0; fix it before opening a test gate')
      const scenario = args.scenario
      if (scenario === null || typeof scenario !== 'object') throw new Error('scenario is required')
      const normalisedScenario = {
        preconditions: normaliseStrings(scenario.preconditions, 'scenario.preconditions', 2_000, 0),
        steps: normaliseStrings(scenario.steps, 'scenario.steps', 2_000, 1),
        expected: normaliseStrings(scenario.expected, 'scenario.expected', 2_000, 1),
        failureSignature: requireString(scenario.failureSignature, 'scenario.failureSignature', 2_000),
        rollback: requireString(scenario.rollback, 'scenario.rollback', 2_000),
      }
      const round = {
        id: `clarity-test-${Date.now().toString(36)}-${randomUUID().slice(0, 6)}`,
        kind: 'test',
        sessionId,
        decision: `Real test: ${candidate}`,
        candidate,
        coldBuild: {
          command: requireString(coldBuild.command, 'coldBuild.command', 2_000),
          exitCode: coldBuild.exitCode,
          builtAt: requireString(coldBuild.builtAt, 'coldBuild.builtAt', 200),
        },
        scenario: normalisedScenario,
        status: 'open',
        createdAt: Date.now(),
      }
      store.open(round)
      return await store.wait(round.id, exec.signal)
    },
  }
}

/**
 * Get the conversation id from the tool execution.
 * @param {object} exec - the tool run context.
 * @returns {string} the session id.
 */
function sessionOf(exec) {
  const id = exec?.agent?.id
  if (typeof id !== 'string' || id === '') throw new Error('this tool needs an active conversation')
  return id
}

/**
 * Validate and copy the variants, rendering each one's artifact file.
 * @param {unknown} value - the model's variant array.
 * @param {string} cwd - directory for relative artifact paths.
 * @returns {Promise<object[]>} clean variants.
 */
export async function normaliseVariants(value, cwd = process.cwd()) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 2) {
    throw new Error('variants must contain one or two items')
  }
  const seen = new Set()
  const variants = []
  for (const [index, variant] of value.entries()) {
    if (variant === null || typeof variant !== 'object') throw new Error(`variants[${index}] must be an object`)
    refuseUnknown(variant, VARIANT_FIELDS, `variants[${index}]`)
    const id = requireString(variant.id, `variants[${index}].id`, 40)
    if (seen.has(id)) throw new Error(`duplicate variant id: ${id}`)
    seen.add(id)
    const { html, source } = await readArtifact(variant, index, cwd)
    variants.push({
      id,
      label: variant.label === undefined ? basename(source) : requireString(variant.label, `variants[${index}].label`, 120),
      html,
      source,
      note: variant.note === undefined ? '' : requireString(variant.note, `variants[${index}].note`, 500),
      real: normaliseStrings(variant.real, `variants[${index}].real`, 500, 0),
      mocked: normaliseStrings(variant.mocked, `variants[${index}].mocked`, 500, 0),
      omitted: normaliseStrings(variant.omitted, `variants[${index}].omitted`, 500, 0),
    })
  }
  return variants
}

/**
 * Resolve one variant's artifact from the file it names.
 * @param {object} variant - the model's variant.
 * @param {number} index - its position, for diagnostics.
 * @param {string} cwd - directory for relative paths.
 * @returns {Promise<{html: string, source: string}>} the rendered document and its path.
 */
async function readArtifact(variant, index, cwd) {
  const requested = requireString(variant.path, `variants[${index}].path`, 2_000)
  const absolute = isAbsolute(requested) ? requested : resolve(cwd, requested)
  let bytes
  try {
    bytes = await readFile(absolute)
  } catch (cause) {
    throw new Error(`variants[${index}].path could not be read: ${absolute} (${cause.code ?? cause.message})`)
  }
  if (bytes.length > MAX_ARTIFACT_BYTES) {
    throw new Error(`variants[${index}].path is too large (max ${MAX_ARTIFACT_BYTES} bytes): ${absolute}`)
  }
  if (bytes.subarray(0, 8_192).includes(0)) {
    throw new Error(`variants[${index}].path is not a text file: ${absolute}`)
  }
  const text = bytes.toString('utf8')
  if (text.trim() === '') throw new Error(`variants[${index}].path is empty: ${absolute}`)
  const inside = !relative(cwd, absolute).startsWith('..')
  const source = inside ? relative(cwd, absolute).split('\\').join('/') : absolute
  return { html: renderArtifact({ path: source, text }), source }
}

/**
 * Find the directory relative artifact paths resolve against.
 * @param {object} ctx - the plugin context.
 * @param {object} exec - the tool execution.
 * @returns {string} the session working directory, or the process directory.
 */
function workingDirectoryOf(ctx, exec) {
  try {
    const cwd = ctx.get('sessions')?.get?.(exec.agent.id)?.header?.cwd
    if (typeof cwd === 'string' && cwd !== '') return cwd
  } catch {
    // The session store is unavailable; fall back to the process directory.
  }
  return process.cwd()
}

/**
 * Validate a string array and copy it.
 * @param {unknown} value - the candidate array.
 * @param {string} name - diagnostic name.
 * @param {number} maxLength - per-item cap.
 * @param {number} minItems - required length.
 * @returns {string[]} the clean array.
 */
function normaliseStrings(value, name, maxLength, minItems) {
  if (value === undefined) {
    if (minItems === 0) return []
    throw new Error(`${name} is required`)
  }
  if (!Array.isArray(value)) throw new Error(`${name} must be an array`)
  if (value.length < minItems) throw new Error(`${name} needs at least ${minItems} item${minItems === 1 ? '' : 's'}`)
  return value.map((item, index) => requireString(item, `${name}[${index}]`, maxLength))
}

/**
 * Refuse a field the schema does not declare.
 *
 * The registry hands the model's arguments over unvalidated, so a misspelled or
 * invented key would otherwise be dropped in silence instead of corrected.
 * @param {object} value - the candidate object.
 * @param {string[]} allowed - its declared fields.
 * @param {string} name - diagnostic name.
 * @returns {void}
 */
function refuseUnknown(value, allowed, name) {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) throw new Error(`${name}.${key} is not a field`)
  }
}

/**
 * Require a non-empty, bounded string.
 * @param {unknown} value - the candidate.
 * @param {string} name - diagnostic name.
 * @param {number} maxLength - maximum length.
 * @returns {string} the string.
 */
function requireString(value, name, maxLength) {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`${name} must be a non-empty string`)
  if (value.length > maxLength) throw new Error(`${name} is too long (max ${maxLength} characters)`)
  return value
}

/**
 * Register the HTTP surface used by the browser half.
 * @param {import('@deepseek-ai/cordis').Context} ctx - the plugin context.
 * @param {RoundStore} store - the shared round store.
 * @returns {() => void} the disposer.
 */
export function registerApi(ctx, store) {
  const dispose = ctx.webServer.register({
    kind: 'prefix',
    path: API_PREFIX,
    handler: async (req, res) => {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1')
      const route = url.pathname.slice(API_PREFIX.length) || '/'
      try {
        if (req.method === 'GET' && route === '/events') {
          store.subscribe(res)
          for (const round of store.openRounds()) sendEvent(res, 'round', round)
          return
        }
        if (req.method === 'GET' && route === '/round') {
          const id = url.searchParams.get('id') ?? ''
          const round = store.get(id)
          if (round === undefined) throw new HttpError(404, 'unknown-round', `unknown round: ${id}`)
          sendJson(res, 200, { round })
          return
        }
        if (req.method === 'GET' && route === '/rounds') {
          const sessionId = url.searchParams.get('sessionId') ?? ''
          const rounds = store
            .openRounds()
            .filter((round) => sessionId === '' || round.sessionId === sessionId)
          sendJson(res, 200, { rounds })
          return
        }
        if (req.method === 'GET' && route === '/health') {
          sendJson(res, 200, { ok: true, openRounds: store.openRounds().length })
          return
        }
        if (req.method === 'POST' && route === '/decide') {
          const body = await readBody(req)
          const roundId = requireString(body.roundId, 'roundId', 200)
          const verdict = requireVerdict(body.verdict, ['accept', 'revise', 'reject', 'cancel'])
          const round = store.requireOpen(roundId)
          const selected = body.selected === undefined ? undefined : requireString(body.selected, 'selected', 40)
          if (verdict === 'accept') {
            if (selected === undefined) throw new HttpError(400, 'bad-request', 'accept needs a selected variant')
            if (!round.variants.some((variant) => variant.id === selected)) {
              throw new HttpError(400, 'bad-request', `unknown variant: ${selected}`)
            }
          }
          const comments = normaliseComments(body.comments)
          const note = body.note === undefined || body.note === '' ? '' : requireString(body.note, 'note', 4_000)
          if ((verdict === 'revise' || verdict === 'reject') && comments.length === 0 && note === '') {
            throw new HttpError(400, 'bad-request', `${verdict} needs a comment or a note`)
          }
          const result = store.decide(roundId, { verdict, selected, comments, note })
          sendJson(res, 200, { ok: true, result })
          return
        }
        if (req.method === 'POST' && route === '/test') {
          const body = await readBody(req)
          const roundId = requireString(body.roundId, 'roundId', 200)
          const verdict = requireVerdict(body.verdict, ['pass', 'fail', 'blocked'])
          const observed = body.observed === undefined ? '' : requireString(body.observed, 'observed', 4_000)
          if (verdict !== 'pass' && observed === '') {
            throw new HttpError(400, 'bad-request', 'fail and blocked need an observation')
          }
          const result = store.test(roundId, { verdict, observed })
          sendJson(res, 200, { ok: true, result })
          return
        }
        throw new HttpError(404, 'not-found', `no route: ${route}`)
      } catch (error) {
        const status = error instanceof HttpError ? error.status : req.method === 'POST' ? 400 : 500
        const code = error instanceof HttpError ? error.code : req.method === 'POST' ? 'bad-request' : 'route-failed'
        const message = error instanceof Error ? error.message : String(error)
        sendJson(res, status, { error: { code, message } })
      }
    },
  })
  return () => {
    dispose()
    store.close()
  }
}

/**
 * Write one SSE frame.
 * @param {import('node:http').ServerResponse} res - the stream.
 * @param {string} event - the event name.
 * @param {object} data - the payload.
 * @returns {void}
 */
function sendEvent(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}

/**
 * Write one JSON response.
 * @param {import('node:http').ServerResponse} res - the response.
 * @param {number} status - the status code.
 * @param {object} body - the JSON body.
 * @returns {void}
 */
function sendJson(res, status, body) {
  const text = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(text),
  })
  res.end(text)
}

/**
 * Read a JSON object body with a size cap.
 * @param {import('node:http').IncomingMessage} req - the request.
 * @returns {Promise<Record<string, unknown>>} the parsed body.
 */
async function readBody(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    const buffer = /** @type {Buffer} */ (chunk)
    size += buffer.length
    if (size > 4 * 1024 * 1024) throw new HttpError(413, 'too-large', 'request body exceeds 4 MiB')
    chunks.push(buffer)
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  if (raw.trim() === '') return {}
  const parsed = JSON.parse(raw)
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new HttpError(400, 'bad-request', 'body must be a JSON object')
  }
  return parsed
}

/**
 * Read a verdict from an allowed set.
 * @param {unknown} value - the candidate.
 * @param {string[]} allowed - the accepted values.
 * @returns {string} the verdict.
 */
function requireVerdict(value, allowed) {
  if (typeof value !== 'string' || !allowed.includes(value)) {
    throw new HttpError(400, 'bad-request', `verdict must be one of: ${allowed.join(', ')}`)
  }
  return value
}

/**
 * Validate and copy comments.
 * @param {unknown} value - the candidate array.
 * @returns {{variantId?: string, text: string, anchor?: object, artifactHash?: string}[]} clean comments.
 */
function normaliseComments(value) {
  if (value === undefined) return []
  if (!Array.isArray(value)) throw new HttpError(400, 'bad-request', 'comments must be an array')
  if (value.length > 40) throw new HttpError(400, 'bad-request', 'too many comments (max 40)')
  return value.map((comment, index) => {
    if (comment === null || typeof comment !== 'object' || Array.isArray(comment)) {
      throw new HttpError(400, 'bad-request', `comments[${index}] must be an object`)
    }
    rejectUnknown(comment, ['variantId', 'text', 'anchor', 'artifactHash'], `comments[${index}]`)
    const clean = { text: requireString(comment.text, `comments[${index}].text`, 4_000) }
    if (comment.variantId !== undefined) {
      clean.variantId = requireString(comment.variantId, `comments[${index}].variantId`, 40)
    }
    if (comment.anchor !== undefined) {
      clean.anchor = normaliseAnchor(comment.anchor, `comments[${index}].anchor`)
    }
    if (comment.artifactHash !== undefined) {
      clean.artifactHash = requireString(comment.artifactHash, `comments[${index}].artifactHash`, 128)
    }
    return clean
  })
}

/**
 * Validate one anchor and copy only its known fields.
 * @param {unknown} value - the candidate anchor.
 * @param {string} name - diagnostic name.
 * @returns {object} a clean anchor.
 */
function normaliseAnchor(value, name) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpError(400, 'bad-request', `${name} must be an object`)
  }
  const kind = value.kind
  if (kind === 'variant') {
    rejectUnknown(value, ['kind'], name)
    return { kind: 'variant' }
  }
  if (kind === 'element') {
    rejectUnknown(value, ['kind', 'selector', 'text'], name)
    const anchor = {
      kind: 'element',
      selector: requireString(value.selector, `${name}.selector`, 500),
    }
    if (value.text !== undefined) anchor.text = optionalString(value.text, `${name}.text`, 500)
    return anchor
  }
  if (kind === 'text') {
    rejectUnknown(value, ['kind', 'quote', 'prefix', 'suffix'], name)
    const anchor = {
      kind: 'text',
      quote: requireString(value.quote, `${name}.quote`, 500),
    }
    if (value.prefix !== undefined) anchor.prefix = optionalString(value.prefix, `${name}.prefix`, 200)
    if (value.suffix !== undefined) anchor.suffix = optionalString(value.suffix, `${name}.suffix`, 200)
    return anchor
  }
  if (kind === 'line') {
    rejectUnknown(value, ['kind', 'path', 'start', 'end'], name)
    const start = positiveInteger(value.start, `${name}.start`)
    const end = positiveInteger(value.end, `${name}.end`)
    if (end < start) throw new HttpError(400, 'bad-request', `${name}.end must be at least ${name}.start`)
    return {
      kind: 'line',
      path: requireString(value.path, `${name}.path`, 500),
      start,
      end,
    }
  }
  throw new HttpError(400, 'bad-request', `${name}.kind must be one of: element, text, line, variant`)
}

/**
 * Refuse fields the anchor shape does not own.
 * @param {Record<string, unknown>} value - the candidate object.
 * @param {string[]} allowed - the field names.
 * @param {string} name - diagnostic name.
 * @returns {void}
 */
function rejectUnknown(value, allowed, name) {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) throw new HttpError(400, 'bad-request', `${name}.${key} is not allowed`)
  }
}

/**
 * Read an optional string and keep it bounded.
 * @param {unknown} value - the candidate.
 * @param {string} name - diagnostic name.
 * @param {number} maxLength - maximum length.
 * @returns {string} the string.
 */
function optionalString(value, name, maxLength) {
  if (typeof value !== 'string') throw new HttpError(400, 'bad-request', `${name} must be a string`)
  if (value.length > maxLength) throw new HttpError(400, 'bad-request', `${name} is too long (max ${maxLength} characters)`)
  return value
}

/**
 * Read a positive integer.
 * @param {unknown} value - the candidate.
 * @param {string} name - diagnostic name.
 * @returns {number} the integer.
 */
function positiveInteger(value, name) {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw new HttpError(400, 'bad-request', `${name} must be a positive integer`)
  }
  return value
}
