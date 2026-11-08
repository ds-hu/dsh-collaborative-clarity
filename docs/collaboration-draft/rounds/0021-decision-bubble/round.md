# Round 0021 — 决定在对话里的那一行

**Decision:** Clarity 的决定气泡：只记「决定了什么」，还是连「为什么」一起记？
**Variant A:** *只记决定* —— 决定句 + 裁决 + 变体名，两行；批注与说明留在工具行。
**Variant B:** *连理由一起记* —— 决定句 + 裁决 + 每条批注（带锚点）+ 一句说明。
**Recommendation:** A —— 气泡是索引，理由在工具行里一点就开，不该每轮都占据对话的高度。
**Accepted:** **B**，拒绝了推荐。
**Forecloses:** 一条气泡可能十几行，把后面的对话推下去；锚点标签（「元素 · 保存按钮」）在对话里读着像代码；
批注与说明在面板、工具行、`rounds/` 记录之外多出第三份，形状一变要三处同改。

## Why this round

DSH 0.2.2 起，`ask_user_question` 的回答不再只留在工具行里：它以一条右对齐的用户气泡留在对话中
（`0778dec09f`，0.2.2-alpha.2 起）。查了一遍它怎么做的——气泡不是真的用户消息，而是**从会话事件
投影出来的一个 chat node**，用 `UserMessageBubble` 画，`groupTree: 'turn'` 让它留在整轮折叠之外。
机制是公开的扩展面：`ctx.uiConversation.events.register(definition)` 加一个 keyed 的
`conversation.chat.node` 渲染器，宿主一行不用改。

于是问题只剩一个：我们的气泡里放多少字。B 被选中，理由是「理由会随工具行一起折叠」——折叠之后
留下来的就是这条气泡，而那正是回头看时想知道的东西。

## Outcome

`client.js` 多了三段，宿主半身（`index.js`）、API 路由、store、工具契约**一个字没动**：

- **定义 `decisionNode`**（`kind: 'clarity-round'`，`target: 'chat'`）：`match` 认领本工具自己的
  `tool/call`；`tool/result` 只在 `surfaceOp === 'append'` 且载荷里带 `roundId` 时认领——别的工具的
  结果一概不碰，替换副本（模型专用）也不碰。`start` 从调用参数里取决定句与变体标签，`update` 从
  结果 JSON 里取裁决、批注、说明、时间。
- **唯一的判定**：只有 `accept` / `revise` / `reject` 会画出这一行。取消、非阻塞的 `pending`、
  真实测试的 `tested`、读不懂的载荷、`isError` 的结果——一律不画，工具行照旧在。
- **节点只建一次**：`update` 里建好 `node` 并留在 state 里，`buildViewNode` 原样返回。同一段历史
  重放得到**同一个对象**，不是每次新造一个让视图以为变了。第一个决定定终身，后到的事件改不了它。
- **渲染 `DecisionBubble`**：`UserMessageBubble` 画外壳（它就是真用户消息用的那个原语），拿不到
  这个原语时退回自己的一只盒子——缺原语只该丢样式，不该丢掉整行。行内是决定句（次要色）、
  裁决行、批注（锚点标签 + 正文）、说明，行下一个时间与复制按钮。
- **两处可选挂载**：`ctx.inject(['uiConversation'])`（没有 chat 的组合只丢这一行，别的照常）与
  `ctx.slots.inject('conversation.chat.node')`（slot 不存在就不注册）。
- **文案 8 条**进 `MESSAGES` 双表：`bubble.label / accept / revise / reject / variant / note / copy / copied`。

## Verification

- 合同测试 78 → 83，七文件全绿（`pnpm run test` 退出 0）。
  - `our round folds into one transcript row, and the labels come from the call`：按装配器的方式喂
    `tool/call` + `tool/result`，断言 `kind`、`target`、`anchorSeq`、`groupTree: 'turn'`、变体标签来自
    调用参数而不是 id、批注锚点与说明都在。
  - `a round the user did not decide draws no row`：取消、`pending`、`tested`、`isError`、读不懂的
    载荷、契约漂移出来的裁决（`partial`）——六种都不画；`tool/result` 先于它的 `tool/call` 出现时
    也没有行（update-only 保持 pending）。
  - `another tool’s result is not claimed, and the first decision stands`：别的工具的结果、`clarity_test`
    的调用、替换副本都不认领；第二个结果改不动已记录的决定。
  - `the row reads as the decision, the reasons, and a copy action`：渲染出来的文字里有决定句、
    `Accepted`、`variant B — with reasons`、批注正文、`Element · Save`、`Whole variant`、说明、`Copy`；
    拒绝时只写 `Turned it down`，不写变体。
  - `the chat row is contributed where the chat exists, and nowhere else`：`apply` 只在
    `uiConversation` 在场时注册定义；渲染器按 `clarity-decision` 这个 key 挂上；tab 的注册不受影响。
- **反向验过一条**：删掉 `accept/revise/reject` 白名单那一条判定 → `a round the user did not decide
  draws no row` 红（`a cancelled round is not a decision`），随后字节还原，`sha256` 与改前一致。
  过程中还发现最初写的两条判定（`status !== 'decided'` 与裁决白名单）互相兜底、谁都删不掉——所以
  只留了后者，判定与测试才真正一一对应。
- **真机未测**：这一轮到 `built` 为止，气泡在真实对话里长什么样要一条 test gate 才算数。

## 代价

- 气泡会长。一条带三条批注与说明的决定可能十几行，这是 B 买来的东西，也是它的价钱。
- 锚点标签在对话里读着像代码（「元素 · 保存按钮」），面板里有这个上下文，transcript 里没有。
- 同一句话现在有三份：面板、工具行、`rounds/` 记录。改形状要记得三处。
- 不做：`blocking: false` 的晚期决定（决定不在会话日志里，`job/settled` 不带 result）、PTC 执行器
  下的 `tool/ptc-dispatch`、真实测试的 verdict。各要一轮。
