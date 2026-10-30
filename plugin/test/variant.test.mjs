import assert from 'node:assert/strict'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { normaliseVariants } from '../index.js'

/** Run a body with a throwaway project directory. */
async function withProject(body) {
  const root = await mkdtemp(join(tmpdir(), 'clarity-variants-'))
  try {
    await mkdir(join(root, 'docs'), { recursive: true })
    await writeFile(join(root, 'docs', 'a.html'), '<!doctype html><h1>From disk</h1>', 'utf8')
    await writeFile(join(root, 'docs', 'notes.md'), '# Notes\n\n- one\n', 'utf8')
    await writeFile(join(root, 'docs', 'pick.ts'), 'export const a = 1\nexport const b = 2\n', 'utf8')
    await writeFile(join(root, 'blank.md'), '   \n', 'utf8')
    await writeFile(join(root, 'blob.bin'), Buffer.from([1, 0, 2, 3]))
    await body(root)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

test('a variant reads its file and records the path it came from', async () => {
  await withProject(async (root) => {
    const [variant] = await normaliseVariants(
      [{ id: 'a', path: 'docs/a.html', note: 'The quieter one.' }],
      root,
    )
    assert.equal(variant.html, '<!doctype html><h1>From disk</h1>')
    assert.equal(variant.source, 'docs/a.html')
    assert.equal(variant.label, 'a.html', 'the label defaults to the file name')
    assert.equal(variant.note, 'The quieter one.')
    assert.deepEqual(variant.real, [])
  })
})

test('a Markdown file arrives as prose', async () => {
  await withProject(async (root) => {
    const [variant] = await normaliseVariants([{ id: 'a', path: 'docs/notes.md' }], root)
    assert.match(variant.html, /<h1>Notes<\/h1>/)
    assert.match(variant.html, /<ul><li>one<\/li><\/ul>/)
  })
})

test('a source file arrives as numbered source carrying its path', async () => {
  await withProject(async (root) => {
    const [variant] = await normaliseVariants([{ id: 'a', path: 'docs/pick.ts' }], root)
    assert.match(variant.html, /data-path="docs\/pick\.ts"/)
    assert.match(variant.html, /export const a = 1/)
  })
})

test('an absolute path inside the project is reported relative to it', async () => {
  await withProject(async (root) => {
    const [variant] = await normaliseVariants([{ id: 'a', path: join(root, 'docs', 'a.html') }], root)
    assert.equal(variant.source, 'docs/a.html')
  })
})

test('a variant that names no file is refused, and so is inline HTML', async () => {
  await assert.rejects(() => normaliseVariants([{ id: 'a', label: 'A' }]), /path must be a non-empty string/)
  await assert.rejects(
    () => normaliseVariants([{ id: 'a', html: '<h1>A</h1>' }], process.cwd()),
    /variants\[0\]\.html is not a field|path must be a non-empty string/,
  )
})

test('a field the schema does not declare is refused rather than dropped', async () => {
  await withProject(async (root) => {
    await assert.rejects(
      () => normaliseVariants([{ id: 'a', path: 'docs/a.html', source: 'docs/a.html' }], root),
      /variants\[0\]\.source is not a field/,
    )
  })
})

test('unreadable, empty, and binary files are refused', async () => {
  await withProject(async (root) => {
    await assert.rejects(
      () => normaliseVariants([{ id: 'a', path: 'docs/missing.html' }], root),
      /could not be read: .*missing\.html/,
    )
    await assert.rejects(() => normaliseVariants([{ id: 'a', path: 'blank.md' }], root), /is empty/)
    await assert.rejects(() => normaliseVariants([{ id: 'a', path: 'blob.bin' }], root), /is not a text file/)
  })
})
