import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { normaliseVariants } from '../index.js'

/** Run a body with a throwaway project directory. */
async function withProject(body) {
  const root = await mkdtemp(join(tmpdir(), 'clarity-variants-'))
  try {
    await mkdir(join(root, 'docs', 'rounds'), { recursive: true })
    await writeFile(join(root, 'docs', 'rounds', 'a.html'), '<!doctype html><h1>From disk</h1>', 'utf8')
    await body(root)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

test('a variant reads its document from a file and records where it came from', async () => {
  await withProject(async (root) => {
    const [variant] = await normaliseVariants(
      [{ id: 'a', path: 'docs/rounds/a.html', note: 'The quieter one.' }],
      root,
    )
    assert.equal(variant.html, '<!doctype html><h1>From disk</h1>')
    assert.equal(variant.source, 'docs/rounds/a.html')
    assert.equal(variant.label, 'a.html', 'the label defaults to the file name')
    assert.equal(variant.note, 'The quieter one.')
    assert.deepEqual(variant.real, [])
  })
})

test('an absolute path inside the project is read and reported relative to it', async () => {
  await withProject(async (root) => {
    const absolute = join(root, 'docs', 'rounds', 'a.html')
    const [variant] = await normaliseVariants([{ id: 'a', path: absolute, label: 'A' }], root)
    assert.equal(variant.html, '<!doctype html><h1>From disk</h1>')
    assert.equal(variant.source, 'docs/rounds/a.html')
    assert.equal(variant.label, 'A')
  })
})

test('an inline document still works and carries no source', async () => {
  const [variant] = await normaliseVariants([{ id: 'a', label: 'A', html: '<h1>A</h1>' }], process.cwd())
  assert.equal(variant.html, '<h1>A</h1>')
  assert.equal('source' in variant, false)
})

test('a variant that gives both or neither document is refused', async () => {
  await assert.rejects(() => normaliseVariants([{ id: 'a', html: '<h1>A</h1>', path: 'a.html' }]), /exactly one of html and path/)
  await assert.rejects(() => normaliseVariants([{ id: 'a', label: 'A' }]), /exactly one of html and path/)
})

test('an unreadable or empty file fails with the resolved path in the message', async () => {
  await withProject(async (root) => {
    await assert.rejects(
      () => normaliseVariants([{ id: 'a', path: 'docs/rounds/missing.html' }], root),
      /could not be read: .*missing\.html/,
    )
    await writeFile(join(root, 'blank.html'), '   \n', 'utf8')
    await assert.rejects(() => normaliseVariants([{ id: 'a', path: 'blank.html' }], root), /is empty/)
  })
})
