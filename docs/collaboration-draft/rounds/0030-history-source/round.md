# Round 0030 — 历史从哪儿来

**Status:** built（真机闸门 `clarity-test-mwu9kjv0-9bae6a` **fail** 一次，见「真机」——仍未 tested）
**Tool round:** `clarity-mwu8ry7a-bc8285`（一次，accept）
**Real test:** `clarity-test-mwu9kjv0-9bae6a`（fail：tab 显示「现在没有打开的 round」）
**Opened / decided:** 2026-11-24
**Artifacts:** [a-projection.html](a-projection.html)、[b-ledger.html](b-ledger.html)

用户的原话：

> 允许每一个 Tab 都可以翻看历史记录，使得多个活跃会话的状态管理更加优雅，且便于用户复盘

三句话说的是一件事的三面：tab 要能翻历史、多会话的状态要收拢、事后要能复盘。
而在动代码之前，这三面都压在同一个问题上——**历史从哪儿来**。来源定了，tab 记什么就定了；
来源错了，状态怎么收都收不干净。所以这一轮只定这个；翻页长什么样是下一轮。

## 先看今天的 tab 记着什么

`RoundPanel` 里有五样东西互相对账：

| 状态 | 管什么 |
|---|---|
| `state.round` | 屏幕上这一轮 |
| `sent` | 我刚把决定送出去了 |
| `knownRound` | 上次解析到的 id——结算轮的兜底 |
| `paramRoundId` | 打开 tab 时带的 id |
| `autoOpened` | 这个会话这一轮我已经开过 tab 了 |

每次 SSE 事件都重跑一遍 `load()`；结算过的那一轮，只有 tab 自己还记着 id 时才看得到；
换一轮，上一轮就从 tab 里消失了。复盘无处可去。

## 决定

Clarity tab 里能翻看的历史，应该是会话日志的投影，还是宿主自己记的一本账？

## 两个变体

| Id | 标签 | Artifact | 真实 | 模拟 | 省略 |
|---|---|---|---|---|---|
| A | 投影 | [a-projection.html](a-projection.html) | `ChatSnapshot.nodes.values()` 的形状（`dsh-client-ui-chat` 的 `contract/snapshot.d.ts`）；`navigation.params` / `revision` / `actions.openTab` 的签名（`dsh-client-ui-sidebar-right` 的 `contract/slots.d.ts`）；`RoundPanel` 的五处状态（`client.js`）；`RoundStore.rounds` 不过期（`index.js`） | 一条历史记录的排版；记录内容是 0029 的真实参数 | 翻页控件；`blocked` 缺按钮；深色主题 |
| B | 账本 | [b-ledger.html](b-ledger.html) | `RoundStore.rounds` 今天就不删结算轮、`/round?id=` 已能取到；`variants[].html` 留在内存里，`MAX_ARTIFACT_BYTES = 400_000` | 淘汰数；只读回放的 iframe | 落盘的第三条路；翻页控件 |

推荐是 A：**一次折叠两处读**——历史和气泡同源，重启后还在，tab 的状态从五处收成一个游标。
代价写在卡片上：历史里看不到 mock 本身，只看到它的路径。

## 结果

```json
{"status":"decided","roundId":"clarity-mwu8ry7a-bc8285","verdict":"accept","selected":"a"}
```

## 建了什么

**来源。** tab 的历史 = `decisionNode` 折出来的节点，从 `uiConversation.binding(sessionId).target('chat')`
读回：`recordsFromChat(snapshot)` 按 `kind === 'clarity-decision'` 筛、按时间排，并按 snapshot 身份记忆
（聊天每变一次面板就重读一遍，`values()` 要走全部节点）。折叠多留了四样东西，让一条记录够复盘：
`roundId`、`selected`、`context`、以及调用当时给的 `variants`（推荐、代价、真实/模拟/省略、路径）。
批注也带上 `variantId`。气泡读的还是原来那几个键，一个字没动。

**游标。** 屏幕上是哪一轮 = `navigation.params.roundId`；没给就是「最新」。打开 tab 今天就是这么开的
（`openTab(KIND, { params: { roundId } })`），所以游标不是新加的状态——它一直在那儿，只是没人把它当状态看。

