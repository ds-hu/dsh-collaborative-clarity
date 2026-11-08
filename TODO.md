# TODO

2026-11-08 重写：做完的都挪进 round 记录和 LEDGER 了，这里只留在办的事。合同测试现在是 90 条，
七个文件全绿。

## 一、卡在你这边的

### 1. 测试关的截图（round 那张已经有了）

- [x] **round 图** —— `docs/README_image.png`（2868×1634）。你直接放进中文版，英文版引用同一张；
  `package.json` 的 `files` 也加了这个文件，否则 npm 页面上会裂。
- [ ] **测试关的图** —— prepared 行、命令那一行、3–7 步场景、**准备完成，开始测试**。两版 README
  现在把它放在 `clarity_test` 那一节里（英文 `a real test before it ships`，中文 `上线前的实测`）。
- 三件小事，看你是否在意：
  - `docs/README_image.png` 的内容其实是 JPEG（2868×1634，395 KB），只是扩展名叫 `.png`；
    要不要转成真 PNG。
  - 那张图截于 0013 之前，面板上的 `DECISION` / `Annotating` / `Comments` 还是英文；现在的面板跟着
    GUI 走中文。想要一张「全中文面板」的图就得重拍。
  - 根目录那个 `image.png`（1264×1594）是另一张、没被任何文档引用；删还是留？

### 2. 两版 README

- [x] **中文版**：你已经重写完了（2026-11-08）。
- [x] **英文版**：照着你的中文版重写，六个小节一一对应。我替你定的几处，不同意就推翻：
  - 「把 demo 和逻辑成仙给你看」按「把 demo 和推理摆到你面前」理解（“成仙”我读作「呈现」的笔误）。
  - 两个工具小节的标题：`clarity_round`: a decision you can see / `clarity_test`: a real test
    before it ships。
  - 原来那句「agent 在工具调用里等你」两版都没有了；要留的话它该在首屏那句里，现在不在。
  - `vibe code` 按 0018 留着。

## 二、我能自己做完的

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
| 0018 | README 保留 `vibe code` | decided |
| 0019 | 草稿住在面板之上（刷新仍丢） | superseded by 0020 |
| 0020 | 草稿进 sessionStorage：切 tab、刷新都还在 | tested |
| 0021 | 决定在对话里留一条气泡，连理由一起记 | tested |
| 0022–0025 | 测试结论也留气泡 → 截图怎么落地 → 一行文件名，点了在右侧栏开图 | tested |
| 0026 | 通过时的观察可以空着 | tested |
| 0027 | 复查三修：空白串、CHANGELOG 自相矛盾、剪贴板里的全角冒号 | tested |
