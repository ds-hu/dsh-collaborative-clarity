# Round 0029 — 动词栏的语法

**Status:** tested
**Tool rounds:** `clarity-mwkm3kn8-19896a`（第一轮，revise）→ `clarity-mwkm8wlr-0bc400`（改后，accept）
**Real test:** `clarity-test-mwkmqm8y-71606f`（pass，2026-11-17）
**Opened / decided:** 2026-11-17
**Artifacts:** 第一轮 [a-one-group.html](a-one-group.html)、[b-earned-fill.html](b-earned-fill.html)；
改后 [a2-sweep-text.html](a2-sweep-text.html)、[b2-tide-text.html](b2-tide-text.html)

用户的原话：

> Pass/Fail 以及 Accept/Revise/Reject 等等，你看看这个能否更加具有层次感和对照感的设计，现在感觉像是强调 Accept/Pass，你想想这个语义对不对。

> 之前为了做动画，好像 Accept/Pass 左侧会有奇怪的常驻 Padding.

第二条说得没错，而且原因就是第一条：主按钮左侧**一直**站着一个 9px 的转圈盒（`visibility: hidden`，
只为「按下去时宽度不变」），加上 `gap: 6px`，文字被推右约 15px。所以这一轮只决定一件事——**动词栏的语法**；
那个常驻盒子两版一起修。

## 先看语义

- **一轮里的主语是那张被选中的卡，不是动词。** 接受＝把选中的这一张定下来；继续修改＝方向对、内容改；
  都不要＝这一版全丢。它们是同一条刻度上的三档承诺，不是「正确答案 / 半对 / 错」。
  给接受一个黑底，等于替用户把「这就是对的那一个」说了一遍——而选择的证据在卡片上。
- **测试闸门里这件事更糟。** 通过和失败是两条等重的**证据记录**。通过有黑底，读作「预期是通过」，
  而这道闸门存在的理由正是它不预设结果；顺手还把失败降级成一行红字。

## 决定

接受 / 继续修改 / 都不要，以及测试闸门的 通过 / 失败，该像 A 那样收成一格三档，还是像 B 那样只让填充
跟「现在能不能定」走？

## 两个变体

| Id | 标签 | Artifact | 真实 | 模拟 | 省略 |
|---|---|---|---|---|---|
| A | 一格三档 | [a-one-group.html](a-one-group.html) | 360px 的栏、DSH 浅/深色 token、12px/18px 与 30px 栏高、radius 12px；三档的墨色阶梯；忙碌态是同一枚按钮 | 变体卡只有标题行（预览区是空位）、note 输入框、滚动 | 悬停/焦点/长文案下的收窄；测试栏补 `blocked`；其他主按钮的语法 |
| B | 选中点亮 | [b-earned-fill.html](b-earned-fill.html) | 同上，另加「未选卡时接受按不动」与代码里 `accept && !selected` 的拦截一致 | 同上 | 同上 |

推荐是 A：一格先说清这三件事回答的是同一个问题，没有哪一格靠填充色抢位。B 的代价写在它自己的卡片里——
**选完卡，接受还是变回一枚黑底按钮**，被批评的那个画面在「已选」状态里原样重演。

## 结果（第一轮）

```json
{"status":"decided","roundId":"clarity-mwkm3kn8-19896a","verdict":"revise","selected":"a","comments":[{"text":"这个感觉可以改成字体渐变动画，你知道我什么意思吗","anchor":{"kind":"element","selector":"body > div:nth-of-type(1) > div:nth-of-type(4) > div:nth-of-type(1) > div:nth-of-type(1) > button:nth-of-type(1)","text":"接受 B"}}]}
```

**取了 A 的格子，要改忙碌态**：批注锚在「按下之后」那一格上，说的是那个转圈。于是第二轮只问手感的差别。

## 决定（第二轮）

忙碌态让字自己动，是要一条窄光带扫过去（A），还是让一整片宽的明暗来回荡（B）？

两版都把转圈**删掉**，改由标签自己报告进度：`background-clip: text` 上一层会走的渐变。宽度不动，因为
什么都没多出来——不是「预留一个盒子」，是不需要盒子。

```json
{"status":"decided","roundId":"clarity-mwkm8wlr-0bc400","verdict":"accept","selected":"a"}
```

取了扫光：1.4 秒一条窄带从左到右，方向明确，最早被认成「正在发送」。

## 建了什么

- **一条框**（`.clarity-seg`，`role="group"`，`aria-label` 复用 `bubble.label`）：三个动词共用一条 0.5px
  细线，第一格左侧没有边线，格子等分、文字居中、长了就省略号。栏本身 `flex: 1 1 220px`，取消 `flex: none`，
  窄到放不下时整格换行、而不是四个按钮散成两排。
- **墨色阶梯**：接受/通过 `label-primary` + 600；继续修改 `label-secondary` + 400；都不要/失败 `error`。
  **整条栏没有一处填充色**，`data-tone="primary"` 从动词上消失（保存编辑、添加评论、开始观察仍是实心主按钮，
  它们不在这条栏里）。
