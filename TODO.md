# TODO

Round 0011（README 重写）之后剩下的活。2026-11-05 记，2026-11-06 更新，做完一条划一条。

已经完成的别再做：README 重写、AGENTS.md 拆分、中文版（按中文重写，不是翻译）、四个徽章、
中英互链、round 记录与 LEDGER / CHANGELOG 同步。下面只是剩下的。

## 一、README 的两张截图（卡在图）

README 里现在**一个 `<img>` 都没有**：宁可空着，也不放裂图。

- [ ] **round 标签页** → `docs/images/round-tab.png`
  - 内容：Clarity tab 里开着一个 round——两个变体并排、每张卡片里带着推荐和代价、下面是
    批注区。（0016 改版后推荐/代价在卡片里，不在整轮头部——截图要等改版真机过了再截。）
  - 放哪：两版 README 的斜体 tagline 之后、`## What goes wrong when you vibe code`
    （中文版 `## Vibe coding 会踩的坑`）之前。
- [ ] **测试关** → `docs/images/test-gate.png`
  - 内容：prepared 行、命令那一行、3–7 步场景、**准备完成，开始测试**。
  - 放哪：`## The last step is a real test`（中文版 `## 最后一步必须真测`）这一节开头。
- 规格：PNG，宽度 ≥ 900px；画面里不要带别的会话、别人的名字。
- 我这边打不开 GUI：Playwright 新上下文访问 `127.0.0.1:3080` 直接 401，所以要么你给图，
  要么临时给我一个能进的方式。
- [ ] 截完还要改打包：`docs/images` 要进 `package.json` 的 `files`。npm 只打包
  `README.md`，相对路径的图在 npm 页面上会裂。

## 二、README.md 你要改的地方（待列）

- [ ] 具体哪几处待你指。下面是我自己觉得不稳的，逐条给我"留"或"改"：

  - `The file is evidence, not inventory.` —— 我编的句子，可能太俏。
  - ~~标题里的 `vibe code`~~ —— 0018 定了：**留**，两版都不动。要再赌一次就重开一轮。
  - 三个坑后面那句斜体答案，在 Markdown 里跟正文连着，读起来像一句话太长。
  - 徽章在窄屏折两行（GitHub 桌面端是一行）。
  - `<details>` 里套代码围栏，在 GitHub 上我没实测过。

## 三、中文版要改的地方（待列）

- [ ] 具体哪几处待你指。
- 规则：中文版按中文写，不要先改英文再翻。（`docs/collaboration-draft/rounds/0011-readme/round.md`
  的 Addendum 里记了这条，也记了第一版为什么读着生硬。）
- 术语按现状：round / artifact / agent 保留英文；foreclosure 译作"代价"（0016 起跟着进卡片）。

## 四、Round 0016：推荐/代价沉进变体（改到一半，停下点在这）

你在 0016 里选了 **revise B**，三条批注已全部落到代码：

- [x] **沉进变体**：schema 破了——`variants[].recommendation`（有它即推荐，整轮恰一条）+
  `variants[].cost`；`round.recommendation` / `round.foreclosures` 从参数表退场，
  传了会被拒（有测试盯着）。客户端角标换成卡片内「推荐 / 代价」两行，按钮紧跟卡片。
- [x] **代价放到"真实/模拟/省略"上面**：你的第一条批注。卡片内顺序是 产物 → 推荐/代价 →
  真实/模拟/省略（有测试盯顺序）。
- [x] **圆点上下居中**：你的第二条批注。`alignItems: baseline` + `alignSelf: center` 对不齐，
  改成 `flex-start` + 显式 `marginTop: 5px`。
- [x] 合同测试 68 → 70，7/7 全绿（2026-11-06T09:25）。
- [x] **宿主已重启**（2026-11-06T12:0x 核实）：在线的 web 进程 10:16:10 启动，晚于
  `index.js` 09:17:31 的写入；且我手上 `clarity_round` 的描述已经是新形状
  （`variants[].recommendation` / `cost` 逐条写进卡片，整轮参数退场）。新代码确实在线，
  可以直接真机。
- [x] 真机（2026-11-06T18:5x）：0018 那一轮整轮跑在新形状上——每张卡里「推荐 / 代价」两行、
  在产物和「真实/模拟/省略」之间，整轮不再有代价块——你挂了一条元素级批注在标题上并接受了 A。
  圆点那一像素的对齐没人专门看过，不算验过。
- [x] 记录收尾（2026-11-06 补写）：`rounds/0016-recommendation-place/round.md`、LEDGER D22 +
  0016 行、CHANGELOG 一条。状态是 `built`，真机过了才推到 `tested`。

## 五、产品：已 Add 的批注就地编辑（0017，已落码，待真机）

- [x] **0017 一轮定案：accept A —— 就地改**。点那条批注右侧的「编辑」，它自己的文字变回输入框，
  下沿「保存 / 取消」；锚点、所属变体、在列表里的位置都不动。
- [x] 键盘：`Esc` 取消，`Ctrl/Cmd+Enter` 保存；空文字保存被拒（不静默删行）。
- [x] 没保存的编辑随决定送出（跟 0012 同一条道理）；`×` 删掉了编辑中那条或它前面那条，编辑态跟着走。
- [x] 合同测试 70 → 73，三条新测试，且三条都反向验过（改坏 → 红 → 字节还原，sha256 一致）。
- [x] **真机通过（0018，`clarity-mw4utbqx-53aaf3`）**：一条批注先写成「测试」，用「编辑」改成
  「我将这条批注从"测试"更改为了"已编辑"」，再随接受送出——送回来的是改后的字，锚点还是那条
  挂在 `<h2>` 上的元素锚点。空保存、取消、改到一半直接决定这三条仍只有合同测试覆盖。

## 六、收尾

- [ ] 真机证据待入账：0012（未点 Add 的字随决定送出）和 0013（界面中文）其实都被你用过了
  ——0016 那轮你打字没点 Add、批注照到；整块面板是中文。LEDGER 那两行还是 `built`，
  要么补一行证据推到 `tested`，要么再各开一轮正式 gate。
- [x] **0013 漏网已修**（2026-11-06）：`anchorLabel()` 的 `Whole variant` / `Element · …` /
  `Line 3` 现在走 `anchor.whole` / `anchor.element` / `anchor.text` / `anchor.line(s)` /
  `anchor.other` 六个键（en 文案不变，zh 是 整条变体 / 元素 · … / 第 n 行）。一条新测试
  （`an anchor is named in the panel's language…`）盯着，反向验过：把那一行改回硬编码 → 红。
- [x] 提交（2026-11-06，两个 commit，见下）。未提交的这批从 0011 一直排到 0018：
  `index.js`、`client.js`、`tests/*.test.mjs`、`CHANGELOG.md`、`LEDGER.md`、
  `docs/collaboration-draft/rounds/0011…0018`、`README.md`、`README.zh-CN.md`、`AGENTS.md`、`TODO.md`。
- [ ] 推送 `origin main` —— 还没推。
- [ ] 版本：Unreleased 里现在有**两次** breaking schema 变更（`coldBuild` → `prepared`、
  `warmStart` → `runThis`；`round.recommendation`/`foreclosures` → `variants[].recommendation`/
  `cost`），发版是 0.4.0。
