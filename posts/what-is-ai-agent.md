---
title: "AI Agent 概述：什么是智能体？"
date: "2026-07-10 12:00:00"
description: "从 LLM 到 AI Agent 的演进之路，搞懂智能体的核心概念"
cover: "/picture/fengmian/111.jpg"
tags: ["AI Agent", "入门", "教程"]

videos:
  - title: "吴恩达《AI Agent 入门》课程"
    url: "https://www.deeplearning.ai/short-courses/ai-agents-in-langgraph/"
    platform: "youtube"
  - title: "什么是 AI Agent？通俗讲解"
    url: "https://www.bilibili.com/video/BV1Z7ZwYHENT/"
    platform: "bilibili"
  - title: "LangGraph 实战：构建你的第一个 Agent"
    url: "https://www.bilibili.com/video/BV1uH4y1c7bM/"
    platform: "bilibili"

links:
  - title: "LangGraph 官方文档"
    url: "https://langchain-ai.github.io/langgraph/"
    description: "LangChain 出品的 Agent 编排框架，支持复杂工作流"
  - title: "Anthropic - Building Effective Agents"
    url: "https://www.anthropic.com/engineering/building-effective-agents"
    description: "Anthropic 官方 Agent 设计实践指南，行业标杆"
---

> **Agent就像一个刚入职的实习生 —— LLM是它聪明但偶尔胡诌的大脑，工具是它办公桌抽屉里的印章和计算器，而你，就是那个给它安排活儿的 mentor。它会自己查资料、自己打电话、自己填表格，唯一的问题是……它有时候会自信满满地把"北京"填进"手机号"那一栏。**

不过没关系，实习生可以教，Agent 也可以调。一起来搞懂这个"数字实习生"到底是怎么干活的。

## 从 LLM 到 Agent

2023 年，大语言模型（LLM）如 GPT-4 的出现让世界震惊。但很快人们发现，单纯的 LLM 存在明显的局限：

- 只会基于训练数据回答，无法获取实时信息
- 无法执行具体操作（如发送邮件、查询数据库）
- 容易产生幻觉（hallucination）
- 缺乏规划和反思能力

打个比方：**ChatGPT 就像高考前的学霸 —— 知识停留在训练截止日，考完试之后世界发生了什么，它一概不知。**你问它"今天北京天气怎么样"，它要么拒绝回答，要么编一个看起来很像那么回事的数字（这就是幻觉 —— 学霸的通病，不会也要硬答）。

AI Agent 的出现，让 LLM 从"嘴炮王者"变成了"实干家"——只能说不能干的日子结束了。用一个贴切的比喻来形容：

## 什么是 AI Agent？

> AI Agent 是一个能够**感知环境、做出决策并执行行动**的自主系统。

简单来说，Agent = LLM + 工具 + 记忆 + 规划能力。

一个典型的 Agent 工作流程：

1. **感知**：接收用户输入或环境信息
2. **思考**：利用 LLM 进行推理、规划
3. **行动**：调用工具执行具体操作
4. **观察**：获取执行结果，判断是否需要继续

这四步循环，在工程上有一个很酷的名字叫 **"ReAct 循环"**（Reasoning + Acting），但本质上就是：**看 → 想 → 干 → 再看一眼**，像极了你在写 bug 时反复 `console.log` 的心路历程——当然，Agent 不会跟你一样在第二步"想"的环节偷偷刷手机摸鱼。

用一段伪代码来直观感受一下 Agent 的"脑回路"：

```python
# Agent 的核心循环：看 → 想 → 干 → 再看
def agent_loop(user_input: str) -> str:
    memory = []  # 短期记忆，记不住太多东西（和周一早上开会时的你差不多）

    while True:
        # Step 1: 感知 —— 把用户说什么和之前干了什么拼在一起
        context = memory + [user_input]

        # Step 2: 思考 —— LLM 大脑开始推理
        thought = llm.think(context)  # 返回"我该干啥"或"我干完了"

        # Step 3: 判断是否结束 —— 学霸学会说"我不知道"了
        if thought.is_finished:
            return thought.final_answer  # 终于可以下班了

        # Step 4: 行动 —— 调用工具干正事
        action_result = thought.execute_tool()  # 比如查天气、发邮件、跑 SQL

        # Step 5: 观察 —— 把结果记下来，下一轮循环用
        memory.append(action_result)  # "哦原来数据库返回了这些，那我继续……"
```

## Agent 的核心组件

### 1. 大脑（LLM）
大语言模型是 Agent 的推理引擎，负责理解任务、制定计划、生成响应。

> 一句话总结：**LLM 负责动脑子，但动完脑子之后具体怎么执行，它不管 —— 那是工具的活儿。**就像产品经理画完原型图，并不会自己去写代码（这才是合理的分工，对吧？）。

### 2. 工具（Tools）
让 Agent 能够与外部世界交互。常见的工具包括：
- 搜索引擎 API（获取实时信息）
- 数据库操作（CRUD）
- 代码解释器（执行 Python 代码）
- 各类 API（发送邮件、操作文件等）

工具调用的本质是 **"函数调用"（Function Calling）**，LLM 输出的是结构化参数，由程序去执行。来看一个例子：

```python
# 定义工具：Agent 能用的"办公用品"
tools = {
    "search_internet": {
        "description": "搜索互联网获取实时信息",
        "parameters": {"query": "string"}  # LLM 会自己填这个参数
    },
    "send_email": {
        "description": "发送邮件",
        "parameters": {"to": "string", "subject": "string", "body": "string"}
    }
}

# LLM 的输出不是自然语言，而是结构化的函数调用
# 用户问："帮我查一下今天北京的天气"
# LLM 输出：{"tool": "search_internet", "query": "北京天气 2026-07-13"}
# Agent 拿到这个 JSON，调 API → 拿到结果 → 再喂回 LLM 总结成自然语言
```

