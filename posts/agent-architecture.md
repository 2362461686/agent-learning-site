---
title: "Agent 架构设计：ReAct、Plan-Execute 与 Multi-Agent"
date: "2026-07-12 16:00:00"
description: "深入理解 Agent 的三种核心架构模式，选择最适合你场景的方案"
cover: ""
tags: ["Agent 架构", "ReAct", "Multi-Agent", "进阶", "教程"]

videos:
  - title: "Multi-Agent 系统设计：从理论到实战"
    url: "https://www.bilibili.com/video/BV1is1SBEEfv/"
    platform: "bilibili"

links:
  - title: "LangGraph 官方文档（Agent 编排）"
    url: "https://langchain-ai.github.io/langgraph/"
    description: "构建可控 Agent 和 Multi-Agent 工作流的核心框架"
  - title: "ReAct Prompting 论文"
    url: "https://arxiv.org/abs/2210.03629"
    description: "ReAct: Synergizing Reasoning and Acting in Language Models"
  - title: "CrewAI 文档"
    url: "https://docs.crewai.com/"
    description: "Multi-Agent 协作框架，角色扮演式 Agent 开发"
  - title: "AutoGen (Microsoft)"
    url: "https://microsoft.github.io/autogen/"
    description: "微软开源的 Multi-Agent 对话框架"
---

讲一万小时定律的时候，很多人会觉得"我又不打算转行做 AI 研究，Agent 架构跟我有什么关系？"好消息是：学会 Agent 架构不需要一万小时，一篇文章就够了。说真的，很多初学者以为 Agent 架构是遥不可及的高深概念，其实它和做饭一样简单——你在厨房里怎么组织一顿饭，就怎么组织一个 Agent。

想象三种做饭场景：

- **边做菜边尝味道调整**：打开冰箱看到什么就做什么，炒着炒着发现咸了加点水，淡了加点盐，最后端上一盘还算满意的菜。这就是 **ReAct**。
- **先列菜谱再按步骤来**：提前想好前菜、主菜、甜点各要做什么，写好采购清单，然后一二三四一步步执行。这就是 **Plan-Execute**。
- **一个切菜一个炒菜一个摆盘**：你负责备菜，室友负责掌勺，另一个人负责装盘，最后主厨喊一声"上菜"。这就是 **Multi-Agent**。

好了，厨房收工，咱们进正题——三种架构，本质上就是三种"组织思路"的方式。如果你是 Bug 体质（写啥都能遇到 edge case），建议先用 ReAct 兜底；如果你掌控欲比较强、喜欢把事情安排得明明白白，Plan-Execute 会更对你胃口；如果你已经是一个"技术组组长"，在带团队做复杂项目，Multi-Agent 就是你的菜。

## 为什么架构很重要？

构建一个 AI Agent 不只是"让 LLM 调用工具"。随着任务复杂度提升，你需要选择合适的架构来组织 Agent 的思考和行动流程。

（别问我怎么知道的——曾经有个项目直接用单 Agent + 死循环去爬 100 个网页，结果 token 账单比我的房租还高。后来上了 Plan-Execute，提前拆好步骤，成本直接砍半。）

## 模式一：ReAct（Reasoning + Acting）

**ReAct** 是最经典的 Agent 架构模式。核心理念：**思考与行动交替进行**。

它就像一个边写代码边跑测试的开发者：写一段，跑一下，报错了就改，没报错就继续，直到功能跑通。整个过程充满试探，但也最灵活。

### 工作流程

```
Thought: 我需要知道今天的天气才能建议穿搭
Action: get_weather("北京")
Observation: 晴天，25°C

Thought: 天气不错，适合轻便穿搭
Action: recommend_outfit("春季晴天", "25°C")
Observation: 建议穿T恤配薄外套

Thought: 我有了推荐，可以回答用户了
Final Answer: 今天北京晴天25°C，建议穿T恤配薄外套
```

### 代码示例

```python
from langchain.agents import create_react_agent, AgentExecutor

# 创建 ReAct Agent：LLM 在"想"和"做"之间来回跳
agent = create_react_agent(llm, tools, prompt)
executor = AgentExecutor(
    agent=agent,
    tools=tools,
    max_iterations=5,  # 最多5轮思考-行动，防止 Agent 陷入"让我再想想"的死循环
    handle_parsing_errors=True
)
```

> 一个小提醒：`max_iterations` 这个参数值得你认真设置。设太小 Agent 还没做完就停了，设太大它可能在 `Thought → Action → Observation` 的循环里快乐地转圈——像个忘关火的锅。

### 适用场景
- 需要多步骤推理的任务
- 结果依赖中间步骤的场景
- 问题复杂度不确定的情况

## 模式二：Plan-Execute（计划-执行）

对于复杂任务，**先规划再执行**可能更高效。

如果把 ReAct 比作"敏捷开发，走一步看一步"，那 Plan-Execute 就是"瀑布模型，需求文档先写好"。听起来老派？但在任务链路清晰的时候，它真的省 token——不用每一步都重新思考"我接下来要干嘛"。

### 工作流程

```
1. Planner: 分析任务，生成执行计划
   Plan: [步骤1: 查天气, 步骤2: 查交通, 步骤3: 推荐路线]

2. Executor: 逐步执行计划
   步骤1 → 结果
   步骤2 → 结果
   步骤3 → 最终答案
```

### 代码示例

