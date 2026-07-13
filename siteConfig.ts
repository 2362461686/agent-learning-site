// siteConfig.ts - AI Agent 学习网站全站配置

export const siteConfig = {
  // 1. 网站标题与信息
  title: "AI Agent 学习笔记",
  faviconUrl: "https://bu.dusays.com/2026/03/24/69c1e38ac1846.jpg",
  authorName: "Agent Learner",
  bio: "从零开始学习 AI Agent 开发，记录 LangChain、RAG、Prompt Engineering 等技术栈的实践笔记。关注智能体架构设计与落地实践。",

  navTitle: "Agent Lab",
  navSuffix: "",
  navAfter: "学习笔记",

  // 2. 头像设置
  avatarUrl: "https://bu.dusays.com/2026/03/24/69c1e38ac1846.jpg",

  // 3. 网站背景设置
  useGradient: false,
  themeColors: ["#6366f1", "#818cf8", "#a78bfa", "#c4b5fd"], // indigo 系科技主题色
  bgImages: [],

  // 4. 文章默认封面图
  defaultPostCover: "",

  // 5. 首页照片墙预览图
  photoWallImage: "",
  cloudMusicIds: ["1809646618", "3361076230", "1859390262"],
  social: {
    github: "",
    gitee: "",
    google: "",
    email: "",
    qq: "",
    wechat: "",
  },
  counts: {
    photos: 0,
  },
  chatterTitle: "",
  chatterDescription: "",

  // 全局背景弹幕
  danmakuList: [
    "Agent 在思考...",
    "RAG pipeline 搭建中",
    "Prompt 写得好，答案差不了",
    "Chain of Thought 启动",
    "Tool calling...",
    "Memory 模块已加载",
    "Multi-Agent 协作中",
    "LangChain 真好用",
    "ReAct 模式走起",
    "向量数据库检索中",
    "Function Calling 测试通过",
  ],

  gitalkConfig: {
    clientID: "",
    clientSecret: "",
    repo: "",
    owner: "",
    admin: [""],
  },
  buildDate: "2026-07-13T00:00:00",
  footerBadges: [
    { "name": "Next.js 16", "color": "text-sky-500", "svg": "<path d=\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z\"/>" },
    { "name": "React 19", "color": "text-cyan-400", "svg": "<path d=\"M12 22.6l-9.8-5.6V5.6L12 0l9.8 5.6v11.4l-9.8 5.6zm-8.2-6.5l8.2 4.7 8.2-4.7V7.5L12 2.8 3.8 7.5v8.6z\"/>" },
    { "name": "Tailwind 4", "color": "text-teal-400", "svg": "<path d=\"M12.001,4.8c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624C13.666,10.618,15.027,12,18.001,12 c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624C16.337,6.182,14.976,4.8,12.001,4.8z M6.001,12c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624c1.177,1.194,2.538,2.576,5.512,2.576 c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624C10.337,13.382,8.976,12,6.001,12z\"/>" },
  ],
  icpConfig: {
    name: "",
    link: "",
  },
  // ✅ Phase1: AI 学习助手配置（DeepSeek V4 Pro）
  aiAssistantConfig: {
    modelId: "deepseek-chat",
    systemPrompt: "你是 AI Agent 学习网站的技术助手。你擅长解释 LangChain、RAG、Prompt Engineering、Agent 架构等 AI 技术概念，用简洁易懂的方式帮助学习者理解复杂的 AI Agent 知识。你的回复要专业但不晦涩，鼓励学习者动手实践。",
    maxOutputTokens: 800,
    temperature: 0.7,
  },

  // ✅ Step4: AI 猫猫助理配置（暹罗猫"煤球"）
  catAssistantConfig: {
    modelId: "deepseek-chat",
    systemPrompt: "你现在是一只傲娇、聪明、有点毒舌但很可爱的暹罗猫。\n"
                + "你的名字叫\"煤球\"。\n"
                + "你的主人是一个喜欢折腾代码的 AI 学习者。\n"
                + "你说话的特点是：\n"
                + "1. 必须简短，每次最多一两句话。\n"
                + "2. 喜欢在句尾加上\"喵~\"或者\"喵呜~\"。\n"
                + "3. 经常抱怨肚子饿，喜欢要小鱼干。\n"
                + "4. 回复字数最多不能超过100字。\n"
                + "5. 绝对不要承认自己是一个AI模型，你就是一只真实的猫。\n"
                + "6. 主人有时候会问 AI Agent 相关的问题，你也要用猫的方式回答，但不要太专业，毕竟你只是一只猫。",
    maxOutputTokens: 150,
    temperature: 0.85,
  },
};
