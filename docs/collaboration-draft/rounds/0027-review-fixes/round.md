# Round 0027 — 复查提出的三个缺陷

**来源：** 一次独立复查（读 diff + 探针），三条确认缺陷、两条「未验证」。原文的严重度/出现率记在
每条标题后。**没有一条是折叠逻辑本身的问题**——投影那部分复查判定无缺陷。

## 1. 空白串仍然挡住 pass 与 cancel（Sev 3 / Occ 3）

**触发**：闸门里观察框里留一个空格或换行（看起来是空的），按「通过」或「取消该测试」→ 红字
`observed must be a non-empty string`，闸门不关。

**根因**：0026 的修复只比对了空串。两侧都是：

- `client.js` 的 `observed === ''` 决定发不发这个字段，于是 `' '` 照发；
- 路由的 `body.observed === '' ? '' : requireString(...)`，而 `requireString` 拒绝的是
  `value.trim() === ''`——`' '` 走到校验器里就抛了，**在** pass/cancel 的豁免判定之前。

**修**：两侧都按「去掉空白后是否为空」判定。`fail` / `blocked` 带空白串时，现在报的是它自己那句
`fail and blocked need an observation`，而不是一个冒充参数错误的 `observed must be a non-empty string`。
非字符串（`observed: 42`）仍然被拒——参数是「拒掉」，不是「悄悄丢掉」。

**测试**：`pass and cancel need no observation…`（API）加了空白串的 pass/cancel（200）、空白串的
fail（400 且是那句话）、以及 `observed: 42`（400）；`a whitespace-only observation is sent as
nothing at all`（面板）断言请求体里没有这个键。

## 2. CHANGELOG 自相矛盾（Sev 1 / Occ 5）

0021 那条 bullet 收尾写着「A cancelled, `blocking: false`, failed or **real-test round draws
nothing**」，两行之后的 bullet 开头就是「**A real test leaves a row too**」。第一句只对「决定轮次
收到测试裁决」（种类不匹配）成立，而它没有说明这个限定。改为只陈述决定行自己的事。

## 3. 英文文案里混进全角冒号（Sev 1 / Occ 4）

`bubbleText` 里写死了 `t('bubble.note') + '：' + data.note`，于是英文剪贴板里是 `Note：Ship it.`。
标签从文案表来、标点却是硬编码的。改成一条整行的键 `bubble.noteLine`（`Note: {note}` /
`说明：{note}`），并把整段复制文本钉成断言。

> 同一行里的 `·`（`已接受 · 变体 B`）**不是**这个缺陷：0021 被接受的那份 mock 就写着 `已接受 · 变体 B`。

## 4. 复查顺带指出、这一轮一并修掉的：重复的文案键

两个表里各有四个键被写了两遍（`anchor.element` / `anchor.line` / `anchor.lines` / `anchor.other`），
后写的静默覆盖前面的——前一份是上一套命名留下的死文案，谁改错一行都不会有任何反应。删掉被覆盖的
那四行（每表 4 行），并加一条源码级断言：一张表里同一个键不许出现两次。

## 未验证（复查留的、我也没能验的）

- **行会不会跟着切换语言**：`DecisionBubble` 读的是模块级的 `t`（`apply` 在 locale 服务到达时
  重绑），本身没有订阅。要不要在注册时带上 `locale: NS` 改读 `props.t`（`QuestionReplyView`
  的写法），得在浏览器里看一眼：开着一个决定行，去 Settings 换语言，看那几个字变不变。
  代码路径读不出结论，所以这一条留白。
- 复查的探针 `probes/probe-review.mjs` 只是证据，不是修复；已删除。

## Verification

- 合同测试 87 → **90**，七文件全绿（`pnpm run verify` 退出 0）。
- **三条反向验过**，各自字节还原、`sha256` 与改前一致：
  - 路由退回只比空串 → API 那条红（`pass with a blank observation`）；
  - 面板退回 `observed === ''` → 空白串那条红；
  - 复制行退回硬编码全角冒号 → 剪贴板那条红；
  - 另：把 `anchor.whole` 写两遍 → 「一张表里不许重复键」那条红。
- **真机通过（2026-11-08，`clarity-test-mw6mkx9l-2debcf`，pass）**：观察框里敲一个空格（看起来仍是
  空的），按「通过」——直接发出，没有那句红字。结果里既没有 `observed` 也没有 `screenshots`，
  空白被当作「没写」。

## 代价

- 空白串现在被当作「没写」：`fail` / `blocked` 带空白串会被拒，报的是「需要观察」。
- 非字符串仍然拒绝，所以 `observed: null` 这类调用方会看到一个参数错误——这是本来的意图。
- 「换语言」这条依然悬着，见上。