**三个来源，一次推导。** `RoundPanel` 每次渲染都从三处推导：宿主的开着的轮（`/rounds`）、日志的记录（快照）、
宿主的「替身」（刚结算、日志还没落的那一轮，`/round?id=` 取一次，或决定送出时用手里那一轮加结果直接拼）。
`mergeRecords` 合并时**日志赢**——替身在日志落地的那一刻自己退场，不用清理。

**删掉的。** `sent`、`knownRound`、`load()` 里「没开着的就回去找旧的」那一支、「决定已送出 / 已经答过」两张卡。
决定送出后 `onSent(result, round)` 把手里那一轮直接变成记录，不多发一次请求；两个视图各留一个本地 `done`，
在替换落地前让动词闭嘴，免得点两次。

**记录长什么样。** `RecordView` 只读：眉题 + 问题 + 上下文，结论行（`结论：已接受 · 选中：一格三档`，带年月日），
每条变体一张卡——`Advice` 和 `Fidelity` 原样复用，文件路径一行，**没有 iframe**；批注只读；说明；测试轮的观察与截图文件名。
取消的轮写成「这个 round 已经取消」，不编造动词。

**聊天变化不碰网络。** 日志的订阅只 `retune`（重读快照）；只有 SSE 事件才走 `roundFeed` → `load()`。
否则聊天每流一段，面板就要去挤那 6 条连接。

## 没做到的（artifact 说了、代码没做）

- **`autoOpened` 留下了。** 卡片把它列进了「全删」。读 `service.d.ts` 才知道 `openTab` 走 `openWithFocus`——
  每次导航都把焦点抢回 pane；它是**开 tab 那一侧**的记事，不是 tab 的状态。删了它，SSE 一重连就把读者拽回等待轮。
  这一条按证据改了，记录照实说。
- **「全删」实际是删了三处半**：`sent`、`knownRound`、兜底那一支全没了；`autoOpened` 留下并改了说法。

## Verification

- 合同测试 **103 → 120**（`tests/client.test.mjs` 49 → 66），七文件全绿（`pnpm test` 退出 0）；`pnpm check` 退出 0。
- 新增的 16 条，按它们守的规则：
  - 折叠带回了记录：`roundId` / `selected` / `context` / 建议（含路径、缺 label 时按文件名）/ 批注的 `variantId`；
  - `recordsFromChat`：只认自己的节点、按时间排、同一 snapshot 同一数组、空快照是空历史；
  - `recordFromHost`：和折叠**同一组键**（`Object.keys` 逐一比对），测试轮带观察与截图路径，取消的轮 `verdict === ''`，不带 `html`；
  - `mergeRecords`：日志赢重复；
  - `pickOpen`：游标优先，否则本会话最新，别人的会话和已结算的不算；
  - 面板：有历史没等待 → 显示最后一条（不是空态，只问宿主一次）；游标选旧记录；无游标选最新；
    日志没落的轮问宿主一次、404 退回最新且不报错；日志已有的不问宿主；**在 tab 里做决定 → 当场变记录，零额外请求**；
    聊天变化不碰网络；`RecordView` 无 iframe、无 textarea、带路径；取消的轮不编动词；
  - 接线：slot 的 `inject(sessionId)` 交出 `history`，同一会话同一来源，未绑定的会话是空历史不是错误；没有 chat 服务 tab 照开。
- **九条反向验证**（一次注入、跑测试、字节还原）：面板不读历史 → 3 条红；忽略游标 → 2 条红；替身不让位 → 1 条红；
  不问宿主 → 1 条红；聊天变化碰网络 → 1 条红；游标落空不退回（这一轮修掉的那个 bug）→ 1 条红；折叠丢建议 → 2 条红；
  决定后不带结果拼记录 → 1 条红；折叠丢 roundId → 3 条红。还原后 `sha256` 前 16 位 `ceff903ac4626be4`（139625 字节），与改前一致。
- **写测试时抓到一个真 bug**：游标指向「哪儿都没有」的一轮（重启后的 id），兜底被写成 `cursor === undefined && …`，
  结果是空态而不是最新——artifact 承诺的是退回最新。改成 `(!state.loading || cursor === undefined)`，并钉了反向验证。
