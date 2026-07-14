---
title: "Multi-Agent 多智能体协作实战"
date: "2026-07-14 09:00:00"
description: "掌握 CrewAI 和 LangGraph 的 Supervisor 模式，构建能分工协作的 Agent 团队"
cover: "/picture/fengmian/222.jpg"
tags: ["Multi-Agent", "LangGraph", "实战", "教程"]

videos:
  - title: "LangGraph Multi-Agent Supervisor 模式详解"
    url: "https://www.youtube.com/watch?v=hvAPnpSfSXM"
    platform: "youtube"
  - title: "CrewAI 实战：构建你的第一个 Agent 团队"
    url: "https://www.bilibili.com/video/BV1Vt42177cF/"
    platform: "bilibili"

links:
  - title: "LangGraph Multi-Agent Supervisor 官方文档"
    url: "https://langchain-ai.github.io/langgraph/tutorials/multi_agent/agent_supervisor/"
    description: "官方 Supervisor 多智能体教程，包含完整代码"
  - title: "CrewAI 官方文档"
    url: "https://docs.crewai.com/"
    description: "角色扮演式 Multi-Agent 框架，用自然语言定义 Agent 角色"
  - title: "AutoGen (Microsoft)"
    url: "https://microsoft.github.io/autogen/"
    description: "微软开源的对话式 Multi-Agent 框架"
---

## 单 Agent 的极限

你在前面几篇已经学会了给一个 Agent 装工具、写 Prompt、调架构。但当你面对一个真正的复杂任务时，单 Agent 会暴露出一个核心问题：

> **一个 Agent 等于一个全能型选手，而全能型选手通常意味着每一项都只能做到 80 分。**

你让同一个人先做需求调研，再写代码，再写测试，再写文档——他每件事都能做，但每件事都不会是顶尖水平。在软件工程里，我们会成立前端组、后端组、测试组。Agent 世界里，同样的分工逻辑成立。

举个例子：你要做一个"分析竞品产品并给出改进建议"的任务。一个 Agent 做大概需要：
1. 搜索竞品信息（它可以做）
2. 阅读并总结（它可以做）
3. 基于总结推理出自己的建议（它可以做，但质量取决于前两步）

而三个 Agent 分工：
1. **Research Agent**：专注搜索和收集，保证信息全面
2. **Analyst Agent**：专注分析和归纳，它的 Prompt 就是"你是一个分析师"
3. **Writer Agent**：专注输出，格式排版一流

> 单 Agent 像个体户，什么活都能接，但大项目撑不住。Multi-Agent 像工作室，每个 Agent 只管自己的专业领域，合起来干活效率翻倍——前提是你别让它们内讧（见下文"防死锁"部分）。

---

## 两种主流 Multi-Agent 模式

### 模式 A：Supervisor（监督者模式）

一个 Supervisor Agent 做总指挥，分配任务给子 Agent，子 Agent 只负责执行自己领域内的工作。

```
           ┌──────────────────┐
           │   Supervisor      │  ← "这个任务该谁做？"
           │    (Coordinator)  │
           └────────┬─────────┘
        ┌───────────┼───────────┐
        ▼           ▼           ▼
  ┌──────────┐ ┌──────────┐ ┌──────────┐
  │Research  │ │ Coding   │ │ Review   │
  │Agent     │ │ Agent    │ │ Agent    │
  │"我负责搜"│ │"我负责写"│ │"我负责审"│
  └──────────┘ └──────────┘ └──────────┘
```

Supervisor 的子 Agent 之间通常**不直接通信**——所有流转必须经过 Supervisor。这避免了混乱，但增加了决策中心节点的压力。

### 模式 B：Collaborative（协作对话模式）

Agent 之间直接对话，像一个 Slack 群里的团队成员互相 @。

```
Research Agent ←→ Coding Agent ←→ Review Agent
     ↑                ↑               ↑
     └────── 直接聊天，不用 Supervisor 审批 ──────┘
```

合作模式更灵活，但也更容易出现"死锁"——两个 Agent 讨论了半天谁也不拍板。

---

## 实战一：CrewAI 搭建分析团队

CrewAI 是最简单的 Multi-Agent 框架，用自然语言定义 Agent 角色：

```python
from crewai import Agent, Task, Crew, Process

# 定义角色：就像在写"招聘需求"
research_agent = Agent(
    role="市场研究员",
    goal="收集指定公司的最新产品和融资信息",
    backstory="你是一个有5年经验的市场研究员，擅长从公开渠道挖掘一手信息。你追求信息的精度和时效性。",
    verbose=True,
    allow_delegation=False  # 研究员不分配任务，只执行
)

analyst_agent = Agent(
    role="竞争分析师",
    goal="基于研究员收集的信息，做SWOT分析并给出策略建议",
    backstory="你是一个资深商业分析师，擅长从零散数据中提炼洞察。你的报告总是结构清晰、有理有据。",
    verbose=True,
    allow_delegation=False
)

# 定义任务：给每个 Agent 分配具体工作
task_research = Task(
    description="搜索 OpenAI 在 2026 年的最新产品发布和融资动态，收集不少于5条关键信息。",
    expected_output="结构化的信息列表，每条包含时间、事件、来源",
    agent=research_agent
)

task_analysis = Task(
    description="基于研究员收集的信息，分析 OpenAI 的市场策略，输出 SWOT 分析和三条建议。",
    expected_output="SWOT 分析报告，包含 Strengths/Weaknesses/Opportunities/Threats + 3条策略建议",
    agent=analyst_agent,
    context=[task_research]  # 关键：分析师的任务依赖研究员的任务结果
)

# 组建团队
crew = Crew(
    agents=[research_agent, analyst_agent],
    tasks=[task_research, task_analysis],
    process=Process.sequential,  # 顺序执行：先研究，再分析
    verbose=True
)

result = crew.kickoff()
print(result)
```

