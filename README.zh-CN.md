<div align="right"><a href="README.md">English</a> | 中文</div>

# Collaborative Clarity

<p>
  <a href="https://www.npmjs.com/package/@ds-hu/dsh-collaborative-clarity"><img src="https://img.shields.io/npm/v/@ds-hu/dsh-collaborative-clarity" alt="npm"></a>
  <a href="https://www.npmjs.com/package/@ds-hu/dsh-collaborative-clarity"><img src="https://img.shields.io/npm/dm/@ds-hu/dsh-collaborative-clarity" alt="downloads"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue" alt="license"></a>
  <img src="https://img.shields.io/badge/DeepSeek%20Harness-plugin-5b4bd6" alt="DeepSeek Harness plugin">
</p>

*一个右侧栏标签页。agent 不再用一段话描述要做什么，而是把它摆到你面前；然后在工具调用里
等你，等你说完。*

## Vibe coding 会踩的坑

让 agent 写代码很快，但有三件事一定会出问题，而且每次都出在同一个地方。不是提示词没写好，
是缺了一样东西。

- **界面要等到做完才看得见。** 屏幕怎么表现，agent 自己就定了；等它建完你才看到，分歧只能
  变成返工。*round 让屏幕在动手之前就出现。*
- **架构慢慢变成别人的。** 代码整个交出去，你手上就没有那张图了：哪个选择有风险、代价多大、
  当初为什么这么定，都得等用户替你发现。*round 会把要紧的那十行、一个推荐，连同这个推荐放弃
  了什么，一起摆出来。*
- **单测绿了，东西没验过。** 单测只能断言写测试的人想到的部分；开发时那种反复上手试，留不成
  测试用例。*round 最后落在一个人必须亲自跑的关卡上。*

这个插件补的就是那“一样东西”。agent 把决定写成一个最小可看的文件——一个屏幕、一个类型、一个
函数——在右侧栏打开，说出推荐哪个、这么选会失去什么，然后等你。

协作的单位因此从“一句话”变成 **round**：一个决定、一组 artifact、一次等待、一份记录。下面讲
的，都是这句话的推论。

## 为什么它管用

**artifact 不必是你的产品。** HTML 最好渲染，也最装得下东西：终端、diff、表格、界面，都能
画。不是网页的项目一样可以拿网页演给你看，按真实尺寸演，不用先造一个 demo。它是证据，用完就
扔，不用攒。

**两边的长处正好互补。** agent 不擅长长的工具循环：每多一轮就要重读越来越长的上下文（缓存
命中只是打折，不是不要钱），还会跑偏；但它一次能生成一整屏。人恰好相反：没人能一口气从零写出
一整页 HTML，更没人愿意在已经有实现的情况下重写一份。round 把 agent 的一次生成用在它擅长的
地方，把你的注意力用在它替不了的判断上。

**最后一公里只能靠人。** 东西最终是给用户用的，那就得有人赶在用户之前，自己上手用过——在
真实构建上，用自己的眼睛看。所以真测试是一道关，不是一个勾选框。

## 一个 round，怎么走完

1. **agent 把决定放上屏。** 最多两个变体，每个都是真文件，不是对文件的描述。
2. **你指着不同意的地方。** 点一个元素、划一句话、点一行代码都行。评论会记住你指的位置，所以
   “这个标签不对”会带着那个标签一起回来。
3. **你拍板。** 接受、要求改、拒绝，或者先放着。你的评论和选中的变体会以结构化数据交回给
   agent，不用它再猜。
4. **agent 把结论写下来。** 结论、你接受的取舍、还没关掉的评论，都落在 artifact 旁边的仓库里。

## 最后一步必须真测

构建跑完之后，`clarity_test` 会开一道关。agent 把它已经跑过的构建记下来，给你一条把应用跑
起来的命令，再写一个三到七步的场景。你跑一遍，自己看，再把结果记下来——pass、fail 或
blocked，文字说不清的附截图。在这之前，这个改动只算 *built*，不算 *tested*。

## 安装

```powershell
dsh plugin --profile web add @ds-hu/dsh-collaborative-clarity
```

需要带 web profile 的 DeepSeek Harness。在本地检出里装，就换成
`link:D:/path/to/dsh-collaborative-clarity`；从 GitHub 装，就换成
`github:ds-hu/dsh-collaborative-clarity`。没有构建步骤，运行时只有一个依赖
（`markdown-it`）。非阻塞 round 还需要 profile 里有 `@deepseek-ai/dsh-tool-jobs`。

版本还是 0.x。能用的部分都写下来了，不用猜：
[06-implementation.md](docs/collaboration-draft/06-implementation.md) 列了验证过的界面和还
缺的口子。

<details>
<summary>从旧的 <code>plugin/</code> 布局（≤ 0.1.0）升级？</summary>

装好的 link 指向一个已经不存在的目录，先删再加：

```powershell
dsh plugin --profile web remove @ds-hu/dsh-collaborative-clarity
dsh plugin --profile web add @ds-hu/dsh-collaborative-clarity
```

</details>

## 一个 round 会留下什么

- **Round 记录**：结论、推荐，以及你接受的取舍。
- **评论**：你指的是哪里，后来有没有解决。
- **测试记录**：谁跑的，看到了什么。

artifact 用完就扔。这个标签页不是文档仓库。

## 继续读

- [AGENTS.md](AGENTS.md)：架构、不能破的规矩、测试怎么跑。
- [docs/collaboration-draft/](docs/collaboration-draft/README.md)：为什么做这个东西，六份文档
  加一个 ADR。
- [CHANGELOG.md](CHANGELOG.md)：每个版本改了什么。

---

Apache License 2.0，见 [LICENSE](LICENSE)。
