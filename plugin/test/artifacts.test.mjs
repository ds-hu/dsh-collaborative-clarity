import assert from 'node:assert/strict'
import test from 'node:test'

import { renderArtifact, renderMarkdown, sourceDocument } from '../artifacts.js'

test('an HTML file passes through untouched', () => {
  const html = '<!doctype html><h1>Hi</h1>'
  assert.equal(renderArtifact({ path: 'a/b.html', text: html }), html)
})

test('Markdown becomes prose', () => {
  const markdown = [
    '# Title',
    '',
    'Intro with **bold**, *lean*, and `code`.',
    '',
    '- one',
    '- two',
    '',
    '```ts',
    'const x = 1 < 2',
    '```',
  ].join('\n')
  const out = renderMarkdown(markdown)
  assert.match(out, /<h1>Title<\/h1>/)
  assert.match(out, /<strong>bold<\/strong>/)
  assert.match(out, /<em>lean<\/em>/)
  assert.match(out, /<code>code<\/code>/)
  assert.match(out, /<ul><li>one<\/li><li>two<\/li><\/ul>/)
  assert.match(out, /<pre><code>const x = 1 &lt; 2<\/code><\/pre>/)
})

test('Markdown never lets raw HTML through', () => {
  const out = renderMarkdown('<img src=x onerror=alert(1)>')
  assert.equal(out.includes('<img'), false)
  assert.match(out, /&lt;img/)
})

test('a source file keeps one text node per line, so a click maps to a line', () => {
  const text = 'export const a = 1\n\nexport const b = 2\n'
  const out = sourceDocument(text, 'src/x.ts')
  const lines = [...out.matchAll(/<span class="l">([\s\S]*?)\n<\/span>/g)].map((match) => match[1])
  assert.deepEqual(lines, ['export const a = 1', '', 'export const b = 2'])
  assert.match(out, /data-path="src\/x\.ts"/)
  assert.match(out, /data-line-start="1"/)
  assert.match(out, /counter-increment:line/)
})

test('the gutter is a counter, never literal text that would shift every anchor', () => {
  const out = sourceDocument('a\nb\n', 'x.py')
  assert.equal(/<span class="l">\d/.test(out), false)
  assert.equal(out.includes('>1<'), false)
})

test('a file with no extension still becomes source, keeping its path', () => {
  const out = renderArtifact({ path: 'Makefile', text: 'all:\n\techo hi\n' })
  assert.match(out, /<pre data-path="Makefile"/)
})

test('a path with quotes or angle brackets cannot break out of the attribute', () => {
  const out = sourceDocument('x\n', 'a"b<c.html')
  assert.equal(out.includes('a"b<c'), false)
  assert.match(out, /data-path="a&quot;b&lt;c\.html"/)
})
