---
title: "Prompt Engineering：提示词工程最佳实践"
date: "2026-07-12 09:00:00"
description: "掌握提示词工程核心技巧，让你的 AI 输出更精准"
cover: "/picture/fengmian/444.jpg"
tags: ["Prompt Engineering", "基础", "教程"]
videos:
  - title: "吴恩达 ChatGPT Prompt Engineering 课程"
    url: "https://www.deeplearning.ai/short-courses/chatgpt-prompt-engineering-for-developers/"
    platform: "youtube"
  - title: "Prompt Engineering 提示词工程完全指南"
    url: "https://www.bilibili.com/video/BV1nGxkzvEFY/"
    platform: "bilibili"
  - title: "大模型提示词进阶技巧（CoT / Few-shot / 角色扮演）"
    url: "https://www.bilibili.com/video/BV11h4y1Q7Hr/"
    platform: "bilibili"
links:
  - title: "OpenAI Prompt Engineering Guide"
    url: "https://platform.openai.com/docs/guides/prompt-engineering"
    description: "OpenAI 官方提示词工程指南，六大策略详解"
  - title: "Prompt Engineering Guide (DAIR.AI)"
    url: "https://www.promptingguide.ai/"
    description: "最全面的 Prompt 工程指南，包含 100+ 技术论文整理"
  - title: "LangChain Prompt Templates"
    url: "https://python.langchain.com/docs/concepts/prompt_templates/"
    description: "LangChain 中的 Prompt 模板化最佳实践"
---

## 什么是 Prompt Engineering？

你有没有过这种经历：问了 AI 一个问题，它回复了一堆正确的废话？洋洋洒洒几百字，全是"既要...又要..."的套话，看完跟没看一样。别怪 AI，怪你的 Prompt。

> **Prompt 就像给实习生布置任务。** 你跟实习生说"帮我弄个东西"，他大概率一脸茫然。但如果你说"帮我把这份 Excel 按销售额从高到低排序，标出前 10 名，存成 CSV"，他一分钟就能交活。LLM 跟实习生很像——你不说清楚，它就自由发挥；你给够了上下文和格式约束，它比谁都靠谱。

Prompt Engineering（提示词工程）是**设计和优化给 LLM 的输入指令**，以获得高质量输出的系统性方法。这玩意儿不玄学，本质上就是"把话说清楚"——只不过说清楚的对象换成了一个注意力只有 4096 个 token 的推理引擎。

好的 Prompt 和差的 Prompt，输出质量天差地别。一个优秀的 Prompt 工程师和一个随手扔问题的用户，用的是同一个模型，拿到的却是完全不同的结果。差就差在这几句话上。（这大概也是唯一一个不等你入职就能立刻提效的技能——改改 Prompt 比改模型省钱多了。）

## 核心原则

### 1. 清晰具体

别让 AI 猜你的意图，直接说明你要什么。AI 不是女朋友，它真的猜不到。

一个行业内卷的现实：别人写的 Prompt 洋洋洒洒 200 字带 Few-shot 加 CoT，你写的 Prompt 三个字"帮我写"——同一套模型，差距就是这么大。好消息是，这个差距不需要加班就能补齐，改 Prompt 比改模型便宜太多了。

```text
❌ "写一篇关于AI的文章"
✅ "写一篇500字的科普文章，介绍AI Agent的概念，
   面向非技术背景读者，包含一个生活中的类比"
```

### 2. 提供上下文

给 LLM 足够的背景信息。别一上来就甩需求，先告诉它"你是谁"——这叫角色设定，比你想象的重要得多。

```text
你是一位有10年经验的Python后端工程师。
现在需要你为一个API接口写说明文档。
请包含：接口路径、请求方法、参数说明、返回示例。
```

### 3. 给出示例（Few-shot）

用一个或几个示例告诉 AI 你期望的输出格式。少样本学习（Few-shot）就像给实习生看两个例子然后说"照着这个格式做"——聪明人看两个例子就懂了，AI 也一样。在座的各位如果带过新人，应该深有体会：不给示例的活 = 无限返工的开始。

```text
将以下英文翻译成中文，保持原文的语气：

输入: "I love coding!"
输出: "我爱编程！"

输入: "This is absolutely amazing!"
输出: "这简直太棒了！"

输入: "{用户要翻译的内容}"
输出:
```

## 进阶技巧

### Chain of Thought（思维链）

让 AI 展示推理过程，大幅提升复杂问题的准确率。你可以把这理解为让 AI "打草稿"——如果小学数学考试不让打草稿，你的正确率也不会高到哪里去。LLM 是 token-by-token 生成的，逼它一次跳答案，它会在不该犯错的地方翻车。

```text
问题: 一个农场有 15 只鸡和 8 只兔子，一共有多少条腿？

请在回答前先逐步推理：
1. 鸡有2条腿，所以15只鸡有 15×2=30 条腿
2. 兔子有4条腿，所以8只兔子有 8×4=32 条腿
3. 总腿数 = 30 + 32 = 62 条腿

现在回答这个问题：一个农场有 23 只鸡和 12 只兔子，一共有多少条腿？
```