### 3. 记忆（Memory）
- **短期记忆**：当前对话的上下文
- **长期记忆**：跨会话的信息持久化（通过向量数据库）

> 短期记忆就像你写代码时开的十几个 Chrome Tab —— 太多了会爆内存。长期记忆则像你的 Notion 笔记，用得上的时候搜一下，用不上就躺在那里吃灰。

```python
# 记忆系统的简化示意
class AgentMemory:
    def __init__(self):
        self.short_term = []       # 当前对话：记性有限，和鱼差不多
        self.long_term = VectorDB()  # 历史存档：搜一搜说不定能找到

    def remember(self, info: str):
        self.short_term.append(info)  # 先记脑子里
        self.long_term.store(info)    # 再存进"笔记本"

    def recall(self, query: str) -> list:
        return self.long_term.search(query)  # 翻翻旧账，看有没有用过的
```

### 4. 规划（Planning）
Agent 需要将复杂任务拆解为可执行的子任务：
- **ReAct 模式**：Reasoning + Acting，交替进行推理和行动
- **Plan-Execute 模式**：先制定完整计划，再逐步执行

> ReAct 像边开飞机边修引擎（走一步看一步），Plan-Execute 像先画好图纸再盖楼（谋定而后动）。日常开发中你会发现，Agent 的 Plan-Execute 模式比你自己写的 TODO list 靠谱多了 —— 因为它至少不会把"重构整个项目"写在第一行。

## 现实中的应用

| 场景 | Agent 类型 | 示例 |
|------|-----------|------|
| 客服 | 对话型 Agent | 自动处理用户咨询，查询订单 |
| 编程 | 代码 Agent | GitHub Copilot、Devin |
| 数据分析 | 数据分析 Agent | 自动查询数据库，生成图表 |
| 办公自动化 | 任务型 Agent | 自动安排日程、处理邮件 |

> 提醒一下：上面表格里的"客服 Agent"，目前大多数还是"人工智障"级别 —— 它可以把"亲，请稍等"说得比真人还亲切，但解决实际问题的能力嘛……你肯定被淘宝/京东的机器人绕进去过。**不过方向是对的，给它点时间。**

---

> 🧪 动手试试

打开你的终端（或者 Colab），跑一跑下面这段代码，感受一下最简版的 Agent 循环是什么样子。不需要装任何 AI 框架，纯 Python 模拟 —— 重点是理解"思考 → 行动 → 观察"这个循环结构。

```python
# 最简 Agent 模拟：没有真的 LLM，但流程是一样的
import random

def fake_think(task):
    """模拟 LLM 思考：在实际项目中，这里会调用 GPT/Claude 的 API"""
    # 假装 LLM 在思考中…… 实际项目中这里要花好几秒（和你的 CI/CD pipeline 一样慢）
    actions = ["查天气", "发邮件", "算数学", "搜索资料"]
    chosen = random.choice(actions)
    print(f"🧠 Agent 思考中：针对「{task}」，我决定去 {chosen}")
    return chosen

def fake_execute(action):
    """模拟工具执行：实际项目中，这里会调用真正的 API"""
    # 假装在执行…… 实际项目中这里也可能报超时错误（你懂的）
    results = {
        "查天气": "北京今天 35°C，注意防暑",
        "发邮件": "邮件已发送给老板（但愿没写错收件人）",
        "算数学": "圆周率第 100 位是 9（不是我算的，是 Google 说的）",
        "搜索资料": "找到 3 篇相关文章"
    }
    result = results.get(action, "啥也没干成……")
    print(f"🔧 执行中：{action} → 结果：{result}")
    return result

# 主循环 —— 这就是 Agent 的核心
def mini_agent(task, max_rounds=3):
    print(f"📋 任务：{task}\n")
    for round_num in range(1, max_rounds + 1):
        print(f"--- 第 {round_num} 轮 ---")
        action = fake_think(task)   # Step 1: LLM 思考
        result = fake_execute(action)  # Step 2: 工具执行
        # Step 3: 判断够不够（简化版：跑够轮数就停）
        if round_num == max_rounds:
            print(f"\n✅ Agent 收工：{result}")
    print("\n（实际 Agent 会比这个复杂 100 倍，但骨架就是这样的循环）")

mini_agent("帮我看看北京热不热，如果热就发封邮件提醒我喝水")
```

**运行这段代码，你会看到 Agent 的"内心独白"** —— 思考什么、执行什么、得到什么结果。把 `fake_think` 换成真正的 LLM API，`fake_execute` 换成搜索引擎、邮件 API，这就是一个能真正干活的 Agent 了。**骨架就这么简单，剩下的都是工程细节。**

## 下一步

了解了 Agent 的基本概念后，下一篇我们将进入实战：**用 LangChain 构建你的第一个 Agent**。

> 💡 今日金句

> **"LLM 是大脑，工具是手脚，Agent 是把它们组装起来的骨架。没有骨架的大脑只能空想，没有大脑的手脚只会乱动。而我们要做的，就是给这个骨架装上正确的肌肉记忆 —— 这就是 Agent 工程的意义。"**

记住：**好的 Agent 不是一次性写对的，是调出来的。**和带实习生一样，多给反馈，多迭代，它慢慢就靠谱了。下次见。
