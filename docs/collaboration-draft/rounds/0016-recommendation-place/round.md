# Round 0016 — 推荐和代价放哪儿

**Decision:** 推荐和代价放在哪儿：整轮头部一块，还是每张卡片自己带？
**Variant A:** *留在整轮* —— 卡片角上还是那个「推荐」小标，代价是一块，放在两张卡片下面、按钮上面。
**Variant B:** *沉进变体* —— 每张卡片自己带「推荐」和「代价」，在产物下面、「真实/模拟/省略」上面。
**Recommendation:** B —— 卡片自己就是完整的论点，谁的代价跟着谁的论点走。
**Accepted:** **B，附三条批注**（verdict `revise`）。
**Forecloses:** 整轮不再有一句「这一轮值不值得」的总评；`round.recommendation` / `round.foreclosures`
从此不存在，传了会被拒。

## Why this round

0015 的排版修正把「代价」从头部挪到了卡片下面，随即暴露了真问题：三张卡片的代价挤在同一块里，
读者得自己把它们分回各自的卡片；而「推荐」还挂在卡片角上，于是**同一个变体的两个论点一个在上一个在下**。

A 和 B 是两种读法：A 读「这个选择的代价」，B 读「每个选项的代价」。B 更接近一个人在比较选项时
真正问的东西——不是我该不该换，而是换成这个要付什么、换成那个要付什么。

## The three comments (round verdict `revise`)

1. **代价放到「真实/模拟/省略」上面**：一张卡读完的顺序应该是「长什么样 → 值不值 → 有多真」，
   而不是先审证据再听主张。
2. **圆点要和标签垂直居中**：当时用 `alignItems: baseline` + `alignSelf: center`，圆点比文字
   中线低一像素；改成 `flex-start` + 显式 `marginTop: 5px`，字号一变也不会再飘。
3. **顺手验 0012**：这一轮的批注只在输入框里打、没点 Add，看它会不会随决定送出去——**会**。

## Outcome

**schema 破了（宿主半截）。** 推荐和代价从整轮搬到变体：

```js
variants[].recommendation = "一句话"      // 有它即推荐；整轮恰一条
variants[].cost           = ["…", "…"]    // 这个选择的代价
round.recommendation / round.foreclosures // 退场，传了会被拒
```

- `VARIANT_SCHEMA` 多两个属性，`VARIANT_FIELDS` 跟着加；
- `decisionTool.execute` 的 `refuseUnknown` 只剩 `decision / context / variants / blocking`；
- 校验「整轮恰一条带 recommendation」，0 条和 2 条都是明确报错，不是取第一个；
- 非阻塞的 pending 结果仍回 `recommendation: recommended[0].id`，形状不变。

**客户端（`client.js`）。** 新增 `Advice` 组件，渲染在 `variant.note` 之后、`Fidelity` 之前：

- 一张卡片里顺序是：产物 → **推荐 / 代价** → 真实/模拟/省略 → 按钮；
- 「推荐」是 brand 色的小标签 + 一句话；代价每条一行，标签 2.6em 定宽，值可以折行；
- 卡片角上那个「推荐」角标和整轮的代价块整块删掉；
- `recommendedId` 从 `round.variants.find(v => v.recommendation)` 取，旧形状的记录回落到第一个变体。

## Verification

- 合同测试 68 → 70，七文件全绿（2026-11-06T09:25）。
  - `the recommendation and its cost sit inside the card, above the fidelity rows`（client）：
    断言一张卡里 why < cost < real 的顺序、每条代价都在、推荐的变体默认被选中；
  - `exactly one variant carries the recommendation`（store）：0 条和 2 条都被拒；
  - `a retired round-level field is refused, not dropped`（store）：`foreclosures` 传进来是**报错**，
    不是被忽略。
- 反向验过：把 `cost` 挪到 fidelity 之后 → 第一条红；去掉「恰一条」校验 → 第二条红。
- **真机未测。** 这一轮的记录是补写的：代码 09:17 落盘、宿主 10:16 重启已在跑新代码，但新卡片
  排版没有人眼看着验过。0017 那一轮的卡片就是它，验的时候一并看。

## 代价

- 一条 breaking 变更：任何照旧写 `round.recommendation` 的脚本/提示都会在参数校验处失败。
  这是有意的——退役字段必须炸，不能悄悄丢。
- `clarity_round` 不再强制「至少一条代价」：`cost` 可以是空数组。约束从工具挪到了写法上。
- 整轮层面的「值不值得做这个决定」没有地方写了；要说得靠 `context` 或某条变体的 cost。
