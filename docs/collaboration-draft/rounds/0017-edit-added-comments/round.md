# Round 0017 — 已 Add 的批注要能改

**Decision:** 已 Add 的批注要改，点在哪儿：行里就地变输入框，还是搬回下面那个输入框？
**Variant A:** *就地改* —— 那条批注自己变成输入框，下沿「保存 / 取消」，所属变体和锚点一直看得见。
**Variant B:** *回填输入框* —— 字搬到底下唯一的输入框，那一行只留高亮和「正在修改」。
**Recommendation:** A —— 你点的是这一条，改的也是这一条。
**Accepted:** A.
**Forecloses:** 编辑时行高会跳一下；并且同一时刻只能有一条在编辑，所以「点另一条的编辑」必须
先定一条规则（本轮定为**先存这条再开那条**，存不下就原地不动）。

## Why this round

这一版之前，点过 Add 的批注只能看不能改：想改一个字，只能 `×` 掉重写一遍，锚点也跟着重挑。
删了重写会丢锚点，而锚点正是这条批注值钱的地方——它是「这个位置要改」的唯一凭据。

A 把输入框放回那一行里，锚点标签和所属变体就贴在输入框上方，改的时候一眼看得见自己在改哪条；
B 复用一个输入框、少一个控件，代价是眼睛要下移，而且候选下拉、锚点提示都和「新建批注」抢同一个框。

## Outcome

`client.js` 的批注区多两个 state：`editingIndex`（哪一条在编辑）和 `editText`（正在改的字）。

- 每条已 Add 的批注右侧是 `编辑 ×`（两个都是小号灰按钮，和原来那个 `×` 同款）。
- 点「编辑」：那一行的文字变成 `textarea`（预填原文字，`autoFocus`），下方出现 `取消 | 保存`，
  `保存` 是主按钮；`编辑 / ×` 在这一行消失，避免边改边删。
- **保存只换 `text`**：`comments[i] = { ...comments[i], text }`。锚点、所属变体、`artifactHash`、
  在列表里的位置一律不动。
- **空文字保存被拒**，用现成的「先写一条批注」，不静默删行，输入框保持打开。
- 键盘：`Esc` 取消，`Ctrl/Cmd+Enter` 保存。行内其他地方点击仍然＝「在 artifact 里指给我看」
  （输入框和按钮各自 `stopPropagation`）。
- `beginEdit` 在另一条开着时先 `saveEdit()`；保存被拒就**不开新的那条**，等于什么都没发生。
- `removeComment` 照顾编辑态：删掉的正是编辑中那条就关掉编辑；删的是它前面那条，编辑下标跟着前移。
- **没保存的编辑随决定一起送出**：和 0012「输入框里没点 Add 的字跟着决定走」同一条道理——
  在编辑框里改完直接点「要求修改」，改后的字就是送出去的字，不会被悄悄丢掉。
- 新增文案三个键（en/zh 同名）：`comments.edit` / `comments.save` / `comments.cancelEdit`。

## Verification

- 合同测试 70 → 73，七个文件全绿（`pnpm verify` 退出 0，2026-11-06）。
  - `an added comment is rewritten in place, keeping its place in the list`：两条批注 → 改第二条 →
    输入框预填原文 → 保存 → 行恢复成文字、旧字消失、顺序不变；
  - `saving an empty edit is refused instead of deleting the comment`：清空再保存 → 弹出
    「先写一条批注」、输入框还开着 → 取消后原文还在；
  - `an edit typed but not saved travels with the decision, anchor and place intact`：改完不保存直接
    「接受 A」→ 送出的 `comments` 只有一条、文字是改后的、`anchor` 仍是 `{kind:'variant'}`。
- 三条都按项目规矩反向验过（改坏 → 测试红 → 字节还原，`sha256` 一致）：
  去掉空文字拒绝 → 第二条红；`base = comments`（不并入编辑）→ 第三条红；
  保存改成追加而不是替换 → 第一条红。
- **真机通过（2026-11-06T18:5x，round 0018 `clarity-mw4utbqx-53aaf3`）**：那一轮的批注就是这条
  功能的实测——先写了一条「测试」，用「编辑」进去改成「我将这条批注从"测试"更改为了"已编辑"」，
  再接受 A。送回来的 `comments[0]` 就是改后的字，`anchor` 仍是那条挂在 `<h2>` 上的
  `{kind:'element', selector:'body > div:nth-of-type(2) > h2:nth-of-type(1)'}`——**文字换了，
  锚点没动，位置也没动**。

## 代价

- 编辑状态是本地 state，不落盘：刷新页面＝放弃正在编辑的字，和未点 Add 的批注一样。
- 「先存这条再开那条」是隐式规则：两条都开着时点另一条的「编辑」，前一条会被存下去，
  用户不会看到「已保存」以外的确认。要更保守，就得在列表里同时只允许一条有「编辑」按钮。
- 顺带发现一处 0013 漏网：`anchorLabel()` 里 `Whole variant` / `Element · …` / `Line 3` 是硬编码
  英文，中文面板下批注行和「正在批注」提示里会露出来。不属本轮，但同一天就修了：六个
  `anchor.*` 键 + 一条盯着语言的新测试（74 条里的最后一条），改回硬编码立刻变红。
