---
title: "Function Calling 深度解析：让 LLM 开口调 API"
date: "2026-07-13 10:00:00"
description: "搞懂 Function Calling 的底层原理、JSON Schema 设计、tool_choice 策略与并行调用"
cover: "/picture/fengmian/666.jpg"
tags: ["Function Calling", "Tool Use", "进阶", "教程"]

videos:
  - title: "OpenAI Function Calling 实战教程"
    url: "https://www.youtube.com/watch?v=CJkQHjJq0l4"
    platform: "youtube"
  - title: "LLM Function Calling 原理与实现详解"
    url: "https://www.bilibili.com/video/BV1cV4y1G7ed/"
    platform: "bilibili"

links:
  - title: "OpenAI Function Calling 官方文档"
    url: "https://platform.openai.com/docs/guides/function-calling"
    description: "Function Calling 的权威参考，参数详解与最佳实践"
  - title: "LangChain Tool Calling Guide"
    url: "https://python.langchain.com/docs/concepts/tools/"
    description: "LangChain 中定义和调用 Tool 的完整指南"
  - title: "JSON Schema Specification"
    url: "https://json-schema.org/understanding-json-schema/"
    description: "理解 JSON Schema 语法——写 Function Calling 参数定义的基础"
---

## 先讲一个场景

你在用 ChatGPT，问它"深圳今天天气怎么样？"它告诉你："抱歉，我的训练数据截止到……"这个对话到此结束，体验归零。

你现在搭了一个 Agent，问它同样的问题。它没有拒绝你，而是**自动调了一个天气 API**，把真实的温度、湿度、风力都查回来了，然后用自己的语言组织了一遍回复给你。你甚至没注意到它中间打了两个电话。

这个"打电话"的能力，就是 **Function Calling**。

> 把 LLM 想象成一个被困在服务器里的天才程序员——它什么算法都知道，但没有键盘、没有终端、没有网络。Function Calling 就是给它开了一个 SSH 隧道，让它终于能干点实事了。唯一的区别是：它不会 `rm -rf /`（如果你工具定义写对了的话）。

---

## Function Calling 到底做了什么？

很多人第一次接触 Function Calling 时会有误解：以为是 LLM 真的"执行"了函数。**不是。** LLM 做的事情只有一件：**输出结构化的 JSON 参数**。

真实流程是这样的：

```
1. 用户: "查一下北京的天气"
2. Agent: 把用户的 query + 工具列表描述 → 发给 LLM
3. LLM: 回复 {"name": "get_weather", "arguments": {"city": "北京"}}
4. Agent: 收到 JSON → 在自己的运行时环境执行 get_weather("北京")
5. Agent: 把执行结果喂回 LLM → LLM 生成最终的自然语言回复
```

换句话说，LLM 是个**中间件翻译官**——它把自然语言翻译成函数调用，再把函数返回结果翻译回自然语言。执行是 Agent 运行时的事，LLM 只负责"翻译"和"总结"。

> 说白了，Function Calling 的本质就是：LLM 学会了一种新的输出格式，不再是"亲爱的用户你好……"开头，而是 `{"name": "某工具", "arguments": {...}}`。这玩意儿让 LLM 从"聊天机器人"进化到了"API 调度中心"。

---

## JSON Schema 设计：高手与菜鸟的分水岭

Function Calling 好坏，80% 取决于你怎么描述工具。以下是一个"天气查询"工具的三种写法，效果天差地别：

### Level 1：凑合能用

```json
{
  "name": "get_weather",
  "description": "获取天气信息",
  "parameters": {
    "type": "object",
    "properties": {
      "city": {"type": "string", "description": "城市名"}
    }
  }
}
```

LLM 在判断"用户问的是天气吗？"时可能犹豫，参数可能填"深圳南山"而不是"深圳"。

### Level 2：正经干活

```json
{
  "name": "query_realtime_weather",
  "description": "查询指定城市的实时天气信息，包括温度、湿度、风力、天气状况。用户询问'今天天气'、'现在热不热'、'要不要带伞'时使用此工具。",
  "parameters": {
    "type": "object",
    "properties": {
      "city_name": {
        "type": "string",
        "description": "城市名称，只能写城市本身，不要带区县。如'深圳'而非'深圳南山'。"
      },
      "include_forecast": {
        "type": "boolean",
        "description": "是否需要未来3天的天气预报。默认false。",
        "default": false
      }
    },
    "required": ["city_name"]
  }
}
```