- 文档同一遍里对齐：[AGENTS.md](../../../AGENTS.md) 不变量 7、宿主「store」、浏览器「History」三条；
  [06-implementation.md](../../06-implementation.md) 的「一次只显示一轮」；[CHANGELOG.md](../../../CHANGELOG.md) `Unreleased`。

## 真机（fail）

`clarity-test-mwu9kjv0-9bae6a`：用户在会话里打开 Clarity tab，看到的是
「No round is open / A round opens here automatically when the agent calls clarity_round or clarity_test.」
——空态，不是记录。截图 `.clarity/screenshots/clarity-test-mwu9kjv0-9bae6a/shot-1.png`。

**为什么当时没发现**：合同测试里 `history` 是一个稳定对象，面板拿到就有；真机里它是**在挂载之后**才绑定的。
`uiConversation.binding(sessionId)` 在席位接管会话的下一刻才可用（`openWaitingRound` 那段代码早就为同一件事
写过 8 次 75ms 的重试），而面板的 `history` 是通过 slot 的 `inject` **一次性**算出来的——
绑定没到，它就把 null 记了一辈子。

**修了什么**（同一轮，不另开）：slot 交出的不再是一个快照，而是一个**求值器** `() => historySourceFor(sessionId)`；
`RoundPanel` 每次渲染都调它，并在拿到之前以 250ms 重试最多 8 次（约 2 秒），之后老实显示空态——
一个永远转的计时器比一个诚实的空态更糟。新增两条合同测试：求值器在**同一份 props 的下一次渲染**里生效
（不重挂载），以及 slot 交出的必须是求值器。九条反向验过，还原后 `sha256` 前 16 位 `5d1a127d76ca4b3c`
（140396 字节）；测试沙箱补上了 `setTimeout`/`clearTimeout`——页面本来就有，缺了它反而让沙箱不像页面。

**仍未证明的是**：这根线在真页面里是否真的接上了。Playwright 打不开这个页面（401），所以修复只是
「按证据最可能的原因 + 让失败可恢复」，不是「看见了它变好」。

## 未验证

- **真机一次没跑通。** 第一次闸门就是上面的 fail；修完的版本还没再进闸门。`uiConversation.binding(sessionId).target('chat')`
  这条路只对着 `.d.ts`、假对象和「最可能的时序」走过：`binding` 什么时候可用、`values()` 在真页面里给不给我们的节点、
  订阅在流式输出时的频率——都要在真页面看一眼。
- **回放与翻页都还没有。** 今天用户能看到的「历史」是：决定之后那一轮留在原地变成记录，以及没有等待时显示最后一条。
  往回翻是下一轮（用户已明确要求先把具体 UI 过目）。
- **「已加载 ≠ 全部」没量过。** 聊天窗只装一段日志；更早的轮次要等聊天往上翻。tab 自己推不动装载。
- **首屏有没有闪一下。** 游标没给、宿主还没答时，面板先说「正在读取」再切到等待轮；真机看得出，我没看见。
- **刷新后 `navigation.params` 还在不在**，取决于外壳对 tab 记录的恢复；没验。
- **记录卡的到达动效**（`clarity-arrival`，key 是 roundId）、深色主题、长上下文的换行，都没看过。
- **250ms × 8 的重试没在真机上量过。** 它只证明了「迟到的绑定会被接住」；真机上多久接住，未知。

## 代价

- **历史里看不到 mock 本身**，只看到它的文件路径。日志里没有 HTML，`/clarity/api` 也不该收文件路径（不变量 4）。
  要回放，得在这个模型之上另加一层「宿主还记得就拿来画」，不是它的一部分。
- **取消掉的轮次、非阻塞的轮次翻不到**——折叠今天就不给它们画行（不变量 7）。
- **更早的轮次要等聊天装载到那一段**。
- **`decided` 到 `tool/result` 之间有一拍空档**，靠宿主的替身顶过去；这是留下来的最后一点本地状态，不是零。
- **折叠重了一点**：每个节点多带 `variants`（含路径与三组保真度）。一段长会话里多几百字节。

## 下一轮

翻页控件：一条带、上一条/下一条、还是抽屉。建在这个模型上——列表与游标都已经在了，缺的只是动游标的手。