### Role Prompting（角色扮演）

给 AI 套上一个人设，比直接下指令效果好得多。为什么？因为预训练语料里充满了各种角色的自然语言——"严苛的代码审查者"这个角色在互联网上说过的话，比你直接命令它"帮我查 bug"丰富一百倍。

```text
你是一个严苛的代码审查者。请审查以下代码：
- 关注安全问题
- 检查性能隐患
- 指出代码坏味道
- 给出改进建议

[代码内容]
```

### Structured Output（结构化输出）

让 AI 输出结构化格式（JSON/Markdown），方便下游程序解析。这年头写 Prompt，不给输出格式约等于给自己埋坑——你以为你拿到的是字符串，结果每一次返回的结构都不一样，你写的正则表达式越来越多，直到某一天你发现自己已经实现了一个不完整的 JSON parser。

```text
分析以下代码并返回JSON格式的结果：
{
  "language": "检测到的编程语言",
  "complexity": "low/medium/high",
  "bugs": ["潜在bug描述"],
  "suggestions": ["改进建议"],
  "overall_score": 85
}
```

## Agent 场景下的 Prompt

在 AI Agent 中，Prompt 更加重要，因为 Agent 需要：

- 理解复杂的多步骤任务
- 自主决定调用哪些工具
- 在信息不完整的情况下做出合理推断——注意"合理"这个词，不合理就是灾难
- 在不同子任务之间正确切换上下文

如果说给 ChatGPT 写 Prompt 是"跟一个人对话"，那给 Agent 写 Prompt 就是"给一个团队写工作守则"。难度不在一个量级。

### System Prompt（系统提示词）

定义 Agent 的角色和行为边界。System Prompt 是你唯一一次机会来告诉 Agent"你是谁、你能做什么、你不能做什么"——这句话写在最前面不是没道理的。

```text
你是一个数据分析助手。你的职责：
1. 接收用户的数据分析需求
2. 编写并执行 Python 代码
3. 将结果可视化呈现

限制：
- 不要执行任何文件删除操作
- 不要访问用户隐私数据
- 如果需求不明确，向用户确认后再执行
```

### Tool Description（工具描述）

Agent 能否正确调用工具，取决于工具描述的好坏。一个函数的 docstring 写得好不好，直接影响 Agent 在什么时候调用它、用什么参数调用它、调用完了怎么理解返回结果。写 Tool Description 本质上是在写"给 LLM 看的 API 文档"。

```python
# 工具定义示例 — Agent 通过函数签名和 docstring 理解如何调用
@tool
def query_database(sql: str) -> str:
    """
    执行SQL查询并返回结果。
    参数 sql: 要执行的SQL SELECT语句。仅支持SELECT，不支持INSERT/UPDATE/DELETE。
    返回: 查询结果的JSON字符串。

    使用时机：当用户需要查询销量、用户信息、订单状态等数据时。
    注意：表名和字段名必须使用英文命名。
    """
```

> 🧪 **动手试试**
>
> 打开你常用的 AI 工具（ChatGPT/Claude/你的 Agent 应用），做以下练习：
>
> 1. **对比实验**：先用"帮我写一个排序算法"问一次，再用"帮我用 Python 写一个快速排序函数，要求包含类型注解和 doctest 测试用例"问一次。对比两者输出的质量差异。
>
> 2. **思维链实战**：出一道你自己工作中的逻辑题（比如排查某个 bug 的推理链路），分别用直接提问和 CoT 方式提问，记录准确率差异。
>
> 3. **给工具写描述**：如果你在用 Agent 框架，挑一个你写过的 tool 函数，按本文的模板重写它的 docstring，看看 Agent 调用准确率有没有提升。
>
> 4. **迭代优化**：找一个你之前用过的、效果一般的 Prompt，用本文的原则重写一遍（加角色、加示例、加输出格式），记录改进前后的差异。
>
> 提示：好 Prompt 是迭代出来的，不是一次写对的。写三版是常态，写一版就完美是幻觉。

## 总结

回头看，Prompt Engineering 的核心其实就五条：

1. **清晰具体** — 别让 AI 猜，它猜不过你
2. **提供上下文** — 给角色、给背景，把 AI 当新入职的同事
3. **给出示例** — Few-shot 最有效，实习生和 AI 都吃这一套
4. **思维链** — 让 AI 展示推理过程，别逼它心算
5. **结构化** — 明确期望的输出格式，你的 parser 会感谢你

写好 Prompt 是所有 AI Agent 工作的基础。下一篇我们进入 **Agent 架构设计**。

---

> 💡 **今日金句**
>
> "A bad prompt is like a bad Jira ticket — both produce exactly what you asked for, and neither is what you actually wanted."
>
> （坏 Prompt 就像一张写得稀烂的 Jira 工单——你拿到的确实是你要求的，但永远不是你想要的。）
