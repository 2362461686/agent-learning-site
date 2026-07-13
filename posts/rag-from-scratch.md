---
title: "RAG 实战：检索增强生成从原理到实现"
date: "2026-07-11 15:00:00"
description: "手把手教你搭建 RAG 系统，让 AI 回答更准确"
cover: ""
tags: ["RAG", "向量数据库", "进阶", "教程"]

videos:
  - title: "RAG 从零到一：检索增强生成实战"
    url: "https://www.bilibili.com/video/BV1hccSeJEUD/"
    platform: "bilibili"

links:
  - title: "ChromaDB 文档"
    url: "https://docs.trychroma.com/"
    description: "轻量级向量数据库，适合快速上手 RAG"
  - title: "Milvus 官方文档"
    url: "https://milvus.io/docs/"
    description: "高性能向量数据库，生产环境首选"
  - title: "LlamaIndex 文档"
    url: "https://docs.llamaindex.ai/"
    description: "专注数据索引与检索的 LLM 框架"
---

想象一下这个场景：LLM 就像高考前的学霸——所有知识都停留在训练截止日，之后就两耳不闻窗外事了。你问它"今天天气怎么样"，它只能尴尬地回一句"我的训练数据截止到 2024 年 1 月"。

这叫什么？**闭卷考试**。LLM 赤手空拳上考场，全凭脑子里那点训练时背下来的东西，一旦超出范围就开始自由发挥——也就是我们常说的"幻觉"（一本正经地胡说八道，程序员的噩梦）。

而 RAG 是什么？**开卷考试**。给它一本参考书，让它先翻书找到相关段落，再结合书本内容作答。你说哪个准确率高？答案不言自明。

> 说白了，RAG = 给 LLM 塞小抄。只不过这个小抄光明正大，老师也认可。

---

## RAG 是什么？

**RAG（Retrieval-Augmented Generation，检索增强生成）** 是解决 LLM "幻觉问题"的关键技术。

核心思路：**先检索，再生成**。在 LLM 回答问题之前，先从外部知识库中检索相关信息，作为 LLM 的参考上下文。

想象一下：你问 LLM "公司上周的销售额是多少"，如果直接问，它只能编一个数字给你。但有了 RAG，它会先去你的数据库里翻上周的销售报表，把真实数据找到，再喂给 LLM 生成回答。幻觉率直接从"随机数生成器"降到"有据可查"。

## 为什么需要 RAG？

LLM 存在两个固有问题：
1. **知识截止**：训练数据有日期限制
2. **幻觉**：会编造不存在的"事实"

RAG 通过在回答前注入真实文档来解决这两个问题。

打个比方：Fine-tuning 是让 LLM 转学去读了一个新专业（成本高、周期长、考试还不一定过），RAG 是给 LLM 配了一台能联网的电脑（开箱即用、随时更新、效果立竿见影）。大部分场景下你先别急着微调，RAG 就能解决 80% 的问题——剩下的 20% 才是 Fine-tuning 的用武之地。

## RAG 的工作流程

```
用户提问 → 向量检索 → 获取相关文档 → 拼接Prompt → LLM生成答案
```

这个流程看起来简单，但每一步都有讲究。检索慢了用户体验差，检索不准答案就偏，拼接 Prompt 不够好 LLM 还是可能胡说。别急，我们一步步来。

## 实践：搭建一个简单的 RAG 系统

### 1. 准备文档

```python
# 模拟一个简单的知识库——实际项目中你可能会从 PDF、网页、数据库导入
documents = [
    "LangChain 是一个用于构建 LLM 应用的框架。",
    "RAG 是 Retrieval-Augmented Generation 的缩写。",
    "向量数据库用于存储和检索文档的向量表示。",
    "ChromaDB 是一个轻量级的开源向量数据库。",
]
```

### 2. 文档分割与向量化

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma

# 第一步：把文档切成小块（chunk），太小丢上下文，太大检索不精准，这是门平衡的艺术
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=200,
    chunk_overlap=50,
)

