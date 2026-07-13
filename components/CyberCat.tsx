"use client";

/**
 * ✅ Step4: AI 猫猫助理 — CyberCat
 *
 * 三层架构实现角色形象：
 *   视觉层：CSS 精灵图（siamese-cat.png），3列 x 2行，background-position 切换帧
 *   人格层：system prompt 配置在 siteConfig.catAssistantConfig
 *   交互层：拖拽、抚摸、喂小鱼干、聊天输入、随机挂机语录
 *
 * 功能：
 *   - 可拖拽的浮动猫咪（fixed bottom-20 right-20）
 *   - 3种动画：idle（慢速3帧）、thinking（快速）、petted（另起一行）
 *   - 聊天气泡（点击抚摸 / AI 回复时显示）
 *   - 喂小鱼干 → 调 DeepSeek API 获取猫言猫语
 *   - 聊天输入框 → 和猫咪对话
 *   - 每20秒随机说一句挂机语录
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CyberCat() {
  const [isPetted, setIsPetted] = useState(false);
  const [speech, setSpeech] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const chatTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- 说话功能 ---
  const speak = (text: string, duration = 6000) => {
    setSpeech(text);
    if (chatTimeoutRef.current) clearTimeout(chatTimeoutRef.current);
    chatTimeoutRef.current = setTimeout(() => setSpeech(null), duration);
  };

  // --- 交互：摸猫猫 ---
  const handlePetCat = () => {
    if (isPetted) return;
    setIsPetted(true);
    speak("呼噜噜... 摸得本喵很舒服喵~", 2000);
    setTimeout(() => setIsPetted(false), 2000);
  };

  // --- 交互：喂小鱼干 ---
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
        body: JSON.stringify({ message: "我刚刚喂了你一条美味的小鱼干！你有什么表示？" }),
      });

      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      speak(data.reply || "吧唧吧唧... 谢谢喵~", 8000);
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

    const userMessage = inputValue;
    setInputValue('');
    setShowInput(false);
    setIsThinking(true);
    speak("让本喵想想喵...", 10000);

    try {
      const res = await fetch('/api/chat/cat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      speak(data.reply || "喵... 本喵短路了喵...", 8000);
    } catch {
      speak("铲屎官的网线被老鼠咬断了吧？喵！", 4000);
    } finally {
      setIsThinking(false);
    }
  };

  // --- 随机挂机语录（每 20 秒 20% 概率触发） ---
  useEffect(() => {
    const randomBarks = [
      "喵呜~ 今天天气真不错喵~",
      "好困哦，想睡觉喵...",
      "铲屎官，快去敲代码！",
      "我的小鱼干藏哪里去了？",
      "怎么没人理本喵...",
      "Agent 架构好难喵...",
      "LangChain 是什么好吃的喵？",
    ];
    const interval = setInterval(() => {
      if (!speech && !showInput && !isThinking && Math.random() > 0.8) {
        const msg = randomBarks[Math.floor(Math.random() * randomBarks.length)];
        speak(msg, 4000);
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [speech, showInput, isThinking]);

  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.1}
      whileDrag={{ scale: 1.1, cursor: "grabbing" }}
      className="fixed bottom-20 right-20 z-[9999] flex flex-col items-center group cursor-grab active:cursor-grabbing"
    >
      {/* 聊天气泡 */}
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

      {/* 猫咪本体 & 交互按钮 */}
      <div className="relative">

        {/* 左侧按钮区：聊天 + 喂食 */}
        <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">

          {/* 聊天按钮 */}
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

          {/* 喂小鱼干按钮 */}
          <button
            onClick={handleFeed}
            disabled={isThinking}
            className={`bg-white/90 dark:bg-slate-700/90 p-2.5 rounded-full shadow-md hover:scale-110 active:scale-95 transition-transform border border-gray-100 dark:border-slate-600 flex items-center justify-center backdrop-blur-sm ${isThinking ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="喂小鱼干"
          >
            <span className="text-xl leading-none">🐟</span>
          </button>
        </div>

        {/* 猫咪精灵图容器 */}
        <div
          className="w-[120px] h-[120px] relative cursor-pointer"
          onClick={handlePetCat}
        >
          <style>{`
            .cat-sprite {
              width: 100%;
              height: 100%;
              background-image: url('/siamese-cat.png');
              background-size: 300% 300%;
              background-repeat: no-repeat;
              image-rendering: pixelated;
            }
            .cat-idle {
              animation: idle-frames 1.2s infinite;
              background-position-y: 0%;
            }
            .cat-petted {
              animation: pet-frames 0.8s infinite;
              background-position-y: 50%;
            }
            .cat-thinking {
              animation: idle-frames 0.6s infinite;
              background-position-y: 0%;
            }
            @keyframes idle-frames {
              0%, 33.32% { background-position-x: 0%; }
              33.33%, 66.65% { background-position-x: 50%; }
              66.66%, 100% { background-position-x: 100%; }
            }
            @keyframes pet-frames {
              0%, 49.99% { background-position-x: 0%; }
              50%, 100% { background-position-x: 50%; }
            }
          `}</style>
          <div className={`cat-sprite drop-shadow-2xl ${isPetted ? 'cat-petted' : isThinking ? 'cat-thinking' : 'cat-idle'}`} />
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
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="跟煤球说点啥喵..."
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
    </motion.div>
  );
}
