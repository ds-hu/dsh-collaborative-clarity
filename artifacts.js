/**
 * Artifact documents — turn a resolved file into the HTML the panel shows.
 *
 * Every variant reaches the panel as one self-contained HTML string rendered in
 * a sandboxed iframe with the annotation bridge injected. What differs is how
 * the file on disk becomes that string: a document passes through unchanged,
 * Markdown is converted to prose, and anything else becomes numbered source.
 *
 * The source wrapper is not only a look. The bridge turns a click into a line
 * anchor by dividing the click offset by the line height, adding
 * `data-line-start`, and clamping the result with the newline count of
 * `pre.textContent`. So the wrapper keeps exactly one text node per source
 * line, each ending in a newline, and draws the gutter with a CSS counter,
 * which never enters `textContent`.
 */

import MarkdownIt from 'markdown-it'

/** Extensions shown as a document, unchanged. */
const DOCUMENT = new Set(['html', 'htm', 'svg'])

/** Extensions converted to prose. */
const PROSE = new Set(['md', 'markdown', 'mdown'])

/**
 * Read a file extension in lower case.
 * @param {string} path - the artifact path.
 * @returns {string} the extension without its dot, or ''.
 */
export function extensionOf(path) {
  const name = path.split(/[\\/]/).pop() ?? ''
  const dot = name.lastIndexOf('.')
  return dot <= 0 ? '' : name.slice(dot + 1).toLowerCase()
}

/**
 * Render one file as the document a variant carries.
 * @param {{path: string, text: string}} input - the artifact path and its text.
 * @returns {string} a complete HTML document.
 */
export function renderArtifact({ path, text }) {
  const extension = extensionOf(path)
  if (DOCUMENT.has(extension)) return text
  if (PROSE.has(extension)) return proseDocument(text)
  return sourceDocument(text, path)
}

/**
 * Wrap one line-numbered source file.
 * @param {string} text - the file text.
 * @param {string} path - the path shown on anchors.
 * @returns {string} a complete HTML document.
 */
export function sourceDocument(text, path) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  if (lines[lines.length - 1] === '') lines.pop()
  const body = lines
    .map((line) => `<span class="l">${escapeHtml(line)}\n</span>`)
    .join('')
  return document(
    [
      'body{margin:0;background:var(--bg);color:var(--ink)}',
      'pre{margin:0;padding:10px 12px 12px;overflow-x:auto;font:11px/1.65 ' + MONO + ';tab-size:2}',
      'pre .l::before{counter-increment:line;content:counter(line);display:inline-block;width:2.2em;margin-right:.7em;text-align:right;color:var(--dim)}',
      'pre{counter-reset:line}',
    ].join(''),
    `<pre data-path="${escapeAttribute(path)}" data-line-start="1">${body}</pre>`,
  )
}

/**
 * Convert Markdown to the prose document a variant carries.
 * @param {string} text - the Markdown source.
 * @returns {string} a complete HTML document.
 */
export function proseDocument(text) {
  return document(
    [
      'body{margin:0;max-width:720px;background:var(--bg);color:var(--ink);font:13px/1.6 ui-sans-serif,-apple-system,"Segoe UI",Roboto,sans-serif}',
      'div{padding:14px 14px 22px}',
      'h1,h2,h3,h4,h5,h6{margin:18px 0 6px;line-height:1.25;letter-spacing:-.01em}',
      'h1{font-size:19px}h2{font-size:16px}h3{font-size:13px}h4,h5,h6{font-size:11px;font-family:' + MONO + ';letter-spacing:.08em;text-transform:uppercase;color:var(--dim)}',
      'div>:first-child{margin-top:0}',
      'p{margin:0 0 8px}ul,ol{margin:0 0 8px;padding-left:18px}li{margin:0 0 3px}li::marker{color:var(--acc)}',
      'code{font:11px/1.5 ' + MONO + ';background:var(--chip);border-radius:4px;padding:1px 4px}',
      'pre{margin:0 0 10px;overflow-x:auto;border:1px solid var(--line);border-radius:6px;background:var(--chip);padding:8px 10px}',
      'pre code{background:none;padding:0;font-size:10.5px;line-height:1.65}',
      'blockquote{margin:0 0 10px;padding-left:10px;border-left:2px solid var(--acc);color:var(--dim)}',
      'table{margin:0 0 12px;border-collapse:collapse;width:100%;font-size:12px}',
      'th,td{border:1px solid var(--line);padding:4px 8px;vertical-align:top;text-align:left}',
      'th{background:var(--chip);font-weight:600}',
      'a{color:var(--acc)}hr{border:0;border-top:1px solid var(--line);margin:14px 0}',
    ].join(''),
    `<div>${renderMarkdown(text)}</div>`,
  )
}

/**
 * The engine. Raw HTML stays escaped (`html: false`), so a file can never inject
 * elements into the panel, and markdown-it drops `javascript:`, `vbscript:`, and
 * `file:` destinations before they can reach an `href`.
 */
const markdown = new MarkdownIt({ html: false, linkify: true })

/**
 * An image would make the sandboxed document fetch something, so it becomes a
 * link to its source labelled with its alt text: the document stays network-free.
 */
markdown.renderer.rules.image = (tokens, index) => {
  const token = tokens[index]
  const source = token.attrGet('src') ?? ''
  const label = (token.content || '').trim() || source
  return `<a href="${escapeAttribute(source)}" rel="noreferrer">${escapeHtml(label)}</a>`
}

/**
 * Render Markdown as the HTML the prose document carries: CommonMark blocks and
 * inline syntax, plus GFM tables, strikethrough, and bare-URL links.
 * @param {string} text - the Markdown source.
 * @returns {string} HTML fragments.
 */
export function renderMarkdown(text) {
  return markdown.render(text)
}

/** The monospace stack, repeated by every generated document. */
const MONO = 'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace'

/**
 * Wrap a body and its rules in a complete, network-free document.
 * @param {string} rules - CSS declarations.
 * @param {string} content - the body.
 * @returns {string} a complete HTML document.
 */
function document(rules, content) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
:root{color-scheme:light dark;--bg:#fff;--ink:#15171c;--dim:#6b7280;--line:#e6e8ec;--acc:#2b6ae8;--chip:#f4f5f7}
@media (prefers-color-scheme:dark){:root{--bg:#12141a;--ink:#e7e9ef;--dim:#98a0ae;--line:#242832;--acc:#6aa8ff;--chip:#1b1f28}}
*{box-sizing:border-box}${rules}
</style></head>
<body>${content}</body></html>`
}

/**
 * Escape text for HTML bodies.
 * @param {string} text - raw text.
 * @returns {string} escaped text.
 */
export function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Escape text for a double-quoted attribute.
 * @param {string} text - raw text.
 * @returns {string} escaped text.
 */
function escapeAttribute(text) {
  return escapeHtml(text).replace(/"/g, '&quot;')
}
