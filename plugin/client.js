window.__ModuleLoader__.load({
  id: 'dsh-collaborative-clarity',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const KIND = 'clarity'
    const TAB_ID = 'dsh-collaborative-clarity'
    const API = '/clarity/api'

    const HAIRLINE = '0.5px solid var(--dsw-alias-border-l2)'
    const MUTED = 'var(--dsw-alias-label-tertiary)'
    const ERROR = 'var(--dsw-alias-state-error-primary)'
    const BRAND = 'var(--dsw-alias-brand-primary, var(--dsw-alias-label-primary))'
    const FONT = 'var(--dsw-font-family, ui-sans-serif, system-ui, "Segoe UI", sans-serif)'
    const MONO = 'var(--ds-font-family-code, ui-monospace, Consolas, monospace)'

    const root = {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      flex: '1 1 auto',
      minHeight: 0,
      overflowY: 'auto',
      padding: '10px 12px 18px',
      fontFamily: FONT,
      fontSize: '12px',
      lineHeight: '18px',
      color: 'var(--dsw-alias-label-primary)',
    }
    const eyebrow = {
      color: MUTED,
      fontSize: '10px',
      lineHeight: '15px',
      fontWeight: 650,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    }
    const title = { margin: '2px 0 0', fontSize: '16px', lineHeight: '22px', fontWeight: 650 }
    const context = { margin: 0, color: 'var(--dsw-alias-label-secondary)' }
    const meta = { display: 'flex', flexWrap: 'wrap', gap: '4px 12px', color: 'var(--dsw-alias-label-secondary)' }
    const section = { display: 'flex', flexDirection: 'column', gap: '6px' }
    const sectionTitle = {
      color: MUTED,
      fontSize: '10px',
      lineHeight: '15px',
      fontWeight: 650,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
    }
    const card = {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      padding: '8px',
      background: 'var(--dsw-alias-bg-layer-1)',
      border: HAIRLINE,
      borderRadius: 'var(--dsw-radius-md)',
    }
    const variantCard = {
      ...card,
      minWidth: 0,
      cursor: 'pointer',
      overflow: 'hidden',
      padding: 0,
      outline: 'none',
    }
    const variantGrid = {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
      gap: '8px',
    }
    const vhead = {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '7px 8px',
      borderBottom: HAIRLINE,
      minWidth: 0,
    }
    const radio = { color: BRAND, fontSize: '13px', lineHeight: '13px', flex: 'none' }
    const vlabel = { fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
    const badge = {
      marginLeft: 'auto',
      flex: 'none',
      color: BRAND,
      border: '0.5px solid var(--dsw-alias-border-l2)',
      borderRadius: '99px',
      padding: '0 6px',
      fontSize: '10px',
      lineHeight: '16px',
      whiteSpace: 'nowrap',
    }
    const frame = {
      width: '100%',
      height: '300px',
      border: 0,
      display: 'block',
      background: '#fff',
    }
    const fidelity = { padding: '6px 8px', color: MUTED, fontSize: '10px', lineHeight: '15px' }
    const buttonBase = {
      font: 'inherit',
      fontSize: '12px',
      lineHeight: '18px',
      padding: '5px 10px',
      borderRadius: 'var(--dsw-radius-md)',
      border: HAIRLINE,
      background: 'var(--dsw-alias-bg-layer-2)',
      color: 'var(--dsw-alias-label-primary)',
      cursor: 'pointer',
    }
    const buttonPrimary = {
      ...buttonBase,
      background: 'var(--dsw-alias-label-primary)',
      borderColor: 'var(--dsw-alias-label-primary)',
      color: 'var(--dsw-alias-bg-base)',
      fontWeight: 600,
    }
    const buttonDanger = { ...buttonBase, color: ERROR }
    const buttonDisabled = { opacity: 0.45, cursor: 'default' }
    const input = {
      font: 'inherit',
      width: '100%',
      boxSizing: 'border-box',
      padding: '5px 7px',
      border: HAIRLINE,
      borderRadius: 'var(--dsw-radius-sm)',
      background: 'var(--dsw-alias-bg-base)',
      color: 'var(--dsw-alias-label-primary)',
      outline: 'none',
    }
    const actions = { display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }
    const commentItem = {
      display: 'flex',
      gap: '6px',
      alignItems: 'flex-start',
      padding: '5px 7px',
      border: HAIRLINE,
      borderRadius: 'var(--dsw-radius-sm)',
      background: 'var(--dsw-alias-bg-layer-1)',
    }
    const commentVariant = { flex: 'none', color: BRAND, fontWeight: 600, fontSize: '10px', lineHeight: '16px' }
    const annotationBar = {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      flexWrap: 'wrap',
      padding: '6px 8px',
      background: 'var(--dsw-alias-bg-layer-1)',
      border: HAIRLINE,
      borderRadius: 'var(--dsw-radius-md)',
    }
    const anchorTag = {
      display: 'inline-flex',
      alignItems: 'center',
      minWidth: 0,
      maxWidth: '100%',
      padding: '0 6px',
      border: '0.5px solid var(--dsw-alias-border-l2)',
      borderRadius: '99px',
      color: 'var(--dsw-alias-label-secondary)',
      fontSize: '10px',
      lineHeight: '17px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }
    const linkButton = {
      font: 'inherit',
      fontSize: '10px',
      lineHeight: '16px',
      padding: 0,
      border: 0,
      background: 'transparent',
      color: MUTED,
      cursor: 'pointer',
      textDecoration: 'underline',
      textUnderlineOffset: '2px',
    }
    const errorText = { color: ERROR }
    const successText = { color: 'var(--dsw-alias-state-success-primary)' }
    const pill = {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0 5px',
      borderRadius: '99px',
      background: 'var(--dsw-alias-bg-layer-2)',
      color: 'var(--dsw-alias-label-secondary)',
      fontSize: '10px',
      lineHeight: '16px',
      whiteSpace: 'nowrap',
    }
    const list = { margin: 0, paddingLeft: '18px', color: 'var(--dsw-alias-label-secondary)' }
    const pre = {
      margin: 0,
      padding: '7px 8px',
      background: 'var(--dsw-alias-bg-base)',
      border: HAIRLINE,
      borderRadius: 'var(--dsw-radius-sm)',
      fontFamily: MONO,
      fontSize: '11px',
      lineHeight: '16px',
      whiteSpace: 'pre-wrap',
      overflowWrap: 'anywhere',
    }

    function ClarityIcon(props) {
      const size = props && props.size ? props.size : 14
      return h(
        'svg',
        {
          viewBox: '0 0 24 24',
          width: size,
          height: size,
          fill: 'none',
          'aria-hidden': true,
          style: { display: 'block', flex: 'none' },
        },
        h('path', {
          d: 'M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.6 3.4c-.5.4-1.4 0-1.4-.7V5.5Z',
          stroke: 'currentColor',
          strokeWidth: 1.5,
          strokeLinejoin: 'round',
        }),
        h('circle', { cx: 9, cy: 10, r: 1, fill: 'currentColor' }),
        h('circle', { cx: 12, cy: 10, r: 1, fill: 'currentColor' }),
        h('circle', { cx: 15, cy: 10, r: 1, fill: 'currentColor' }),
      )
    }

    async function api(path, init) {
      const response = await fetch(API + path, {
        ...init,
        headers: { 'content-type': 'application/json', ...(init && init.headers ? init.headers : {}) },
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok || (body && body.error)) {
        const message = body && body.error && body.error.message ? body.error.message : `request failed (${response.status})`
        throw new Error(message)
      }
      return body
    }

    function variantLabel(round, id) {
      if (!id) return 'Round'
      const found = round.variants.find((variant) => variant.id === id)
      return found ? found.label : id
    }

    function contentHash(html) {
      let hash = 2166136261
      for (let i = 0; i < html.length; i += 1) {
        hash ^= html.charCodeAt(i)
        hash = Math.imul(hash, 16777619)
      }
      return (hash >>> 0).toString(16).padStart(8, '0')
    }

    function shortText(value, limit) {
      const text = String(value || '').trim()
      return text.length > limit ? text.slice(0, limit - 1) + '…' : text
    }

    function anchorLabel(anchor) {
      if (!anchor || anchor.kind === 'variant') return 'Whole variant'
      if (anchor.kind === 'element') {
        return anchor.text ? 'Element · ' + shortText(anchor.text, 42) : 'Element · ' + shortText(anchor.selector, 42)
      }
      if (anchor.kind === 'text') return '“' + shortText(anchor.quote, 40) + '”'
      if (anchor.kind === 'line') {
        return anchor.start === anchor.end ? 'Line ' + anchor.start : 'Lines ' + anchor.start + '–' + anchor.end
      }
      return 'Anchor'
    }

    function isAnchor(anchor) {
      if (!anchor || typeof anchor !== 'object' || Array.isArray(anchor)) return false
      if (anchor.kind === 'variant') return true
      if (anchor.kind === 'element') {
        return typeof anchor.selector === 'string' && anchor.selector !== '' && anchor.selector.length <= 500
      }
      if (anchor.kind === 'text') {
        return typeof anchor.quote === 'string' && anchor.quote !== '' && anchor.quote.length <= 500
      }
      if (anchor.kind === 'line') {
        return (
          typeof anchor.path === 'string' &&
          anchor.path !== '' &&
          Number.isInteger(anchor.start) &&
          Number.isInteger(anchor.end) &&
          anchor.start >= 1 &&
          anchor.end >= anchor.start
        )
      }
      return false
    }

    function safeJson(value) {
      return JSON.stringify(value).replace(/</g, '\\u003c')
    }

    function withBridge(html, variantId) {
      const config = '<script>window.__CLARITY_VARIANT__=' + safeJson(variantId) + ';</script>'
      const bridge = '<script>(' + clarityBridge.toString() + ')();</script>'
      const injection = config + bridge
      const close = html.toLowerCase().lastIndexOf('</body>')
      if (close === -1) return html + injection
      return html.slice(0, close) + injection + html.slice(close)
    }

    /**
     * Runs inside the sandboxed artifact iframe. It must stay self-contained: the
     * client half has no build step, so this function is serialised with toString().
     */
    // clarity-bridge:start
    function clarityBridge() {
      var variantId = window.__CLARITY_VARIANT__ || ''
      var enabled = false
      var hovered = null
      var suppressClick = false
      var lastLine = null
      var highlightTimer = null
      var pressed = false
      var dragged = false
      var pressX = 0
      var pressY = 0

      function send(payload) {
        payload.__clarity = true
        payload.variantId = variantId
        try {
          parent.postMessage(payload, '*')
        } catch (error) {
          // The tab was torn down mid-message.
        }
      }

      function cssEscape(value) {
        if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(String(value))
        return String(value).replace(/["\\]/g, '\\$&')
      }

      function selectorFor(element) {
        if (!element || element.nodeType !== 1) return ''
        var anchored = element.closest('[data-anchor], [data-clarity-anchor]')
        if (anchored) {
          var name = anchored.hasAttribute('data-anchor') ? 'data-anchor' : 'data-clarity-anchor'
          return '[' + name + '="' + cssEscape(anchored.getAttribute(name)) + '"]'
        }
        if (element.id && document.querySelectorAll('#' + cssEscape(element.id)).length === 1) {
          return '#' + cssEscape(element.id)
        }
        var parts = []
        var node = element
        while (node && node.nodeType === 1 && node !== document.body) {
          var tag = node.tagName.toLowerCase()
          var parentElement = node.parentElement
          if (!parentElement) break
          var index = 1
          var sibling = node
          while ((sibling = sibling.previousElementSibling)) {
            if (sibling.tagName === node.tagName) index += 1
          }
          parts.unshift(tag + ':nth-of-type(' + index + ')')
          node = parentElement
        }
        return parts.length === 0 ? 'body' : 'body > ' + parts.join(' > ')
      }

      function elementAnchor(target) {
        if (!target || target.nodeType !== 1) return null
        var element =
          target.closest(
            '[data-anchor], [data-clarity-anchor], button, a, input, select, textarea, h1, h2, h3, h4, p, li, td, th, label, [role="button"]',
          ) || target
        if (element === document.body || element === document.documentElement) return null
        var selector = selectorFor(element)
        if (!selector) return null
        var text = String(element.innerText || element.textContent || '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 120)
        return { kind: 'element', selector: selector, text: text }
      }

      function textAnchor() {
        var selection = window.getSelection ? window.getSelection() : null
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null
        var quote = String(selection.toString() || '')
          .replace(/\s+/g, ' ')
          .trim()
        if (quote === '') return null
        var range = selection.getRangeAt(0)
        var container = range.commonAncestorContainer
        var element = container.nodeType === 1 ? container : container.parentElement
        if (!element) return null
        var full = String(element.textContent || '').replace(/\s+/g, ' ')
        var at = full.indexOf(quote)
        return {
          kind: 'text',
          quote: quote.slice(0, 300),
          prefix: at > 0 ? full.slice(Math.max(0, at - 40), at) : '',
          suffix: at >= 0 ? full.slice(at + quote.length, at + quote.length + 40) : '',
        }
      }

      function lineAnchor(event, target) {
        var pre = target && target.closest ? target.closest('pre') : null
        if (!pre) return null
        var rect = pre.getBoundingClientRect()
        var style = window.getComputedStyle(pre)
        var lineHeight = parseFloat(style.lineHeight)
        if (!isFinite(lineHeight) || lineHeight <= 0) lineHeight = (parseFloat(style.fontSize) || 14) * 1.5
        var padTop = parseFloat(style.paddingTop) || 0
        var offset = event.clientY - rect.top - padTop
        var line = Math.max(1, Math.floor(offset / lineHeight) + 1)
        var total = String(pre.textContent || '').split('\n').length
        line = Math.min(line, Math.max(1, total))
        var base = parseInt(pre.getAttribute('data-line-start') || '1', 10)
        if (!isFinite(base) || base < 1) base = 1
        var start = base + line - 1
        var end = start
        var path = pre.getAttribute('data-path') || selectorFor(pre) || 'code'
        if (event.shiftKey && lastLine && lastLine.path === path) {
          start = Math.min(lastLine.start, start)
          end = Math.max(lastLine.end, end)
        }
        lastLine = { path: path, start: start, end: end }
        return { kind: 'line', path: path, start: start, end: end }
      }

      function clearHover() {
        if (!hovered) return
        if (hovered.__clarityOutline !== undefined) {
          hovered.style.outline = hovered.__clarityOutline
          hovered.style.outlineOffset = hovered.__clarityOffset
          delete hovered.__clarityOutline
          delete hovered.__clarityOffset
        }
        hovered = null
      }

      function hover(event) {
        if (!enabled) return
        if (pressed && (Math.abs(event.clientX - pressX) > 3 || Math.abs(event.clientY - pressY) > 3)) {
          dragged = true
        }
        var target = event.target
        if (!target || target.nodeType !== 1 || target === hovered) return
        clearHover()
        if (target === document.body || target === document.documentElement) return
        target.__clarityOutline = target.style.outline
        target.__clarityOffset = target.style.outlineOffset
        target.style.outline = '2px solid #f59e0b'
        target.style.outlineOffset = '1px'
        hovered = target
      }

      function flash(element) {
        if (!element) return
        var previous = element.style.boxShadow
        element.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, .55)'
        try {
          element.scrollIntoView({ block: 'center', behavior: 'smooth' })
        } catch (error) {
          element.scrollIntoView()
        }
        clearTimeout(highlightTimer)
        highlightTimer = setTimeout(function () {
          element.style.boxShadow = previous
        }, 1800)
      }

      function focusAnchor(anchor) {
        if (!anchor || !anchor.kind) return
        if (anchor.kind === 'element') {
          try {
            flash(document.querySelector(anchor.selector))
          } catch (error) {
            // The selector may no longer resolve after an edit.
          }
          return
        }
        if (anchor.kind === 'line') {
          try {
            flash(document.querySelector(anchor.path))
          } catch (error) {
            // A file path is not necessarily a selector.
          }
          return
        }
        if (anchor.kind === 'text') {
          var nodes = document.querySelectorAll('body *')
          for (var i = 0; i < nodes.length; i += 1) {
            if (String(nodes[i].textContent || '').replace(/\s+/g, ' ').indexOf(anchor.quote) !== -1) {
              flash(nodes[i])
              return
            }
          }
        }
      }

      function onClick(event) {
        if (!enabled) return
        if (suppressClick) {
          suppressClick = false
          return
        }
        var anchor = lineAnchor(event, event.target) || elementAnchor(event.target)
        if (!anchor) return
        event.preventDefault()
        event.stopPropagation()
        clearHover()
        send({ type: 'anchor', anchor: anchor })
      }

      function onMouseDown(event) {
        if (!enabled) return
        pressed = true
        dragged = false
        suppressClick = false
        pressX = event.clientX
        pressY = event.clientY
      }

      function onMouseUp() {
        if (!enabled) return
        var wasDragged = dragged
        pressed = false
        dragged = false
        if (!wasDragged) return
        var anchor = textAnchor()
        if (!anchor) return
        suppressClick = true
        send({ type: 'anchor', anchor: anchor })
      }

      function onMessage(event) {
        var data = event.data
        if (!data || data.__clarity !== true) return
        if (data.type === 'mode') {
          enabled = data.enabled === true
          document.documentElement.style.cursor = enabled ? 'crosshair' : ''
          if (!enabled) clearHover()
          return
        }
        if (data.type === 'focus') focusAnchor(data.anchor)
      }

      document.addEventListener('click', onClick, true)
      document.addEventListener('mousedown', onMouseDown, true)
      document.addEventListener('mouseup', onMouseUp, true)
      document.addEventListener('mousemove', hover, true)
      window.addEventListener('message', onMessage)
    }
    // clarity-bridge:end

    function Header(props) {
      const round = props.round
      const isTest = round.kind === 'test'
      return h(
        'div',
        { style: section },
        h('div', { style: eyebrow }, isTest ? 'Real test' : 'Decision'),
        h('h2', { style: title }, round.decision),
        round.context ? h('p', { style: context }, round.context) : null,
        isTest
          ? h(
              'div',
              { style: meta },
              h('span', null, h('b', null, 'Candidate '), round.candidate),
              h('span', null, h('b', null, 'Cold build '), round.coldBuild.command, ' · exit ', String(round.coldBuild.exitCode), ' · ', round.coldBuild.builtAt),
            )
          : h(
              'div',
              { style: meta },
              h('span', null, h('b', null, 'Recommended '), variantLabel(round, round.recommendation)),
              h('span', null, h('b', null, 'Forecloses '), round.foreclosures.join('; ')),
            ),
      )
    }

    function Fidelity(props) {
      const variant = props.variant
      const parts = []
      if (variant.real && variant.real.length) parts.push('real: ' + variant.real.join(', '))
      if (variant.mocked && variant.mocked.length) parts.push('mocked: ' + variant.mocked.join(', '))
      if (variant.omitted && variant.omitted.length) parts.push('omitted: ' + variant.omitted.join(', '))
      if (parts.length === 0) return null
      return h('div', { style: fidelity }, parts.join(' · '))
    }

    function DecisionView(props) {
      const round = props.round
      const sent = props.sent
      const [selected, setSelected] = React.useState(round.recommendation)
      const [comments, setComments] = React.useState([])
      const [commentText, setCommentText] = React.useState('')
      const [commentVariant, setCommentVariant] = React.useState(round.recommendation)
      const [pendingAnchor, setPendingAnchor] = React.useState(null)
      const [annotate, setAnnotate] = React.useState(false)
      const [note, setNote] = React.useState('')
      const [busy, setBusy] = React.useState(false)
      const [error, setError] = React.useState(null)
      const frameRefs = React.useRef(new Map())
      const composerRef = React.useRef(null)

      const disabled = busy || sent !== null

      React.useEffect(() => {
        function onMessage(event) {
          const data = event.data
          if (!data || data.__clarity !== true || data.type !== 'anchor') return
          const variant = round.variants.find((entry) => entry.id === data.variantId)
          if (!variant) return
          const iframe = frameRefs.current.get(variant.id)
          if (!iframe || event.source !== iframe.contentWindow) return
          if (!isAnchor(data.anchor)) return
          setPendingAnchor({ variantId: variant.id, anchor: data.anchor })
          setSelected(variant.id)
          setError(null)
          if (composerRef.current) composerRef.current.focus()
        }
        window.addEventListener('message', onMessage)
        return () => window.removeEventListener('message', onMessage)
      }, [round])

      React.useEffect(() => {
        for (const iframe of frameRefs.current.values()) {
          postMode(iframe)
        }
      }, [annotate])

      function postMode(iframe) {
        try {
          iframe.contentWindow.postMessage({ __clarity: true, type: 'mode', enabled: annotate }, '*')
        } catch {
          // The iframe is between loads.
        }
      }

      function addComment() {
        const text = commentText.trim()
        if (text === '') {
          setError('Write a comment first.')
          return
        }
        const variantId = pendingAnchor ? pendingAnchor.variantId : commentVariant
        const variant = round.variants.find((entry) => entry.id === variantId)
        if (!variant) {
          setError('Choose a variant first.')
          return
        }
        setComments((current) => [
          ...current,
          {
            variantId,
            text,
            anchor: pendingAnchor ? pendingAnchor.anchor : { kind: 'variant' },
            artifactHash: contentHash(variant.html),
          },
        ])
        setPendingAnchor(null)
        setCommentText('')
        setError(null)
      }

      function focusComment(comment) {
        const iframe = frameRefs.current.get(comment.variantId)
        if (!iframe) return
        try {
          iframe.contentWindow.postMessage(
            { __clarity: true, type: 'focus', anchor: comment.anchor || { kind: 'variant' } },
            '*',
          )
        } catch {
          // The artifact is between loads.
        }
      }

      function removeComment(index) {
        setComments((current) => current.filter((_, i) => i !== index))
      }

      async function submit(verdict) {
        if (verdict === 'accept' && !selected) {
          setError('Choose a variant first.')
          return
        }
        if ((verdict === 'revise' || verdict === 'reject') && comments.length === 0 && note.trim() === '') {
          setError('A revision or rejection needs a comment or a note.')
          return
        }
        setBusy(true)
        setError(null)
        try {
          const body = { roundId: round.id, verdict, selected, comments, note }
          const result = await api('/decide', { method: 'POST', body: JSON.stringify(body) })
          props.onSent(result.result)
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : String(cause))
        } finally {
          setBusy(false)
        }
      }

      return h(
        React.Fragment,
        null,
        h(
          'div',
          { style: annotationBar },
          h(
            'button',
            {
              type: 'button',
              style: annotate ? { ...buttonPrimary, padding: '2px 8px' } : { ...buttonBase, padding: '2px 8px' },
              'aria-pressed': annotate,
              onClick: () => setAnnotate((current) => !current),
              disabled,
            },
            annotate ? 'Annotating' : 'Annotate',
          ),
          annotate
            ? h(
                'span',
                { style: { color: 'var(--dsw-alias-label-secondary)' } },
                'Click an element, select text, or click a line in a code block.',
              )
            : h('span', { style: { color: MUTED } }, 'Comment on the whole variant, or annotate a target.'),
        ),
        h(
          'div',
          { style: variantGrid },
          round.variants.map((variant) =>
            h(
              'div',
              {
                key: variant.id,
                role: 'button',
                tabIndex: 0,
                'aria-pressed': selected === variant.id,
                style: {
                  ...variantCard,
                  ...(selected === variant.id
                    ? { borderColor: BRAND, boxShadow: '0 0 0 1px ' + BRAND + ' inset' }
                    : {}),
                },
                onClick: () => {
                  if (!disabled) setSelected(variant.id)
                },
                onKeyDown: (event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    if (!disabled) setSelected(variant.id)
                  }
                },
              },
              h(
                'div',
                { style: vhead },
                h('span', { style: radio }, selected === variant.id ? '●' : '○'),
                h('span', { style: vlabel }, variant.label),
                variant.id === round.recommendation ? h('span', { style: badge }, 'recommended') : null,
              ),
              h('iframe', {
                ref: (node) => {
                  if (node) frameRefs.current.set(variant.id, node)
                  else frameRefs.current.delete(variant.id)
                },
                srcDoc: withBridge(variant.html, variant.id),
                sandbox: 'allow-scripts',
                title: variant.label,
                style: annotate ? { ...frame, cursor: 'crosshair' } : frame,
                onLoad: (event) => postMode(event.currentTarget),
              }),
              variant.note ? h('div', { style: { ...fidelity, color: 'var(--dsw-alias-label-secondary)' } }, variant.note) : null,
              h(Fidelity, { variant }),
            ),
          ),
        ),
        h(
          'div',
          { style: section },
          h('div', { style: sectionTitle }, 'Comments'),
          pendingAnchor
            ? h(
                'div',
                { style: { ...card, gap: '3px', padding: '6px 8px', borderColor: BRAND } },
                h(
                  'div',
                  { style: { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' } },
                  h('span', { style: eyebrow }, 'Commenting on'),
                  h('span', { style: anchorTag }, anchorLabel(pendingAnchor.anchor)),
                  h(
                    'button',
                    {
                      type: 'button',
                      style: linkButton,
                      onClick: () => setPendingAnchor(null),
                      disabled,
                    },
                    'Clear',
                  ),
                ),
                h('div', { style: { color: MUTED, fontSize: '10px' } }, variantLabel(round, pendingAnchor.variantId)),
              )
            : null,
          comments.length === 0
            ? h(
                'div',
                { style: { color: MUTED } },
                pendingAnchor
                  ? 'Write the comment that belongs at that spot.'
                  : 'No comments yet. Use Annotate to point at an element, text, or code line.',
              )
            : h(
                'div',
                { style: { display: 'flex', flexDirection: 'column', gap: '4px' } },
                comments.map((comment, index) =>
                  h(
                    'div',
                    {
                      key: String(index),
                      style: { ...commentItem, cursor: 'pointer' },
                      title: 'Show this spot in the artifact',
                      onClick: () => focusComment(comment),
                    },
                    h(
                      'div',
                      { style: { display: 'flex', flexDirection: 'column', gap: '1px', flex: 1, minWidth: 0 } },
                      h(
                        'div',
                        { style: { display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' } },
                        h('span', { style: commentVariant }, variantLabel(round, comment.variantId)),
                        h('span', { style: { color: MUTED, fontSize: '10px' } }, anchorLabel(comment.anchor)),
                      ),
                      h('span', { style: { overflowWrap: 'anywhere' } }, comment.text),
                    ),
                    h(
                      'button',
                      {
                        type: 'button',
                        title: 'Remove comment',
                        style: { ...buttonBase, padding: '0 4px', border: 0, background: 'transparent', color: MUTED },
                        onClick: (event) => {
                          event.stopPropagation()
                          removeComment(index)
                        },
                        disabled,
                      },
                      '×',
                    ),
                  ),
                ),
              ),
          h(
            'div',
            { style: { display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' } },
            pendingAnchor
              ? null
              : h(
                  'select',
                  {
                    value: commentVariant,
                    onChange: (event) => setCommentVariant(event.target.value),
                    style: { ...input, width: 'auto', flex: 'none' },
                    'aria-label': 'Comment on variant',
                    disabled,
                  },
                  round.variants.map((variant) => h('option', { key: variant.id, value: variant.id }, variant.label)),
                ),
            h('input', {
              ref: composerRef,
              value: commentText,
              onChange: (event) => setCommentText(event.target.value),
              onKeyDown: (event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  addComment()
                }
              },
              placeholder: pendingAnchor ? 'What should change here?' : 'What should change?',
              style: { ...input, flex: '1 1 140px', width: 'auto' },
              disabled,
            }),
            h(
              'button',
              { type: 'button', style: disabled ? { ...buttonBase, ...buttonDisabled } : buttonBase, onClick: addComment, disabled },
              'Add',
            ),
          ),
        ),
        h(
          'div',
          { style: section },
          h('label', { style: sectionTitle, htmlFor: 'clarity-note' }, 'Note to the agent (optional)'),
          h('textarea', {
            id: 'clarity-note',
            value: note,
            onChange: (event) => setNote(event.target.value),
            rows: 2,
            placeholder: 'One sentence the agent should carry into the implementation.',
            style: { ...input, resize: 'vertical', minHeight: '40px' },
            disabled,
          }),
        ),
        error ? h('div', { style: errorText, role: 'alert' }, error) : null,
        h(
          'div',
          { style: actions },
          h(
            'button',
            {
              type: 'button',
              style: disabled ? { ...buttonPrimary, ...buttonDisabled } : buttonPrimary,
              onClick: () => submit('accept'),
              disabled,
            },
            busy ? 'Sending…' : `Accept ${variantLabel(round, selected)}`,
          ),
          h(
            'button',
            { type: 'button', style: disabled ? { ...buttonBase, ...buttonDisabled } : buttonBase, onClick: () => submit('revise'), disabled },
            'Revise',
          ),
          h(
            'button',
            { type: 'button', style: disabled ? { ...buttonDanger, ...buttonDisabled } : buttonDanger, onClick: () => submit('reject'), disabled },
            'Reject',
          ),
          h(
            'button',
            { type: 'button', style: disabled ? { ...buttonBase, ...buttonDisabled } : buttonBase, onClick: () => submit('cancel'), disabled },
            'Cancel',
          ),
        ),
      )
    }

    function TestView(props) {
      const round = props.round
      const sent = props.sent
      const [phase, setPhase] = React.useState('ready')
      const [observed, setObserved] = React.useState('')
      const [busy, setBusy] = React.useState(false)
      const [error, setError] = React.useState(null)
      const disabled = busy || sent !== null

      async function submit(verdict) {
        if (verdict !== 'pass' && observed.trim() === '') {
          setError('Record what you saw before marking this failed or blocked.')
          return
        }
        setBusy(true)
        setError(null)
        try {
          const body = { roundId: round.id, verdict, observed }
          const result = await api('/test', { method: 'POST', body: JSON.stringify(body) })
          props.onSent(result.result)
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : String(cause))
        } finally {
          setBusy(false)
        }
      }

      return h(
        React.Fragment,
        null,
        h(
          'div',
          { style: card },
          h('div', { style: sectionTitle }, 'Preconditions'),
          h('ul', { style: list }, round.scenario.preconditions.map((item, index) => h('li', { key: String(index) }, item))),
          h('div', { style: sectionTitle }, 'Steps'),
          h('ol', { style: list }, round.scenario.steps.map((item, index) => h('li', { key: String(index) }, item))),
          h('div', { style: sectionTitle }, 'Expected'),
          h('ul', { style: list }, round.scenario.expected.map((item, index) => h('li', { key: String(index) }, item))),
          h('div', { style: sectionTitle }, 'Failure signature'),
          h('div', { style: { color: 'var(--dsw-alias-label-secondary)' } }, round.scenario.failureSignature),
          h('div', { style: sectionTitle }, 'Rollback'),
          h('div', { style: { color: 'var(--dsw-alias-label-secondary)' } }, round.scenario.rollback),
          h('div', { style: { ...meta, marginTop: '2px' } }, h('span', { style: pill }, 'cold build exit 0'), h('span', { style: pill }, round.candidate)),
        ),
        phase === 'ready'
          ? h(
              'div',
              { style: actions },
              h(
                'button',
                {
                  type: 'button',
                  style: disabled ? { ...buttonPrimary, ...buttonDisabled } : buttonPrimary,
                  onClick: () => setPhase('running'),
                  disabled,
                },
                'I’m ready to test',
              ),
              h('span', { style: { color: MUTED } }, 'The build is already cold-built. Run the scenario now.'),
            )
          : h(
              'div',
              { style: section },
              h('div', { style: sectionTitle }, 'What did you observe?'),
              h('textarea', {
                value: observed,
                onChange: (event) => setObserved(event.target.value),
                rows: 3,
                placeholder: 'One or two sentences: what happened, and where it differed from expected.',
                style: { ...input, resize: 'vertical', minHeight: '52px' },
                disabled,
              }),
              error ? h('div', { style: errorText, role: 'alert' }, error) : null,
              h(
                'div',
                { style: actions },
                h(
                  'button',
                  { type: 'button', style: disabled ? { ...buttonPrimary, ...buttonDisabled } : buttonPrimary, onClick: () => submit('pass'), disabled },
                  'Pass',
                ),
                h(
                  'button',
                  { type: 'button', style: disabled ? { ...buttonDanger, ...buttonDisabled } : buttonDanger, onClick: () => submit('fail'), disabled },
                  'Fail',
                ),
                h(
                  'button',
                  { type: 'button', style: disabled ? { ...buttonBase, ...buttonDisabled } : buttonBase, onClick: () => submit('blocked'), disabled },
                  'Blocked',
                ),
                h('button', { type: 'button', style: buttonBase, onClick: () => setPhase('ready'), disabled }, 'Back'),
              ),
            ),
      )
    }

    function RoundPanel(props) {
      const info = props.useTabInfo ? props.useTabInfo() : null
      const paramRoundId = info && info.tab && info.tab.navigation && info.tab.navigation.params
        ? info.tab.navigation.params.roundId
        : undefined
      const [state, setState] = React.useState({ loading: true, error: null, round: null })
      const [sent, setSent] = React.useState(null)

      React.useEffect(() => {
        let live = true
        let remembered = null
        try {
          remembered = localStorage.getItem('clarity.lastRound.' + props.sessionId)
        } catch {
          remembered = null
        }
        const id = paramRoundId ?? remembered
        if (!id) {
          setState({ loading: false, error: null, round: null })
          return undefined
        }
        setState({ loading: true, error: null, round: null })
        api('/round?id=' + encodeURIComponent(id))
          .then((body) => {
            if (live) setState({ loading: false, error: null, round: body.round })
          })
          .catch((cause) => {
            if (live) setState({ loading: false, error: cause instanceof Error ? cause.message : String(cause), round: null })
          })
        return () => {
          live = false
        }
      }, [paramRoundId, props.sessionId])

      if (state.loading) {
        return h('div', { style: root }, h('div', { style: { color: MUTED } }, 'Reading round…'))
      }
      if (state.error) {
        return h('div', { style: root }, h('div', { style: errorText, role: 'alert' }, state.error))
      }
      const round = state.round
      if (!round) {
        return h(
          'div',
          { style: root },
          h('div', { style: eyebrow }, 'Collaborative Clarity'),
          h('h2', { style: title }, 'No round is open'),
          h(
            'p',
            { style: context },
            'A round opens here automatically when the agent calls clarity_round or clarity_test. Keep this tab; it will show the next round in this conversation.',
          ),
        )
      }
      if (round.sessionId !== props.sessionId) {
        return h(
          'div',
          { style: root },
          h('div', { style: eyebrow }, 'Collaborative Clarity'),
          h('h2', { style: title }, 'This round belongs to another conversation'),
          h('p', { style: context }, 'Open the conversation that started it, or start a new round there.'),
        )
      }
      if (sent) {
        return h(
          'div',
          { style: root },
          h(Header, { round }),
          h(
            'div',
            { style: { ...card, borderColor: 'var(--dsw-alias-state-success-primary)' } },
            h('div', { style: { ...successText, fontWeight: 600 } }, sent.status === 'tested' ? 'Result sent to the agent.' : sent.status === 'cancelled' ? 'Round cancelled.' : 'Decision sent to the agent.'),
            h(
              'div',
              { style: { color: 'var(--dsw-alias-label-secondary)' } },
              sent.verdict ? 'Verdict: ' + sent.verdict : 'The tool call has returned.',
              sent.selected ? ' · selected: ' + sent.selected : '',
            ),
          ),
          h('p', { style: { ...context, marginTop: '2px' } }, 'You can close this tab. The agent has the structured result.'),
        )
      }
      const complete = (result) => {
        try {
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i)
            if (key && key.indexOf('clarity.lastRound.') === 0) localStorage.removeItem(key)
          }
        } catch {
          // Storage may be unavailable; the result is still on the Host.
        }
        setSent(result)
      }
      return h(
        'div',
        { style: root },
        h(Header, { round }),
        round.kind === 'test'
          ? h(TestView, { round, sent, onSent: complete })
          : h(DecisionView, { round, sent, onSent: complete }),
      )
    }

    function TabTitle() {
      return h(
        'span',
        { style: { display: 'inline-flex', alignItems: 'center', gap: '5px', minWidth: 0 } },
        h(ClarityIcon, { size: 13 }),
        h('span', { style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, 'Clarity'),
      )
    }

    const pending = new Map()
    const pendingListeners = new Set()
    let openRound = () => {}
    let publishPendingInteraction = null

    function notifyPending() {
      for (const listener of pendingListeners) listener()
    }

    function rememberPending(round) {
      const release = publishPendingInteraction === null
        ? null
        : publishPendingInteraction(
            { key: round.id, kind: 'question', sessionId: round.sessionId },
            async () => {},
          )
      pending.set(round.id, {
        id: round.id,
        sessionId: round.sessionId,
        decision: round.decision,
        kind: round.kind,
        release,
      })
      notifyPending()
    }

    function forgetPending(roundId) {
      const entry = pending.get(roundId)
      if (entry === undefined) return
      pending.delete(roundId)
      try {
        entry.release?.()
      } catch {
        // The domain was already torn down.
      }
      notifyPending()
    }

    function forgetAllPending() {
      for (const entry of pending.values()) {
        try {
          entry.release?.()
        } catch {
          // The domain was already torn down.
        }
      }
      pending.clear()
      notifyPending()
    }

    function SessionPendingDot(props) {
      const [, force] = React.useReducer((value) => value + 1, 0)
      React.useEffect(() => {
        pendingListeners.add(force)
        return () => {
          pendingListeners.delete(force)
        }
      }, [])
      const waiting = [...pending.values()].filter((round) => round.sessionId === props.sessionId)
      if (waiting.length === 0) return null
      const latest = waiting[waiting.length - 1]
      return h(
        'span',
        {
          role: 'img',
          title: latest.decision,
          'aria-label': 'A round is waiting for you: ' + latest.decision,
          style: {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '16px',
            height: '16px',
            flex: 'none',
          },
        },
        h('span', {
          style: {
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#f59e0b',
            boxShadow: '0 0 0 3px rgba(245, 158, 11, .18)',
          },
          'aria-hidden': true,
        }),
      )
    }

    const pluginApi = {
      inject: ['slots', 'sidebarRightTabs', 'sidebarRight', 'uiSession'],
      apply(ctx) {
        publishPendingInteraction = ctx.uiSession.registerPendingInteraction(() => 5)
        openRound = (roundId) => {
          try {
            ctx.sidebarRight.openTab(KIND, { params: { roundId } })
          } catch (cause) {
            console.warn('[clarity] could not open the round tab:', cause)
          }
        }
        ctx.effect(
          () =>
            ctx.sidebarRightTabs.register({
              id: TAB_ID,
              kind: KIND,
              title: () => 'Clarity',
              multiple: true,
              guide: [
                {
                  id: 'clarity',
                  order: 40,
                  title: () => 'Clarity',
                  description: () => 'Artifact rounds: a decision shown, annotated, and chosen while the agent waits.',
                  icon: ClarityIcon,
                },
              ],
            }),
          'clarity tab type',
        )

        ctx.effect(
          () =>
            ctx.slots.inject('sidebar.right.pane.tab', () =>
              ctx.slots.register(
                {
                  name: 'sidebar.right.pane.tab',
                  key: TAB_ID,
                  inject: (sessionId) => ({ sessionId }),
                },
                RoundPanel,
              ),
            ),
          'clarity tab body',
        )

        ctx.effect(
          () =>
            ctx.slots.inject('sidebar.right.pane.tab.title', () =>
              ctx.slots.register({ name: 'sidebar.right.pane.tab.title', key: TAB_ID }, TabTitle),
            ),
          'clarity tab chip',
        )

        ctx.effect(
          () =>
            ctx.slots.inject('sidebar.session.row.leading', () =>
              ctx.slots.register({ name: 'sidebar.session.row.leading', id: 'clarity-pending' }, SessionPendingDot),
            ),
          'clarity session dot',
        )

        ctx.effect(() => {
          const source = new EventSource(API + '/events')
          source.addEventListener('open', () => {
            forgetAllPending()
          })
          source.addEventListener('round', (event) => {
            let round
            try {
              round = JSON.parse(event.data)
            } catch {
              return
            }
            if (!round) return
            rememberPending(round)
            try {
              localStorage.setItem('clarity.lastRound.' + round.sessionId, round.id)
            } catch {
              // The tab still opens from the event; only the guide fallback is lost.
            }
            if (round.sessionId !== ctx.sidebarRight.mounted.getSnapshot()) return
            openRound(round.id)
          })
          const forget = (event) => {
            try {
              const data = JSON.parse(event.data)
              if (data && typeof data.roundId === 'string') forgetPending(data.roundId)
            } catch {
              // The event still clears the stored fallback below.
            }
            try {
              for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i)
                if (key && key.indexOf('clarity.lastRound.') === 0) localStorage.removeItem(key)
              }
            } catch {
              // Nothing to forget.
            }
          }
          source.addEventListener('decided', forget)
          source.addEventListener('tested', forget)
          return () => source.close()
        }, 'clarity events')
      },
    }
    Object.defineProperty(pluginApi, '__test', {
      value: { clarityBridge, withBridge, anchorLabel, contentHash, isAnchor },
      enumerable: false,
    })
    return pluginApi
  },
})
