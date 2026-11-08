# Round 0022 — 测试的结论要不要也留一条气泡

**Decision:** clarity_test 的结论要不要也留一条气泡？
**Variant A:** *要，只写结论* —— 候选 + Passed / Failed / Blocked，观察留在工具行。
**Variant B:** *不要* —— 结论留在工具行与 `rounds/<NNNN>/test.md`。
**Recommendation:** A —— 结论是一个词，观察是一段话。
**Verdict:** **revise**（甲 a 上带一条批注）。

## 批注

> 不认同。观察完全可以写，且甚至可以考虑图片兼容。你看那个 ask user 不也是把用户写的重新显示了一遍嘛。

批注锚在「观察是…读第二次」那条理由上：用户否定的是「观察不必再显示一次」这个论证，
不是形状本身。`ask_user_question` 的气泡确实把用户写的原话再显示一遍，测试气泡照同一个立场做。

## 结果

这一轮没有实现。修订方向两条：观察进气泡；截图另行决定 →
[round 0023](../0023-test-bubble-images/round.md)。

## 记录

- Tool round `clarity-mw66mi1v-650bab`；变体文件 [a.html](a.html)、[b.html](b.html)。
