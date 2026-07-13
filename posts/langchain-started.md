---
title: "LangChain 入门：构建第一个 Chain"
date: "2026-07-11 10:00:00"
description: "掌握 LangChain 核心三件套：Chain、Tool、Memory"
cover: ""
tags: ["LangChain", "框架", "教程"]

videos:
  - title: "LangChain 入门教程：构建你的第一个 AI 应用"
    url: "https://www.bilibili.com/video/BV1g7nczpEaJ/"
    platform: "bilibili"

links:
  - title: "LangChain 官方文档"
    url: "https://python.langchain.com/docs/"
    description: "框架核心概念、API 参考、官方教程"
  - title: "LangChain Expression Language (LCEL)"
    url: "https://python.langchain.com/docs/concepts/lcel/"
    description: "声明式构建 Chain 的核心语法，面向工资编程必备"
  - title: "LangSmith 平台"
    url: "https://www.langchain.com/langsmith"
    description: "LangChain 官方调试与监控平台"
---

## 先讲个道理

如果你觉得直接调 API 太原始，就像用螺丝刀手写操作系统——那 LangChain 就是给你的一整套电动工具箱。它把"调模型"这件事从手工作坊升级到了流水线生产。

Chain 的本质，你可以粗暴地理解成 **Linux 的管道符 `|`**：上一个组件的输出，自动变成下一个组件的输入。数据从左往右流，就像 `cat data.txt | grep error | wc -l` 一样自然。区别只是——这里的"数据"可能是 prompt、LLM 的回复、工具调用结果，甚至是一整段对话历史。

面向工资编程的朋友们，记好 **LCEL** 这个缩写。面试聊到 LangChain，这三个字母能从"用过"直接拔到"理解原理"。


## LangChain 是什么？

LangChain 是目前最流行的 AI Agent 开发框架之一，提供了构建 LLM 应用的标准化组件。

核心理念：**把 LLM 与外部世界连接起来**。

说白了，LLM 就像一个博学但困在房间里的哲学家——什么都知道，但出不了门。LangChain 就是给它装上手脚，让它能查天气、调 API、读数据库、记住你上一句说了什么。

## 安装与设置

```bash
# 安装 LangChain 核心库和 OpenAI 集成
pip install langchain langchain-openai
```

设置 API Key：

```python
# 配置 OpenAI API 密钥，建议用环境变量而非硬编码
import os
os.environ["OPENAI_API_KEY"] = "your-api-key"
```

## 核心概念一：Chain（链）

Chain 是 LangChain 最基础的概念——将多个步骤串联起来。

你可以想象一条流水线：prompt 模板负责"把问题格式化"，LLM 负责"动脑子"，Output Parser 负责"把结果整理干净"。它们之间靠 `|` 串在一起，数据自动流转，不用你手动传参——懒人的福音，架构师的优雅。

### 最简单的 Chain

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# 初始化大模型，这里用的是 GPT-4o
llm = ChatOpenAI(model="gpt-4o")

# 定义 prompt 模板：system 设定角色，user 用变量占位
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个专业的AI教程写手。"),
    ("user", "用{language}写一段关于{topic}的介绍，100字以内。")
])

# LCEL 语法：用 | 将 prompt → llm → parser 串成一条链
chain = prompt | llm | StrOutputParser()

# 调用链：传入变量值，自动依次执行各环节
result = chain.invoke({
    "language": "中文",
    "topic": "RAG检索增强生成"
})
print(result)
```

这里使用了 LangChain 的 **LCEL（LangChain Expression Language）**，用 `|` 管道符连接各组件。


## 核心概念二：Tool（工具）

Tool 让 Agent 能够调用外部功能。

Tools 就像是给 LLM 配了一把瑞士军刀——能让它做它本来做不了的事。没有 Tool 的 Agent 只是个话痨，有了 Tool 它才是个能办事的助手。你写的每一个 `@tool` 装饰器，都是在给 Agent 增加一种超能力。

```python
from langchain_core.tools import tool

