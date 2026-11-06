# Round 0015 — 测试关的三处修正

**Decision:** 第三个按钮按下去，这一轮到哪一步结束？
**Variant A:** *取消该测试* —— 按下去这一轮就关了，agent 收到 `cancelled`。
**Variant B:** *先放一放* —— 不关这一轮，回到「准备完成，开始测试」，agent 继续等。
**Recommendation:** A.
**Accepted:** A.
**Forecloses:** 想「等会儿再测」的人只能整轮取消：agent 白等一次，回头还得重新开一轮。

## Why this round

上一次实测（`dirty:5be9c91`，verdict `fail`）带回来三件事：

1. 标题是 `Real test: dirty:5be9c91`——一串用户不认识的英文加一个内部标识；
2. 按了「准备完成，开始测试」之后，刚才那条命令就没了，用户只能凭记忆去开应用；
3. 「无法测试」和「返回上一步」两个按钮，用户说不清区别，提议并成一个「取消该测试」。

前两条是明确的改法；第三条只有一个真问题——并出来的那个按钮，按下去之后这一轮到哪一步结束。
A 是关掉（和决定面板的「取消这一轮」对称），B 是挂起（round 继续开着，agent 继续等）。

## Outcome

- **标题**：测试关的 `h2` 就是「真机测试」，不再显示宿主拼出来的 `Real test: …`；候选变成
  meta 行里的 `版本：`。`round.decision` 仍然留在记录里给模型看，只是不再占据屏幕顶部。
- **命令**：prepared 行和命令块抽成一块 `preparedBlock`，ready 和 observe 两个阶段都渲染。
  看应用的时候，屏幕上一直写着「你在看哪个构建」。
- **按钮**：`通过 / 失败 / 取消该测试`。`blocked` 和「返回上一步」从界面上消失；场景卡片一直在
  上面，所以「回去再看一遍」本来就不需要退一个页面。
- **宿主**：`POST /test` 接受 `verdict: 'cancel'`；`RoundStore.test()` 对 cancel 走
  `{ status: 'cancelled', reason: … }` 分支，**不带 verdict**——取消不是一种测试结论。
- 同一批标注还带了两处排版：**代价**从头部移到变体下面（头部的「推荐」一行删掉，卡片角标已经
  写着「推荐」）；**真实/模拟/省略**改成三行「圆点 + 对齐标签 + 值」，不再是连成一句的灰字。

## Verification

- 合同测试 66 → 68，七个文件全绿。新增两条：
  - `a test gate can be cancelled instead of answered`（store）：cancel 之后 round 是
    `cancelled`、结果里没有 verdict、等待中的工具调用拿到 cancelled；
  - `cancelling a test gate sends cancel and needs no observation`（client）：观察框空着也能按
    「取消该测试」，发出去的 body 是 `verdict: 'cancel'`，并且界面上不再有 Blocked / Back。
- `node --check` 两个半截都通过。
- 真机：`dirty:39cf6cd25c2b`，`pnpm test` 退出 0，gate `clarity-test-mw49x67i-70e9a6` **pass**——
  标题是「真机测试」、版本行是 `版本：dirty:39cf6cd25c2b`、观察阶段命令仍在、底部三个按钮。
  取消按钮本身没有在这轮 gate 里按过，它的行为由 `tests/store.test.mjs` 覆盖。
- 第一次开的 gate 没跑成：写 `index.js` 之后宿主重载了这个插件，旧实例被 dispose，
  `RoundStore.close()` 把还在等的 round 结算成 `cancelled / the plugin was unloaded`。宿主起来后
  用 `/clarity/api/test` 打了一发 `verdict: 'cancel'` 的探针（回 `unknown-round` 而不是旧的参数
  拒绝），确认在线的是新代码，再重开 gate。

## 代价

`blocked` 从此没有界面入口。协议仍然接受它（`/test` 的枚举里有），但用户点不到——「我试了但
测不了」现在只能写成取消加一句观察。要用回来的话，是在「取消该测试」旁边再加一个入口。