chunks = text_splitter.create_documents(documents)

# 第二步：把文本块变成向量（一串浮点数），语义相近的文本向量距离也近
embeddings = OpenAIEmbeddings()

# 第三步：存入向量数据库，persist_directory 指定持久化路径，下次重启不用重新构建
vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    persist_directory="./chroma_db"
)
```

### 3. 创建检索链

```python
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain

# 把向量库变成一个检索器，k=3 表示每次取最相关的 3 个文档片段
retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

# 搭一条完整的 RAG 链：先检索文档，再让 LLM 结合文档生成回答
combine_chain = create_stuff_documents_chain(llm, prompt)
rag_chain = create_retrieval_chain(retriever, combine_chain)

# 问一个问题试试——LLM 会自动检索相关文档并基于它们回答
response = rag_chain.invoke({
    "input": "什么是RAG？"
})
```

## RAG 的进阶优化

### 1. 检索质量
- **语义搜索**：使用更好的 Embedding 模型
- **混合搜索**：结合关键词搜索和语义搜索
- **重排序（Rerank）**：对检索结果二次排序

> 小提示：如果你的 Embedding 模型选的是 text-embedding-ada-002，而你们的老板用的是 BGE-M3……建议你悄悄升级。模型选得好，检索效率翻倍；模型选得差，向量库里全是"近义词不近、同义词不同"的尴尬。

### 2. 文档处理
- **更好的分割策略**：按段落、按语义分割
- **元数据过滤**：按日期、类别筛选文档
- **文档清洗**：去除噪声和格式混乱

### 3. 生成质量
- **引用来源**：在回答中标明信息来源
- **多轮对话**：结合历史上下文进行检索
- **Query 改写**：优化用户的检索查询

## 常见问题

**Q: 向量数据库选哪个？**

A: 送你一句真言——**ChromaDB 入门、Milvus 装逼、Pinecone 面向工资编程**。说正经的：小项目用 ChromaDB（一句 `pip install` 搞定），中型项目上 Milvus（开源高性能，社区活跃），Pinecone 适合不想管运维、公司报销云服务费的场景。Weaviate、Qdrant 也都是不错的选择，别只听我一家的。

**Q: RAG 和 Fine-tuning 的区别？**

A: RAG 是外挂知识库，灵活可更新；Fine-tuning 是修改模型参数，效果好但成本高。两者可以结合使用。

**Q: 向量数据库搜出来的结果总不对怎么办？**

A: 这是经典的"检索了一个寂寞"问题。排查顺序：先看你的 chunk 大小是不是合理（500-1000 token 是个不错的起点），再看 Embedding 模型是不是太老太弱，最后检查一下文档本身质量——垃圾进垃圾出，这个原则在 RAG 里同样适用。

> 🧪 **动手试试**

学完不练，等于白学。用你刚学到的知识，试着完成下面这个小挑战：

1. 把 `documents` 列表扩充到 10 条以上，加入一些关于你最近在学习的技术的文档
2. 调整 `chunk_size` 和 `chunk_overlap`，观察检索结果有什么变化
3. 问一个知识库里**不存在**的问题，观察 RAG 和纯 LLM 回答的差异
4. （加分项）不用 LangChain，尝试用 ChromaDB 的原生 API + OpenAI SDK 手动搭一条 RAG 流水线，理解底层在做什么

做完上面几条，你对 RAG 的理解就不是"会用框架"了，而是"知道框架为什么这么设计"。

## 总结

RAG 是当前 AI Agent 最核心的技术之一。通过检索 + 生成的模式，可以让 Agent 基于真实数据回答，大幅提升准确性。

下一篇我们将学习 **Prompt Engineering**，如何写好 Prompt 来驾驭 LLM。

> 💡 **今日金句**

> "AI 不是魔法，RAG 也不是银弹。但一个搭得好的 RAG 系统，能让你的 LLM 应用从'能跑'变成'靠谱'。记住：检索是下限，生成是上限——下限决定你的系统会不会翻车，上限决定你的系统能飞多高。"