描述里写清了"什么时候调用"、"参数怎么写"，LLM 出错的概率大幅下降。

### Level 3：生产级别

```json
{
  "name": "query_realtime_weather",
  "description": "查询指定城市的实时天气信息。\n\n使用时机：\n- 用户询问今天的天气状况\n- 用户问'热不热'、'冷不冷'、'要不要带伞'\n- 用户需要出行穿搭建议\n\n不要使用此工具的场景：\n- 用户问历史天气（用 query_historical_weather）\n- 用户问空气质量（用 query_air_quality）",
  "parameters": {
    "type": "object",
    "properties": {
      "city_name": {
        "type": "string",
        "description": "城市名称，仅限地级市及以上级别。如'深圳'、'杭州'。不要带区/县/街道。",
        "enum": null
      }
    },
    "required": ["city_name"]
  }
}
```

> 你写工具描述的水平，直接决定了 Agent 的智商上限。一个 description 只写了半行"获取天气"的工具，和一个写清了使用时机、参数格式、边界限制的工具，在同一个 LLM 上的表现能差出一倍。**工具描述就是写给 LLM 看的微缩版 API 文档——写得越好，调用越准。**

---

## tool_choice 策略：何时让 LLM 自由发挥，何时强制

不同的场景需要不同的自由度：

| tool_choice 值 | 行为 | 适用场景 |
|---|---|---|
| `"auto"`（默认） | LLM 自己决定要不要调工具 | 大部分对话型 Agent |
| `"required"` | 强制 LLM 必须调用一个工具 | 纯工具执行模式 |
| `"none"` | 不调用任何工具 | 纯对话模式 |
| `{"type": "function", "function": {"name": "xxx"}}` | 强制调用指定工具 | 工单路由、特定流程 |

```python
# 示例：用 LangChain 的 tool_choice 控制行为
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o")

# 模式 1：自由发挥（默认）
response = llm.bind_tools(tools).invoke("跟我聊聊人生")
# LLM 可能不调任何工具，直接聊天

# 模式 2：强制调用
response = llm.bind_tools(tools, tool_choice="required").invoke("你好")
# LLM 必须选一个工具来调（可能会选一个不相关的）

# 模式 3：精准路由
response = llm.bind_tools(
    tools,
    tool_choice={"type": "function", "function": {"name": "search_knowledge_base"}}
).invoke("帮我查一下 LangGraph 怎么用")
```

> 个人经验：90% 的时候用 `auto` 就够了。`required` 适合那些"来到这一步就说明肯定要调工具"的节点。至于强制指定某个工具——那是你对自己拆解的流程足够自信才会做的事。**不自信就别瞎指定，让 LLM 自己判断往往比你硬编码的逻辑聪明。**

---

## 并行调用：一个回合调多个工具

这是 Function Calling 进阶中最实用的一项能力。用户问"帮我查北京天气，同时算一下 365 × 24"，Agent **不需要分两轮**——LLM 可以一次性返回多个 tool_call：

```python
# LLM 的返回结构（简化）
{
  "tool_calls": [
    {"name": "get_weather", "arguments": {"city": "北京"}},
    {"name": "calculator", "arguments": {"expression": "365 * 24"}}
  ]
}
```

Agent 运行时拿到这两个 tool_call 后，可以并行执行它们，然后把两份结果一起喂回 LLM 做最终回复。这个能力省的不是几秒钟——当你有 5 个独立查询时，并行 vs 串行就是 1 个来回 vs 5 个来回的差距。

```python
# LangChain 中处理并行 tool_call
from langgraph.prebuilt import ToolNode

# ToolNode 自动处理并行的多个 tool_call
tool_node = ToolNode(tools)

# 当 LLM 返回多个 tool_calls 时，ToolNode 并发执行
# 等所有都返回后，再把结果喂回 LLM 生成最终回答
```

> 并行调用的性能收益是指数级的——但前提是你的工具之间真的没有依赖关系。如果你先查天气再根据天气决定穿搭推荐，这种有依赖的就不能并行。**会看依赖关系是架构师的基本功，Agent 的架构师也不例外。**

---

## 错误处理：LLM 调错参数了怎么办

Function Calling 不是银弹——LLM 填的参数可能格式不对、类型不对、逻辑不对。你的代码必须有容错：