```python
from langchain_experimental.plan_and_execute import (
    PlanAndExecute,
    load_agent_executor,
    load_chat_planner,
)

# Planner 负责"列菜单"，Executor 负责"炒菜"
planner = load_chat_planner(llm)
executor = load_agent_executor(llm, tools)
agent = PlanAndExecute(planner=planner, executor=executor)

result = agent.invoke({
    "input": "帮我规划一个北京三日游：包含景点、交通和美食推荐"
})
```

### 适用场景
- 任务有明确步骤可拆解
- 需要全局视角规划
- 多依赖关系的复杂工作流

## 模式三：Multi-Agent（多 Agent 协作）

当一个 Agent 不够时，让**多个专业 Agent 协作**。

这大概是三种架构里最有"团队感"的一个。如果你参与过前后端分离的项目，你应该秒懂——前端 Agent 负责 UI 逻辑，后端 Agent 负责数据和接口，Supervisor Agent 就是你们的 Tech Lead，负责拍板和分配任务。唯一不同的是，Agent 之间不会在 Code Review 时互怼（暂时还不会）。

### 架构设计

```
          ┌─────────────┐
          │  Supervisor  │  ← 总指挥，分配任务
          │    Agent     │
          └──────┬──────┘
      ┌──────────┼──────────┐
      ▼          ▼          ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Research  │ │  Coding  │ │  Review  │
│  Agent    │ │  Agent   │ │  Agent   │
└──────────┘ └──────────┘ └──────────┘
```

### 使用场景

```python
# 一个典型的多Agent工作流：
# 1. Research Agent 调研技术方案
# 2. Coding Agent 编写代码
# 3. Review Agent 审查代码质量
# 4. Supervisor 协调三者，决定下一步
# 注意：三个 Agent 各自独立运行，Supervisor 负责路由和汇总，
# 相当于一个小型"技术评审会"自动化了
```

## 如何选择架构？

| 场景 | 推荐架构 | 理由 |
|------|---------|------|
| 简单查询 | ReAct | 快速灵活 |
| 多步骤任务 | ReAct | 动态调整 |
| 复杂工作流 | Plan-Execute | 全局规划 |
| 需要分工协作 | Multi-Agent | 专业分工 |
| 不确定的任务 | ReAct | 灵活适应 |

一个老生常谈但确实有用的原则：**能用 ReAct 搞定的，就别上 Multi-Agent。** 架构的复杂度是"复利"的——每多一个 Agent，你的调试难度、token 消耗、出问题的概率都在成倍增长。在团队里我见过最经典的翻车现场就是：一个简单查询任务被套了 Multi-Agent，三个 Agent 互相等对方返回结果，最后超时——像极了三个后端同时等对方先提交代码。

## 实际建议

1. **从 ReAct 开始**：90% 的场景够用
2. **逐步演进**：发现问题再引入更复杂的架构
3. **关注成本**：Multi-Agent 的 token 消耗可能是指数级的
4. **做好错误处理**：Agent 执行失败时的回退策略很重要

> 🧪 **动手试试**
>
> 选一个你最近遇到的问题（哪怕只是"帮我查一下今天 GitHub trending 上的 Python 项目并总结每个项目的 README"），分别用 ReAct 和 Plan-Execute 两种思路拆解一下它的执行流程。你会发现同一个任务，两种架构的"思维方式"完全不同——ReAct 是先开枪再瞄准，Plan-Execute 是先瞄准再开枪。两种没有绝对的好坏，只有适合与否。
>
> 进阶挑战：如果把这个任务交给 Multi-Agent，你会怎么分配角色？试着在白板上画一下 Supervisor 下面的子 Agent 分工，看看能不能跑通。
>
> 另外推荐直接跑一遍 [LangGraph 官方文档](https://langchain-ai.github.io/langgraph/) 里的 Quick Start，30 分钟就能在本地把一个 ReAct Agent 跑起来。读完文章不动手，等于厨师看了菜谱不开火——道理都懂，但菜还是生的。

## 总结

三种核心架构各有适用场景：
- **ReAct**：最通用，思考行动交替
- **Plan-Execute**：先规划后执行，适合复杂任务
- **Multi-Agent**：专业分工，适合大型系统

选择合适的架构，是构建可靠 AI Agent 的关键一步。

---

> 到这里，我们已经覆盖了 AI Agent 从入门到架构的核心知识。接下来你可以选择一个感兴趣的方向深入实践，比如用 LangGraph 构建更复杂的 Agent 工作流。

> 💡 **今日金句**
>
> "好的架构不是让系统永远不会出错，而是让系统在出错时，你知道该从哪里开始修。"

---

> 📚 **参考资源**
>
> 本文涉及的框架和论文汇总：
>
> - [LangGraph 官方文档](https://langchain-ai.github.io/langgraph/) — 构建可控 Agent 和 Multi-Agent 工作流的核心框架
> - [ReAct Prompting 论文](https://arxiv.org/abs/2210.03629) — ReAct: Synergizing Reasoning and Acting in Language Models
> - [CrewAI 文档](https://docs.crewai.com/) — Multi-Agent 协作框架，角色扮演式 Agent 开发
> - [AutoGen (Microsoft)](https://microsoft.github.io/autogen/) — 微软开源的 Multi-Agent 对话框架
> - [Multi-Agent 系统设计：从理论到实战](https://www.bilibili.com/video/BV1is1SBEEfv/) — Bilibili 视频教程