> CrewAI 的精髓在于 `backstory` 和 `context` 两个字段。`backstory` 是你给 Agent 的"人设简历"，写得越具体，Agent 的行为越符合你的预期。`context` 是任务之间的依赖声明——如果你不写这个，Analyst 可能在 Researcher 还没干完活的时候就动手了。**Multi-Agent 的难点不是分工本身，而是管理依赖关系——这和带团队管理项目是一模一样的道理。**

---

## 实战二：LangGraph Supervisor 模式

LangGraph 的思路更底层——不是"定义角色"，而是"定义图结构"。每一个 Agent 是图的一个节点，Supervisor 是路由节点。

```python
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import create_react_agent
from typing import TypedDict, Literal

# 定义全局状态
class TeamState(TypedDict):
    messages: list
    next_agent: str
    task_result: str
    round_count: int

# 构建子 Agent（每个都是独立的 ReAct Agent）
research_agent = create_react_agent(llm, tools=[web_search, db_query])
code_agent = create_react_agent(llm, tools=[python_repl, file_writer])

# Supervisor 的决策函数
def supervisor_node(state: TeamState) -> dict:
    """Supervisor 审视当前状态，决定下一步交给谁"""
    # 防死锁：最多 10 轮
    if state["round_count"] > 10:
        return {"next_agent": "FINISH"}

    # LLM 决策：分析当前任务进度
    prompt = f"""你是一个项目管理者。当前任务完成情况如下：
{state["task_result"]}

请决定下一步行动。你只能选择：
- research: 需要更多信息 → 交给 Research Agent
- code: 可以开始实现了 → 交给 Code Agent
- FINISH: 任务已完成 → 结束

只输出 agent 名称。"""
    decision = llm.invoke(prompt).content.strip()
    return {"next_agent": decision, "round_count": state["round_count"] + 1}

# 构建图
graph = StateGraph(TeamState)

# 添加节点
graph.add_node("supervisor", supervisor_node)
graph.add_node("research", research_agent)
graph.add_node("code", code_agent)

# 路由：谁 → 下一步去哪
graph.add_conditional_edges(
    "supervisor",
    lambda s: s["next_agent"],
    {
        "research": "research",
        "code": "code",
        "FINISH": END,
    }
)

# 每个子 Agent 执行完必须回到 Supervisor 汇报
graph.add_edge("research", "supervisor")
graph.add_edge("code", "supervisor")

app = graph.compile()
result = app.invoke({"messages": [], "round_count": 0, "task_result": ""})
```

> LangGraph 的优势在于你对控制流有完全掌控——每一步怎么走、条件怎么判、终止条件是什么，全都显式定义在代码里。代价是代码量更多，调试更复杂。**CrewAI 适合"我先试试看"，LangGraph 适合"我知道我要什么"。**

---

## Multi-Agent 的三个经典翻车现场

### 1. 死锁：三个 Agent 互相等

症状：Research Agent 说"我需要 Analyst 确认方向"，Analyst 说"我需要 Researcher 提供数据"，Writer 说"我等你们俩好了再开始"。三个都在等对方，谁都不先动。

解法：**给 Supervisor 设置 max_rounds**，超时强制终止。或者引入"降级策略"——最后一名 Agent 独自输出一个不完美的结果。

### 2. Token 账单爆炸

症状：三个 Agent 每人聊了 5 轮，每轮上下文都带着全部历史。总 token 消耗 = 单 Agent 的 3-5 倍。

解法：**压缩子 Agent 之间的消息**。不要传递完整的自然语言对话，只传结构化摘要。

### 3. 幻觉级联放大

症状：Researcher 编了一个数据，Analyst 基于这个假数据做了分析，Writer 基于分析写了报告。最后整个输出看起来像那么回事，实际上从头错到尾。

解法：**关键数据加验证节点**。比如 Research Agent 输出必须带来源 URL，Supervisor 抽查验证。

> 这三类问题背后是同一个道理：Multi-Agent 的复杂度不是线性叠加的，是指数级的。加一个 Agent = 加 N 条通信路径 = 加 N 个故障点。**不是所有任务都值得上 Multi-Agent——能用单 Agent 搞定的，别强行拆成三个。**

---

> 🧪 **动手试试**

1. **最小 Multi-Agent**：用 CrewAI 搭两个 Agent——一个"搜索员"一个"总结员"，给它们一个有 3 个子问题的任务，观察执行顺序是否正确。
2. **加防死锁**：在你的 Supervisor 里加 `max_rounds` 限制，故意给一个 Agent 分配一个不完整的任务，观察它在超时后如何降级。
3. **对比实验**：同一个任务，分别用单 Agent 和 Multi-Agent (3个) 跑一遍，对比结果质量和 token 消耗。你会发现 token 账单的差距大得让你怀疑人生。

---

## 总结

- **CrewAI** 上手快，"定义角色"就够了，适合快速验证想法
- **LangGraph Supervisor** 控制力强，适合需要精细控制的生产级场景
- **AutoGen (Microsoft)** 偏向对话式协作，Agent 之间互相发消息
- **核心原则**：能用单 Agent 别上多 Agent，上了多 Agent 一定要设超时和降级策略

下一篇我们聊聊 Agent 的**部署与生产化**——代码写完了，怎么让它 7×24 小时稳定运行？

---

> 💡 **今日金句**

> "Multi-Agent 系统本质上是一个微服务架构——只不过每个微服务的内部逻辑是一个 LLM 推理循环。你在大厂学到的分布式系统经验，90% 在 Multi-Agent 里都能复用。剩下的 10% 是 LLM 的不确定性——这 10% 够你喝一壶的。"
