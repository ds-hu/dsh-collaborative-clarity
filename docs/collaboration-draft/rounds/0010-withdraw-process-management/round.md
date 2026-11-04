# Round 0010 — Withdraw process management

**Decision:** 门（右侧 tab）该不该自己起进程？
**Variant A:** *Hand over the command* — the tab shows a copyable `runThis` line and records only
what the user saw. No Start, no Stop, no output.
**Variant B:** *Borrow the job runtime* — the agent starts the app as a background job, the tab shows
a read-only "running" fact and delegates Stop to the job registry.
**Recommendation:** A.
**Accepted:** A.
**Forecloses:** A 之后，tab 永远不知道 app 在不在跑：端口是否被占、上一个进程是否还活着，插件都看不见，
"能不能开始测"只剩用户自己判断。B 保留了 Stop，但它的可信度等于 job runtime 的 kill 质量——今天量到的
正好是那里也会漏，所以 B 只是把一句兑现不了的承诺换了个所有者。

## Why this round

Round 0009 选了 *confined start*：tab 在 round 所属会话的沙箱里跑 `warmStart`，结论落地时杀掉它。
真机测试否掉了这个前提，两处证据：

- **Stop 没有到宿主。** round 记录在 Stop 之后仍带着 `start`，宿主的 `/test/cancel` 从未被执行；而那个
  夹具进程（`node plugin/test/fixtures/serve.mjs`）在 Stop 之后、在结论落地之后都还在服务 4173，
  最后是手工 `Stop-Process` 结束的。
- **harness 自己的 kill 也只到直接子进程。** 同一个夹具用 DSH 的后台 job 起，`job_kill` 之后 job 结束了，
  `node` 仍在监听。工具桥项目在 2026-10-08 踩过同一形状并留下两条 ADR
  (`dsh-tool-bridge/docs/adr/0004`, `0008`)：`child.kill()` 只结束一个进程，Windows 上没有任何东西
  会跟着父进程下去；它的结论是"先 `taskkill /T /F` 扫树，再打自己持有的 handle"，而那要求**自己 spawn、
  手里有 pid**。

`ctx.shell` 的 handle 没有 pid，只有 `status/done/readOutput/observed/kill()`。于是插件只有两条路：
自己 spawn（放弃会话沙箱——那是 0009 的另一半结论），或者继续用一个保证不了"它真的死了"的按钮。
两条都不该做，所以第三个选项是：不做进程管理。

## Fidelity

**Real:** 测试面板的结构、字号、间距；prepared 行与 runThis 行的位置关系；观察表单本身没动。
**Mocked:** 没有——这一轮删除功能，没有新界面可看。
**Omitted:** 撤销后"用户自己起服务"的完整动线（终端里 Ctrl+C、端口冲突）不属于 tab 的任何状态。

## Outcome

`clarity_test` 的 schema：`warmStart?: { command, cwd? }` → `runThis?: string`。`prepared` 不变。
`runThis` 是**文本**：tab 渲染一行 `Run <code>` 加一个 **Copy**，不执行、不追踪、不杀。

删掉的宿主面：`POST /clarity/api/test/start`、`POST /test/cancel`、`GET /test/output`，以及
`RoundStore.markStarted/clearStarted`、`round.start`、warm map、500 ms 的输出现场轮询、会话沙箱策略解析。
删掉的客户端面：running 态、确认 sheet、**Start**、**Stop**、**Output**、elapsed 计时器、跨会话恢复的
phase 推导。按下 **I'm ready to test** 直接进观察表单。

保留并因此更干净的：`prepared` 作为**事实记录**（AI 已经跑过构建），以及一条用户可复制的运行命令。

## Verification

合同测试：62 个，七个文件（`node tests/<file>.test.mjs` 各跑一次），全绿。这次撤回本身有三条常驻断言：

- `tests/api.test.mjs` — *the test surface has no process endpoints*：`/test/start`、`/test/cancel`、
  `/test/output` 都必须 404，`not-found`。
- `tests/client.test.mjs` — *a round from the old host never draws a process control*：一个带着
  `warmStart` 和 `start` 的旧记录不会画出 Started/Stop/Output。
- `tests/store.test.mjs` — *a test gate refuses the retired warmStart argument*：旧字段是硬错误，
  不是被静默忽略。

这三条都不是空转：任意一条对应的实现回来，它们会红。

**先撤回，后验证。** 撤回本身没有新界面可看；被撤回的那个承诺（"Stop 会结束它"）由 0009 的真机测试否掉，
证据在本文与 0009 的记录里。

**补上的真机验证**（2026-11-05 00:30，`dirty:6377605990c2`）：门通过 —— tab 只画 prepared 行和触发器，
按下直接进观察表单，**Back** 能来回，页面上没有任何 Start / Stop / Output，宿主那三条进程路由同时回
`404 no route`。记录：[test.md](test.md)。没覆盖的两处（`Run` 那行、旧记录守卫）只有合同测试。
