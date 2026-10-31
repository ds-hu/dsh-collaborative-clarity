import assert from 'node:assert/strict'
import test from 'node:test'

import { proseDocument, renderArtifact, renderMarkdown, sourceDocument } from '../artifacts.js'

test('an HTML file passes through untouched', () => {
  const html = '<!doctype html><h1>Hi</h1>'
  assert.equal(renderArtifact({ path: 'a/b.html', text: html }), html)
})

test('an SVG file is a document, not source', () => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg"><rect width="8" height="8"/></svg>'
  assert.equal(renderArtifact({ path: 'icon.svg', text: svg }), svg)
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
  assert.match(out, /<ul>\s*<li>one<\/li>\s*<li>two<\/li>\s*<\/ul>/)
  assert.match(out, /<pre><code class="language-ts">const x = 1 &lt; 2\n<\/code><\/pre>/)
})

test('Markdown never lets raw HTML through', () => {
  const out = renderMarkdown('<img src=x onerror=alert(1)>')
  assert.equal(out.includes('<img'), false)
  assert.match(out, /&lt;img/)
})

test('a GFM table becomes a real table, and a column keeps its alignment', () => {
  const out = renderMarkdown(
    ['| Step | Expected | Rollback |', '| --- | :---: | --- |', '| open the tab | a ring | close it |'].join('\n'),
  )
  assert.match(out, /<table>/)
  assert.match(out, /<thead>/)
  assert.match(out, /<th>Step<\/th>/)
  assert.match(out, /<th style="text-align:center">Expected<\/th>/)
  assert.match(out, /<td>open the tab<\/td>/)
  assert.match(out, /<td style="text-align:center">a ring<\/td>/)
})

test('a table row needs its delimiter row, or it stays prose', () => {
  const out = renderMarkdown('| a | b |\n| c | d |')
  assert.equal(out.includes('<table>'), false)
})

test('an escaped pipe stays inside its cell', () => {
  const out = renderMarkdown('| a \\| b | c |\n| --- | --- |\n| d | e |')
  assert.match(out, /<th>a \| b<\/th>/)
})

test('a table cell cannot smuggle HTML', () => {
  const out = renderMarkdown('| a |\n| --- |\n| <b>x</b> |')
  assert.equal(out.includes('<b>'), false)
  assert.match(out, /&lt;b&gt;x&lt;\/b&gt;/)
})

test('the prose document carries the rules its table needs', () => {
  const doc = proseDocument('| a |\n| --- |\n| b |')
  assert.match(doc, /<table>/)
  assert.match(doc, /th,td\{border:1px solid/)
})

test('an image becomes a link, so the document fetches nothing', () => {
  const out = renderMarkdown('![a diagram](https://example.com/d.png)')
  assert.equal(out.includes('<img'), false)
  assert.match(out, /<a href="https:\/\/example\.com\/d\.png"[^>]*>a diagram<\/a>/)
})

test('a link to a script scheme stays text', () => {
  const out = renderMarkdown('[click](javascript:alert(1))')
  assert.equal(out.includes('href="javascript'), false)
  assert.match(out, /\[click\]/)
})

test('a bare URL becomes a link, and a nested list keeps its level', () => {
  const out = renderMarkdown('see https://example.com/x\n\n1. a\n   - b')
  assert.match(out, /<a href="https:\/\/example\.com\/x">/)
  assert.match(out, /<ol>\s*<li>a\s*<ul>\s*<li>b<\/li>/)
})

test('GFM strikethrough renders as a strike, not as tildes', () => {
  const out = renderMarkdown('~~gone~~')
  assert.match(out, /<s>gone<\/s>/)
  assert.equal(out.includes('~~'), false)
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
