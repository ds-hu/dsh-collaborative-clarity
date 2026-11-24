# Rounds 0031–0035 — 历史怎么翻，以及它的总览

**Status:** tested（设计闸门 `clarity-test-mwuok8ya-385691` 在 **review 之前**的树上 pass；
下面「复查」那八条是之后改的，各有合同护栏，**尚未再过闸门**）
**Tool rounds:** `clarity-mwunazu1-562cb0`（A/B：一条带 / 抽屉 → revise A）
→ `clarity-mwunmf14-94ec9e`（倒序、等待钉不钉 → revise A′）
→ `clarity-mwunqj9a-3991c8`（编号 → accept A″）
→ `clarity-mwunv6n2-dc3aa1`（总览在面板/导出 → revise A）
→ `clarity-mwuo4pgt-7ebf1c`（总览入口 → accept A′）
**Real test:** `clarity-test-mwuoglp6-dc51cb`（fail：两条文案/分界意见，核心可用）→
`clarity-test-mwuok8ya-385691`（**pass**）
**Artifacts:**
[0031 a](0031-history-paging/a-strip.html) / [0031 b](0031-history-paging/b-drawer.html)；
[0032 a′](0032-strip-order/a2-first-cell.html) / [0032 b′](0032-strip-order/b2-pinned.html)；
[0033 a″](0033-strip-numbers/a3-numbered.html) / [0033 b″](0033-strip-numbers/b3-plain.html)；
[0034 a](0034-overview/a-in-panel.html) / [0034 b](0034-overview/b-report-file.html)；
[0035 a′](0035-overview-entry/a4-pinned-chip.html) / [0035 b′](0035-overview-entry/b4-header-button.html)

用户的原话（0031 之前）：

> 允许每一个 Tab 都可以翻看历史记录，使得多个活跃会话的状态管理更加优雅，且便于用户复盘

以及 0030 的真机反馈：

> 没有成功。另外，具体 UI 还没有给我过目，重新做 clarity round。

那一句是这一串的起点：先定来源（0030），再把具体的 UI 摆出来给人看（0031–0035）。

## 五轮，各定一件事

| # | 决定 | 结果 |
|---|---|---|
| 0031 | 顶部一条带，还是收进抽屉？ | revise A（取带子，要改三处） |
| 0032 | 倒序之后，「需要决定」随带子滑，还是钉在左端？ | revise A′（随带子滑；日期没辨识力） |
| 0033 | 拿掉日期后，每格要不要编号？ | **accept A″**（带编号） |
| 0034 | 总览是面板里的一页，还是一份导出的文件？ | revise A（要入口，要显示批注与说明） |
| 0035 | 总览入口：带子右端钉住，还是眉题行按钮？ | **accept A′**（钉在带子右端） |

四轮的批注分别落在：倒序与等待置顶、文案「需要决定」、**标题哪来的**（我编了摘要——已改回问题原文）、
非阻塞轮可能有两个「需要决定」、同一天日期没辨识力、总览入口、行内要看得到批注与 note。

## 建了什么

- **带子**（`Strip`）：每一轮一格，编号按会话内的时间顺序（最早的 #1），**等待先说、再按新到旧**；
  每格 = 结论色点 + `#N` + 问题原文（截断 42 字，永不写摘要）；两个「等待中」并排时也是同一套语法。
  点一格 → `navigate(roundId)` → tab 的 `navigation.params.roundId` 改道，即 0030 定下的游标。
- **右端钉一枚「总览 N」**（0035 A′）：横滑区之外，滑到多早它都在，`N` 是全部轮数。
- **总览页**（`Overview`）：这个会话的全部轮次，等待的标「等待中」；每行给结论词、选中的变体、
  批注条数，**并把每条批注与 note 摊开**（0034 的批注）；底部「复制 Markdown」「下载 HTML」。
- **复制**：一份编号的设计流程 Markdown。**下载**：一份自包含 HTML（`reportHtmlOf`），转义一切文本，
  自带浅/深两套配色，可以整页截图、打印、发给别人。
- 面板的视图状态只有一个 `view: 'round' | 'overview'`；其余仍是 0030 的「三个来源 → 一个游标」。

## 真机（fail，两处已修）

`clarity-test-mwuoglp6-dc51cb`，用户的原话：

> 我又想了一下，那个"需要决定"改为"等待中"/"Waiting"比较好；
> 总览那里，批注的元素和批注内容分界不清晰。
>
> 核心功能已完全可用。