- **离开不是回答**：取消这一轮 / 取消该测试成了框外面的一个安静链接（无边线、无底色、`label-tertiary`）。
- **忙碌态**：`button[data-busy='true'] .clarity-verb-label` 上跑 `clarity-sweep`；`color-mix` 不可用时退成
  一次平淡的淡出（`clarity-fade`），**不是**让字形挖空。`.clarity-spin`、它的 `@keyframes`、按钮上的
  1.2 秒扫光 `::after`、`buttonBase` 里的 `gap: 6px` 一起删掉——那个「常驻 Padding」的成因没了。
- **动词按 id 说话**：「接受 B」用的是变体 id，不再是 `variantLabel` 的整句标签——一个标签可以是一句话
  （0028 那个变体就叫「B · 起：到达也动」），三分之一的宽度放不下。`Shows the variant a comment belongs to`
  那条路径仍用标签。
- **降级但不宣传**：未选卡时接受是静的、按不动（`unavailable` 参数）。但今天到不了这个状态——草稿默认选中
  推荐项（`draftOf(round.id, recommendedId)`），点卡片只换不取消。代码留着兜底，记录里不把它当一个状态卖。
- **焦点环挪进格子里**：框有 `overflow: hidden`，`outline` 会被裁掉，所以格子用 `inset` 阴影画 2px 焦点环。
- **`prefers-reduced-motion: reduce`**：渐变停下，标签变成一枚淡到 55% 的字——还是在说「在发送」，只是不动了。
- `buttonDanger` 常量删了（两处调用都改成墨色阶梯），`variantLabel` 仍在（批注区用它）。

## Verification

- 合同测试 **101 → 102**，七文件全绿（`pnpm run test` 退出 0）；`pnpm run check` 退出 0。
- 改的断言：`buttonsNamed` / `buttonText` / 三处局部 `button()` 助手改成 `textOf(node)`——动词现在包一层
  `<span class="clarity-verb-label">`，按钮的可见文字等于它的文字内容，这个改法本身是对的（可访问名不因多一层而变）。
- 新的与改写后的合同测试：
  - 动词栏是**一条框**：三格按承诺顺序是 `Accept B` / `Revise B` / `Reject A&B`，取消**不在框里**；
  - 静止时按钮**只有标签一个孩子**，发送中也是；树里没有 `clarity-spin`；
  - 样式表里忙碌的是 `.clarity-verb-label`（`background-clip:text`），没有 `clarity-spin`、没有
    `[data-busy]::after`，`prefers-reduced-motion` 分支留着 `animation:none` 的淡出。
- **三条反向验证**（一次注入、跑测试、字节还原）：把转圈盒塞回标签前 → 「a working button…」红；把取消挪进框里
  → 「the action row names the variant each verb acts on」红；把样式表里那格的选择器改成没人用的
  `.clarity-verb` → 「the working label is the indicator…」红。还原后 `sha256` 前 16 位回到
  `3424265ddf37e35b`（123974 字节），与改前一致。
- **真机通过（2026-11-17，`clarity-test-mwkmqm8y-71606f`，pass）。** 闸门里跑的是刷新页面后打开面板：
  五条预期逐条看过——底部是一条细线框、三格等分、没有黑底、都不要是红字；取消在框外；点另一张卡
  「接受 X」的字母跟着换；按「继续修改」时那格的字上一道光带扫过、文字不位移、整排不跳位、其余两格变淡；
  三个动词在格子里居中，左边那段 15px 的空白没了。
- **没做的是量。** 上面那条是「看见了」，不是「量过了」：没有像 0028 那样把样式表抽出来喂给 Chromium
  量像素。沙箱起不了浏览器（见下）。

## 未验证

- **像素没量过。** 真机看到的是形状与动效都对，没有把运行时的样式表抽出来量像素（沙箱里 Chromium 起不来：
  crashpad 的子进程被拒、`spawn EPERM`；Playwright MCP 的 profile 被另一个会话占着）。
- **两个数没读过**：英文「Cancel this round」在一行里的实际宽度，以及深色主题下的扫光对比度。
  真机那次是中文字面，浅色主题。
- **`color-mix` 的降级分支没在旧内核上跑过。** 逻辑上是：不支持就不上 `-webkit-text-fill-color: transparent`
  的那条规则，退成 `clarity-fade`，所以最坏情况是淡出而不是字消失。
- 会话行、对话里的决定气泡、`clarity_test` 闸门里 `blocked` 那条缺的按钮，都不在这一轮范围内。

## 代价

- **三档挤在一格里，误触距离变短**：「都不要」离「接受」只隔半根细线，而它是最不该被误点的那个。
- **红字比实心按钮轻**：失败/都不要在触屏上更难命中，却比今天更该被慎重对待。
- **忙碌态是一段一直在跑的渐变**：面板的动效预算里，它是唯一在你不动时也会动的东西（1.4 秒一轮，直到回应到达）。
- **接受只说 id**：标签是一句话的轮次里，bar 上读到的是「接受 B」，要回到卡片才知道 B 是什么。
- 一排按钮从「一个主操作 + 三个次要」变成「一个三档选择 + 一个离开」，和面板里其他实心主按钮不再是同一种语法；
  下一轮如果改那些按钮的语法，得回来对一次。
