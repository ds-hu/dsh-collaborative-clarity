# Round 0020 — 草稿落到哪个 storage

**Decision:** 草稿落到 storage：跟着标签页走（sessionStorage），还是跟着浏览器走（localStorage）？
**Variant A:** *sessionStorage* —— 刷新、宿主重启后刷新都在；关掉标签页即清，没有清理规则要写。
**Variant B:** *localStorage* —— 关浏览器再开也在，所有窗口共用一份；永远不过期。
**Recommendation:** A —— 它自己会过期，而草稿的寿命本来只该到这一轮结束。
**Accepted:** A.
**Forecloses:** 关掉那个标签页，没写完的字一起没了；同一个会话开两个窗口，两边各存各的。

## Why this round

0019 定的是「页面内存」，代价写在它自己的记录里：**刷新就白写**。随即就发现这是记错了——
参与的人以为当时选的是 storage 那一支。与其在对话里争，不如把两支 storage 摆出来重选：
它俩的寿命不一样，而这个差别正是「草稿该活多久」这个问题的答案本身。

sessionStorage 跟着标签页死，localStorage 跟着浏览器活。后者听起来更安全，代价是多出来
一整套清理规则，以及两个窗口同时改同一份草稿时**后写的直接覆盖先写的**——没有任何合并。

## Outcome

`client.js` 的草稿层从「一个 Map」改成「Map + 本标签页的 sessionStorage」，键是
`clarity.draft.<roundId>`：

- `draftOf()` 首次访问时先读 storage；读得到就填进草稿，读不到就是空的。Map 仍然存在，
  只是从「唯一的家」变成「这一页的缓存」。
- 每次 `useRemembered` 写入都顺手 `saveDraft()`：打字时也在写，和页面的卸载/刷新无关。
- 读出**只信自己写的形状**：不是对象、`comments` 不是数组、`JSON.parse` 抛错——一律当作没有草稿。
  storage 里有别人写的东西是常态，不值得让面板跟着坏。
- 决定送出后 `forgetDraft()`：Map 和 storage 一起删。
- 上限 20 轮：Map 挤掉最早的，storage 侧同样扫一遍（`store.key(i)` 枚举 `clarity.draft.` 前缀）。
- 没有 storage 的宿主（`window.sessionStorage` 缺失或被拒）退回纯内存：少一层保护，但面板照常。

## Verification

- 合同测试 76 → 78，七文件全绿（`pnpm verify` 退出 0）。
  - `a draft survives a page reload, because it is kept in sessionStorage`：写一条批注 + 半句话 →
    **换一个 client 实例**（＝新的一页、空的 hook 内存）用同一个 storage 再渲染 → 都在；
  - `junk in storage costs the draft, never the panel`：`clarity.draft.r1 = 'not json at all'` →
    面板照常画，脏数据一个字都不显示；
  - `the draft is spent once the decision lands, tab and storage alike` 加了 storage 侧的断言。
- 三条反向验过（字节还原，`sha256` 一致）：不读 storage → reload 那条红；`forgetDraft` 不删
  storage → spent 那条红；把 `catch` 改成 `throw` → junk 那条红（`SyntaxError` 直接冒到渲染）。
- **真机未测**：验证方法是刷新页面，看批注和那半句话还在不在。

## 代价

- 关掉标签页 = 草稿没了。这是被接受的那一半：草稿的寿命到这一轮结束。
- 批注正文会落到磁盘（浏览器自己决定怎么写盘），只是会跟着标签页消失。
- 同一个 tab 里连续开很多轮，storage 里同名键会累积；靠 20 条上限在每次新建草稿时扫掉最旧的。
- 页面内存那一层没有删掉，只是退成缓存：没有 storage 的宿主仍然能用，只是回到 0019 的行为。
