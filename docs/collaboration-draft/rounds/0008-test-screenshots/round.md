# Round 0008 — Test screenshots

**Decision:** 测试门禁的截图用缩略图条，还是大图加胶片条？
**Variant A:** *Thumbnail strip* — 64×48 previews in one row, click to open.
**Variant B:** *Large preview plus filmstrip* — the selected shot at full width, a 46×34 strip
to switch.
**Recommendation:** A.
**Accepted:** B.
**Forecloses:** B 的大图固定占约 200px，而 test 面板上方已有场景清单和观察框；360px 侧栏里
三张以上会把按钮推到屏幕外。A 则把每张图压到 64×48：要判断细小的 UI 差异必须点开，截图多
时只能逐张看。

## Why this round

The test gate records what the user saw as text only. A screenshot carries the part that is hard
to describe — the wrong badge colour, the notice that did not appear — so the gate should accept
them and hand the agent a file it can open with `read_image`.

This was also the first non-blocking round in the new job-backed flow: the call returned
`{ status: "pending", jobId }` at once, and the decision arrived later as a background-job
completion. Nothing in the agent waited while the user compared the two variants.

## Fidelity

**Real:** 当前 test 面板的结构、字号与间距；示例图是内联 SVG，不是真实运行截图。
**Mocked:** 添加、删除、切换、放大按钮都不可点。
**Omitted:** 深色模式、无截图时的空状态、上传错误与大小限制。

## Outcome

Accepted B. The panel now has one full-width preview of the selected screenshot, a filmstrip of
46×34 thumbnails plus an add control, a Remove link for the selected shot, and accepts up to
four PNG/JPEG/WebP files by picker, drop, or paste into the note.

The agent receives `screenshots: [{ path, bytes }]` in the test result. Files are written to
`.clarity/screenshots/<roundId>/shot-N.<ext>` inside the session working directory, so the
paths stay readable and the directory is easy to delete.

One deviation from the accepted artifact: B's mock had no remove control, so a small **Remove**
link was added under the filmstrip. Without it the only way to drop a wrong screenshot was to
reload the tab.

## Verification

The first real-test gate failed, and for useful reasons: a pasted image never arrived because the
handler only read `clipboardData.files` (some sources deliver the file as an `item`), and a
dropped image appeared in both the screenshot area and the chat composer, because the harness
installs a `document`-level drop listener that adds files to the composer. The fix reads both
clipboard shapes, scopes paste to the panel, and stops drag events at the screenshot zone.

The second gate passed. The attached screenshot was returned as a path, and the agent opened it
with `read_image` — the same route the model uses after a real test.
