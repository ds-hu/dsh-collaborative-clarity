# TODO

2026-11-07 重写：做完的都挪进 round 记录和 LEDGER 了，这里只留在办的事。合同测试现在是 78 条，
七个文件全绿。

## 一、卡在你这边的两件

### 1. README 的两张截图

README 里现在一个 `<img>` 都没有：宁可空着，也不放裂图。

- [ ] **`docs/images/round-tab.png`** —— Clarity tab 里开着一个 round：两个变体并排、每张卡片里
  带着推荐/代价（0016 之后的版式）、下面是批注区。放在两版 README 的斜体 tagline 之后、
  `## What goes wrong when you vibe code`（中文版 `## Vibe coding 会踩的坑`）之前。
- [ ] **`docs/images/test-gate.png`** —— prepared 行、命令那一行、3–7 步场景、**准备完成，开始
  测试**。放在 `## The last step is a real test`（中文版 `## 最后一步必须真测`）开头。
- 规格：PNG，宽度 ≥ 900px；画面里不要带别的会话、别人的名字。
- 我这边打不开 GUI（Playwright 新上下文访问 `127.0.0.1:3080` 直接 401），所以图得你给，
  或者临时给我一个能进的方式。
- [ ] 图到了之后要改打包：`docs/images` 进 `package.json` 的 `files`，否则 npm 页面上会裂。

### 2. 两版 README 的措辞清单

- [ ] **英文版**哪几处要改，待你指。我自己觉得不稳的：
  - `The file is evidence, not inventory.` —— 我编的句子，可能太俏。
  - 三个坑后面那句斜体答案，在 Markdown 里跟正文连着，读起来像一句话太长。
  - 徽章在窄屏折两行（GitHub 桌面端是一行）。
  - `<details>` 里套代码围栏，在 GitHub 上我没实测过。
  - 标题里的 `vibe code` 不用再提了——0018 定过：留。
- [ ] **中文版**哪几处要改，待你指。规则：按中文写，不要先改英文再翻（0011 的 Addendum 里记了
  这条，也记了第一版为什么读着生硬）；round / artifact / agent 保留英文，foreclosure 译作「代价」。

## 二、我能自己做完的

- [ ] **推送** —— `origin main` 还没推，`main` 也还没建立跟踪。远端是
  `https://github.com/ds-hu/dsh-collaborative-clarity.git`。
- [ ] **0012 / 0013 的证据入账** —— LEDGER 里这两行还是 `built`。0012（没点 Add 的批注随决定
  送出）你在 0016 用过，0013（面板跟着 GUI 走中文）整块面板都在跑。要么按你一句话推 `tested`，
  要么各开一轮正式 gate。
- [ ] **0.4.0** —— Unreleased 里躺着两次 breaking schema 变更（`coldBuild` → `prepared`、
  `warmStart` → `runThis`；`round.recommendation` / `foreclosures` → `variants[].recommendation` /
  `cost`）。流程：bump `package.json` → CHANGELOG 的 Unreleased 归到新版本 → 打 `v0.4.0` 推 tag，
  CI 用 OIDC 发布。

## 三、已经结账的（细节都在各自的 round 记录里）

| 轮次 | 结果 | 状态 |
|---|---|---|
| 0011 | README 重写成 why/how，机制拆进 AGENTS.md，中文版按中文重写 | decided |
| 0012 | 没点 Add 的批注随决定送出；动作行点名它作用在哪个变体上 | built |
| 0013 | 面板跟随 GUI 语言（`ctx.locale`，`anchor.*` 也已补齐） | built |
| 0014 | 批注的命名，外加一次 15 行的中文文案通读 | decided |
| 0015 | 测试关：真机测试标题、命令留在观察阶段、一个「取消该测试」 | tested |
| 0016 | 推荐/代价沉进变体（breaking）；整轮参数退场 | tested |
| 0017 | 已 Add 的批注就地编辑，锚点与位置不动 | tested |
| 0018 | README 保留 `vibe code`，两版都不动 | decided |
| 0019 | 草稿住在面板之上（刷新仍丢） | superseded by 0020 |
| 0020 | 草稿进 sessionStorage：切 tab、刷新都还在 | tested |
