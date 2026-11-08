# Round 0026 — 通过时到底要不要写观察

**Instruction:** 「感觉 pass 和 cancel 没必要要求 observation 必填。」
**Verdict:** 我先答「本来就不要求」——**答错了**。真机 `clarity-test-mw6hqby4-2df8c9`（fail，
观察原文「确实按不动 Pass」）把它钉死：观察空着按「通过」，面板直接红字
`observed must be a non-empty string`。

## 怎么错的

`POST /test` 里两行相邻的代码互相打脸：

```js
const observed = body.observed === undefined ? '' : requireString(body.observed, 'observed', 4_000)
if (verdict !== 'pass' && verdict !== 'cancel' && observed === '') {
  throw new HttpError(400, 'bad-request', 'fail and blocked need an observation')
}
```

第二行明说 pass / cancel 可以不写；第一行在它之前就抛了——因为 `requireString('')` 拒绝空串，
而面板**每次都送这个字段**（空的时候送 `observed: ''`）。于是 `pass` 与 `cancel` 两条路都到不了
第二行：一个 400「observed must be a non-empty string」，`fail` 拿到的也是这条错话，而不是本该
说的「fail and blocked need an observation」。

我第一轮的「证据」是自己的探针——它只送 `{ roundId, verdict }`，**把字段省了**，于是拿到 200。
探针的形状和面板的形状差一个字段，结论就差了一个 400。这条要记：**先对齐调用方的真实请求体，
再谈路由会不会拒。**

同一件事的旁证：`tests/client.test.mjs` 里那条「cancelling a test gate … needs no observation」
当时断言的是**请求体**里有 `observed: ''`——断言意图，从没跨过 HTTP 这道边界。

## Outcome

两侧都改，各自独立成立：

- **宿主**：`observed` 是 `undefined` **或空串**时都当作「没有观察」，再交给 pass / cancel 的豁免
  判定；`fail` / `blocked` 仍然拒绝，但报的是自己的那句话。
- **面板**：空观察框现在**不发这个字段**，而不是发一个空串。这一半让修复在**宿主没重启**的
  情况下也生效——`index.js` 的改动要重启 DSH 才生效，而重启会结束当前会话。

## Verification

- 合同测试 85 → **87**，七文件全绿（`pnpm run verify` 退出 0）。
  - `pass and cancel need no observation, and the panel always sends the field`（API）：用面板的
    真实请求体（字段齐全、`observed: ''`）打 `/clarity/api/test`——pass / cancel 得 200 且结果里
    没有 `observed`；fail / blocked 得 400 且报「fail and blocked need an observation」。
  - `a pass with an empty observation is sent as no observation at all`（面板）：观察框空着按
    「通过」，请求体里**没有** `observed` 这个键。
  - 原来那条 cancel 断言从「送空串」改成「不送」。
- **反向验过两条**，各自字节还原、`sha256` 与改前一致：
  - 宿主退回单行判定 → API 那条红（`observed must be a non-empty string`）；
  - 面板退回「总是送 observed」 → cancel 与 pass 两条红。
- 直接探针（`.tmp/probe-observation.mjs`，面板真实请求体）：

  ```
  pass     -> HTTP 200 {"ok":true,"result":{"status":"tested","roundId":"probe-pass","verdict":"pass"}}
  cancel   -> HTTP 200 {"ok":true,"result":{"status":"cancelled",...}}
  fail     -> HTTP 400 {"error":{"code":"bad-request","message":"fail and blocked need an observation"}}
  blocked  -> HTTP 400 {"error":{"code":"bad-request","message":"fail and blocked need an observation"}}
  ```
- **真机通过（2026-11-07，`clarity-test-mw6ijiwp-06a9ae`，pass）**：闸门里观察框留空、不附截图，
  点「通过」——直接发出。返回的结果是 `{status:'tested', roundId, verdict:'pass'}`：既没有
  `observed`，也没有 `screenshots`，正是空观察该有的样子。
  - 这一条同时证明修复在**宿主未重启**时也生效：面板不再发那个字段，旧路由把它当
    `undefined` → `''`。

## 后续

这次只比对了**空串**：空白串（一个空格、一个换行）依然被拦，报的还是同一句话。复查指出后由
[round 0027](../0027-review-fixes/round.md) 补完——两侧都按「去掉空白后是否为空」判定。
本记录里「pass / cancel 不需要观察」的结论，以 0027 为准。

## 代价与遗留

- 观察框空着通过时，气泡里就没有观察那一段（`store.test` 只在非空时写这个字段）。
- 文案仍然读着像必填（标题「你看到了什么？」、占位是肯定句），这一轮没动它：那是另一件事。
- `blocked` 仍然没有按钮（`tests/client.test.mjs` 断言过「blocked is no longer a button of its own」），
  但 schema / store / API 还收它，且要求观察。要不要收掉这条分支，另开一轮。
