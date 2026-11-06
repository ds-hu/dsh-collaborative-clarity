# Round 0012 — 没点 Add 的那句话

**Decision:** 按提交时，注释框里那句还没点 Add 的话，一起带上还是拦住？
**Variant A:** *一起带走* —— 提交时把它并成一条注释，跟决定一起发出去。
**Variant B:** *拦住* —— 停下，提示先点 Add；框里有字时 Add 会亮起来。
**Recommendation:** A.
**Accepted:** A，另加三处按钮改名（用户顺手提的）。
**Forecloses:** ① 你以为按的是「接受」，它顺带把框里那句话也写进了 round 记录；② 记录里会出现
一条没经过 Add 的注释，事后分不清是有意写的还是手滑。

## Why this round

缺陷很具体：在注释框里打字，不点 **Add**，直接点接受 / 要求改 / 拒绝，这段字就没了。它既不在
注释列表里，也不在提交的 body 里——`submit()` 读的是 `comments`，而 `commentText` 只活在输入框
里。

这不算隐蔽的 bug，更像一个没做决定的岔路：输入框和「提交」之间有两种合理关系，一种是把没交的
话一并带走，一种是停下来让人确认。两种都自洽，所以这一轮把两种都做成能点的面板底部，让差别落在
手指上，而不是描述里。

## Fidelity

**Real:** 面板底部的结构与顺序——注释列表、composer（变体下拉 + 输入框 + Add）、Note、四个
按钮；两种行为都能当场点出来。
**Mocked:** 注释与 Note 的内容是示例；配色和圆角按 `client.js` 的 token 近似，不是逐像素。
**Omitted:** 错误文案的最终措辞；Ctrl+Enter 直接加注释那条路径没有重复演。

## Outcome

`client.js` 的 `submit()` 先看一眼输入框：有字就按当前锚点（没有锚点就是整变体）折成一条注释，
用 `outgoing` 同时喂给校验和请求体。**只有请求成功之后才清空输入框**——失败时字还在，可以重试。

```js
const outgoing = carried === null ? comments : [...comments, carried]
```

按钮也跟着改了三处，用的都是用户认可的说法：

| 原来 | 现在 |
|---|---|
| `Revise` | `Revise B`（按选中的变体） |
| `Reject` | `Reject A&B`（所有变体，用 `&` 连） |
| `Cancel` | `Decide later` |

`Revise` / `Reject` 用的是变体 **id** 的大写形式，不是 `label`：label 是「A — The argument
first」这种长句，两个拼起来按钮会失控。`Accept` 没动，它本来就念的是 label。

## Verification

- 合同测试 62 → 64，七个文件全绿。新增两条：
  - *a comment typed but never added travels with the decision* —— 输入框有字、直接按
    `Accept A`，请求体里必须有这条注释，并且落地后输入框清空。
  - *the action row names the variant each verb acts on* —— `Accept B`、`Revise B`、
    `Reject A&B`、`Decide later` 都在，且不再有 `Cancel`。
- 第一条按项目规矩反证过：把 `submit()` 里的 `outgoing` 换回 `comments`，该测试报
  `the unsent comment is sent instead of dropped 0 !== 1`，随后从注入前的备份恢复，
  `client.js` 的 sha256 回到 `01f32e32…`。

## 没做的

真机测试还没跑：这一轮要验的是「打字不点 Add 直接提交」，需要一轮活着的 round 才能点。等
下一轮 clear 之后开一次门。