- **文案**：`strip.waiting` 从「需要决定」/“Needs a decision” 改成「等待中」/“Waiting”。
- **分界**：总览里的批注原本是 `锚点 — 正文` 一行灰字。现在拆成两行——锚点用小一号的淡字，正文在下面，
  整块左侧一条细线；note 与测试观察同样处理。合同测试钉住这两点（锚点自成一行、正文自成一行）。
- 129 条测试全绿，`pnpm check` 退出 0。

**「核心功能已完全可用」是用户给的结论**，不是我的推断：带子、编号、总览、导出都真的跑起来了。

修完之后再进闸门：`clarity-test-mwuok8ya-385691` **pass**（用户原话：「可以了。接下来你派个 reviewer。」）。

## Verification

- 合同测试 **120 → 129**（`tests/client.test.mjs` 66 → 75），七文件全绿（`pnpm test` 退出 0）；`pnpm check` 退出 0。
- 新增 9 条：编号按时序跨日志与宿主；等待先说；每格是问题原文截断；Markdown 编号 + 批注 + note；
  报告是完整文档且转义 `<script>`；带子画在轮次之上且「总览」钉在末端；点格子 → navigate；总览列出批注与 note 并返回；
  空会话的总览说「还没有决定过」。
- **五条反向验证**（注入、跑测试、字节还原）：去掉编号 → 2 条红；不把等待放前面 → 2 条红；总览按钮空转 → 2 条红；
  报告不转义 → 1 条红；等待格丢掉文字 → 1 条红。那批之后文件还原到 `sha256` 前 16 位 `73bd989ea1e6ed05`
  （163345 字节）——这个数是当时那批的，不是现在这棵树（见「复查」）。

## 复查（review，8 条全部成立、全部修掉）

派了一个 reviewer，范围 `uncommitted`。它报了 8 条，逐条回到源码核对，**八条都成立**，已全修：

1. **重试根本不会重试**（最重）：`historySourceFor` 把「没绑定」这个 miss 也缓存了，而重试 effect 的依赖是 `[history]`——
   `history` 一直是 null，effect 再也不会跑；那一次 `setTimeout` 醒来时距缓存不足 1 秒，直接读回同一个 miss。
   「250ms × 8」是死的。改成：**hit 缓存、miss 不缓存**；订阅与重试拆成两个 effect，重试按 `tick` 重新武装。
   新增两条合同测试（miss 会被再问、迟到绑定在下次渲染生效）。
2. **取消的轮会先有后无**：取消时我给它建了替身，于是它在带子与总览里出现；一刷新，折叠不画取消的轮（不变量 7），
   它就消失，后面每一轮的 `#N` 集体前移。改成：**取消不建替身**。
3. **`client.js` 被写成了 CRLF**（3830 行），提交会重写整个文件。已还原为 LF。
4. **带子的色点**把 revise / blocked / 取消都画成成功色。加了 `verdictTone`：accept/pass 绿、fail/reject 红、
   revise/blocked 黄、取消灰。
5. **本记录的 `tested` 与证据不符**：闸门确实过了，但下面「未验证」还写着「真机没跑过这一版」，而 hash 是旧的。
   本节与下一节已改。
6. **`06-implementation.md` 说「还不能翻页」**，与同一次 diff 里加进来的带子矛盾。已改。
7. **记录视图丢了底部留白**：它没有决定栏，却挂在 `root`（底 0）上。改回 `rootPadded`。
8. **`<button role="listitem">`**：把按钮的角色抹掉了。带子改成 `role="group"` + 纯按钮。

修完后合同测试 **129 → 134**，新增五条守卫，五条反向验证各自变红、字节还原到 `37ee4cca69e63c9a`（162477 字节，LF）。

reviewer 还留了三条「未确认」：非空 source 不会重新解析、`recordsFromChat` 以快照身份记忆、以及 `load()` 闭包可能拿旧
`history`。第三条在修复里顺手解决了（`history` 进了 `load()` 的依赖）；前两条留在「未验证」。

## 未验证

- **下载与复制没有真机验。** 「下载 HTML」依赖 `URL.createObjectURL` 与 `<a download>`（宿主若禁止，按钮静默不动）；
  「复制 Markdown」依赖 `navigator.clipboard` 与安全上下文。两者都只在假环境里走过。
- **`historySourceFor` 不会重新解析一个已经拿到的 source。** 若席位在 tab 打开后重新绑定同一会话，tab 会继续读旧的 target。
- **`recordsFromChat` 以快照身份记忆。** 若真实 chat store 原地改快照而不换对象，记录会冻结。
- **编号到三位数**（#100 以上）的宽度与对齐没看过。
- 带子横滑没有滚动条提示，第二屏以后是否会被发现，未知。
- **深色之外的配色没逐项看过**：这次闸门是在用户自己的深色主题里过的，浅色只跟着 token 走。
