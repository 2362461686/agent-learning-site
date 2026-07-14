"use client";

/**
 * ✅ Step4: AI 猫猫助理 — CyberCat
 * ✅ 悬浮球模式：自动收起/展开、拖拽、挂机语录
 *
 * 三层架构实现角色形象：
 *   视觉层：CSS 精灵图（yuexinmiao.webp），8列 x 9行，background-position 切换帧
 *   人格层：system prompt 配置在 siteConfig.catAssistantConfig
 *   交互层：拖拽、抚摸、喂小鱼干、聊天输入、随机挂机语录
 *
 * 悬浮球模式功能：
 *   - 可拖拽到任意位置（dragConstraints 通过 viewportRef 约束）
 *   - 空闲30秒自动收起到屏幕边缘（仅露出一小部分）
 *   - 收起后呼吸动画 + 挂机语录（每25秒80%概率）
 *   - 点击/拖拽露出部分 → 展开完整UI
 *   - 移动端和桌面端都适用
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';

/* ===== 常量 ===== */
const COLLAPSE_DELAY = 30000; // 30秒无操作自动收起
const COLLAPSED_QUOTE_IVL = 25000;
const NORMAL_QUOTE_IVL = 20000;
const CAT_WIDTH = 120; // 猫猫 sprite 尺寸

const COLLAPSED_BARKS = [
  "想你了喵~ 快来看看本喵！",
  "铲屎官？你还在吗喵？",
  "好无聊啊喵... 谁来摸摸我...",
  "本喵在这儿呢！看不见吗喵？",
  "月薪还没发吗？本喵等着小鱼干呢喵~",
  "喂！别假装看不见我喵！",
  "边缘的猫生好寂寞喵...",
  "快回来工作！本喵监督你！",
];

const NORMAL_BARKS = [
  "喵呜~ 今天发工资了吗喵~",
  "好困哦，想下班睡觉喵...",
  "铲屎官，快去赚月薪买小鱼干！",
  "我的小鱼干藏哪里去了喵？",
  "怎么没人理本喵...",
  "这个月绩效能拿多少喵？",
  "Agent 架构好难喵...",
  "LangChain 是什么好吃的喵？",
  "打工喵的一天又开始啦喵~",
  "月薪喵也想躺平喵呜...",
];

