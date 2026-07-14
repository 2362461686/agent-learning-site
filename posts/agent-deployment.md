---
title: "Agent 部署与生产化：从本地脚本到 7×24 服务"
date: "2026-07-14 14:00:00"
description: "掌握 LangServe/FastAPI/Docker 部署全流程，让你的 Agent 稳定运行在生产环境"
cover: "/picture/fengmian/333.jpg"
tags: ["部署", "生产化", "DevOps", "教程"]

videos:
  - title: "LangServe: Deploy LangChain Apps in Minutes"
    url: "https://www.youtube.com/watch?v=1VYvVCKPWCA"
    platform: "youtube"
  - title: "Docker 容器化部署 Agent 应用实战"
    url: "https://www.bilibili.com/video/BV1vK421h7ZU/"
    platform: "bilibili"

links:
  - title: "LangServe 官方文档"
    url: "https://python.langchain.com/docs/langserve/"
    description: "LangChain 官方部署方案，一键生成 API"
  - title: "FastAPI 官方文档"
    url: "https://fastapi.tiangolo.com/"
    description: "高性能 Python Web 框架，Agent 部署的首选基建"
  - title: "Vercel AI SDK"
    url: "https://sdk.vercel.ai/"
    description: "Next.js 生态的 AI 应用部署方案，支持流式输出"
---

## "代码写完了"只是万里长征第一步

恭喜你，Agent 在本地 `python main.py` 能跑通了。但当你兴冲冲地把代码丢给同事让他试一下时：

- "你装 Python 3.11 了吗？"
- "API Key 配了吗？"
- "ChromaDB 的版本是 0.4.x 还是 0.5.x？"
- "你这怎么跑一半挂了？"

> 本地能跑 ≠ 生产可用。这两个状态之间隔着一条鸿沟，名字叫**部署**。好消息是：你的本地 Agent 代码跑通的那一刻，70% 的工作已经做完了。剩下的 30% 是把"能跑"变成"一直能跑"，而这 30% 靠的是工程规范，不是算法能力。

---

## 方案一：LangServe —— 三行代码转 API

如果你用的是 LangChain 全家桶，LangServe 是部署最快的方案：

```python
# agent_server.py —— 只需加几行，Agent 就变成了 HTTP API
from fastapi import FastAPI
from langserve import add_routes
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent

# 你的 Agent（和本地开发一模一样）
llm = ChatOpenAI(model="gpt-4o-mini")
agent = create_react_agent(llm, tools)

# FastAPI 起服务
app = FastAPI(title="My Agent API")

# 一行代码把 Agent 暴露为 REST API
add_routes(
    app,
    agent,
    path="/agent",
    # 可选：加流式输出
    enable_feedback_endpoint=True,
)

# 启动：uvicorn agent_server:app --reload
```

启动后自动生成：
- `POST /agent/invoke` — 同步调用
- `POST /agent/stream` — 流式输出
- `GET /agent/playground` — 可视化调试页面
- `GET /docs` — 自动生成的 Swagger API 文档

> LangServe 就像给 Agent 套了个外卖包装——味道不变，但别人不用跑你厨房里来吃了。最方便的是 `/agent/playground`，产品经理可以在网页上直接调试你的 Agent，不用麻烦你开终端。

---

## 方案二：FastAPI 裸写 —— 完全掌控

当你的 Agent 不是纯 LangChain，或者需要定制路由逻辑时，直接上 FastAPI：

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import asyncio

app = FastAPI()

class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"

class ChatResponse(BaseModel):
    reply: str
    tool_calls: list = []

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # 带超时的 Agent 调用
        result = await asyncio.wait_for(
            run_agent(request.message, request.session_id),
            timeout=30.0  # 30 秒超时
        )
        return ChatResponse(reply=result["text"], tool_calls=result["tools"])
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Agent 思考超时，请重试")
    except Exception as e:
        # 重要：别把 LLM 的异常堆栈直接返回给客户端
        raise HTTPException(status_code=500, detail="内部错误，已记录日志")

@app.get("/health")
async def health_check():
    return {"status": "ok", "model": "gpt-4o-mini"}
