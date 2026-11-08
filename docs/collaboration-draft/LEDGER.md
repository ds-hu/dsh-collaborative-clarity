# Ledger

This directory now has one real round and one implemented plugin. The first table records
the decisions taken **while writing the draft**; the second records the round that was run
through the plugin. The plugin's verified scope is in
[06-implementation.md](06-implementation.md).

## Draft decisions

| # | Decision | State | Evidence |
|---|---|---|---|
| D1 | The unit of collaboration is a round: one decision, one artifact set, one blocking wait | proposed | [README](README.md), [02](02-protocol.md) |
| D2 | In grill, `ask_user_question` is hidden and `grill` is the only blocking human tool | proposed | [02 §Visibility](02-protocol.md#visibility-and-supersession) |
| D3 | The round opens in a dedicated right-Sidebar tab with an internal split, not two dock tabs | proposed | [03 §Why one tab](03-surface.md#why-one-tab-with-an-internal-split) |
| D4 | Every variant declares a fidelity map: real, mocked, omitted | proposed | [03 §Artifact formats](03-surface.md#artifact-formats) |
| D5 | Every round names a recommendation and at least one foreclosure | proposed | [02 R3–R4](02-protocol.md#round-rules) |
| D6 | Contract tests, a prepared build, and a real test are separate gates; only a real test yields `tested` | proposed | [04](04-verification.md) |
| D7 | The test trigger runs a recorded command, never a composed one | proposed | [04 §The trigger](04-verification.md#the-trigger) |
| D8 | Drafts are never deleted; superseded rounds and rejected variants stay | proposed | [05](05-draft-integrity.md) |
| D9 | Artifacts are plain files and annotations are a text sidecar, so any editor works | proposed | [03 §Why the annotations live in files](03-surface.md#why-the-annotations-live-in-files) |
| D10 | Three rounds per decision, then decide or abandon | proposed | [02 §The round cap](02-protocol.md#the-round-cap) |
| D11 | The docs live in `docs/collaboration-draft/` | agreed | The brief's path; the directory exists |
| D12 | The first deliverable is documents plus a mock, not a plugin | superseded | The plugin was built first; see [06](06-implementation.md) and [OPEN-QUESTIONS](OPEN-QUESTIONS.md) Q2 |
| D13 | A waiting round is marked on the session row, not with a bottom-right pill | agreed | User feedback in real test 1; implemented as the runtime warning dot + `Answer` |
| D14 | The waiting mark is the runtime `pendingInteraction` of kind `question`, so it appears even when the row is busy | agreed | Real test 3 passed with "Good!" |
| D15 | A comment can anchor to an element, a text quote, a line range, or the whole variant, and the anchor is returned with the decision | built | [03 §As built](03-surface.md#as-built), [06 §Anchors](06-implementation.md#anchors), `node scripts/run-tests.mjs` |
| D16 | The plugin ships as `@ds-hu/dsh-collaborative-clarity` under Apache-2.0, with a blue icon that reads on dark and light surfaces | agreed | User publishing request; [package.json](../../package.json), [LICENSE](../../LICENSE), [icon.svg](../../icon.svg) |
| D17 | The README is a short why/how page and the mechanisms live in `AGENTS.md`; the Chinese README is a second copy of the same page | agreed | [Round 0011](rounds/0011-readme/round.md); [README](../../README.md), [AGENTS.md](../../AGENTS.md), [README.zh-CN.md](../../README.zh-CN.md) |
| D18 | A comment typed but never added travels with the decision, and the action row names the variant each verb acts on | agreed | [Round 0012](rounds/0012-unsent-comment/round.md); `tests/client.test.mjs` |
| D19 | The panel speaks the GUI language through `ctx.locale` under the `collaborativeClarity` namespace, falling back to its English table when the service is absent | agreed | [Round 0013](rounds/0013-ui-chinese/round.md); `tests/client.test.mjs` |
| D20 | The anchored notes are 「批注」 in Chinese, and the action row's last button says it cancels rather than promises to wait | agreed | [Round 0014](rounds/0014-naming/round.md); `tests/client.test.mjs` |
| D21 | A test gate is exited by one button that cancels it; the command stays on screen in the observation phase, and a test round's title is its kind, not the candidate string | tested | [Round 0015](rounds/0015-test-gate-fixes/round.md); real test `clarity-test-mw49x67i-70e9a6`; `tests/store.test.mjs`, `tests/client.test.mjs` |
| D22 | The advice lives in the variant, not in the round: `variants[].recommendation` marks the recommended one and `variants[].cost` states its price; `round.recommendation` / `round.foreclosures` are refused | built | [Round 0016](rounds/0016-recommendation-place/round.md); `tests/store.test.mjs`, `tests/client.test.mjs` |
| D23 | An added comment is rewritten where it sits — its own row turns into an input — so the anchor, the variant, and its place in the list survive the rewrite | tested | [Round 0017](rounds/0017-edit-added-comments/round.md); a comment was written, edited and sent in round 0018 `clarity-mw4utbqx-53aaf3`; `tests/client.test.mjs` |
| D24 | The README keeps `vibe code` in its first heading, in both languages; the phrase is a deliberate filter, and re-arguing it is a new round | agreed | [Round 0018](rounds/0018-readme-vibe-code/round.md); tool round `clarity-mw4utbqx-53aaf3` |
| D25 | A draft outlives the panel — comments, unsent text, the selected variant, the note and an open edit live one level above the panel, keyed by round id | superseded | [Round 0019](rounds/0019-draft-survives-tab/round.md); superseded by D26, which keeps the same layer but puts it in sessionStorage |
| D26 | A draft is kept in this tab's `sessionStorage` under `clarity.draft.<roundId>`: it survives a reload and a remount, dies with the tab, is dropped once its decision is sent, and junk in that key costs the draft, never the panel | tested | [Round 0020](rounds/0020-draft-storage/round.md); real test 2026-11-07 (tab switch and a reload both kept the draft); `tests/client.test.mjs` |
| D27 | A decided round also leaves one right-aligned row in the transcript — decision sentence, verdict, every comment with its anchor, the note — projected from its own `tool/call` and `tool/result`, never from the plugin store; only accept/revise/reject draw it | tested | [Round 0021](rounds/0021-decision-bubble/round.md); real test `clarity-test-mw64t9es-706efa` (pass); 83 tests |
| D28 | A settled real test draws the same kind of row: candidate, `Passed`/`Failed`/`Blocked`, the observation, and one line of screenshot file names — each name carrying its path in the title and opening that image in the right Sidebar | tested | [Rounds 0022–0025](rounds/0025-shots-one-line/round.md); real test `clarity-test-mw694ijz-304c8d` (pass; the name opened the image in the Sidebar); 85 tests |
| D29 | A `pass` and a `cancel` need no observation: the route reads an empty **or blank** string as none, and the panel omits the field unless the box holds something — `fail` and `blocked` still refuse a blank one | tested | [Round 0026](rounds/0026-observation-optional/round.md), completed by [0027](rounds/0027-review-fixes/round.md); real tests `clarity-test-mw6hqby4-2df8c9` (fail, the bug) → `clarity-test-mw6ijiwp-06a9ae` (pass, empty box) → `clarity-test-mw6mkx9l-2debcf` (pass, a space in the box); 90 tests |

## Round ledger

A real round appends one row.

| Date | Round | Decision | Verdict | Selected | Forecloses | Evidence | Status |
|---|---|---|---|---|---|---|---|
| 2026-10-29 | [0001](rounds/0001-tab-variant-budget/round.md) | Two variants side by side, or three behind a switcher? | accept | A | A third option needs a second round; no simultaneous comparison of three | [decision](rounds/0001-tab-variant-budget/decision.md); tool round `clarity-mvtlhcdo-c26616` | decided |
| 2026-10-29 | [0002](rounds/0002-session-attention/round.md) | Where does the waiting mark go, and does it survive a busy row? | pass | session row warning dot | A bottom-right pill; a custom dot that does not enter the runtime status | [test](rounds/0002-session-attention/test.md); three real-test gates | tested |
| 2026-10-30 | [0007](rounds/0007-package-layout/round.md) | Is the package the repository root as plain files, or the root with a source→`lib/` build? | accept | A | The client half stays one hand-written file and splitting it later means adopting B on a live plugin | [round](rounds/0007-package-layout/round.md); tool round `clarity-mvugaxqz-aa9cde` | decided |
| 2026-11-04 | [0010](rounds/0010-withdraw-process-management/round.md) | Should the tab start a process at all? | accept + pass | A | The tab never knows whether the app is up, and a leaked process is invisible to it | [round](rounds/0010-withdraw-process-management/round.md); [test](rounds/0010-withdraw-process-management/test.md); `dsh-tool-bridge` ADR-0004/0008 | tested |
| 2026-11-05 | [0011](rounds/0011-readme/round.md) | README: a reference manual, or a short why/how page? | accept | A, after three revisions (A‴) | No single file lists every parameter again; three copies to keep in sync; the first screen bets on the phrase "vibe code" | [round](rounds/0011-readme/round.md); tool rounds `clarity-mw2cshoj-58414b` → `clarity-mw2d96ui-7ee114` | decided |
| 2026-11-05 | [0012](rounds/0012-unsent-comment/round.md) | Does an unsent comment travel with the decision, or stop it? | accept | A (carry it), plus `Revise B` / `Reject A&B` / `Decide later` | A comment can now be sent without pressing Add, and the record cannot say whether that was deliberate | [round](rounds/0012-unsent-comment/round.md); tool round `clarity-mw3om7q3-32a200`; 64 tests | built |
| 2026-11-05 | [0013](rounds/0013-ui-chinese/round.md) | Does the panel follow the GUI language, or carry its own switch? | accept | A (follow the GUI, `ctx.locale`) | A second baseline dictionary per string; a Japanese GUI gets an English panel | [round](rounds/0013-ui-chinese/round.md); tool round `clarity-mw3p1a2r-75b140`; 66 tests | built |
| 2026-11-06 | [0014](rounds/0014-naming/round.md) | 批注 or 评论 for the anchored notes? | accept | A (批注), plus a 15-line wording pass over the Chinese panel | Annotations and Comments stop sharing a root in Chinese | [round](rounds/0014-naming/round.md); tool round `clarity-mw3rjkch-da9b87`; smoke gate `clarity-test-mw3s0eve-f87728` | decided |
| 2026-11-06 | [0015](rounds/0015-test-gate-fixes/round.md) | Where does a test gate end when you cancel it? | accept | A (cancel closes the round) | 「等会儿再测」 means cancelling and reopening; `blocked` loses its button | [round](rounds/0015-test-gate-fixes/round.md); tool round `clarity-mw498aq3-f34679`; real test `clarity-test-mw49x67i-70e9a6` (pass); 68 tests | tested |
| 2026-11-06 | [0016](rounds/0016-recommendation-place/round.md) | 推荐和代价放在哪儿：整轮头部一块，还是每张卡片自己带？ | revise | B（沉进变体），带三条批注 | 整轮不再有一句「这一轮值不值得」的总评；schema 破了——`round.recommendation` / `foreclosures` 传了会被拒 | [round](rounds/0016-recommendation-place/round.md); 0018 那一轮整轮跑在新形状上并被接受, 74 tests | tested |
| 2026-11-06 | [0017](rounds/0017-edit-added-comments/round.md) | 已 Add 的批注要改，点在哪儿：行里就地变输入框，还是搬回下面那个输入框？ | accept | A（就地改） | 编辑时行高会跳一下；同一时刻只能一条在编辑，「点另一条＝先存这条」是隐式规则 | [round](rounds/0017-edit-added-comments/round.md); tool round `clarity-mw4ggbd3-48c4a9`; 真机：0018 里一条批注被改成「已编辑」后送出，锚点未变; 74 tests | tested |
| 2026-11-06 | [0018](rounds/0018-readme-vibe-code/round.md) | README 首屏那个 `vibe code`：留着，还是换成说人话的标题？ | accept | A（留着，两版都不动） | 不认这个词的人在第一屏出局；过几年这个词会旧，届时重开一轮 | [round](rounds/0018-readme-vibe-code/round.md); tool round `clarity-mw4utbqx-53aaf3` | decided |
| 2026-11-06 | [0019](rounds/0019-draft-survives-tab/round.md) | 切 tab 就丢的草稿：记在页面内存里，还是写进 sessionStorage？ | accept | A（页面内存，键是 round id） | 刷新页面仍然全丢；宿主已结算的轮次本地不知道，靠 20 条上限作废 | [round](rounds/0019-draft-survives-tab/round.md); tool round `clarity-mw4y4b1t-3f18b4`; 76 tests | superseded by [0020](rounds/0020-draft-storage/round.md) |
| 2026-11-06 | [0020](rounds/0020-draft-storage/round.md) | 草稿落到 storage：跟着标签页走（sessionStorage），还是跟着浏览器走（localStorage）？ | accept | A（sessionStorage） | 关掉标签页即清；同一会话开两个窗口各存各的，不会合并 | [round](rounds/0020-draft-storage/round.md); tool round `clarity-mw53f22b-7fdd2c`; 真机 2026-11-07：切 tab 与刷新都保住了草稿; 78 tests | tested |
| 2026-11-07 | [0021](rounds/0021-decision-bubble/round.md) | Clarity 的决定气泡：只记「决定了什么」，还是连「为什么」一起记？ | accept + pass | B（连理由一起记），拒绝了推荐 | 一条气泡可能十几行；锚点标签在对话里读着像代码；同一句字多出第三份 | [round](rounds/0021-decision-bubble/round.md); tool round `clarity-mw61y3rn-e8183f`; real test `clarity-test-mw64t9es-706efa`; 83 tests | tested |
| 2026-11-07 | [0022–0025](rounds/0025-shots-one-line/round.md) | 测试的结论要不要也留一条气泡 → 截图怎么落地 → 那一行里写什么 | revise ×3, accept + pass | B‴（一行文件名，点了在右侧栏开图） | 气泡里没有完整路径；三张起换行；文件名不说明是哪一轮 | [chain](rounds/0025-shots-one-line/round.md); tool rounds `clarity-mw66mi1v-650bab` → `clarity-mw67hsvn-28498a`; real test `clarity-test-mw694ijz-304c8d`; 85 tests | tested |
| 2026-11-07 | [0026](rounds/0026-observation-optional/round.md) | 通过时到底要不要写观察 | 指令 + 真机 fail → 修 → 真机 pass | 两侧都改：宿主把空串当「没有」，面板干脆不发 | 空观察的气泡没有观察段；文案仍像必填；`blocked` 仍无按钮 | [round](rounds/0026-observation-optional/round.md); real tests `clarity-test-mw6hqby4-2df8c9`（fail，抓到 bug）→ `clarity-test-mw6ijiwp-06a9ae`（pass，空观察）; 87 tests | tested |
| 2026-11-08 | [0027](rounds/0027-review-fixes/round.md) | 复查提的三个缺陷（空白串仍拦、CHANGELOG 自相矛盾、英文剪贴板混进全角冒号） | 修 + 真机 pass | 空白按 trim 判定；CHANGELOG 限定到决定行；`bubble.noteLine` | 空白串算「没写」；重复文案键一并删掉并加断言 | [round](rounds/0027-review-fixes/round.md); real test `clarity-test-mw6mkx9l-2debcf`（pass，空白观察）; 90 tests; 四条 mutation 验过 | tested |

## What would move a row

- `proposed` → `agreed` requires the user's explicit acceptance in this session, with the
  decision id.
- `agreed` → `built` requires code and a decision record.
- `built` → `prepared` requires the prepared-build record from [04](04-verification.md).
- `prepared` → `tested` requires a test record from the user.
- Any row may move to `abandoned` or `superseded` with a reason; it never disappears.

## Not verified yet

Claims this repository currently presents more confidently than the evidence behind them, and gaps
that only a conversation knows about. Each line names the probe that would settle it, so the next
reader can close it instead of inheriting it.

| Claim | Why the evidence is thin | Probe that settles it |
|---|---|---|
| The panel is unmounted when another sidebar tab is shown (round 0020's premise) | Inferred from a reported symptom plus where the state sits — never observed | Count panel mounts and unmounts somewhere visible, then switch tabs once |
| 0016's card layout: advice above the fidelity rows, the dot on the text's midline | Round 0018 ran on the new shape and was accepted, but nobody read the cards for layout | Open a round, read the cards, then accept — and report anything off |
| 0012 — an unsent comment travels with the decision | Used live in round 0016, never promoted; the row still says `built` | Say it counts, or run a gate |
| 0013 — the panel follows the GUI's language | Every Chinese screenshot shows it working, but no gate covered it; `built` | Same |
| `docs/README_image.png` is inside the published tarball | Inferred from the registry's `fileCount` and `unpackedSize`, not from a listing | `npm pack --dry-run --json`, outside the sandbox |
| The README screenshot predates the Chinese panel | English chrome (`DECISION`, `Annotating`, `Comments`) is visible in it; the build behind it is unknown | Re-shoot it after the next real test |