# 定义一个工具：根据城市名返回天气信息
@tool
def get_weather(city: str) -> str:
    """获取指定城市的天气信息"""
    # 实际项目中应调用天气API
    weather_data = {
        "北京": "晴天，25°C",
        "上海": "多云，28°C",
        "深圳": "阵雨，30°C",
    }
    return weather_data.get(city, "暂无数据")

# 定义一个工具：计算数学表达式
@tool
def calculator(expression: str) -> str:
    """计算数学表达式"""
    try:
        return str(eval(expression))
    except:
        return "计算错误"
```


## 核心概念三：Memory（记忆）

Memory 让对话有上下文——不然每次对话 Agent 都像金鱼一样七秒记忆。

你想一下这个场景：你跟同事说了五分钟的需求，他突然问"你刚才说啥来着？"——这就是没有 Memory 的 LLM。加上 Memory 之后，Agent 就能记住"你叫小明"，而不是每次对话都从头认识你。

```python
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationChain

# 创建对话记忆缓冲区
memory = ConversationBufferMemory()

# 创建带记忆的对话链，verbose=True 可以在控制台看到内部执行过程
conversation = ConversationChain(
    llm=llm,
    memory=memory,
    verbose=True
)

# 第一轮对话：告诉 Agent 你的名字
conversation.predict(input="我叫小明")
# 第二轮对话：Agent 有记忆了，能正确回答你的名字
conversation.predict(input="我叫什么名字？")  # Agent记得你叫小明
```


## 构建第一个 Agent

将 Chain、Tool、Memory 组合起来：

把这三个概念拼在一起，你就得到了一个真正能"干活"的 Agent——它能理解你的话（Chain），调用外部能力（Tool），还能记住上下文（Memory）。这就是 LangChain 的完整拼图。当你把下面这段代码跑通的时候，你已经不是"调 API 的"了，你是"搭 Agent 的"。

```python
from langchain.agents import create_tool_calling_agent, AgentExecutor

# 把之前定义的工具装进工具箱
tools = [get_weather, calculator]

# 创建能调用工具的 Agent，llm + tools + prompt 三合一
agent = create_tool_calling_agent(llm, tools, prompt)

# AgentExecutor 负责调度：决定什么时候用哪个工具，什么时候直接回答
agent_executor = AgentExecutor(agent=agent, tools=tools)

# 一句话同时触发两个工具：Agent 会自动拆解任务并组合结果
response = agent_executor.invoke({
    "input": "北京今天天气怎么样？另外帮我算一下 15 * 37"
})
```


> 🧪 动手试试

> 跑通上面的代码之后，试着做这三件事：
>
> 1. **换模型**：把 `ChatOpenAI` 的 `model` 参数从 `gpt-4o` 改成 `gpt-4o-mini`，对比一下输出质量和速度的差异。
> 2. **加工具**：自己写一个新的 `@tool`，比如 `get_time()` 返回当前时间，或者 `translate_to_english(text: str)` 做中译英，然后塞进 `tools` 列表里跑一遍。
> 3. **改 prompt**：把 system prompt 从"专业的AI教程写手"改成"一个暴躁的资深程序员，回复要在技术正确的前提下带点吐槽"，看看 Agent 的性格变化。


## 总结

LangChain 的三大核心：
- **Chain**：串联处理步骤，像流水线一样让数据自动流转
- **Tool**：扩展 Agent 能力边界，给它装上"手脚"
- **Memory**：让对话有"记忆"，告别金鱼式对话

下一篇我们将深入 RAG（检索增强生成），看看如何让 Agent "学会查资料"。


> 💡 今日金句

> "LLM 是大脑，LangChain 是脊椎。没有脊椎的大脑只能躺在培养皿里思考人生；有了脊椎，它才能站起来干活。"
