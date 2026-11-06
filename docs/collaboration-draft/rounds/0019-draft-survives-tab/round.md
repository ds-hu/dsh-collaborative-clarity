# Round 0019 — 切 tab 就丢的草稿

**Decision:** 切 tab 就丢的草稿：记在页面内存里，还是写进 sessionStorage？
**Variant A:** *页面内存* —— `client.js` 模块层一个 Map，键是 round id，和 `pending` / `roundFeed` 同一层。
**Variant B:** *sessionStorage* —— 按 round id 写进本标签页的 storage，刷新也还在。
**Recommendation:** A —— 切 tab 是常事，刷新不是；storage 是另一个决定。
**Accepted:** A.
**Forecloses:** 按 F5 或宿主重载插件，这一版一个字都救不回来。

## Why this round

总在切 tab 的人会发现：**批注、没点 Add 的字、选中的变体、备注、正在编辑的那条，全在这个面板
自己的 `useState` 里**。而右侧栏换一个 tab 就把面板卸载了——`ctx.slots` 只画当前 tab 的 body——
回来时是全新的一遍，连 `/rounds` 重新问一遍都算正常，只是草稿没了。

这是真的丢东西，不是显示问题：你写了一条批注、读 artifact 读到一半去看看别的，回来它就没了。

两条路的分界线不一样：页面内存活不过刷新，storage 活不过「宿主已经把这一轮结算了」。

## Outcome

`client.js` 模块层多一个 `drafts` Map（上限 20 轮，最早的先挤掉），外加一个 5 行的
`useRemembered(draft, name)`：**草稿是真相，hook state 只是镜像**，写的时候两边一起写。

`DecisionView` 的九个字段改住在这里：`selected`、`comments`、`commentText`、`commentVariantId`、
`editingIndex`、`editText`、`pendingAnchor`、`annotate`、`note`。`busy` 和 `error` 留在 hook 里
——一个是正在发请求，一个是刚才那句报错，都不该跨一次卸载活下来。

决定送出去之后 `drafts.delete(round.id)`：这一轮的草稿已经变成了宿主那边的记录。

## Verification

- 合同测试 74 → 76，七文件全绿（`pnpm verify` 退出 0）。
  - `a draft survives the panel unmounting, which is what a tab switch does`：加一条批注、输入框里
    留半句 → `unmount()` → 再渲染，批注和那半句都在；换一个 round id 再渲染，草稿不串门；
  - `the draft is spent once the decision lands`：接受之后 `unmount()` 再渲染，送出去的那条不在。
- 两条都反向验过（字节还原，`sha256` 一致）：不把草稿存进 Map → 第一条红；不删已送出的草稿 →
  第二条红。
- 测试里的 `unmount()` 是给 `statefulReact` 新加的：`hooks.length = 0`，就是「这个面板没了」。
- **真机未测**：验证方法就是切走再切回来看批注还在不在。

## 代价

- 刷新页面仍然全丢。要救这一种，得走 storage（本轮拒掉的那条），并且要连带想出清理规则。
- 草稿按 round id 记账，宿主那边已经结算的轮次，本地草稿不会主动知道——靠 20 条上限自然作废。
- `RoundPanel` 自己的 `sent` 仍是 hook state：决定之后切走再回来，看到的是「这一轮已回答」的
  记录卡，而不是刚刚那句「已发送」。两句话说的是同一件事，但不是同一个画面。
