window.__ModuleLoader__.load({
  id: '@ds-hu/dsh-collaborative-clarity',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const KIND = 'clarity'
    const TAB_ID = 'dsh-collaborative-clarity'
    const NS = 'collaborativeClarity'
    const API = '/clarity/api'

    const HAIRLINE = '0.5px solid var(--dsw-alias-border-l2)'
    const MUTED = 'var(--dsw-alias-label-tertiary)'
    const ERROR = 'var(--dsw-alias-state-error-primary)'
    const BRAND = 'var(--dsw-alias-brand-primary, var(--dsw-alias-label-primary))'
    const FONT = 'var(--dsw-font-family, ui-sans-serif, system-ui, "Segoe UI", sans-serif)'
    const MONO = 'var(--ds-font-family-code, ui-monospace, Consolas, monospace)'

    // Everything the panel needs from CSS is interaction and time: hover, focus,
    // press, the entrance, and the one curve they share. None of it fits an inline
    // style object, so it lives in one stylesheet injected once. Round 0028 settled
    // the law: a new round rises into place, every other animation is a reply to
    // something the user did.
    //
    // The sheet reaches the whole page for as long as the plugin is applied, so every
    // selector is prefixed and every rule but the scope itself is scoped: a `.row` or
    // a `rise` of someone else's must never be touched by it.
    const STYLE_ID = 'clarity-motion'
    const STYLE_RULES = `
.clarity-scope{--clarity-d1:90ms;--clarity-d2:150ms;--clarity-d3:240ms;--clarity-ease:cubic-bezier(.2,0,0,1)}
@media (prefers-reduced-motion:reduce){.clarity-scope{--clarity-d1:1ms;--clarity-d2:1ms;--clarity-d3:1ms}}

/* One timing law for every control in the panel. */
.clarity-scope button,.clarity-scope input,.clarity-scope textarea,.clarity-scope select{
  transition:background-color var(--clarity-d1) var(--clarity-ease),border-color var(--clarity-d1) var(--clarity-ease),color var(--clarity-d1) var(--clarity-ease),box-shadow var(--clarity-d2) var(--clarity-ease),opacity var(--clarity-d2) var(--clarity-ease),transform var(--clarity-d1) var(--clarity-ease)}
.clarity-scope button:active:not(:disabled){transform:scale(.996)}
.clarity-scope button:focus-visible,.clarity-scope [role=button]:focus-visible{outline:1px solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:1px}
.clarity-scope input:focus,.clarity-scope textarea:focus{outline:none;border-color:var(--dsw-alias-border-l4)!important;box-shadow:0 0 0 1px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}
@media (hover:hover){
  /* An inset wash, not a background: it lands on any button whatever its own fill
     is, and never has to beat an inline style to be seen. */
  .clarity-scope button:hover:not(:disabled){box-shadow:inset 0 0 0 999px var(--dsw-alias-interactive-bg-hover)}
  .clarity-scope button[data-tone='primary']:hover:not(:disabled){box-shadow:none;opacity:.92}
}

/* The variant card: the selected one lifts, and the radio settles into it. */
.clarity-scope .clarity-card{transition:border-color var(--clarity-d2) var(--clarity-ease),box-shadow var(--clarity-d3) var(--clarity-ease),transform var(--clarity-d3) var(--clarity-ease)}
.clarity-scope .clarity-card[aria-pressed='true']{border-color:var(--dsw-alias-label-primary)!important;box-shadow:inset 0 0 0 1px var(--dsw-alias-label-primary),0 2px 10px -4px rgb(0 0 0 / 30%);transform:translateY(-1px)}
@media (hover:hover){.clarity-scope .clarity-card:hover:not([aria-pressed='true']){border-color:var(--dsw-alias-border-l4)}}
.clarity-scope .clarity-vhead{transition:background-color var(--clarity-d2) var(--clarity-ease)}
.clarity-scope .clarity-card[aria-pressed='true'] .clarity-vhead{background:var(--dsw-alias-bg-layer-2)}
.clarity-scope .clarity-card[aria-pressed='true'] .clarity-radio{animation:clarity-pop var(--clarity-d3) var(--clarity-ease) both}
@keyframes clarity-pop{from{transform:scale(.55);opacity:.35}to{transform:scale(1);opacity:1}}

/* The entrance: once per round, in reading order. The root carries the key and the
   class together, so a re-render does not replay it and a new round does. */
@keyframes clarity-rise{from{opacity:0;translate:0 6px}to{opacity:1;translate:0 0}}
.clarity-scope.clarity-arrival > *{animation:clarity-rise var(--clarity-d3) var(--clarity-ease) both}
.clarity-scope.clarity-arrival > *:nth-child(2){animation-delay:40ms}
.clarity-scope.clarity-arrival > *:nth-child(3){animation-delay:80ms}
.clarity-scope.clarity-arrival > *:nth-child(4){animation-delay:120ms}
.clarity-scope.clarity-arrival > *:nth-child(n+5){animation-delay:160ms}

/* Sending: the button says it is working once, not twice. Its own inline style says
   so too — full opacity and a progress cursor — because an inline style is the only
   thing that can beat the disabled style the same button carries. */
.clarity-scope button[data-busy='true']{position:relative;overflow:hidden}
.clarity-scope button[data-busy='true']::after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(100deg,transparent 24%,color-mix(in srgb,var(--dsw-alias-bg-base) 26%,transparent) 50%,transparent 76%);animation:clarity-sheen 1.2s linear infinite}
@keyframes clarity-sheen{from{transform:translateX(-100%)}to{transform:translateX(100%)}}
/* The spinner's box exists at rest and only its ink is hidden, so the primary button
   is the same width before and during the send and the row cannot rewrap under the
   pointer. */
.clarity-scope .clarity-spin{display:inline-block;width:9px;height:9px;flex:none;border-radius:50%;border:1.5px solid currentColor;border-right-color:transparent;animation:clarity-spin .8s linear infinite;visibility:hidden}
.clarity-scope button[data-busy='true'] .clarity-spin{visibility:visible}
@keyframes clarity-spin{to{transform:rotate(360deg)}}

/* A comment that has just been added arrives without shoving the list. */
@keyframes clarity-in{from{opacity:0;translate:0 4px}to{opacity:1;translate:0 0}}
.clarity-scope .clarity-row[data-new='true']{animation:clarity-in var(--clarity-d3) var(--clarity-ease) both}

@media (prefers-reduced-motion:reduce){
  .clarity-scope.clarity-arrival > *{animation:none}
  .clarity-scope .clarity-card[aria-pressed='true']{transform:none}
  .clarity-scope .clarity-card[aria-pressed='true'] .clarity-radio{animation:none}
  .clarity-scope .clarity-row[data-new='true']{animation:none}
  .clarity-scope button:active:not(:disabled){transform:none}
  .clarity-scope button[data-busy='true']::after{display:none}
}`

    /**
     * Put the motion stylesheet in the document once.
     *
     * The owner count lives on the node, not in this module: a hot reload evaluates a
     * fresh bundle, so a module-level counter would let the old instance's disposer
     * remove the sheet the new one is already using. Two instances, one node, one
     * count — the last one out takes it.
     * @returns {(() => void)|undefined} a disposer, or nothing outside a browser.
     */
    function ensureStyle() {
      if (typeof document === 'undefined' || !document || typeof document.createElement !== 'function') return undefined
      if (!document.head || typeof document.head.appendChild !== 'function') return undefined
      let style = document.getElementById(STYLE_ID)
      if (!style) {
        style = document.createElement('style')
        style.id = STYLE_ID
        style.textContent = STYLE_RULES
        document.head.appendChild(style)
      }
      const node = style
      // A hot reload hands this function the previous bundle's node, whose rules are a
      // version behind: the sheet is shared, its content is refreshed on every apply.
      if (node.textContent !== STYLE_RULES) node.textContent = STYLE_RULES
      node.__clarityUsers = (Number(node.__clarityUsers) || 0) + 1
      let released = false
      return () => {
        if (released) return
        released = true
        node.__clarityUsers = Math.max(0, (Number(node.__clarityUsers) || 1) - 1)
        if (node.__clarityUsers > 0) return
        try {
          node.remove()
        } catch {
          // A document torn down first needs no cleanup.
        }
      }
    }

    /** Whether the system asks for no motion, so a scripted scroll can obey too. */
    function prefersReducedMotion() {
      try {
        return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches === true
      } catch {
        return false
      }
    }

    // Every string the panel draws lives here, so a language switch never has to
    // hunt through a render function. `en` is the baseline: `ctx.locale` requires
    // it, and it is what shows when the locale service is absent.
    const MESSAGES = {
      en: {
        'header.realTest': 'Real test',
        'header.decision': 'Decision',
        'header.candidate': 'Version: ',
        'advice.why': 'why',
        'advice.cost': 'cost',
        'fidelity.real': 'real',
        'fidelity.mocked': 'mock',
        'fidelity.omitted': 'omit',
        'anchor.variant': 'Whole variant',
        'comment.empty': 'Write a comment first.',
        'comment.chooseVariant': 'Choose a variant first.',
        'comment.needsText': 'A revision or rejection needs a comment or a note.',
        'annotate.on': 'Annotating',
        'annotate.off': 'Annotate',
        'annotate.anchored': 'Anchored: {anchor}. Interaction is unlocked; press Annotate to pick another.',
        'annotate.hint': 'Click an element, drag-select text, or click a code line in either card.',
        'annotate.offHint': 'Comment on the whole variant, or turn on Annotate.',
        'comments.title': 'Comments',
        'comments.commentingOn': 'Commenting on',
        'comments.clear': 'Clear',
        'comments.emptyAnchored': 'Write the comment that belongs at that spot.',
        'comments.showSpot': 'Show this spot in the artifact',
        'comments.remove': 'Remove comment',
        'comments.edit': 'Edit',
        'comments.save': 'Save',
        'comments.cancelEdit': 'Cancel',
        'comments.onVariant': 'Comment on variant',
        'anchor.whole': 'Whole variant',
        'anchor.element': 'Element · {text}',
        'anchor.text': '“{quote}”',
        'anchor.line': 'Line {line}',
        'anchor.lines': 'Lines {start}–{end}',
        'anchor.other': 'Anchor',
        'composer.placeholderAnchored': 'What should change here? (Ctrl+Enter adds)',
        'composer.placeholder': 'What should change? (Ctrl+Enter adds)',
        'composer.add': 'Add',
        'note.label': 'Note to the agent (optional)',
        'note.placeholder': 'One sentence the agent should carry into the implementation.',
        'action.accept': 'Accept',
        'action.revise': 'Revise',
        'action.rejectAll': 'Reject {variants}',
        'action.cancel': 'Cancel this round',
        'test.preconditions': 'Preconditions',
        'test.steps': 'Steps',
        'test.expected': 'Expected',
        'test.failure': 'Failure signature',
        'test.rollback': 'Rollback',
        'test.prepared': 'Prepared ',
        'test.noPrepared': 'No prepared build recorded.',
        'test.run': 'Command: ',
        'test.copied': 'Copied',
        'test.copy': 'Copy',
        'test.ready': 'I’m ready to test',
        'test.observed': 'What did you observe?',
        'test.observedPlaceholder': 'One or two sentences: what happened, and where it differed from expected.',
        'test.needsObservation': 'Record what you saw before marking this failed.',
        'test.screenshot': 'Screenshot',
        'test.screenshotOf': 'Screenshot {index} of {total}',
        'test.remove': 'Remove',
        'test.dropHint': 'Paste into the note, drop, or choose a PNG/JPEG.',
        'test.pass': 'Pass',
        'test.fail': 'Fail',
        'test.cancel': 'Cancel this test',
                'test.addScreenshot': 'Add screenshot',
        'state.reading': 'Reading round…',
        'state.decisionSent': 'Decision sent to the agent.',
        'state.resultSent': 'Result sent to the agent.',
        'state.cancelled': 'Round cancelled.',
        'state.close': 'You can close this tab. The agent has the structured result.',
        'state.noRound': 'No round is open',
        'state.noRoundHint':
          'A round opens here automatically when the agent calls clarity_round or clarity_test. Keep this tab; it will show the next round in this conversation.',
        'state.roundCancelled': 'This round was cancelled.',
        'state.answered': 'This round is already answered.',
        'state.hasResult': 'The agent has the result. Open a new round for the next decision.',
        'state.returned': 'The tool call has returned.',
        'state.verdict': 'Verdict: {verdict}',
        'state.selected': ' · selected: {selected}',
        'bubble.label': 'Decision',
        'bubble.pass': 'Passed',
        'bubble.fail': 'Failed',
        'bubble.blocked': 'Blocked',
        'bubble.shots': 'Screenshots',
        'bubble.openShot': 'Open {name} in the sidebar',
        'bubble.accept': 'Accepted',
        'bubble.revise': 'Asked for changes',
        'bubble.reject': 'Turned it down',
        'bubble.variant': 'variant {label}',
        'bubble.note': 'Note',
        'bubble.noteLine': 'Note: {note}',
        'bubble.copy': 'Copy',
        'bubble.copied': 'Copied',
        'tab.guide': 'Artifact rounds: a decision shown, annotated, and chosen while the agent waits.',
      },
      zh: {
        'header.realTest': '真机测试',
        'header.decision': '决定',
        'header.candidate': '版本：',
        'advice.why': '推荐',
        'advice.cost': '代价',
        'fidelity.real': '真实',
        'fidelity.mocked': '模拟',
        'fidelity.omitted': '省略',
        'anchor.variant': '整条变体',
        'comment.empty': '先写一条批注。',
        'comment.chooseVariant': '先选一条变体。',
        'comment.needsText': '要求修改或者拒绝，总得留下一条批注或说明。',
        'annotate.on': '标注中',
        'annotate.off': '标注',
        'annotate.anchored': '已锚定：{anchor}。交互已解锁，再点「标注」可以选别处。',
        'annotate.hint': '点一个元素、划一段文字，或者点代码里的某一行。',
        'annotate.offHint': '可以批注整条变体，也可以打开「标注」。',
        'comments.title': '批注',
        'comments.commentingOn': '正在批注',
        'comments.clear': '取消',
        'comments.emptyAnchored': '在这里写下你要说的。',
        'comments.showSpot': '在 artifact 里指给我看',
        'comments.remove': '删掉这条批注',
        'comments.edit': '编辑',
        'comments.save': '保存',
        'comments.cancelEdit': '取消',
        'comments.onVariant': '批注哪条变体',
        'anchor.whole': '整条变体',
        'anchor.element': '元素 · {text}',
        'anchor.text': '“{quote}”',
        'anchor.line': '第 {line} 行',
        'anchor.lines': '第 {start}–{end} 行',
        'anchor.other': '锚点',
        'composer.placeholderAnchored': '这里要改什么？（Ctrl+Enter 添加）',
        'composer.placeholder': '要改什么？（Ctrl+Enter 添加）',
        'composer.add': '添加',
        'note.label': '给 agent 的话（可选）',
        'note.placeholder': '一句话，让 agent 带进实现里。',
        'action.accept': '接受',
        'action.revise': '继续修改',
        'action.rejectAll': '都不要',
        'action.cancel': '取消这一轮',
        'test.preconditions': '前期准备',
        'test.steps': '测试步骤',
        'test.expected': '预期结果',
        'test.failure': '失败迹象',
        'test.rollback': '回滚方法',
        'test.prepared': '已构建 ',
        'test.noPrepared': '没有记录构建。',
        'test.run': '命令：',
        'test.copied': '已复制',
        'test.copy': '复制',
        'test.ready': '准备完成，开始测试',
        'test.observed': '你看到了什么？',
        'test.observedPlaceholder': '一两句话：发生了什么，哪里和预期不一样。',
        'test.needsObservation': '标成失败之前，先记下你看到了什么。',
        'test.screenshot': '截图',
        'test.screenshotOf': '截图 {index} / {total}',
        'test.remove': '移除',
        'test.dropHint': '粘贴进说明里、拖进来，或者选一张 PNG/JPEG。',
        'test.pass': '通过',
        'test.fail': '失败',
        'test.cancel': '取消该测试',
                'test.addScreenshot': '添加截图',
        'state.reading': '正在读取 round…',
        'state.decisionSent': '决定已经发给 agent。',
        'state.resultSent': '结果已经发给 agent。',
        'state.cancelled': 'round 已取消。',
        'state.close': '可以关掉这个标签页了，agent 已经拿到结构化结果。',
        'state.noRound': '现在没有打开的 round',
        'state.noRoundHint':
          'agent 调用 clarity_round 或 clarity_test 时，round 会自动开在这里。别关这个标签页；这个会话的下一个 round 还会出现在这儿。',
        'state.roundCancelled': '这个 round 已经取消。',
        'state.answered': '这个 round 已经答过了。',
        'state.hasResult': 'agent 已经拿到结果，下一个决定请开新的一轮。',
        'state.returned': '工具调用已经返回。',
        'state.verdict': '结论：{verdict}',
        'state.selected': ' · 选中：{selected}',
        'bubble.label': '决定',
        'bubble.pass': '已通过',
        'bubble.fail': '未通过',
        'bubble.blocked': '受阻',
        'bubble.shots': '截图',
        'bubble.openShot': '在右侧栏打开 {name}',
        'bubble.accept': '已接受',
        'bubble.revise': '要求修改',
        'bubble.reject': '都不要',
        'bubble.variant': '变体 {label}',
        'bubble.note': '说明',
        'bubble.noteLine': '说明：{note}',
        'bubble.copy': '复制',
        'bubble.copied': '已复制',
        'tab.guide': 'Artifact round：把一个决定摆出来，你标注、你选，agent 在旁边等。',
      },
    }

    function fillMessage(text, vars) {
      if (!vars) return text
      return text.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match))
    }

    // `apply` rebinds this through the locale service; until then the English table
    // is the answer, which is also what a composition without the service gets.
    let t = (key, vars) => fillMessage(MESSAGES.en[key] === undefined ? key : MESSAGES.en[key], vars)

    const root = {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      flex: '1 1 auto',
      minHeight: 0,
      overflowY: 'auto',
      // No bottom padding: the decision bar is the last child and carries its own,
      // so a pinned bar sits flush with the bottom of the pane instead of floating.
      padding: '10px 12px 0',
      fontFamily: FONT,
      fontSize: '12px',
      lineHeight: '18px',
      color: 'var(--dsw-alias-label-primary)',
    }
    /** A root for a state with no decision bar under it. */
    const rootPadded = { ...root, padding: '10px 12px 18px' }
    /**
     * The scroll root's props: the motion scope the stylesheet hangs off, so every
     * control inside the panel shares one set of timings.
     * @param {object} [style] - root, or rootPadded for a state with no decision bar.
     * @returns {object} props for the panel's scroll root.
     */
    function scope(style) {
      return { className: 'clarity-scope', style: style || root }
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
      // No inline `outline`: the stylesheet owns the focus ring, and an inline
      // declaration would beat it — and the browser's own ring would be gone too.
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
    const frame = {
      width: '100%',
      height: '300px',
      border: 0,
      display: 'block',
      background: '#fff',
    }
    const FIDELITY_TONE = {
      real: 'var(--dsw-alias-state-success-primary, #2da44e)',
      mocked: '#d4a72c',
      omitted: MUTED,
    }
    const fidelity = {
      padding: '6px 8px',
      color: MUTED,
      fontSize: '10px',
      lineHeight: '15px',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
    }
    // The dot sits on the same visual centre as the 15px line it labels. With
    // `baseline` alignment it lands a pixel low: the glyph box and the dot box
    // have different heights, so only an explicit offset lines them up.
    const fidelityRow = { display: 'flex', alignItems: 'flex-start', gap: '5px' }
    const fidelityDot = { flex: 'none', width: '5px', height: '5px', marginTop: '5px', borderRadius: '50%' }
    const fidelityLabel = { flex: 'none', width: '2.6em', whiteSpace: 'nowrap' }
    // What this variant argues for and what it costs, inside the card it belongs
    // to: the alternative was a round-level list the eye had to pair with a badge.
    const advice = {
      padding: '6px 8px',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      fontSize: '10px',
      lineHeight: '15px',
      borderTop: HAIRLINE,
    }
    const adviceRow = { display: 'flex', alignItems: 'flex-start', gap: '5px' }
    const adviceLabel = { flex: 'none', width: '2.6em', fontWeight: 650, letterSpacing: '.06em', color: MUTED, whiteSpace: 'nowrap' }
    const adviceValue = { flex: '1 1 0', minWidth: 0, color: 'var(--dsw-alias-label-secondary)' }
    const sourceLine = {
      padding: '0 8px 5px',
      color: MUTED,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSize: '10px',
      lineHeight: '14px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }
    const buttonBase = {
      font: 'inherit',
      fontSize: '12px',
      lineHeight: '18px',
      // A flex row so a spinner can sit beside a label with a gap instead of on top
      // of it; a button with no spinner is unaffected.
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
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
    // The bar pins to the bottom of the pane. A decision is the point of this tab,
    // and reaching it must not depend on how much advice a variant carries.
    const actions = {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '6px',
      alignItems: 'center',
      position: 'sticky',
      bottom: 0,
      zIndex: 2,
      // `auto` pushes a short round's bar to the foot of the pane instead of letting
      // it float right under the note; when the content overflows it resolves to 0.
      marginTop: 'auto',
      padding: '8px 0 10px',
      borderTop: HAIRLINE,
      background: 'var(--dsw-alias-bg-base)',
    }
    // The variant a comment belongs to is a choice of two, not a dropdown: at the
    // sidebar's width that is one tap, and it never hides the option you are on.
    const chip = {
      font: 'inherit',
      fontSize: '11px',
      lineHeight: '16px',
      padding: '1px 8px',
      borderRadius: '99px',
      border: HAIRLINE,
      background: 'var(--dsw-alias-bg-layer-2)',
      color: 'var(--dsw-alias-label-secondary)',
      cursor: 'pointer',
    }
    const chipOn = { ...chip, borderColor: 'var(--dsw-alias-label-primary)', color: 'var(--dsw-alias-label-primary)', fontWeight: 600 }
    const chipRow = { display: 'flex', flex: 'none', alignItems: 'center', gap: '4px', paddingBottom: '5px' }
    const countChip = {
      display: 'inline-block',
      minWidth: '15px',
      marginLeft: '2px',
      padding: '0 5px',
      border: HAIRLINE,
      borderRadius: '99px',
      background: 'var(--dsw-alias-bg-layer-2)',
      color: MUTED,
      fontSize: '10px',
      lineHeight: '14px',
      fontWeight: 650,
      textAlign: 'center',
    }
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
    const list = { margin: 0, paddingLeft: '18px', color: 'var(--dsw-alias-label-secondary)' }
    const preparedLine = { color: 'var(--dsw-alias-label-secondary)', fontSize: '12px', margin: '0 0 8px' }

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
          d: 'M5.8 18.6V7.6a3.4 3.4 0 0 1 3.4-3.4h5.6a3.4 3.4 0 0 1 3.4 3.4v4a3.4 3.4 0 0 1-3.4 3.4H8.8z',
          stroke: 'currentColor',
          strokeWidth: 1.7,
          strokeLinejoin: 'round',
        }),
        h('path', {
          d: 'M9.2 6.6h5.6l.7 2.2L12 12.8 8.5 8.8l.7-2.2Z',
          fill: 'currentColor',
        }),
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

    /** HH:MM for an ISO timestamp or epoch millis; the raw value when it does not parse. */
    function clock(value) {
      const at = new Date(value)
      if (Number.isNaN(at.getTime())) return String(value)
      return String(at.getHours()).padStart(2, '0') + ':' + String(at.getMinutes()).padStart(2, '0')
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
      if (!anchor || anchor.kind === 'variant') return t('anchor.whole')
      if (anchor.kind === 'element') {
        return t('anchor.element', { text: shortText(anchor.text || anchor.selector, 42) })
      }
      if (anchor.kind === 'text') return t('anchor.text', { quote: shortText(anchor.quote, 40) })
      if (anchor.kind === 'line') {
        return anchor.start === anchor.end
          ? t('anchor.line', { line: anchor.start })
          : t('anchor.lines', { start: anchor.start, end: anchor.end })
      }
      return t('anchor.other')
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
      var locked = null
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
        return { anchor: { kind: 'element', selector: selector, text: text }, element: element }
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
          anchor: {
            kind: 'text',
            quote: quote.slice(0, 300),
            prefix: at > 0 ? full.slice(Math.max(0, at - 40), at) : '',
            suffix: at >= 0 ? full.slice(at + quote.length, at + quote.length + 40) : '',
          },
          element: element,
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
        return { anchor: { kind: 'line', path: path, start: start, end: end }, element: pre }
      }

      function clearLock() {
        if (!locked) return
        if (locked.__clarityLockOutline !== undefined) {
          locked.style.outline = locked.__clarityLockOutline
          locked.style.outlineOffset = locked.__clarityLockOffset
          delete locked.__clarityLockOutline
          delete locked.__clarityLockOffset
        }
        locked = null
      }

      function lockTarget(element) {
        if (!element || element.nodeType !== 1) return
        if (hovered === element) hovered = null
        if (locked && locked !== element) clearLock()
        if (!locked) {
          element.__clarityLockOutline = element.style.outline
          element.__clarityLockOffset = element.style.outlineOffset
          locked = element
        }
        element.style.outline = '2px solid #f59e0b'
        element.style.outlineOffset = '2px'
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
        var picked = lineAnchor(event, event.target) || elementAnchor(event.target)
        if (!picked) return
        event.preventDefault()
        event.stopPropagation()
        clearHover()
        lockTarget(picked.element)
        send({ type: 'anchor', anchor: picked.anchor })
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
        var picked = textAnchor()
        if (!picked) return
        suppressClick = true
        lockTarget(picked.element)
        send({ type: 'anchor', anchor: picked.anchor })
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
      // A test round's decision string is composed for the model ("Real test: …").
      // It is not what a person should read at the top of the tab, so the title is
      // the kind and the candidate moves into the meta line.
      return h(
        'div',
        { style: section },
        isTest ? null : h('div', { style: eyebrow }, t('header.decision')),
        h('h2', { style: title }, isTest ? t('header.realTest') : round.decision),
        round.context ? h('p', { style: context }, round.context) : null,
        isTest
          ? h('div', { style: meta }, h('span', null, h('b', null, t('header.candidate')), round.candidate))
          : null,
      )
    }

    function Advice(props) {
      const variant = props.variant
      const rows = []
      if (variant.recommendation) {
        rows.push(
          h(
            'div',
            { key: 'recommendation', style: adviceRow },
            h('span', { style: { ...adviceLabel, color: BRAND } }, t('advice.why')),
            h('span', { style: adviceValue }, variant.recommendation),
          ),
        )
      }
      const cost = Array.isArray(variant.cost) ? variant.cost : []
      cost.forEach((item, index) => {
        rows.push(
          h(
            'div',
            { key: `cost-${index}`, style: adviceRow },
            h('span', { style: adviceLabel }, index === 0 ? t('advice.cost') : ''),
            h('span', { style: adviceValue }, item),
          ),
        )
      })
      if (rows.length === 0) return null
      // Inside the card and above the fidelity rows: the argument and its price
      // belong to the variant they describe, not to a list below both cards.
      return h('div', { style: advice }, rows)
    }

    function Fidelity(props) {
      const variant = props.variant
      const rows = []
      if (variant.real && variant.real.length) rows.push({ key: 'fidelity.real', tone: FIDELITY_TONE.real, value: variant.real.join(', ') })
      if (variant.mocked && variant.mocked.length) rows.push({ key: 'fidelity.mocked', tone: FIDELITY_TONE.mocked, value: variant.mocked.join(', ') })
      if (variant.omitted && variant.omitted.length) rows.push({ key: 'fidelity.omitted', tone: FIDELITY_TONE.omitted, value: variant.omitted.join(', ') })
      if (rows.length === 0) return null
      // Three rows with a dot and an aligned label: as one joined line the three
      // words read as a single grey sentence and stop being distinguishable.
      return h(
        'div',
        { style: fidelity },
        rows.map((row) =>
          h(
            'div',
            { key: row.key, style: fidelityRow },
            h('span', { style: { ...fidelityDot, background: row.tone } }),
            h('span', { style: fidelityLabel }, t(row.key)),
            h('span', { style: { flex: '1 1 0', minWidth: 0 } }, row.value),
          ),
        ),
      )
    }

    // The panel is unmounted whenever another right-sidebar tab is shown, and a
    // reload empties every hook, so a draft kept only in component state is gone
    // on the way back. One draft per round lives here, and in this tab's
    // sessionStorage: a reload keeps it, closing the tab is the end of it.
    const drafts = new Map()
    const DRAFT_LIMIT = 20
    const DRAFT_PREFIX = 'clarity.draft.'
    const DRAFT_FIELDS = [
      'selected',
      'comments',
      'commentText',
      'commentVariantId',
      'editingIndex',
      'editText',
      'pendingAnchor',
      'annotate',
      'note',
    ]

    // A host that blocks storage must cost a reload, not the panel.
    function draftStorage() {
      try {
        const store = window.sessionStorage
        return store && typeof store.getItem === 'function' ? store : null
      } catch {
        return null
      }
    }

    function draftPayload(draft) {
      const payload = {}
      for (const name of DRAFT_FIELDS) payload[name] = draft[name]
      return payload
    }

    // Storage is not ours alone: anything that is not the shape we wrote is
    // dropped rather than half-believed.
    function readStoredDraft(roundId) {
      const store = draftStorage()
      if (store === null) return null
      try {
        const raw = store.getItem(DRAFT_PREFIX + roundId)
        if (typeof raw !== 'string' || raw === '') return null
        const parsed = JSON.parse(raw)
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
        if (!Array.isArray(parsed.comments)) return null
        return parsed
      } catch {
        return null
      }
    }

    function saveDraft(draft) {
      const store = draftStorage()
      if (store === null) return
      try {
        store.setItem(DRAFT_PREFIX + draft.roundId, JSON.stringify(draftPayload(draft)))
      } catch {
        // A full or frozen storage is not worth a broken panel.
      }
    }

    function forgetDraft(roundId) {
      drafts.delete(roundId)
      const store = draftStorage()
      if (store === null) return
      try {
        store.removeItem(DRAFT_PREFIX + roundId)
      } catch {
        // Nothing to do: the entry will go with the tab.
      }
    }

    // One tab can meet many rounds; the oldest stored draft goes first.
    function sweepStoredDrafts() {
      const store = draftStorage()
      if (store === null || typeof store.key !== 'function') return
      try {
        const keys = []
        for (let index = 0; index < store.length; index += 1) {
          const key = store.key(index)
          if (typeof key === 'string' && key.startsWith(DRAFT_PREFIX)) keys.push(key)
        }
        while (keys.length > DRAFT_LIMIT) {
          const key = keys.shift()
          if (typeof key === 'string') store.removeItem(key)
        }
      } catch {
        // A storage we cannot enumerate is one we simply do not prune.
      }
    }

    function draftOf(roundId, seed) {
      const cached = drafts.get(roundId)
      if (cached !== undefined) return cached
      const draft = {
        roundId,
        selected: seed,
        comments: [],
        commentText: '',
        commentVariantId: seed,
        editingIndex: null,
        editText: '',
        pendingAnchor: null,
        annotate: true,
        note: '',
      }
      const stored = readStoredDraft(roundId)
      if (stored !== null) {
        for (const name of DRAFT_FIELDS) {
          if (stored[name] !== undefined) draft[name] = stored[name]
        }
      }
      drafts.set(roundId, draft)
      while (drafts.size > DRAFT_LIMIT) {
        forgetDraft(drafts.keys().next().value)
      }
      sweepStoredDrafts()
      return draft
    }

    // A field that outlives the panel. The draft is the source of truth; the
    // hook state only mirrors it, so a write still redraws, and both the tab
    // and a reload read the same draft back.
    function useRemembered(draft, name) {
      const [value, setValue] = React.useState(draft[name])
      const write = (next) => {
        const resolved = typeof next === 'function' ? next(draft[name]) : next
        draft[name] = resolved
        setValue(resolved)
        saveDraft(draft)
      }
      return [value, write]
    }

    function DecisionView(props) {
      const round = props.round
      const sent = props.sent
      // The recommendation is the variant that carries its own sentence. A round
      // stored before that shape existed falls back to its first variant.
      const recommended = round.variants.find((variant) => variant.recommendation)
      const recommendedId = (recommended ?? round.variants[0] ?? {}).id ?? null
      const draft = draftOf(round.id, recommendedId)
      const [selected, setSelected] = useRemembered(draft, 'selected')
      const [comments, setComments] = useRemembered(draft, 'comments')
      const [commentText, setCommentText] = useRemembered(draft, 'commentText')
      const [commentVariantId, setCommentVariantId] = useRemembered(draft, 'commentVariantId')
      // One comment at a time turns back into an input: its anchor and the
      // variant it belongs to stay on screen while its text is rewritten.
      const [editingIndex, setEditingIndex] = useRemembered(draft, 'editingIndex')
      const [editText, setEditText] = useRemembered(draft, 'editText')
      const [pendingAnchor, setPendingAnchor] = useRemembered(draft, 'pendingAnchor')
      const [annotate, setAnnotate] = useRemembered(draft, 'annotate')
      const [note, setNote] = useRemembered(draft, 'note')
      const [error, setError] = React.useState(null)
      // The comment this session just added, so only that one rises into place.
      const [lastAdded, setLastAdded] = React.useState(-1)
      // Which verb is in flight, if any. One boolean was not enough: every verb shares
      // the same bar, and the accept button was reporting sends it had not been asked
      // to make.
      const [pending, setPending] = React.useState(null)
      const busy = pending !== null
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
          setAnnotate(false)
          setError(null)
          if (composerRef.current) {
            composerRef.current.focus()
            try {
              composerRef.current.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
            } catch {
              // Older engines scroll on focus alone.
            }
          }
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
          setError(t('comment.empty'))
          return
        }
        const variantId = pendingAnchor ? pendingAnchor.variantId : commentVariantId
        const variant = round.variants.find((entry) => entry.id === variantId)
        if (!variant) {
          setError(t('comment.chooseVariant'))
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
        setLastAdded(comments.length)
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
        setLastAdded(-1)
        // An edit that was open follows the list: it closes with the comment it
        // belonged to, and shifts up when an earlier comment goes.
        if (editingIndex === index) {
          setEditingIndex(null)
          setEditText('')
        } else if (editingIndex !== null && index < editingIndex) {
          setEditingIndex(editingIndex - 1)
        }
      }

      // Rewriting a comment keeps its anchor, its variant, and its place in the
      // list: only the text is replaced. An empty save is refused rather than
      // silently deleting the comment.
      function saveEdit() {
        const text = editText.trim()
        if (text === '') {
          setError(t('comment.empty'))
          return false
        }
        setComments((current) => current.map((entry, i) => (i === editingIndex ? { ...entry, text } : entry)))
        setEditingIndex(null)
        setEditText('')
        setError(null)
        return true
      }

      function beginEdit(index) {
        if (editingIndex === index) return
        // Opening another comment saves the one being edited; refusing the save
        // keeps the current one open instead of losing what was typed.
        if (editingIndex !== null && !saveEdit()) return
        setEditingIndex(index)
        setEditText(comments[index].text)
        setError(null)
      }

      function cancelEdit() {
        setEditingIndex(null)
        setEditText('')
        setError(null)
      }

      async function submit(verdict) {
        // A comment typed into the box but never added travels with the decision.
        // Losing what you just wrote is worse than sending one comment too many.
        const unsent = commentText.trim()
        const variantId = pendingAnchor ? pendingAnchor.variantId : commentVariantId
        const variant = round.variants.find((entry) => entry.id === variantId)
        const carried =
          unsent === '' || !variant
            ? null
            : {
                variantId,
                text: unsent,
                anchor: pendingAnchor ? pendingAnchor.anchor : { kind: 'variant' },
                artifactHash: contentHash(variant.html),
              }
        // An edit typed but not saved travels with the decision too: it is the
        // same loss as an unsent comment, and this decision is what it was for.
        const rewritten = editingIndex !== null && editText.trim() !== ''
        const base = rewritten
          ? comments.map((entry, i) => (i === editingIndex ? { ...entry, text: editText.trim() } : entry))
          : comments
        const outgoing = carried === null ? base : [...base, carried]

        if (verdict === 'accept' && !selected) {
          setError(t('comment.chooseVariant'))
          return
        }
        if ((verdict === 'revise' || verdict === 'reject') && outgoing.length === 0 && note.trim() === '') {
          setError(t('comment.needsText'))
          return
        }
        setPending(verdict)
        setError(null)
        try {
          const body = { roundId: round.id, verdict, selected, comments: outgoing, note }
          const result = await api('/decide', { method: 'POST', body: JSON.stringify(body) })
          if (carried !== null || rewritten) {
            setPendingAnchor(null)
            setCommentText('')
            setEditingIndex(null)
            setEditText('')
          }
          // The decision is the host's now; the draft that fed it is spent.
          forgetDraft(round.id)
          props.onSent(result.result)
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : String(cause))
        } finally {
          setPending(null)
        }
      }

      /**
       * One verb in the decision bar. Only the button you pressed says it is working,
       * and its label stays put: the spinner's box exists at rest, so the row cannot
       * rewrap under the pointer.
       * @param {string} verdict - the verb this button submits.
       * @param {object} base - its resting style.
       * @param {string} label - its text.
       * @param {string} [tone] - 'primary' for the filled one.
       * @returns {object} the button node.
       */
      function verbButton(verdict, base, label, tone) {
        const working = pending === verdict
        return h(
          'button',
          {
            type: 'button',
            'data-tone': tone,
            'data-busy': working ? 'true' : undefined,
            // Working is not unavailable: the button keeps full opacity and says so
            // with a progress cursor. It has to be said here, because the disabled
            // style it also carries is inline, and an inline declaration is what a
            // stylesheet rule cannot reach.
            style: working ? { ...base, cursor: 'progress' } : disabled ? { ...base, ...buttonDisabled } : base,
            onClick: () => submit(verdict),
            disabled,
          },
          tone === 'primary' ? h('span', { className: 'clarity-spin' }) : null,
          label,
        )
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
              'data-tone': annotate ? 'primary' : undefined,
              style: annotate ? { ...buttonPrimary, padding: '2px 8px' } : { ...buttonBase, padding: '2px 8px' },
              'aria-pressed': annotate,
              onClick: () => setAnnotate((current) => !current),
              disabled,
            },
            annotate ? t('annotate.on') : t('annotate.off'),
          ),
          pendingAnchor
            ? h(
                'span',
                { style: { color: 'var(--dsw-alias-label-secondary)' } },
                t('annotate.anchored', { anchor: anchorLabel(pendingAnchor.anchor) }),
              )
            : annotate
              ? h(
                  'span',
                  { style: { color: 'var(--dsw-alias-label-secondary)' } },
                  t('annotate.hint'),
                )
              : h('span', { style: { color: MUTED } }, t('annotate.offHint')),
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
                className: 'clarity-card',
                'aria-pressed': selected === variant.id,
                // The ring, the lift and the header tint are the stylesheet's: it
                // owns every state that a click changes, so they cannot drift.
                style: variantCard,
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
                { className: 'clarity-vhead', style: vhead },
                h('span', { className: 'clarity-radio', style: radio }, selected === variant.id ? '●' : '○'),
                h('span', { style: vlabel }, variant.label),
              ),
              variant.source ? h('div', { style: sourceLine, title: variant.source }, variant.source) : null,
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
              h(Advice, { variant }),
              h(Fidelity, { variant }),
            ),
          ),
        ),
        h(
          'div',
          { style: section },
          h(
            'div',
            { style: sectionTitle },
            t('comments.title'),
            comments.length === 0 ? null : h('span', { style: countChip }, String(comments.length)),
          ),
          pendingAnchor
            ? h(
                'div',
                { style: { ...card, gap: '3px', padding: '6px 8px', borderColor: BRAND } },
                h(
                  'div',
                  { style: { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' } },
                  h('span', { style: eyebrow }, t('comments.commentingOn')),
                  h('span', { style: anchorTag }, anchorLabel(pendingAnchor.anchor)),
                  h(
                    'button',
                    {
                      type: 'button',
                      style: linkButton,
                      onClick: () => setPendingAnchor(null),
                      disabled,
                    },
                    t('comments.clear'),
                  ),
                ),
                h('div', { style: { color: MUTED, fontSize: '10px' } }, variantLabel(round, pendingAnchor.variantId)),
              )
            : null,
          // An empty list draws no paragraph: the annotation bar already says how a
          // comment starts, and the composer under it is the invitation.
          comments.length === 0
            ? pendingAnchor
              ? h('div', { style: { color: MUTED } }, t('comments.emptyAnchored'))
              : null
            : h(
                'div',
                { style: { display: 'flex', flexDirection: 'column', gap: '4px' } },
                comments.map((comment, index) => {
                  const editing = editingIndex === index
                  return h(
                    'div',
                    {
                      key: String(index),
                      className: 'clarity-row',
                      // Only the row this session just added rises into place; a
                      // draft read back on reload arrives with the round, not one
                      // row at a time.
                      'data-new': index === lastAdded ? 'true' : undefined,
                      style: editing ? commentItem : { ...commentItem, cursor: 'pointer' },
                      title: editing ? undefined : t('comments.showSpot'),
                      onClick: editing ? undefined : () => focusComment(comment),
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
                      editing
                        ? h('textarea', {
                            value: editText,
                            rows: 2,
                            autoFocus: true,
                            onChange: (event) => setEditText(event.target.value),
                            onKeyDown: (event) => {
                              // Esc drops the edit; Ctrl/Cmd+Enter saves it.
                              if (event.key === 'Escape') {
                                event.preventDefault()
                                cancelEdit()
                              }
                              if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                                event.preventDefault()
                                saveEdit()
                              }
                            },
                            style: { ...input, minHeight: '44px', resize: 'vertical', lineHeight: '18px' },
                            disabled,
                          })
                        : h('span', { style: { overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' } }, comment.text),
                      editing
                        ? h(
                            'div',
                            { style: { display: 'flex', gap: '4px', justifyContent: 'flex-end', marginTop: '2px' } },
                            h(
                              'button',
                              {
                                type: 'button',
                                style: disabled ? { ...buttonBase, ...buttonDisabled } : buttonBase,
                                onClick: cancelEdit,
                                disabled,
                              },
                              t('comments.cancelEdit'),
                            ),
                            h(
                              'button',
                              {
                                type: 'button',
                                'data-tone': 'primary',
                                style: disabled ? { ...buttonPrimary, ...buttonDisabled } : buttonPrimary,
                                onClick: saveEdit,
                                disabled,
                              },
                              t('comments.save'),
                            ),
                          )
                        : null,
                    ),
                    editing
                      ? null
                      : h(
                          'div',
                          { style: { display: 'flex', flex: 'none', alignItems: 'flex-start', gap: '2px' } },
                          h(
                            'button',
                            {
                              type: 'button',
                              title: t('comments.edit'),
                              style: { ...buttonBase, padding: '0 4px', border: 0, background: 'transparent', color: MUTED },
                              onClick: (event) => {
                                event.stopPropagation()
                                beginEdit(index)
                              },
                              disabled,
                            },
                            t('comments.edit'),
                          ),
                          h(
                            'button',
                            {
                              type: 'button',
                              title: t('comments.remove'),
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
                  )
                }),
              ),
          h(
            'div',
            { style: { display: 'flex', gap: '4px', alignItems: 'flex-end', flexWrap: 'wrap' } },
            pendingAnchor
              ? null
              : h(
                  'div',
                  { style: chipRow, role: 'group', 'aria-label': t('comments.onVariant') },
                  round.variants.map((variant) =>
                    h(
                      'button',
                      {
                        key: variant.id,
                        type: 'button',
                        style: commentVariantId === variant.id ? chipOn : chip,
                        'aria-pressed': commentVariantId === variant.id,
                        title: variant.label,
                        onClick: () => setCommentVariantId(variant.id),
                        disabled,
                      },
                      variant.id.toUpperCase(),
                    ),
                  ),
                ),
            h('textarea', {
              ref: composerRef,
              value: commentText,
              rows: 2,
              onChange: (event) => setCommentText(event.target.value),
              onKeyDown: (event) => {
                // Enter writes a new line; Ctrl/Cmd+Enter adds the comment.
                if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                  event.preventDefault()
                  addComment()
                }
              },
              placeholder: pendingAnchor
                ? t('composer.placeholderAnchored')
                : t('composer.placeholder'),
              style: { ...input, flex: '1 1 160px', width: 'auto', minHeight: '44px', resize: 'vertical', lineHeight: '18px' },
              disabled,
            }),
            h(
              'button',
              { type: 'button', style: disabled ? { ...buttonBase, ...buttonDisabled } : buttonBase, onClick: addComment, disabled },
              t('composer.add'),
            ),
          ),
        ),
        h(
          'div',
          { style: section },
          h('label', { style: sectionTitle, htmlFor: 'clarity-note' }, t('note.label')),
          h('textarea', {
            id: 'clarity-note',
            value: note,
            onChange: (event) => setNote(event.target.value),
            rows: 2,
            placeholder: t('note.placeholder'),
            style: { ...input, resize: 'vertical', minHeight: '40px' },
            disabled,
          }),
        ),
        error ? h('div', { style: errorText, role: 'alert' }, error) : null,
        h(
          'div',
          { style: actions },
          verbButton('accept', buttonPrimary, `${t('action.accept')} ${variantLabel(round, selected)}`, 'primary'),
          verbButton('revise', buttonBase, selected ? `${t('action.revise')} ${selected.toUpperCase()}` : t('action.revise')),
          verbButton('reject', buttonDanger, t('action.rejectAll', { variants: round.variants.map((variant) => variant.id.toUpperCase()).join('&') })),
          verbButton('cancel', buttonBase, t('action.cancel')),
        ),
      )
    }

    function TestView(props) {
      const round = props.round
      const sent = props.sent
      const prepared = round.prepared && typeof round.prepared.command === 'string' ? round.prepared : null
      // The tab never runs anything: `runThis` is a line the user copies into a
      // terminal. Whoever starts the process owns it, so the round records no
      // start, no output, and no stop.
      const runThis = typeof round.runThis === 'string' && round.runThis !== '' ? round.runThis : null
      const [phase, setPhase] = React.useState('ready')
      const [observed, setObserved] = React.useState('')
      const [shots, setShots] = React.useState([])
      const [selectedShot, setSelectedShot] = React.useState(0)
      // Which verb is in flight, if any: the pressed button is the one that says it is
      // working, the other two simply go quiet.
      const [pending, setPending] = React.useState(null)
      const busy = pending !== null
      const [error, setError] = React.useState(null)
      const [copied, setCopied] = React.useState(false)
      const fileRef = React.useRef(null)
      const panelRef = React.useRef(null)
      const disabled = busy || sent !== null
      const activeShot = Math.min(selectedShot, Math.max(0, shots.length - 1))

      // Up to four PNG/JPEG/WebP files, kept as data URLs until the test is sent.
      function addShots(files) {
        const list = Array.from(files || []).filter(
          (file) => /^image\/(png|jpeg|webp)$/.test(file.type) && file.size <= 8 * 1024 * 1024,
        )
        if (list.length === 0) return
        setSelectedShot(shots.length + list.length - 1)
        for (const file of list) {
          const reader = new FileReader()
          reader.onload = () => {
            if (typeof reader.result !== 'string') return
            setShots((previous) =>
              previous.length >= 4
                ? previous
                : [...previous, { name: file.name || 'screenshot.png', dataUrl: reader.result }],
            )
          }
          reader.readAsDataURL(file)
        }
      }

      function removeShot(index) {
        setShots((previous) => previous.filter((_, position) => position !== index))
        setSelectedShot((current) => Math.max(0, Math.min(current, shots.length - 2)))
      }

      /** A pasted image arrives either as a File or as a file item, depending on the source. */
      function clipboardImages(data) {
        if (!data) return []
        const files = []
        if (data.files && data.files.length > 0) {
          files.push(...data.files)
        } else if (data.items) {
          for (const item of data.items) {
            if (item.kind !== 'file') continue
            const file = typeof item.getAsFile === 'function' ? item.getAsFile() : null
            if (file) files.push(file)
          }
        }
        return files.filter((file) => /^image\//.test(file.type))
      }

      // Paste is scoped to this panel: the harness installs its own document
      // drop target, and the chat composer owns pastes outside this tab.
      React.useEffect(() => {
        if (phase !== 'observe' || disabled) return undefined
        const onPaste = (event) => {
          const root = panelRef.current
          if (!root) return
          const active = typeof document === 'undefined' ? null : document.activeElement
          const inside =
            (event.target && root.contains(event.target)) || (active && root.contains(active))
          if (!inside) return
          const files = clipboardImages(event.clipboardData)
          if (files.length === 0) return
          event.preventDefault()
          addShots(files)
        }
        document.addEventListener('paste', onPaste)
        return () => document.removeEventListener('paste', onPaste)
      })

      async function submit(verdict) {
        // A failure has to say what was seen; cancelling records no verdict at all.
        if (verdict === 'fail' && observed.trim() === '') {
          setError(t('test.needsObservation'))
          return
        }
        setPending(verdict)
        setError(null)
        try {
          const body = {
            roundId: round.id,
            verdict,
            // An empty box means "no observation", so it is left out rather than
            // sent as '': the route treats a present-but-empty field as a bad
            // argument, and a pass or a cancel is allowed to carry none. Blank
            // counts, not just '' — the `fail` guard above already trims.
            ...(observed.trim() === '' ? {} : { observed }),
            screenshots: shots.map((shot) => ({ name: shot.name, dataUrl: shot.dataUrl })),
          }
          const result = await api('/test', { method: 'POST', body: JSON.stringify(body) })
          props.onSent(result.result)
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : String(cause))
        } finally {
          setPending(null)
        }
      }

      /**
       * One verb in the test bar. The one you pressed says it is working; the other
       * two only go quiet, because they are not.
       * @param {string} verdict - the verb this button submits.
       * @param {object} base - its resting style.
       * @param {string} label - its text.
       * @param {string} [tone] - 'primary' for the filled one.
       * @returns {object} the button node.
       */
      function verbButton(verdict, base, label, tone) {
        const working = pending === verdict
        return h(
          'button',
          {
            type: 'button',
            'data-tone': tone,
            'data-busy': working ? 'true' : undefined,
            // The greying that disables the other two is inline, so "working" is said
            // inline here too — a stylesheet rule could not reach it.
            style: working ? { ...base, cursor: 'progress' } : disabled ? { ...base, ...buttonDisabled } : base,
            onClick: () => submit(verdict),
            disabled,
          },
          // The primary carries the spinner at rest — same box, hidden ink — so pressing
          // it cannot change the bar's width. The others say it with the sheen alone.
          tone === 'primary' ? h('span', { className: 'clarity-spin' }) : null,
          label,
        )
      }

      /** Put the command on the clipboard; the user runs it, the tab never does. */
      async function copyRun() {
        if (runThis === null) return
        if (typeof navigator === 'undefined' || !navigator.clipboard) return
        try {
          await navigator.clipboard.writeText(runThis)
          setCopied(true)
        } catch {
          setCopied(false)
        }
      }

      // The build and the command stay on screen in both phases: once you are
      // looking at the app, the line tells you which build you are looking at.
      const preparedBlock = h(
        'div',
        { style: section },
        prepared
          ? h(
              'div',
              { style: preparedLine },
              t('test.prepared'),
              h('b', null, clock(prepared.builtAt)),
              ' · ',
              h('b', null, prepared.command),
            )
          : h('div', { style: preparedLine }, t('test.noPrepared')),
        runThis === null
          ? null
          : h(
              'div',
              { style: { ...preparedLine, display: 'flex', gap: '8px', alignItems: 'baseline', flexWrap: 'wrap' } },
              t('test.run'),
              h('code', { style: { overflowWrap: 'anywhere' } }, runThis),
              h('button', { type: 'button', style: linkButton, onClick: copyRun }, copied ? t('test.copied') : t('test.copy')),
            ),
      )

      return h(
        React.Fragment,
        null,
        h(
          'div',
          { style: card },
          h('div', { style: sectionTitle }, t('test.preconditions')),
          h('ul', { style: list }, round.scenario.preconditions.map((item, index) => h('li', { key: String(index) }, item))),
          h('div', { style: sectionTitle }, t('test.steps')),
          h('ol', { style: list }, round.scenario.steps.map((item, index) => h('li', { key: String(index) }, item))),
          h('div', { style: sectionTitle }, t('test.expected')),
          h('ul', { style: list }, round.scenario.expected.map((item, index) => h('li', { key: String(index) }, item))),
          h('div', { style: sectionTitle }, t('test.failure')),
          h('div', { style: { color: 'var(--dsw-alias-label-secondary)' } }, round.scenario.failureSignature),
          h('div', { style: sectionTitle }, t('test.rollback')),
          h('div', { style: { color: 'var(--dsw-alias-label-secondary)' } }, round.scenario.rollback),
        ),
        phase === 'ready'
          ? h(
              'div',
              { style: section },
              preparedBlock,
              h(
                'button',
                {
                  type: 'button',
                  'data-tone': 'primary',
                  style: disabled ? { ...buttonPrimary, ...buttonDisabled } : buttonPrimary,
                  onClick: () => setPhase('observe'),
                  disabled,
                },
                t('test.ready'),
              ),
            )
          : h(
              'div',
              { style: section, ref: panelRef },
              preparedBlock,
              h('div', { style: sectionTitle }, t('test.observed')),
              h('textarea', {
                value: observed,
                onChange: (event) => setObserved(event.target.value),
                rows: 3,
                placeholder: t('test.observedPlaceholder'),
                style: { ...input, resize: 'vertical', minHeight: '52px' },
                disabled,
              }),
              h(
                'div',
                {
                  style: { marginTop: '10px' },
                  // The harness listens for files on `document` and would also add
                  // them to the chat composer, so stop the event at this zone.
                  onDragEnter: (event) => {
                    event.preventDefault()
                    event.stopPropagation()
                  },
                  onDragOver: (event) => {
                    event.preventDefault()
                    event.stopPropagation()
                  },
                  onDrop: (event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    addShots(event.dataTransfer.files)
                  },
                },
                h(
                  'div',
                  { style: sectionTitle },
                  shots.length === 0 ? t('test.screenshot') : t('test.screenshotOf', { index: activeShot + 1, total: shots.length }),
                ),
                shots.length === 0
                  ? null
                  : h('img', {
                      alt: '',
                      src: shots[activeShot].dataUrl,
                      style: {
                        width: '100%',
                        maxHeight: '220px',
                        objectFit: 'contain',
                        display: 'block',
                        border: HAIRLINE,
                        borderRadius: '6px',
                        background: 'var(--dsw-alias-bg-base)',
                      },
                    }),
                h(
                  'div',
                  { style: { display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap', alignItems: 'center' } },
                  shots.map((shot, index) =>
                    h(
                      'button',
                      {
                        key: shot.name + String(index),
                        type: 'button',
                        title: shot.name,
                        'aria-label': `Show screenshot ${index + 1}`,
                        onClick: () => setSelectedShot(index),
                        style: {
                          width: '46px',
                          height: '34px',
                          padding: 0,
                          overflow: 'hidden',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          background: 'transparent',
                          border: index === activeShot ? '2px solid var(--dsw-alias-label-primary)' : HAIRLINE,
                        },
                      },
                      h('img', {
                        src: shot.dataUrl,
                        alt: '',
                        style: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
                      }),
                    ),
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      'aria-label': t('test.addScreenshot'),
                      style: { ...buttonBase, width: '46px', height: '34px', padding: 0 },
                      onClick: () => fileRef.current && fileRef.current.click(),
                    },
                    '+',
                  ),
                  h('input', {
                    ref: fileRef,
                    type: 'file',
                    accept: 'image/png,image/jpeg,image/webp',
                    multiple: true,
                    style: { display: 'none' },
                    onChange: (event) => {
                      addShots(event.target.files)
                      event.target.value = ''
                    },
                  }),
                ),
                shots.length === 0
                  ? null
                  : h(
                      'button',
                      {
                        type: 'button',
                        style: { ...linkButton, color: MUTED, marginTop: '4px' },
                        onClick: () => removeShot(activeShot),
                      },
                      t('test.remove'),
                    ),
                h(
                  'div',
                  { style: { color: MUTED, fontSize: '10px', marginTop: '4px' } },
                  t('test.dropHint'),
                ),
              ),
              error ? h('div', { style: errorText, role: 'alert' }, error) : null,
              h(
                'div',
                { style: actions },
                verbButton('pass', buttonPrimary, t('test.pass'), 'primary'),
                verbButton('fail', buttonDanger, t('test.fail')),
                verbButton('cancel', buttonBase, t('test.cancel')),
              ),
            ),
      )
    }

    const roundFeed = {
      listeners: new Set(),
      subscribe(listener) {
        roundFeed.listeners.add(listener)
        return () => roundFeed.listeners.delete(listener)
      },
      publish() {
        for (const listener of [...roundFeed.listeners]) {
          try {
            listener()
          } catch {
            // One panel failing must not silence the others.
          }
        }
      },
    }

    /** The newest still-open round of one conversation, or null. */
    function newestOpenRound(rounds, sessionId) {
      if (!Array.isArray(rounds)) return null
      let newest = null
      for (const round of rounds) {
        if (!round || round.sessionId !== sessionId || round.status !== 'open') continue
        if (newest === null || (round.createdAt || 0) >= (newest.createdAt || 0)) newest = round
      }
      return newest
    }

    function RoundPanel(props) {
      const info = props.useTabInfo ? props.useTabInfo() : null
      const paramRoundId = info && info.tab && info.tab.navigation && info.tab.navigation.params
        ? info.tab.navigation.params.roundId
        : undefined
      const [state, setState] = React.useState({ loading: true, error: null, round: null })
      const [sent, setSent] = React.useState(null)
      // The round this body last resolved; the host is authoritative, so the id
      // is only a locator — never a substitute for asking.
      const knownRound = React.useRef(null)

      React.useEffect(() => {
        let live = true
        let ticket = 0
        const load = async () => {
          const mine = ++ticket
          let next = null
          try {
            const body = await api('/rounds?sessionId=' + encodeURIComponent(props.sessionId))
            next = newestOpenRound(body.rounds, props.sessionId)
          } catch (cause) {
            if (live && mine === ticket) {
              setState({ loading: false, error: cause instanceof Error ? cause.message : String(cause), round: null })
            }
            return
          }
          const known = paramRoundId ?? knownRound.current
          if (next === null && known) {
            // A settled round still deserves its record, not an empty tab.
            try {
              const body = await api('/round?id=' + encodeURIComponent(known))
              if (body.round && body.round.sessionId === props.sessionId) next = body.round
            } catch {
              // The host no longer has it: the empty state is the honest answer.
            }
          }
          if (!live || mine !== ticket) return
          if (next !== null && next.id !== knownRound.current) {
            knownRound.current = next.id
            setSent(null)
          }
          setState({ loading: false, error: null, round: next })
        }
        // Keep the round on screen while a refresh is in flight; only a first
        // load shows the placeholder.
        setState((previous) => ({ loading: previous.round === null, error: null, round: previous.round }))
        load()
        const unsubscribe = roundFeed.subscribe(load)
        return () => {
          live = false
          unsubscribe()
        }
      }, [paramRoundId, props.sessionId])

      if (state.loading) {
        return h('div', scope(rootPadded), h('div', { style: { color: MUTED } }, t('state.reading')))
      }
      if (state.error) {
        return h('div', scope(rootPadded), h('div', { style: errorText, role: 'alert' }, state.error))
      }
      const round = state.round
      if (!round) {
        if (sent) {
          return h(
            'div',
            scope(rootPadded),
            h(
              'div',
              { style: { ...card, borderColor: 'var(--dsw-alias-state-success-primary)' } },
              h('div', { style: { ...successText, fontWeight: 600 } }, t('state.decisionSent')),
              h('p', { style: { ...context, margin: 0 } }, t('state.close')),
            ),
          )
        }
        return h(
          'div',
          scope(rootPadded),
          h('div', { style: eyebrow }, 'Collaborative Clarity'),
          h('h2', { style: title }, t('state.noRound')),
          h(
            'p',
            { style: context },
            t('state.noRoundHint'),
          ),
        )
      }
      if (round.status !== 'open' && !sent) {
        return h(
          'div',
          scope(rootPadded),
          h(Header, { round }),
          h(
            'div',
            { style: card },
            h('div', { style: { fontWeight: 600 } }, round.status === 'cancelled' ? t('state.roundCancelled') : t('state.answered')),
            h('div', { style: { color: 'var(--dsw-alias-label-secondary)' } }, t('state.hasResult')),
          ),
        )
      }
      if (sent) {
        return h(
          'div',
          scope(rootPadded),
          h(Header, { round }),
          h(
            'div',
            { style: { ...card, borderColor: 'var(--dsw-alias-state-success-primary)' } },
            h('div', { style: { ...successText, fontWeight: 600 } }, sent.status === 'tested' ? 'Result sent to the agent.' : sent.status === 'cancelled' ? 'Round cancelled.' : t('state.decisionSent')),
            h(
              'div',
              { style: { color: 'var(--dsw-alias-label-secondary)' } },
              sent.verdict ? t('state.verdict', { verdict: sent.verdict }) : t('state.returned'),
              sent.selected ? t('state.selected', { selected: sent.selected }) : '',
            ),
          ),
          h('p', { style: { ...context, marginTop: '2px' } }, t('state.close')),
        )
      }
      const complete = (result) => {
        setSent(result)
      }
      // The root carries the round id as its key: a new round mounts a new root, so
      // the entrance plays exactly once per round and never on a re-render.
      return h(
        'div',
        { key: round.id, className: 'clarity-scope clarity-arrival', style: root },
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
        createdAt: round.createdAt || Date.now(),
        release,
      })
      notifyPending()
    }

    /**
     * Reconcile the pending map with the host's authoritative open-round list.
     *
     * A dropped stream, a reload, or a missed frame all converge here: the host
     * is the source of truth, so reconnecting re-reads it instead of trusting
     * what the browser accumulated.
     * @param {object[]} rounds - every round still open on the host.
     * @returns {void}
     */
    function replacePending(rounds) {
      const live = new Set()
      for (const round of rounds) {
        if (!round || typeof round.id !== 'string') continue
        live.add(round.id)
        if (!pending.has(round.id)) rememberPending(round)
      }
      for (const roundId of [...pending.keys()]) {
        if (!live.has(roundId)) forgetPending(roundId)
      }
    }

    /** The newest round waiting in one conversation, or null. */
    function latestPendingFor(sessionId) {
      let latest = null
      for (const entry of pending.values()) {
        if (entry.sessionId !== sessionId) continue
        if (latest === null || (entry.createdAt || 0) >= (latest.createdAt || 0)) latest = entry
      }
      return latest
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

    // -------------------------------------------------------------------------
    // The decision row in the transcript
    //
    // A round's outcome is already in the session log: the tool call and its
    // result are recorded events. So this row is projected from those events and
    // never read back from the plugin store — a reload, a second browser, and
    // next month's history page all draw the same bubble. `ask_user_question`
    // records its answered batches the same way; this is that seam, for our tool.
    // -------------------------------------------------------------------------

    const CHAT_SLOT = 'conversation.chat.node'
    const NODE_KIND = 'clarity-decision'
    const ROUND_TOOL = 'clarity_round'
    const TEST_TOOL = 'clarity_test'

    /**
     * The bubble every real user message is drawn with, when this harness has it.
     *
     * It is a baseline client module of the host, not one of ours, so the row
     * lands indistinguishable from the chat around it. A harness without it gets
     * our own box: a missing primitive must cost the styling, not the row.
     */
    const SharedBubble = (() => {
      try {
        const primitives = require('@deepseek-ai/dsh-client-ui-primitives')
        const candidate = primitives === null || primitives === undefined ? null : primitives.UserMessageBubble
        return candidate === undefined ? null : candidate
      } catch {
        return null
      }
    })()

    /** Parse a tool payload that arrives either as JSON text or as a ready value. */
    function readJson(value) {
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value)
          return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null
        } catch {
          return null
        }
      }
      return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null
    }

    /** The one text block a tool result carries, or '' when it carries anything else. */
    function resultText(message) {
      const content = message && Array.isArray(message.content) ? message.content : []
      if (content.length !== 1 || !content[0] || content[0].type !== 'text') return ''
      return typeof content[0].text === 'string' ? content[0].text : ''
    }

    /** The label a variant id had in this round's arguments. */
    function labelOf(labels, id) {
      if (typeof id !== 'string' || id === '') return ''
      return labels[id] === undefined ? id : labels[id]
    }

    /** The recorded verdict as a word, or '' for a verdict this row does not draw. */
    function verdictWord(verdict) {
      if (verdict === 'accept') return t('bubble.accept')
      if (verdict === 'revise') return t('bubble.revise')
      if (verdict === 'reject') return t('bubble.reject')
      if (verdict === 'pass') return t('bubble.pass')
      if (verdict === 'fail') return t('bubble.fail')
      if (verdict === 'blocked') return t('bubble.blocked')
      return ''
    }

    /** One line for those decisions that picked a variant. */
    function verdictLine(data) {
      const word = verdictWord(data && data.verdict)
      if (word === '') return ''
      if (!data.variantLabel) return word
      return word + ' · ' + t('bubble.variant', { label: data.variantLabel })
    }

    /** The file name of a path the Host wrote, for the one-line screenshot row. */
    function fileNameOf(path) {
      const parts = String(path).split('/')
      const last = parts[parts.length - 1]
      return last === '' ? String(path) : last
    }

    /** What the copy action writes: the same lines, without the chrome. */
    function bubbleText(data) {
      const lines = []
      if (data.candidate || data.decision) lines.push(data.candidate || data.decision)
      const line = verdictLine(data)
      if (line !== '') lines.push(line)
      if (data.observed) lines.push(data.observed)
      for (const comment of Array.isArray(data.comments) ? data.comments : []) {
        lines.push(anchorLabel(comment.anchor) + ' — ' + comment.text)
      }
      if (data.note) lines.push(t('bubble.noteLine', { note: data.note }))
      const shots = Array.isArray(data.shots) ? data.shots : []
      for (const path of shots) lines.push(t('bubble.shots') + ' ' + path)
      return lines.join('\n')
    }

    /** The verbs each kind of row can word; anything else draws nothing. */
    const DECISION_VERDICTS = ['accept', 'revise', 'reject']
    const TEST_VERDICTS = ['pass', 'fail', 'blocked']

    /** The screenshot paths the Host wrote, in gate order, relative to the session. */
    function shotPaths(value) {
      const paths = []
      for (const shot of Array.isArray(value) ? value : []) {
        if (!shot || typeof shot.path !== 'string' || shot.path === '') continue
        paths.push(shot.path)
      }
      return paths
    }

    /** The comments the panel sent, each with an anchor this row can word. */
    function commentsOf(value) {
      const comments = []
      for (const comment of Array.isArray(value) ? value : []) {
        if (!comment || typeof comment.text !== 'string' || comment.text === '') continue
        comments.push({
          text: comment.text,
          // A stored anchor is what the panel sent; anything else is read as the
          // whole-variant anchor, which is the widest true statement.
          anchor: isAnchor(comment.anchor) ? comment.anchor : { kind: 'variant' },
        })
      }
      return comments
    }

    /**
     * Fold our own tool call into the row that records what the user chose.
     *
     * `start` keeps the decision sentence and the variant labels from the call
     * arguments; `update` reads the verdict out of the tool result. Everything
     * else — a cancelled round, a round still pending, an error, a result that
     * is not ours — leaves the node unset, and an unset node is a row that is
     * simply not there. The node is built once, in `update`, so replaying the
     * same history hands the view back the same object instead of a new one.
     */
    const decisionNode = {
      kind: 'clarity-round',
      target: 'chat',
      match(event) {
        if (event === null || typeof event !== 'object') return null
        if (event.type === 'tool/call') {
          const data = event.data
          if (!data || (data.name !== ROUND_TOOL && data.name !== TEST_TOOL)) return null
          return { id: String(data.callId), role: 'start' }
        }
        if (event.type === 'tool/result' && event.surfaceOp === 'append') {
          // A native result does not name its tool. The call id is the identity,
          // and the round id inside the payload says the result is one of ours:
          // every other tool's result is left to the generic Tool row.
          const message = event.data ? event.data.message : null
          const callId = message && message.source ? message.source.callId : undefined
          if (typeof callId !== 'string') return null
          const value = readJson(resultText(message))
          if (!value || typeof value.roundId !== 'string') return null
          return { id: callId, role: 'update' }
        }
        return null
      },
      start(_context, match) {
        const event = match.event
        const args = event && event.type === 'tool/call' ? readJson(event.data.arguments) : null
        const test = event && event.type === 'tool/call' && event.data.name === TEST_TOOL
        const labels = {}
        const variants = args && Array.isArray(args.variants) ? args.variants : []
        for (const variant of variants) {
          if (!variant || typeof variant.id !== 'string' || variant.id === '') continue
          labels[variant.id] =
            typeof variant.label === 'string' && variant.label !== '' ? variant.label : variant.id
        }
        // The muted first line: the question that was asked, or what was tested.
        const label = test
          ? args && typeof args.candidate === 'string' ? args.candidate : ''
          : args && typeof args.decision === 'string' ? args.decision : ''
        return { kind: test ? 'test' : 'decision', label, labels, node: null }
      },
      update(context, match) {
        const state = context.state
        // Settled once, and the first settlement stands: a later event for the
        // same call must not rewrite a row the user may already be reading.
        if (!state || state.node !== null) return state
        const event = match.event
        const message = event && event.type === 'tool/result' ? event.data.message : null
        if (!message || message.isError === true) return state
        const value = readJson(resultText(message))
        // One check per kind, and it is the whole rule: a verb this row can
        // word. Everything the Host says otherwise — pending, cancelled,
        // errored, a verb from the other kind — leaves the node unset, and an
        // unset node is a row that is simply not there.
        const drawable = state.kind === 'test' ? TEST_VERDICTS : DECISION_VERDICTS
        if (!value || !drawable.includes(value.verdict)) return state
        const data = {
          kind: state.kind,
          verdict: value.verdict,
          time: typeof event.time === 'number' ? event.time : 0,
        }
        if (state.kind === 'test') {
          data.candidate = state.label
          data.observed = typeof value.observed === 'string' ? value.observed : ''
          data.shots = shotPaths(value.screenshots)
        } else {
          data.decision = state.label
          data.variantLabel = value.verdict === 'reject' ? '' : labelOf(state.labels, value.selected)
          data.comments = commentsOf(value.comments)
          data.note = typeof value.note === 'string' ? value.note : ''
        }
        return {
          ...state,
          node: {
            key: context.key,
            id: context.id,
            kind: NODE_KIND,
            target: 'chat',
            anchorSeq: event.seq,
            location: context.start ? context.start.location : { kind: 'unresolved' },
            // `turn` is where an answered question batch sits: outside whole-Turn
            // folding, so the record survives the process group collapsing.
            groupTree: 'turn',
            visibility: 'visible',
            data,
          },
        }
      },
      buildViewNode(context) {
        return context.state && context.state.node ? context.state.node : null
      },
    }

    /**
     * The row itself: the decision sentence, then what was decided, then the
     * reasons the user gave for it.
     *
     * Reading is the only thing this row does. It answers no request and starts
     * nothing; the copy action only touches the clipboard.
     */
    function DecisionBubble(props) {
      const data = (props && props.node && props.node.data) || {}
      const openFile = props && typeof props.openFile === 'function' ? props.openFile : null
      const [copied, setCopied] = React.useState(false)
      const copy = () => {
        if (typeof navigator === 'undefined' || !navigator.clipboard) return
        Promise.resolve(navigator.clipboard.writeText(bubbleText(data)))
          .then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          })
          .catch(() => {
            // A refused clipboard is not worth a banner over a transcript row.
          })
      }
      const body = []
      const lead = data.candidate || data.decision
      if (lead) body.push(h('div', { key: 'question', style: bubbleQuestion }, lead))
      body.push(h('div', { key: 'verdict', style: bubbleVerdict }, verdictLine(data)))
      if (data.observed) body.push(h('div', { key: 'observed', style: bubbleObserved }, data.observed))
      const comments = Array.isArray(data.comments) ? data.comments : []
      if (comments.length > 0) {
        body.push(
          h(
            'ul',
            { key: 'comments', style: bubbleComments },
            comments.map((comment, index) =>
              h(
                'li',
                { key: String(index), style: bubbleComment },
                h('span', { style: bubbleAnchor }, anchorLabel(comment.anchor)),
                h('span', { style: bubbleBody }, comment.text),
              ),
            ),
          ),
        )
      }
      if (data.note) {
        body.push(
          h(
            'div',
            { key: 'note', style: bubbleNote },
            h('span', { style: bubbleAnchor }, t('bubble.note')),
            h('span', { style: bubbleBody }, data.note),
          ),
        )
      }
      const shots = Array.isArray(data.shots) ? data.shots : []
      if (shots.length > 0) {
        // One line of file names, each one a link into the right Sidebar: the
        // path is the whole point of the link, so it rides in the title rather
        // than taking three lines of bubble. The preview side already knows how
        // to draw an image from a session-relative path.
        body.push(
          h(
            'div',
            { key: 'shots', style: bubbleShots },
            h('span', { style: bubbleShotsLabel }, t('bubble.shots')),
            shots.map((path, index) =>
              h(
                'button',
                {
                  key: String(index),
                  type: 'button',
                  style: bubbleShotLink,
                  title: path,
                  'aria-label': t('bubble.openShot', { name: fileNameOf(path) }),
                  onClick: () => {
                    if (openFile !== null) openFile(path)
                  },
                },
                fileNameOf(path),
              ),
            ),
          ),
        )
      }
      return h(
        'div',
        {
          style: bubbleRow,
          role: 'group',
          'aria-label': data.kind === 'test' ? t('header.realTest') : t('bubble.label'),
          'data-clarity-decision': '',
        },
        h(
          'div',
          { style: bubbleWidth },
          SharedBubble === null ? h('div', { style: bubbleBox }, body) : h(SharedBubble, { style: bubbleBox }, body),
        ),
        h(
          'div',
          { style: bubbleActions },
          h('span', null, clock(data.time)),
          h('button', { type: 'button', style: bubbleAction, onClick: copy }, copied ? t('bubble.copied') : t('bubble.copy')),
        ),
      )
    }

    const bubbleRow = {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '4px',
      width: '100%',
      fontFamily: FONT,
    }
    const bubbleWidth = { maxWidth: 'min(84%, 560px)', minWidth: 0 }
    const bubbleBox = {
      background: 'var(--dsw-alias-bg-layer-2)',
      border: '1px solid var(--dsw-alias-border-l1, rgba(0,0,0,.06))',
      borderRadius: 'var(--dsw-radius-lg, 12px)',
      padding: '8px 12px',
      fontSize: '13px',
      lineHeight: '20px',
      textAlign: 'left',
    }
    const bubbleQuestion = { color: MUTED, fontSize: '12px', lineHeight: '18px' }
    const bubbleVerdict = { marginTop: '3px' }
    const bubbleComments = {
      listStyle: 'none',
      margin: '6px 0 0',
      padding: '4px 0 0',
      borderTop: '1px solid var(--dsw-alias-border-l1, rgba(0,0,0,.07))',
    }
    const bubbleComment = { display: 'flex', flexDirection: 'column', paddingTop: '4px', fontSize: '12.5px' }
    const bubbleAnchor = { color: MUTED, fontSize: '11px', lineHeight: '16px' }
    const bubbleBody = { overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }
    const bubbleObserved = {
      margin: '6px 0 0',
      paddingTop: '4px',
      borderTop: '1px solid var(--dsw-alias-border-l1, rgba(0,0,0,.07))',
      fontSize: '12.5px',
      overflowWrap: 'anywhere',
      whiteSpace: 'pre-wrap',
    }
    const bubbleShots = {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'baseline',
      gap: '0 6px',
      marginTop: '6px',
      paddingTop: '4px',
      borderTop: '1px solid var(--dsw-alias-border-l1, rgba(0,0,0,.07))',
      fontSize: '11px',
      lineHeight: '16px',
    }
    const bubbleShotsLabel = { color: MUTED }
    const bubbleShotLink = {
      border: 'none',
      background: 'transparent',
      padding: 0,
      margin: 0,
      font: 'inherit',
      fontFamily: MONO,
      color: 'var(--dsw-alias-brand-primary, var(--dsw-alias-label-primary))',
      textDecoration: 'underline',
      textUnderlineOffset: '2px',
      cursor: 'pointer',
    }
    const bubbleNote = {
      display: 'flex',
      flexDirection: 'column',
      marginTop: '6px',
      paddingTop: '4px',
      borderTop: '1px solid var(--dsw-alias-border-l1, rgba(0,0,0,.07))',
      fontSize: '12.5px',
    }
    const bubbleActions = {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      paddingRight: '2px',
      color: MUTED,
      fontSize: '11px',
      lineHeight: '16px',
    }
    const bubbleAction = {
      border: 'none',
      background: 'transparent',
      color: 'inherit',
      font: 'inherit',
      cursor: 'pointer',
      padding: '0 2px',
    }

    const pluginApi = {
      inject: ['slots', 'sidebarRightTabs', 'sidebarRight', 'uiSession'],
      apply(ctx) {
        // The motion stylesheet is the only global this plugin adds to the page, and
        // it goes in once, under its own id.
        ctx.effect(() => ensureStyle(), 'clarity motion styles')
        // The panel speaks the GUI's language when the locale service is there: the
        // user picks it in Settings → General, and the choice reaches this tab
        // without a reload. `ctx.inject` waits for the service rather than sampling
        // it once, so load order does not decide the language; a composition without
        // the service never runs this callback and keeps the English table.
        if (typeof ctx.inject === 'function') {
          ctx.inject(['locale'], (arena) => {
            const locale = arena.locale
            if (!locale || typeof locale.register !== 'function' || typeof locale.bind !== 'function') return
            const bound = locale.bind(NS)
            arena.effect(
              () => locale.register(NS, { en: MESSAGES.en, zh: MESSAGES.zh }),
              'collaborative-clarity: dictionaries',
            )
            const previous = t
            t = (key, vars) => fillMessage(bound(key), vars)
            return () => {
              t = previous
            }
          })
        }
        publishPendingInteraction = ctx.uiSession.registerPendingInteraction(() => 5)
        openRound = (roundId) => {
          try {
            ctx.sidebarRight.openTab(KIND, { params: { roundId } })
            return true
          } catch (cause) {
            console.warn('[clarity] could not open the round tab:', cause)
            return false
          }
        }
        ctx.effect(
          () =>
            ctx.sidebarRightTabs.register({
              id: TAB_ID,
              kind: KIND,
              title: () => 'Clarity',
              // One Clarity tab per conversation: a new round navigates the tab
              // that is already there instead of pinning a second, stale copy
              // to the round it was opened with.
              multiple: false,
              guide: [
                {
                  id: 'clarity',
                  order: 40,
                  title: () => 'Clarity',
                  description: () => t('tab.guide'),
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

        // The transcript row. `uiConversation` is optional, like the locale
        // service: a composition without the chat keeps the tab and loses only
        // the bubble. The definition reads the events; the renderer below is
        // reached only where the slot exists.
        if (typeof ctx.inject === 'function') {
          ctx.inject(['uiConversation'], (arena) => {
            const uiConversation = arena.uiConversation
            if (!uiConversation || !uiConversation.events || typeof uiConversation.events.register !== 'function') {
              return undefined
            }
            return arena.effect(() => uiConversation.events.register(decisionNode), 'clarity chat row')
          })
        }
        ctx.effect(
          () =>
            ctx.slots.inject(CHAT_SLOT, () =>
              ctx.slots.register({ name: CHAT_SLOT, key: NODE_KIND }, DecisionBubble),
            ),
          'clarity chat bubble',
        )

        // A round that opened while another conversation was on screen never
        // got its tab opened. Surface it when its conversation comes back.
        let autoOpened = ''
        const openWaitingRound = () => {
          const sessionId = ctx.sidebarRight.mounted.getSnapshot()
          if (typeof sessionId !== 'string' || sessionId === '') return
          const waiting = latestPendingFor(sessionId)
          if (waiting === null) {
            autoOpened = ''
            return
          }
          const key = sessionId + '/' + waiting.id
          if (autoOpened === key) return
          autoOpened = key
          // The seat adopts the session's store a tick after the selection
          // changes; retry briefly rather than dropping the round.
          let tries = 0
          const attempt = () => {
            if (ctx.sidebarRight.mounted.getSnapshot() !== sessionId) return
            if (openRound(waiting.id)) return
            tries += 1
            if (tries < 8) setTimeout(attempt, 75)
          }
          attempt()
        }
        ctx.effect(() => {
          const unsubscribe = ctx.sidebarRight.mounted.subscribe(openWaitingRound)
          openWaitingRound()
          return unsubscribe
        }, 'clarity on-screen session')

        ctx.effect(() => {
          const source = new EventSource(API + '/events')
          const refresh = async () => {
            try {
              const body = await api('/rounds')
              replacePending(Array.isArray(body.rounds) ? body.rounds : [])
            } catch {
              // The dot is an aid; a failed refresh must not break the stream.
            }
            roundFeed.publish()
            openWaitingRound()
          }
          source.addEventListener('open', () => {
            refresh()
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
            roundFeed.publish()
            if (round.sessionId !== ctx.sidebarRight.mounted.getSnapshot()) return
            openRound(round.id)
          })
          const forget = (event) => {
            try {
              const data = JSON.parse(event.data)
              if (data && typeof data.roundId === 'string') forgetPending(data.roundId)
            } catch {
              // The feed refresh below still reconciles the whole set.
            }
            roundFeed.publish()
          }
          source.addEventListener('decided', forget)
          source.addEventListener('tested', forget)
          return () => source.close()
        }, 'clarity events')
      },
    }
    Object.defineProperty(pluginApi, '__test', {
      value: { clarityBridge, withBridge, anchorLabel, contentHash, isAnchor, MESSAGES, DecisionView, TestView, RoundPanel, newestOpenRound, decisionNode, DecisionBubble, bubbleText },
      enumerable: false,
    })
    return pluginApi
  },
})
