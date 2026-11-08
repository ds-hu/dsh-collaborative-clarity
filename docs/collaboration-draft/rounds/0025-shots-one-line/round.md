# Round 0025 — 那一行里写什么

**Decision:** 截图那一行：默认折成「截图 2 张」，还是直接写文件名？
**Variant A‴:** *一行折叠，点开见路径* —— 默认 `▸ 截图 2 张`，点开就地列出两条可点路径。
**Variant B‴:** *一行文件名，点了就开* —— `截图 shot-1.png shot-2.png`，每个名字可点，
完整路径在悬停提示里，没有第二层。
**Recommendation:** A‴ —— 路径是选这条路的原因，折起来但留着它。
**Accepted:** **B‴**，拒绝了推荐。
**Forecloses:** 气泡里没有完整路径，只有文件名；三张起就换行，「一行」只在两张以内成立；
文件名本身不说明它是哪一轮、哪个目录。

## 这一条链

0022 → 0023 → 0024 → 0025，四轮都在同一个决定上：**测试的结论要不要在对话里留痕，留到什么程度**。

- [0022](../0022-test-bubble/round.md)：只写结论 vs 不写。退回——观察当然要写，`ask_user`
  的气泡本来就把用户写的重显示一遍。
- [0023](../0023-test-bubble-images/round.md)：观察进气泡之后，图怎么办。退回——并抓到我写的
  一句假话（「在工具行里看」，工具行根本看不到图），同时给出「路径点开在边栏」的方向。
- [0024](../0024-shot-paths/round.md)：路径 vs 缩略图。退回——两条完整路径太吵，要求压成一行，
  像未展开的工具调用。
- 0025：压成一行之后行里写什么。接受 B‴。

## Outcome

`client.js` 的 `decisionNode` 从「只认 `clarity_round` 的裁决」扩展成**两种行**，其余结构不变：

- `start` 记住是哪一种：`clarity_round` 的 `decision` 句，或 `clarity_test` 的 `candidate`。
- `update` 按种类各收各的动词：决定收 `accept / revise / reject`，测试收 `pass / fail / blocked`。
  别的（取消、`pending`、报错、读不懂、另一种的动词）一律不画，工具行照旧。
- 测试行多两段：观察（`pre-wrap`，照用户写的换行）与一行截图——`截图 shot-1.png shot-2.png`，
  每个名字是 `<button>`，`title` 是完整路径，`onClick = props.openFile(path)`。
- 新增五个文案键：`bubble.pass / fail / blocked / shots / openShot`，中英同键集。
- 宿主半边零改动：路径本来就是相对会话目录的，正是边栏预览接受的地址形状。

## Verification

- 合同测试 83 → 85，七文件全绿（`pnpm run verify` 退出 0）。
  - `a real-test verdict folds into one row with its observation and its shots`：喂
    `clarity_test` 的 call + `tested` 结果，断言 `kind: 'test'`、candidate、观察、两条截图路径；
    `blocked` 也是一个可画的裁决；没有截图是空列表而不是崩。
  - `the test row names each screenshot, and each name opens it in the sidebar`：渲染出来的文字里
    有候选、`Passed`、观察、`Screenshots`、两个文件名；按钮的 `title` 是完整路径，
    `aria-label` 是「Open shot-1.png in the sidebar」，点下去 `openFile` 收到的是那条路径。
  - 旧的「`tested` 不画行」断言改成「decision 的 call 收到 test 的裁决是种类不匹配」。
- **反向验过**：把 `drawable` 从「按种类取动词表」改成只认决定表 → 两条新测试同时红；随后字节
  还原，`sha256` 与改前一致。
- **真机通过（2026-11-07，`clarity-test-mw694ijz-304c8d`，pass）**：闸门结束后 `clarity_test`
  那一行下方出现一条气泡——候选、`Passed`、观察、「截图 shot-1.png」；点文件名，右侧边栏打开
  了那张图，**`openFile` 吃相对路径**，不用宿主再补绝对值。观察原文只有「测试」两个字，所以
  那一段也很短：这条覆盖的是形状与链路，不是文案长度。

## 代价

- 文件名没有信息量：`shot-1.png` 不说明它是哪一轮；完整路径要点悬停才看得到。
- 三张以上就是一行换成两行，「压成一行」只在两张以内成立。
- 一次工作现在最多留下两条气泡（决定 + 测试）。
- 仍然不做：`blocking: false` 的晚期决定、PTC 下的 `tool/ptc-dispatch`。
