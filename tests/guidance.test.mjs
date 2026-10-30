import assert from 'node:assert/strict'
import test from 'node:test'

import { GUIDANCE_ORDER, GUIDANCE_SECTION, GUIDANCE_TEXT, registerGuidance } from '../index.js'

/** A context that records the section it is given. */
function recordingContext() {
  const seen = { section: undefined }
  return {
    seen,
    ctx: {
      get: (name) =>
        name === 'systemPrompt'
          ? {
              section(section) {
                seen.section = section
                return () => {
                  seen.disposed = true
                }
              },
            }
          : undefined,
    },
  }
}

test('the timing rule is one section in the policy region', () => {
  const { ctx, seen } = recordingContext()
  const dispose = registerGuidance(ctx)
  assert.equal(seen.section.name, GUIDANCE_SECTION)
  assert.equal(seen.section.order, GUIDANCE_ORDER)
  assert.ok(GUIDANCE_ORDER > 2900 && GUIDANCE_ORDER < 3000, 'it sits among the tool sections')
  assert.equal(typeof dispose, 'function')
  dispose()
  assert.equal(seen.disposed, true, 'unloading the plugin retracts the section')
})

test('the published text names the trigger, the restraint, and no prompt variable', () => {
  assert.match(GUIDANCE_TEXT, /clarity_round/)
  assert.match(GUIDANCE_TEXT, /before writing any implementation/)
  assert.match(GUIDANCE_TEXT, /finish the work and report/)
  assert.match(GUIDANCE_TEXT, /One decision per round/)
  assert.equal(GUIDANCE_TEXT.includes('{{'), false, 'a strict variable reference would fail the render')
})

test('a composition without the prompt service keeps the tools', () => {
  const dispose = registerGuidance({ get: () => undefined })
  assert.equal(typeof dispose, 'function')
  assert.equal(dispose(), undefined)
})
