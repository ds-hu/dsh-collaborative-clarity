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

/** Extensions shown as a document, unchanged. */
const DOCUMENT = new Set(['html', 'htm'])

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
      'a{color:var(--acc)}hr{border:0;border-top:1px solid var(--line);margin:14px 0}',
    ].join(''),
    `<div>${renderMarkdown(text)}</div>`,
  )
}

/**
 * Render the Markdown subset a review needs: headings, lists, quotes, rules,
 * fenced code, and inline code, bold, italic, and links.
 * @param {string} text - the Markdown source.
 * @returns {string} HTML fragments.
 */
export function renderMarkdown(text) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  const out = []
  let index = 0
  while (index < lines.length) {
    const line = lines[index]
    if (line.trim() === '') {
      index += 1
      continue
    }

    const fence = /^\s{0,3}(`{3,}|~{3,})/.exec(line)
    if (fence) {
      const marker = fence[1][0]
      const code = []
      index += 1
      while (index < lines.length && !new RegExp(`^\\s{0,3}${marker}{3,}\\s*$`).test(lines[index])) {
        code.push(lines[index])
        index += 1
      }
      index += 1
      out.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`)
      continue
    }

    const heading = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line)
    if (heading) {
      const level = heading[1].length
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`)
      index += 1
      continue
    }

    if (/^\s{0,3}([-*_])(\s*\1){2,}\s*$/.test(line)) {
      out.push('<hr>')
      index += 1
      continue
    }

    if (/^\s{0,3}>/.test(line)) {
      const quoted = []
      while (index < lines.length && /^\s{0,3}>/.test(lines[index])) {
        quoted.push(lines[index].replace(/^\s{0,3}>\s?/, ''))
        index += 1
      }
      out.push(`<blockquote>${renderMarkdown(quoted.join('\n'))}</blockquote>`)
      continue
    }

    const bullet = /^\s{0,3}([-*+]|\d+[.)])\s+(.*)$/.exec(line)
    if (bullet) {
      const ordered = /\d/.test(bullet[1])
      const pattern = ordered ? /^\s{0,3}\d+[.)]\s+(.*)$/ : /^\s{0,3}[-*+]\s+(.*)$/
      const items = []
      let current = null
      while (index < lines.length) {
        const item = pattern.exec(lines[index])
        if (item) {
          current = [item[1].trim()]
          items.push(current)
          index += 1
          continue
        }
        if (current !== null && /^\s{2,}\S/.test(lines[index])) {
          current.push(lines[index].trim())
          index += 1
          continue
        }
        if (lines[index].trim() === '') {
          let peek = index + 1
          while (peek < lines.length && lines[peek].trim() === '') peek += 1
          const next = lines[peek]
          if (next !== undefined && (pattern.test(next) || /^\s{2,}\S/.test(next))) {
            index = peek
            continue
          }
        }
        break
      }
      const tag = ordered ? 'ol' : 'ul'
      out.push(`<${tag}>${items.map((parts) => `<li>${inline(parts.join(' '))}</li>`).join('')}</${tag}>`)
      continue
    }

    const paragraph = []
    while (index < lines.length && lines[index].trim() !== '' && !startsBlock(lines[index])) {
      paragraph.push(lines[index].trim())
      index += 1
    }
    if (paragraph.length > 0) out.push(`<p>${inline(paragraph.join(' '))}</p>`)
  }
  return out.join('\n')
}

/**
 * Whether a line opens a block rather than continuing a paragraph.
 * @param {string} line - one Markdown line.
 * @returns {boolean} true when a block starts here.
 */
function startsBlock(line) {
  return /^\s{0,3}(#{1,6}\s|>|[-*+]\s|\d+[.)]\s|`{3,}|~{3,}|([-*_])(\s*\2){2,}\s*$)/.test(line)
}

/**
 * Apply inline Markdown to one line of already-escaped text.
 * @param {string} text - raw Markdown text.
 * @returns {string} HTML with inline formatting.
 */
function inline(text) {
  let out = escapeHtml(text)
  out = out.replace(/`([^`]+)`/g, (_match, code) => `<code>${code}</code>`)
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, label, href) =>
    /^\s*(javascript|data|vbscript):/i.test(href) ? match : `<a href="${href}" rel="noreferrer">${label}</a>`,
  )
  return out
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
