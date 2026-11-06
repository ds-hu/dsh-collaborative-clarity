# Round 0013 — 面板说中文

**Decision:** 面板的中文，跟 GUI 的语言走，还是插件自己带一个开关？
**Variant A:** *跟 GUI 语言走* —— 注册 `collaborativeClarity` 命名空间，语言由 Settings →
General 决定，面板里没有开关。
**Variant B:** *插件自带开关* —— 标签页右上角一个 中/EN，只影响这块面板。
**Recommendation:** A.
**Accepted:** A.
**Forecloses:** ① 注册字典要求 `en` 和 `zh` 两份 baseline，以后每加一句文案就得两份一起加；
② GUI 支持八种语言而这里只做中英，日语用户会看到一块英文面板夹在日文界面里。

## Why this round

面板主体的每个字都是硬编码的英文字面量，散在 `DecisionView`、`TestView`、`RoundPanel` 和
几个空状态里，一共六十来处。而 DSH 本身有 `dsh-client-locale`：客户端插件注册命名空间字典，
用户在 Settings → General 选语言，切换即时生效，不用刷新。

这个 profile 里另外三个插件（better-workspaces、pocket、usage-monitor）已经这么做了，所以
"这条路通不通"不是问题；要定的是**这个面板的语言由谁决定**。两种都自洽：跟全局走，面板和周围
界面永远同一种语言；自己带开关，用户可以在一个中文 GUI 里单独把这个面板留成英文。

## Fidelity

**Real:** 面板结构、中文文案——都按真实字符串搬进了 `client.js`；B 的右上角开关是真能点的。
**Mocked:** 变体卡片里是灰色占位条，不是真 artifact；没有画测试关那半边。
**Omitted:** 切换语言时的重绘动效；artifact 内部的用户内容（不归插件翻）。

## Outcome

`client.js` 多了一张表和一个函数：

```js
const MESSAGES = { en: { … }, zh: { … } }
let t = (key, vars) => fillMessage(MESSAGES.en[key] ?? key, vars)
```

- 表里的键在两种语言之间完全一致，有测试盯着（`the English and Chinese tables carry the same
  keys`）——以后漏一条中文，测试红。
- `fillMessage` 支持 `{name}` 占位，所以 `第 {n} 行`、`截图 {index} / {total}`、`结论：{verdict}`
  这类都不用拼字符串。
- `apply` 里 `ctx.get('locale')`：有服务就 `register(NS, { en, zh })` 并用 `bind(NS)` 包一层
  重新赋值 `t`；没有服务就留在英文表。**所以老版本 harness 不会因为这个挂掉。**
- 六十来处字面量换成了 `t('…')`；`Clarity` 这个产品名和 tab 标题不翻。
- 术语按现有用法：round / artifact / agent 保留英文。

## Verification

- 合同测试 64 → 66，七个文件全绿。新增两条：
  - *the English and Chinese tables carry the same keys*；
  - *the panel speaks the GUI language, and English without the service* —— 没有 locale 服务时
    渲染出 `Accept A`，注入一个假服务后渲染出 `接受 A`，并断言注册的命名空间是
    `collaborativeClarity`。
- `node --check client.js` 通过。
- **没做真机测试**：需要登录 GUI 才能看到真实面板，这一轮只到合同测试。
