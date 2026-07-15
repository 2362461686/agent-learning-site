<p align="center">
  <img src="https://raw.githubusercontent.com/2362461686/agent-learning-site/master/public/picture/touxiang/toux1.jpg" width="120" height="120" style="border-radius: 24px" alt="Agent Lab Logo" />
</p>

<h1 align="center">Agent Lab · AI Agent 学习笔记</h1>

<p align="center">
  从零开始学习 AI Agent 开发，记录 LangChain、RAG、Prompt Engineering 等技术栈的实践笔记<br/>
  关注智能体架构设计与落地实践
</p>

<p align="center">
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js 16" /></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React 19" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://vercel.com/"><img src="https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" /></a>
  <a href="https://www.framer.com/motion/"><img src="https://img.shields.io/badge/Framer_Motion-12-0055FF?style=for-the-badge&logo=framer&logoColor=white" alt="Framer Motion" /></a>
</p>

<p align="center">
  🌐 <a href="https://agent-learning-site.vercel.app"><strong>在线演示</strong></a> ·
  📝 <a href="https://agent-learning-site.vercel.app/timeline"><strong>教程列表</strong></a> ·
  🎵 <a href="https://agent-learning-site.vercel.app/music"><strong>音乐播放器</strong></a>
</p>

---

## ✨ 特色亮点

<table>
  <tr>
    <td width="50%">
      <h3>🐱 AI 猫助手 · 月薪喵</h3>
      <p>一只傲娇、毒舌但超可爱的桌面猫，用 <strong>DeepSeek Chat</strong> + <strong>TF-IDF RAG 检索</strong>回答你的 AI Agent 问题。可拖拽、可抚摸、可聊天。</p>
      <p><em>"要小鱼干吗？喵~"</em></p>
    </td>
    <td width="50%">
      <h3>📝 10 篇实战教程</h3>
      <p>从入门到部署，覆盖 <strong>LangChain、RAG、Prompt Engineering、Function Calling、Multi-Agent、向量数据库、安全</strong> 等核心主题。</p>
      <p>每篇都是实战笔记，记录踩坑与心得。</p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>🎵 网易云音乐播放器</h3>
      <p>内嵌全功能音乐播放器，支持 <strong>LRC 歌词同步</strong>、歌单管理、三种播放模式。边学代码边听歌。</p>
    </td>
    <td width="50%">
      <h3>✨ 赛博诗歌美学</h3>
      <p>Indigo 靛蓝科技主题 · 毛玻璃设计 · 暗黑/明亮双模式 · 樱花飘落 & 萤火虫动画 · Framer Motion 流畅过渡</p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>📖 完整学习路线</h3>
      <p>从 AI Agent 概述 → RAG → LangChain → Prompt Engineering → Function Calling → Multi-Agent → 部署 → 安全，一条龙进阶路径。</p>
    </td>
    <td width="50%">
      <h3>🔍 站内全文搜索</h3>
      <p>基于 <strong>TF-IDF 向量检索</strong>的 RAG 系统，AI 猫助手能精准回答关于本站教程的任何问题。</p>
    </td>
  </tr>
</table>

---

## 🚀 快速开始

### 环境要求

- **Node.js** ≥ 20
- **npm** / yarn / pnpm / bun

### 本地运行

```bash
# 1. 克隆仓库
git clone https://github.com/2362461686/agent-learning-site.git
cd agent-learning-site

# 2. 安装依赖
npm install

# 3. 配置环境变量（可选，仅 AI 猫助手需要）
cp .env.local.example .env.local
# 编辑 .env.local，填入你的 DeepSeek API Key

# 4. 启动开发服务器
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 即可访问。

---

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| **框架** | Next.js 16 (App Router) · React 19 · TypeScript 5 |
| **样式** | Tailwind CSS 4 · Framer Motion 12 · Lucide Icons |
| **内容** | MDX/Markdown · unified/remark/rehype · KaTeX 数学公式 · highlight.js 代码高亮 |
| **AI** | DeepSeek Chat API · TF-IDF 向量检索 · RAG 增强对话 |
| **评论** | Gitalk (GitHub Issues) |
| **部署** | Vercel |

---

## 📁 项目结构

```
agent-learning-site/
├── app/                        # Next.js App Router
│   ├── api/
│   │   ├── chat/cat/           # AI 猫助手 API（DeepSeek + RAG）
│   │   └── music/              # 网易云音乐代理（Meting API）
│   ├── posts/[slug]/           # 文章详情页
│   ├── timeline/               # 教程时间线
│   ├── music/                  # 音乐播放器
│   ├── about/                  # 关于页面
│   └── layout.tsx              # 根布局
├── components/                 # React 组件
│   ├── CyberCat.tsx            # 🐱 月薪喵 AI 助手
│   ├── MusicProvider.tsx       # 音乐状态管理
│   ├── Navbar.tsx              # 响应式导航
│   ├── BackgroundEffects.tsx   # 樱花/萤火虫背景
│   └── FloatingPlayer.tsx      # 浮动播放器
├── posts/                      # 10 篇 Markdown 教程
├── scripts/
│   └── build-rag-index.mjs     # RAG 索引构建（TF-IDF）
├── public/
│   ├── picture/                # 图片资源
│   └── rag-index.json          # 构建产物：RAG 知识库
├── siteConfig.ts               # 全站配置中心
└── package.json
```

---

## 📚 教程目录

| # | 标题 | 日期 | 标签 |
|---|------|------|------|
| 1 | **AI Agent 概述：什么是智能体？** | 2026-07-10 | `入门` `AI Agent` |
| 2 | **RAG 实战：检索增强生成从原理到实现** | 2026-07-11 | `RAG` `向量数据库` `进阶` |
| 3 | **LangChain 入门：构建第一个 Chain** | 2026-07-11 | `LangChain` `框架` |
| 4 | **Prompt Engineering：提示词工程最佳实践** | 2026-07-12 | `Prompt Engineering` `基础` |
| 5 | **Agent 架构设计：ReAct, Plan-Execute 与 Multi-Agent** | 2026-07-12 | `Agent 架构` `ReAct` `进阶` |
| 6 | **Function Calling 深度解析：让 LLM 开口调 API** | 2026-07-13 | `Function Calling` `Tool Use` `进阶` |
| 7 | **向量数据库选型与实战：从 Chroma 到 Milvus** | 2026-07-13 | `向量数据库` `Embedding` `进阶` |
| 8 | **Multi-Agent 多智能体协作实战** | 2026-07-14 | `Multi-Agent` `LangGraph` `实战` |
| 9 | **Agent 部署与生产化：从本地脚本到 7×24 服务** | 2026-07-14 | `部署` `DevOps` |
| 10 | **AI Agent 安全与可控性** | 2026-07-14 | `安全` `Guardrails` |

> 🎯 **推荐学习路线**：按 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 顺序阅读，由浅入深，层层递进。

---

## 🐱 月薪喵

一只住在你桌面右下角的傲娇 AI 猫：

- **聊天**：点击它，问任何 AI Agent 问题，会用 RAG 检索本站知识库来回答
- **喂养**：投喂小鱼干会触发随机 AI 对话
- **抚摸**：点击猫猫身体，它会开心地喵喵叫
- **拖拽**：可以拖到屏幕任何位置
- **自动收起**：30 秒不理会，自动缩到屏幕边缘只露尾巴

> 需要配置 `DEEPSEEK_API_KEY` 环境变量才能使用 AI 猫。

---

## 📄 许可证

MIT License © 2026 Agent Learner

---

<p align="center">
  <sub>Built with ❤️ and lots of ☕ · Deployed on ▲ Vercel</sub>
</p>