/* ===== 组件 ===== */
export default function CyberCat() {
  // --- 喵喵状态 ---
  const [isPetted, setIsPetted] = useState(false);
  const [speech, setSpeech] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  // --- 悬浮球状态 ---
  const [collapsed, setCollapsed] = useState(false);
  const [edge, setEdge] = useState<'right' | 'left'>('right');

  // --- Refs ---
  const chatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string>(`sess_${Math.random().toString(36).slice(2)}`);
  const collapseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const catRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const posX = useMotionValue(0);
  const posY = useMotionValue(0);
  const expandedPosRef = useRef({ x: 0, y: 0 });
  const [dragKey, setDragKey] = useState(0);

  // --- 首次挂载：初始化位置（SSR-safe） ---
  useEffect(() => {
    const x = window.innerWidth - CAT_WIDTH - 80;
    const y = window.innerHeight - CAT_WIDTH - 80;
    expandedPosRef.current = { x, y };
    posX.set(x);
    posY.set(y);
  }, []);

  // --- 同步 refs，防止闭包过期 ---
  const collapsedRef = useRef(collapsed);
  const speechRef = useRef(speech);
  const showInputRef = useRef(showInput);
  const isThinkingRef = useRef(isThinking);

  useEffect(() => { collapsedRef.current = collapsed; }, [collapsed]);
  useEffect(() => { speechRef.current = speech; }, [speech]);
  useEffect(() => { showInputRef.current = showInput; }, [showInput]);
  useEffect(() => { isThinkingRef.current = isThinking; }, [isThinking]);

  // --- 说话功能 ---
  const speak = (text: string, duration = 6000) => {
    setSpeech(text);
    if (chatTimeoutRef.current) clearTimeout(chatTimeoutRef.current);
    chatTimeoutRef.current = setTimeout(() => setSpeech(null), duration);
  };

  // --- 收起定时器 ---
  const resetCollapseTimer = useCallback(() => {
    if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
    if (collapsedRef.current) setCollapsed(false);
    collapseTimerRef.current = setTimeout(() => {
      // 说话/输入/思考中不打搅
      if (speechRef.current || showInputRef.current || isThinkingRef.current) {
        resetCollapseTimer();
        return;
      }
      // 判断靠近哪个屏幕边缘
      const catEl = catRef.current;
      if (catEl) {
        const rect = catEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        setEdge(centerX > window.innerWidth / 2 ? 'right' : 'left');
      }
      setCollapsed(true);
    }, COLLAPSE_DELAY);
  }, []);

  // 启动首次收起定时器
  useEffect(() => {
    resetCollapseTimer();
    return () => {
      if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
    };
  }, [resetCollapseTimer]);

  // --- 窗口 resize：猫猫不跑出屏幕 ---
  useEffect(() => {
    const handleResize = () => {
      const { x, y } = expandedPosRef.current;
      if (x > window.innerWidth - 30) {
        expandedPosRef.current.x = window.innerWidth - CAT_WIDTH;
        if (!collapsedRef.current) posX.set(window.innerWidth - CAT_WIDTH);
      }
      if (y > window.innerHeight - CAT_WIDTH) {
        expandedPosRef.current.y = window.innerHeight - CAT_WIDTH;
        if (!collapsedRef.current) posY.set(window.innerHeight - CAT_WIDTH);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- 交互：摸猫猫 ---
  const handlePetCat = () => {
    if (isPetted) return;
    setIsPetted(true);
    speak("呼噜噜... 摸得本喵很舒服喵~", 2000);
    setTimeout(() => setIsPetted(false), 2000);
    resetCollapseTimer();
  };

  // --- 交互：喂小鱼干 ---
  const handleFeed = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isThinking) return;
    resetCollapseTimer();
    setShowInput(false);
    setIsThinking(true);
    speak("嗷呜！真好吃喵！本喵吃饱了要说两句...", 6000);

    try {
      const res = await fetch('/api/chat/cat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: "我刚刚喂了你一条美味的小鱼干！你有什么表示？", sessionId: sessionIdRef.current }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        speak(err.error || err.details || "铲屎官的网线被老鼠咬断了吧？喵！", 4000);
        return;
      }
      const data = await res.json();
      speak(data.reply || "...", 8000);
    } catch {
      speak("吧唧吧唧... 鱼干好吃，但本喵卡壳了喵...", 4000);
    } finally {
      setIsThinking(false);
    }
  };

  // --- 交互：发消息聊天 ---
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isThinking) return;
    resetCollapseTimer();
    const userMessage = inputValue;
    setInputValue('');
    setShowInput(false);
    setIsThinking(true);
    speak("让本喵想想喵...", 10000);

    try {
      const res = await fetch('/api/chat/cat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, sessionId: sessionIdRef.current }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        speak(err.error || err.details || "铲屎官的网线被老鼠咬断了吧？喵！", 4000);
        return;
      }
      const data = await res.json();
      speak(data.reply || "...", 8000);
    } catch {
      speak("铲屎官的网线被老鼠咬断了吧？喵！", 4000);
    } finally {
      setIsThinking(false);
    }
  };

  // --- 拖拽 ---
  const handleDragStart = () => {
    if (collapsedRef.current) setCollapsed(false);
    resetCollapseTimer();
  };

  const handleDragEnd = (_event: any, info: any) => {
    const rect = catRef.current?.getBoundingClientRect();
    if (rect) {
      const x = Math.max(-CAT_WIDTH + 30, Math.min(window.innerWidth - 30, rect.left));
      const y = Math.max(0, Math.min(window.innerHeight - CAT_WIDTH, rect.top));
      expandedPosRef.current = { x, y };
      posX.set(x);
      posY.set(y);
    }
    setEdge(info.point.x > window.innerWidth / 2 ? 'right' : 'left');
    setDragKey(prev => prev + 1);
    resetCollapseTimer();
  };

  // --- 随机挂机语录 ---
  useEffect(() => {
    if (collapsed) {
      // 收起状态：每25秒80%概率
      const interval = setInterval(() => {
        if (!speechRef.current && !showInputRef.current && !isThinkingRef.current && Math.random() < 0.8) {
          const msg = COLLAPSED_BARKS[Math.floor(Math.random() * COLLAPSED_BARKS.length)];
          speak(msg, 5000);
        }
      }, COLLAPSED_QUOTE_IVL);
      return () => clearInterval(interval);
    } else {
      // 展开状态：每20秒20%概率
      const interval = setInterval(() => {
        if (!speechRef.current && !showInputRef.current && !isThinkingRef.current && Math.random() > 0.8) {
          const msg = NORMAL_BARKS[Math.floor(Math.random() * NORMAL_BARKS.length)];
          speak(msg, 4000);
        }
      }, NORMAL_QUOTE_IVL);
      return () => clearInterval(interval);
    }
  }, [collapsed]);

  // --- 收起/展开：useEffect 驱动 posX 来保留拖动位置 ---
  useEffect(() => {
    if (!collapsed) {
      posX.set(expandedPosRef.current.x);
      return;
    }
    if (edge === 'right') {
      posX.set(window.innerWidth - 24);
    } else {
      posX.set(-(CAT_WIDTH - 24));
    }
  }, [collapsed, edge]);

  // --- 气泡方向：收起时 bubble 朝屏幕内侧 ---
  // 收起+右边缘：猫被推到右边，可见部分在左 → bubble 在左侧，尾巴朝右指猫
  // 收起+左边缘：猫被推到左边，可见部分在右 → bubble 在右侧，尾巴朝左指猫
  const bubbleJustify = collapsed
    ? (edge === 'right' ? 'justify-start' : 'justify-end')
    : 'justify-center';
  const bubbleTailPos = collapsed
    ? (edge === 'right'
        ? 'left-[calc(100%-9px)]'   // bubble 左侧对齐，尾巴在右边（朝猫）
        : 'left-[9px]')              // bubble 右侧对齐，尾巴在左边（朝猫）
    : 'left-1/2';                     // 居中
  const bubbleTailXlate = collapsed ? '-translate-x-0' : '-translate-x-1/2';

  return (
    // 外壳层：动画位移 & 不透明度
    <motion.div
      style={{
        position: 'fixed',
        left: 0, top: 0,
        x: posX, y: posY,
        zIndex: 9999,
      }}
      animate={{ opacity: collapsed ? 0.85 : 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onClick={() => { if (collapsed) resetCollapseTimer(); }}
    >
      {/* ✅ Bug Fix：全屏不可见 div 提供 dragConstraints */}
      <div
        ref={viewportRef}
        className="fixed inset-0 pointer-events-none"
        aria-hidden="true"
      />

      {/* 呼吸动画层 */}
      <motion.div
        animate={collapsed ? { scale: [0.85, 0.9, 0.85] } : { scale: 1 }}
        transition={collapsed ? { repeat: Infinity, duration: 2, ease: 'easeInOut' } : { duration: 0.3 }}
      >
        {/* 拖拽层 */}
        <motion.div
          key={dragKey}
          ref={catRef}
          drag
          dragElastic={0.1}
          dragConstraints={viewportRef}
          whileDrag={{ scale: 1.1, cursor: "grabbing" }}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          className="flex flex-col items-center group cursor-grab active:cursor-grabbing"
        >
          {/* 💬 聊天气泡 */}
          <div className={`relative w-full flex ${bubbleJustify} mb-6`}>
            <AnimatePresence>
              {speech && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  className="absolute bottom-0 bg-white dark:bg-slate-800 text-slate-700 dark:text-gray-200 px-4 py-3 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 text-sm max-w-[240px] break-words text-center leading-relaxed"
                  style={{ pointerEvents: 'none', transformOrigin: 'bottom center' }}
                >
                  {speech}
                  {/* 气泡尾巴：收起时方向朝猫（屏幕内侧） */}
                  <div
                    className={`absolute -bottom-[6px] ${bubbleTailPos} ${bubbleTailXlate} w-3 h-3 bg-white dark:bg-slate-800 border-b border-r border-gray-100 dark:border-slate-700 transform rotate-45`}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 🐈 猫咪本体 & 交互按钮 */}
          <div className="relative">

            {/* 左侧按钮区：收起时隐藏 */}
            {!collapsed && (
              <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">

                {/* 💬 聊天按钮 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowInput(!showInput);
                    resetCollapseTimer();
                  }}
                  className="bg-white/90 dark:bg-slate-700/90 p-2.5 rounded-full shadow-md hover:scale-110 active:scale-95 transition-transform border border-gray-100 dark:border-slate-600 text-blue-500 hover:text-blue-600 flex items-center justify-center backdrop-blur-sm"
                  title="聊天"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* 🐟 喂小鱼干按钮 */}
                <button
                  onClick={handleFeed}
                  disabled={isThinking}
                  className={`bg-white/90 dark:bg-slate-700/90 p-2.5 rounded-full shadow-md hover:scale-110 active:scale-95 transition-transform border border-gray-100 dark:border-slate-600 flex items-center justify-center backdrop-blur-sm ${isThinking ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title="喂小鱼干"
                >
                  <span className="text-xl leading-none">🐟</span>
                </button>
              </div>
            )}

            {/* 猫咪精灵图容器 */}
            <div
              className="relative cursor-pointer overflow-hidden transition-all duration-500 rounded-2xl"
              style={{
                width: collapsed ? 24 : CAT_WIDTH,
                height: CAT_WIDTH,
              }}
              onClick={handlePetCat}
            >
              <div
                className="absolute top-0 h-full"
                style={{
                  width: CAT_WIDTH,
                  ...(collapsed && edge === 'right' ? { right: 0 } : {}),
                  ...(collapsed && edge === 'left' ? { left: 0 } : {}),
                }}
              >
                <style>{`
                .cat-sprite {
                  width: 100%;
                  height: 100%;
                  background-image: url('/yuexinmiao.webp');
                  background-size: 800% 900%;
                  background-repeat: no-repeat;
                }
                .cat-idle {
                  animation: cat-idle 1.2s steps(1) infinite;
                  background-position-y: 0%;
                }
                .cat-petted {
                  animation: cat-petted 0.8s steps(1) infinite;
                  background-position-y: 37.5%;
                }
                .cat-thinking {
                  animation: cat-thinking 0.6s steps(1) infinite;
                  background-position-y: 75%;
                }
                @keyframes cat-idle {
                  0%, 16.67% { background-position-x: 0%; }
                  16.67%, 33.33% { background-position-x: 14.3%; }
                  33.33%, 50% { background-position-x: 28.6%; }
                  50%, 66.67% { background-position-x: 42.9%; }
                  66.67%, 83.33% { background-position-x: 57.1%; }
                  83.33%, 100% { background-position-x: 71.4%; }
                }
                @keyframes cat-petted {
                  0%, 25% { background-position-x: 0%; }
                  25%, 50% { background-position-x: 14.3%; }
                  50%, 75% { background-position-x: 28.6%; }
                  75%, 100% { background-position-x: 42.9%; }
                }
                @keyframes cat-thinking {
                  0%, 16.67% { background-position-x: 0%; }
                  16.67%, 33.33% { background-position-x: 14.3%; }
                  33.33%, 50% { background-position-x: 28.6%; }
                  50%, 66.67% { background-position-x: 42.9%; }
                  66.67%, 83.33% { background-position-x: 57.1%; }
                  83.33%, 100% { background-position-x: 71.4%; }
                }
              `}</style>
                <div className={`cat-sprite drop-shadow-2xl ${isPetted ? 'cat-petted' : isThinking ? 'cat-thinking' : 'cat-idle'}`} />
              </div>
            </div>
          </div>

          {/* ⌨️ 聊天输入框：收起时隐藏 */}
          {!collapsed && (
            <AnimatePresence>
              {showInput && (
                <motion.form
                  initial={{ opacity: 0, y: -10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.9 }}
                  onSubmit={handleChatSubmit}
                  className="absolute -bottom-14 bg-white dark:bg-slate-800 p-1.5 rounded-full shadow-lg flex items-center border border-gray-200 dark:border-slate-700 w-56 z-20"
                >
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="跟月薪喵说点啥喵..."
                    className="bg-transparent border-none outline-none text-sm px-3 py-1 w-full dark:text-white placeholder-gray-400"
                    disabled={isThinking}
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={isThinking || !inputValue.trim()}
                    className={`rounded-full p-1.5 ml-1 flex items-center justify-center transition-colors ${
                      isThinking || !inputValue.trim() ? 'bg-gray-300 text-gray-500' : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
                    </svg>
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
