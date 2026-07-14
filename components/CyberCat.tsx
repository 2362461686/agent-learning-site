"use client";

/**
 * 月薪喵 — 可拖拽的 AI 猫猫助理
 *
 * 功能：
 *   - 拖拽到任意位置（松手后记住位置）
 *   - 抚摸、喂小鱼干、聊天输入
 *   - CSS 精灵图动画（yuexinmiao.webp）
 *   - 随机挂机语录
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ===== 常量 ===== */
const CAT_WIDTH = 120;
const QUOTE_IVL = 20000;

const BARKS = [
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
  const [isPetted, setIsPetted] = useState(false);
  const [speech, setSpeech] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  // 位置
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const constrainRef = useRef<HTMLDivElement>(null);
  const chatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string>(`sess_${Math.random().toString(36).slice(2)}`);

  // 闭包 refs
  const speechRef = useRef(speech);
  const showInputRef = useRef(showInput);
  const isThinkingRef = useRef(isThinking);
  useEffect(() => { speechRef.current = speech; }, [speech]);
  useEffect(() => { showInputRef.current = showInput; }, [showInput]);
  useEffect(() => { isThinkingRef.current = isThinking; }, [isThinking]);

  // 说话
  const speak = (text: string, duration = 6000) => {
    setSpeech(text);
    if (chatTimeoutRef.current) clearTimeout(chatTimeoutRef.current);
    chatTimeoutRef.current = setTimeout(() => setSpeech(null), duration);
  };

  // 初始化位置 + resize
  useEffect(() => {
    setPos({
      x: window.innerWidth - CAT_WIDTH - 80,
      y: window.innerHeight - CAT_WIDTH - 80,
    });
    const onResize = () => {
      setPos(p => ({
        x: Math.max(-CAT_WIDTH + 30, Math.min(window.innerWidth - 30, p.x)),
        y: Math.max(0, Math.min(window.innerHeight - CAT_WIDTH, p.y)),
      }));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // 抚摸
  const handlePetCat = () => {
    if (isPetted) return;
    setIsPetted(true);
    speak("呼噜噜... 摸得本喵很舒服喵~", 2000);
    setTimeout(() => setIsPetted(false), 2000);
  };

  // 喂小鱼干
  const handleFeed = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isThinking) return;
    setShowInput(false);
    setIsThinking(true);
    speak("嗷呜！真好吃喵！本喵吃饱了要说两句...", 6000);

    try {
      const res = await fetch('/api/chat/cat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: "我刚刚喂了你一条美味的小鱼干！你有什么表示？",
          sessionId: sessionIdRef.current,
        }),
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

  // 聊天
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isThinking) return;
    const msg = inputValue;
    setInputValue('');
    setShowInput(false);
    setIsThinking(true);
    speak("让本喵想想喵...", 10000);

    try {
      const res = await fetch('/api/chat/cat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, sessionId: sessionIdRef.current }),
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

  // 拖拽
  const handleDragEnd = (_: any, info: any) => {
    setPos({
      x: Math.max(-CAT_WIDTH + 30, Math.min(window.innerWidth - 30, info.point.x - CAT_WIDTH / 2)),
      y: Math.max(0, Math.min(window.innerHeight - CAT_WIDTH, info.point.y - CAT_WIDTH / 2)),
    });
  };

  // 随机语录
  useEffect(() => {
    const ivl = setInterval(() => {
      if (!speechRef.current && !showInputRef.current && !isThinkingRef.current && Math.random() > 0.8) {
        speak(BARKS[Math.floor(Math.random() * BARKS.length)], 4000);
      }
    }, QUOTE_IVL);
    return () => clearInterval(ivl);
  }, []);

  return (
    <motion.div
      drag
      dragElastic={0}
      dragMomentum={false}
      dragConstraints={constrainRef}
      onDragEnd={handleDragEnd}
      whileDrag={{ cursor: "grabbing" }}
      style={{ position: 'fixed', left: 0, top: 0, zIndex: 9999 }}
      animate={{ x: pos.x, y: pos.y }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="cursor-grab active:cursor-grabbing group"
    >
      <div
        ref={constrainRef}
        className="fixed inset-0 pointer-events-none"
        aria-hidden="true"
      />

      <div className="flex flex-col items-center">
        {/* 气泡 */}
        <div className="relative w-full flex justify-center mb-6">
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
                <div className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-slate-800 border-b border-r border-gray-100 dark:border-slate-700 transform rotate-45" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 猫 + 按钮 */}
        <div className="relative">
          {/* 左侧按钮 */}
          <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowInput(!showInput);
              }}
              className="bg-white/90 dark:bg-slate-700/90 p-2.5 rounded-full shadow-md hover:scale-110 active:scale-95 transition-transform border border-gray-100 dark:border-slate-600 text-blue-500 hover:text-blue-600 flex items-center justify-center backdrop-blur-sm"
              title="聊天"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={handleFeed}
              disabled={isThinking}
              className={`bg-white/90 dark:bg-slate-700/90 p-2.5 rounded-full shadow-md hover:scale-110 active:scale-95 transition-transform border border-gray-100 dark:border-slate-600 flex items-center justify-center backdrop-blur-sm ${isThinking ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="喂小鱼干"
            >
              <span className="text-xl leading-none">🐟</span>
            </button>
          </div>

          {/* 精灵图 */}
          <div
            className="w-[120px] h-[120px] relative cursor-pointer"
            onClick={handlePetCat}
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
            <div className={`cat-sprite drop-shadow-2xl ${
              isPetted ? 'cat-petted' : isThinking ? 'cat-thinking' : 'cat-idle'
            }`} />
          </div>
        </div>

        {/* 聊天输入框 */}
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
                onChange={e => setInputValue(e.target.value)}
                placeholder="跟月薪喵说点啥喵..."
                className="bg-transparent border-none outline-none text-sm px-3 py-1 w-full dark:text-white placeholder-gray-400"
                disabled={isThinking}
                autoFocus
              />
              <button
                type="submit"
                disabled={isThinking || !inputValue.trim()}
                className={`rounded-full p-1.5 ml-1 flex items-center justify-center transition-colors ${
                  isThinking || !inputValue.trim()
                    ? 'bg-gray-300 text-gray-500'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
                </svg>
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