```

几个生产环境必须做的：
1. **超时控制**：LLM 调用可能很慢，必须设超时
2. **异常不泄漏**：不要把内部堆栈暴露给客户端
3. **健康检查**：`/health` 端点让监控系统知道你还活着

---

## 方案三：Docker 容器化

不管你用的是 LangServe 还是 FastAPI，最后都得容器化：

```dockerfile
# Dockerfile
FROM python:3.12-slim

WORKDIR /app

# 先拷贝依赖文件，利用 Docker 缓存层
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 再拷贝代码
COPY . .

# 环境变量从外部注入
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["uvicorn", "agent_server:app", "--host", "0.0.0.0", "--port", "8000"]
```

```yaml
# docker-compose.yml —— 如果 Agent 依赖向量数据库
version: "3.8"
services:
  agent-api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - CHROMA_HOST=chromadb
    depends_on:
      - chromadb

  chromadb:
    image: chromadb/chroma:latest
    volumes:
      - ./chroma_data:/chroma/chroma
    ports:
      - "8001:8000"
```

---

## 部署平台怎么选？

| 平台 | 适合场景 | 优势 | 注意事项 |
|---|---|---|---|
| Vercel | Next.js + Serverless | 零配置，免费额度够用 | 函数超时限制（通常 10-60 秒），长 LLM 调用可能超 |
| Railway / Render | 简单 Web 服务 | Docker 一键部署，Git 联动 | 免费版会休眠 |
| 云服务器 (ECS/Lighthouse) | 需要持久运行 | 完全掌控，定时任务友好 | 需要自己搞运维 |
| HuggingFace Spaces | 演示 Demo | 免费 GPU，社区分享 | 不适合高并发生产 |

> 本网站 `agent-learning-site` 就跑在 Vercel 上。免费版 Serverless 函数超时 10 秒（Pro 版 60 秒），对于 DeepSeek 的短回复够用了。如果你用的是 GPT-4 + 长链推理，建议上 Railway 或者自建服务器，否则用户等一半就超时报错了——这比直接告诉他"我不知道"更让人崩溃。

---

## 监控与日志：别等用户投诉才知道挂了

上线不是结束，上线是运维的开始。你至少要监控三样东西：

```python
import logging
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("agent-api")

@app.middleware("http")
async def log_requests(request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start
    logger.info(f"{request.method} {request.url.path} → {response.status_code} ({duration:.2f}s)")
    return response
```

**三点底线监控：**
1. **响应时间**：p50/p95/p99 延迟，Agent 跑 30 秒还是 2 秒，用户体感天差地别
2. **错误率**：API Key 过期、模型限流、超时——这些错误应该触发告警，不是你翻日志才看到
3. **Token 消耗**：每天花多少钱，哪些接口烧钱最多

> 监控不是 KPI 汇报，是你的安全带。上线第一天没监控，等于闭着眼睛开车。你可以先用 `print` 撑两天，但第三天一定要上个正经日志系统——否则排查问题的过程会让你怀疑自己为什么要干这行。

---

> 🧪 **动手试试**

1. 用 LangServe 把你在前几篇搭的 Agent 包装成 API，打开 `/agent/playground` 页面，用可视化界面测试。
2. 写一份 Dockerfile + docker-compose.yml，把你的 Agent + 向量数据库一起用 `docker compose up` 跑起来。
3. 加一个请求日志中间件，统计每次 Agent 调用的耗时和 token 消耗，看看哪个查询最烧钱。

---

## 总结

部署 Agent 的核心步骤就四步：
1. **用 FastAPI/LangServe 包装成 HTTP 服务**
2. **Docker 容器化**——消除"在我电脑上能跑"
3. **选一个部署平台**——Vercel(Serverless) / Railway(Docker) / 自建服务器
4. **加监控日志**——知道它什么时候挂了，挂了为什么

下一篇是本系列的压轴篇：**AI Agent 安全与可控性**——你部署出去的 Agent，别让它被人一句话就骗去删库了。

---

> 💡 **今日金句**

> "Deploying an AI agent to production is like raising a toddler and sending them to kindergarten. They know enough to function, but you're terrified of what they might do when you're not watching."

> （把 AI Agent 部署到生产环境，就像把三岁小孩送进幼儿园——他知道怎么吃饭睡觉，但你永远担心他在你看不见的时候会干出什么匪夷所思的事情。）