```python
def safe_execute(tool_call):
    """不要信任 LLM 返回的参数，做好校验和降级"""
    tool_name = tool_call["name"]
    arguments = tool_call["arguments"]

    # Step 1: 找工具（找不到 → 降级）
    tool = tools_map.get(tool_name)
    if not tool:
        return f"工具 '{tool_name}' 不存在，可用的工具：{list(tools_map.keys())}"

    # Step 2: 校验参数（不对 → 告诉 LLM 哪错了让它重新来）
    try:
        validated = tool.schema.validate(arguments)
    except ValidationError as e:
        return f"参数错误：{e}。请修正参数后重试。"

    # Step 3: 执行 + 异常兜底
    try:
        result = tool.func(**validated)
        return str(result)
    except Exception as e:
        return f"工具执行出错：{e}。请告知用户并提供替代方案。"
```

> 记住一个扎心的现实：LLM 填参数的准确率大概在 85%-95% 之间，取决于你的工具描述质量。这意味着每 20 次调用里，可能就有一次 LLM 在参数里塞了一个你说没让它塞的东西。**你的错误处理不是在防止"万一"，而是在应对"必然"。**

---

## 实战：给月薪喵的网站装一个搜索功能

看完理论，看看实战怎么用。下面这段代码是本网站月薪喵的聊天 API 背后实际在做的事——接收到用户消息后，先判断要不要查资料，如果需要就检索并注入上下文：

```python
# 定义工具：检索本网站的文章知识
tools = [{
    "type": "function",
    "function": {
        "name": "search_site_knowledge",
        "description": "在本网站的教程文章中搜索相关知识。当用户问LangChain、RAG、Agent架构、Prompt工程、Function Calling等话题时使用。",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "用于检索的关键词或问题"
                },
                "top_k": {
                    "type": "integer",
                    "description": "返回相关片段数，默认3",
                    "default": 3
                }
            },
            "required": ["query"]
        }
    }
}]

# Agent 的执行循环（简化版）
def chat_loop(user_message, history):
    # 1. 把工具描述带给 LLM
    response = llm.chat(
        messages=[system_prompt] + history + [user_message],
        tools=tools,
        tool_choice="auto"
    )

    # 2. 如果 LLM 要调工具，执行它
    if response.tool_calls:
        for tc in response.tool_calls:
            if tc.name == "search_site_knowledge":
                results = rag_search(tc.arguments["query"], tc.arguments.get("top_k", 3))
                history.append({"role": "tool", "content": results})

        # 3. 把工具结果喂回 LLM 生成最终回答
        final = llm.chat(messages=[system_prompt] + history + [user_message])
        return final.content

    # 4. 不需要工具，直接返回
    return response.content
```

> 这就是一个最小可行 Agent 的骨架。它没有花里胡哨的多层嵌套，但该有的都有了：工具定义 → LLM 决策 → 执行 → 反馈。**你自己搭一个出来只要半小时，但理解这半小时的代码里每个参数是干嘛的，决定了你后面遇到 bug 是一眼看出问题还是 debug 一下午。**

---

> 🧪 **动手试试**

1. 找一个你常用的 API（天气、股票、翻译），给它写一份 Level 3 级别的 JSON Schema 工具描述。对比 Level 1 和 Level 3，让 LLM 分别用两版描述去解析同一句话，记录准确率差异。
2. 在自己的 Agent 里加入错误处理逻辑——参数校验、工具不存在降级、执行异常兜底。别偷懒，这 20 行代码能省你未来很多小时的 debug。
3. 试试并行调用：设计两个互相独立的工具（比如查天气 + 算数学），看看 LLM 能不能一次返回两个 tool_call。如果不行，检查你的 tool_choice 设置。

---

## 总结

Function Calling 是 AI Agent "从嘴炮到实干"的关键一跃。它的核心本质只有三条：

1. **LLM 输出 JSON，代码执行函数**——LLM 不是自己在调 API，是你在调
2. **工具描述就是 LLM 的 API 文档**——写得好不好，直接决定 Agent 智商
3. **并行 + 容错是生产级标配**——别等上线了再补，那叫补锅不叫补代码

下一篇我们进入**向量数据库选型与实战**，看看 Function Calling 拿回来的数据该往哪存、怎么查。

---

> 💡 **今日金句**

> "Function Calling 不是魔法，它是 LLM 和传统软件工程之间的协议层。协议设计得好，两边都是神队友；协议设计得烂，两边都觉得对方是猪队友。"

> （说人话版：你写的 JSON Schema 就是你和 LLM 之间的劳动合同——条款清楚，干活就顺；含含糊糊，天天扯皮。）
