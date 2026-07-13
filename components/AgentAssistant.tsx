"use client";

/**
 * ✅ Phase1: AI Agent 学习助手 — AgentAssistant
 *
 * 功能：
 * - 左下角浮动按钮，点击打开聊天面板
 * - 通过 /api/chat 调用 DeepSeek V4 Pro
 * - 支持流式 SSE 响应，逐字显示 AI 回复
 * - 上下文感知：检测当前学习教程，传递给 API
 * - 快捷提问按钮，帮助新手快速上手
 * - 移动端自适应的底部 Sheet 布局
 *
 * 状态说明：
 * - idle: 等待用户输入
 * - streaming: AI 正在回复（显示打字动画）
 * - error: API 异常（显示重试提示）
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, X, Loader2, AlertCircle } from 'lucide-react';

// ======================== 快捷提问列表 ========================

const QUICK_SUGGESTIONS = [
  '什么是 AI Agent？和普通 AI 有什么区别？',
  'LangChain 的核心组件有哪些？',
  'RAG 的工作原理是什么？',
  '怎么写出好的 Prompt？',
  '如何选择 Agent 架构方案？',
];

// ======================== 消息类型 ========================

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

/**
 * 从 URL 路径中提取当前教程 slug
 * 例如 /posts/rag-from-scratch → rag-from-scratch
 */
function extractSlug(pathname: string): string | null {
  const match = pathname.match(/^\/posts\/([^/]+)/);
  return match ? match[1] : null;
}

export default function AgentAssistant() {
  // ==================== 状态管理 ====================

  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pathname = usePathname();
  const currentSlug = extractSlug(pathname);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // SSR 安全：客户端挂载后再渲染
  useEffect(() => { setMounted(true); }, []);

  // ==================== 自动滚动到底部 ====================

  // 新消息到来时自动滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, scrollToBottom]);

  // 打开面板时自动聚焦输入框
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // ==================== 发送消息 ====================

  /**
   * 发送消息到 DeepSeek API 并处理流式响应
   *
   * DeepSeek SSE 格式（OpenAI 兼容）:
   *   data: {"choices":[{"delta":{"content":"Hello"}}]}
   *   data: {"choices":[{"delta":{"content":" world"}}]}
   *   data: [DONE]
   */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || streaming) return;

      // 清空错误状态，标记开始流式传输
      setError(null);
      setStreaming(true);
      setInputValue('');

      // 将用户消息追加到聊天记录
      const userMessage: Message = { role: 'user', content: content.trim() };
      setMessages((prev) => [...prev, userMessage]);

      // 创建 AbortController 以便取消请求
      abortControllerRef.current = new AbortController();

      try {
        // 调用服务端 API 代理
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            slug: currentSlug,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({ error: '请求失败' }));
          throw new Error(errData.error || `HTTP ${response.status}`);
        }

        // 添加空的助手消息占位（用于流式填充）
        setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

        // 读取 SSE 流
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // 按行分割处理 SSE 事件
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // 最后一行可能不完整，保留到下次处理

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data:')) continue;

            const jsonStr = trimmed.slice(5).trim(); // 移除 "data:" 前缀
            if (jsonStr === '[DONE]') continue; // 流结束标记

            try {
              const parsed = JSON.parse(jsonStr);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                // 逐片段追加到助手消息末尾
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last && last.role === 'assistant') {
                    updated[updated.length - 1] = {
                      ...last,
                      content: last.content + delta,
                    };
                  }
                  return updated;
                });
              }
            } catch {
              // 忽略无法解析的 SSE 行
            }
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return; // 用户主动取消
        console.error('[AgentAssistant] 请求失败:', err);
        setError(err.message || '网络连接失败，请检查网络后重试');
        // 移除空的助手消息占位
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === 'assistant' && last.content === '') {
            updated.pop();
          }
          return updated;
        });
      } finally {
        setStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [messages, currentSlug, streaming]
  );

  // ==================== 事件处理 ====================

  /** 提交输入框内容 */
  const handleSubmit = () => {
    if (!inputValue.trim() || streaming) return;
    sendMessage(inputValue);
  };

  /** 回车发送（Shift+Enter 换行） */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  /** 点击快捷提问 */
  const handleQuickSuggestion = (suggestion: string) => {
    sendMessage(suggestion);
  };

  // ==================== SSR 安全 ====================

  if (!mounted) return null;

  // ==================== 渲染 ====================

  return (
    <>
      {/* ====== 浮动触发按钮 ====== */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 left-6 z-40 w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 flex items-center justify-center hover:shadow-xl hover:shadow-indigo-500/40 transition-shadow"
        title="AI 学习助手"
      >
        {isOpen ? <X size={22} /> : <Bot size={22} />}
      </motion.button>

      {/* ====== 聊天面板 ====== */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed z-50 bottom-6 left-6
                       w-[calc(100vw-3rem)] max-w-[380px] h-[500px]
                       sm:w-[380px] sm:max-w-none
                       max-sm:bottom-20 max-sm:left-4 max-sm:right-4 max-sm:w-auto max-sm:h-[60vh]
                       bg-white/90 dark:bg-slate-900/95 backdrop-blur-2xl
                       rounded-3xl border border-white/40 dark:border-white/10
                       shadow-2xl shadow-indigo-500/10
                       flex flex-col overflow-hidden"
          >
            {/* --- 头部 --- */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/50 dark:border-slate-700/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Bot size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">
                    AI 学习助手
                  </h3>
                  {currentSlug && (
                    <p className="text-[10px] text-indigo-500 dark:text-indigo-400 font-medium">
                      正在学习：{currentSlug}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <X size={16} className="text-slate-400" />
              </button>
            </div>

            {/* --- 消息区域 --- */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* 空状态：显示快捷提问 */}
              {messages.length === 0 && !error && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-3">
                    我是你的 AI 学习助手，可以回答任何 AI Agent 相关问题 👋
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {QUICK_SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => handleQuickSuggestion(suggestion)}
                        className="text-xs font-medium px-3 py-1.5 rounded-xl
                                   bg-indigo-50 dark:bg-indigo-500/10
                                   text-indigo-600 dark:text-indigo-400
                                   border border-indigo-200/50 dark:border-indigo-500/20
                                   hover:bg-indigo-100 dark:hover:bg-indigo-500/20
                                   transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 聊天消息 */}
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed
                      ${msg.role === 'user'
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }
                      ${msg.role === 'assistant' && msg.content === '' ? 'min-w-[60px]' : ''}
                    `}
                  >
                    {/* 流式传输中的打字动画 */}
                    {msg.role === 'assistant' && msg.content === '' && streaming ? (
                      <div className="flex items-center gap-1 py-1">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap break-words">
                        {msg.content}
                        {/* 流式传输中的光标 */}
                        {msg.role === 'assistant' && streaming && idx === messages.length - 1 && (
                          <span className="inline-block w-0.5 h-4 bg-indigo-500 ml-0.5 align-middle animate-pulse" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* 错误状态 */}
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200/50 dark:border-red-500/20">
                  <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                    <button
                      onClick={() => setError(null)}
                      className="text-xs font-medium text-red-500 hover:text-red-600 mt-1 underline"
                    >
                      关闭
                    </button>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* --- 输入区域 --- */}
            <div className="px-4 py-3 border-t border-slate-200/50 dark:border-slate-700/50 shrink-0">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入你的问题..."
                  disabled={streaming}
                  rows={1}
                  className="flex-1 resize-none rounded-2xl px-4 py-2.5 text-sm
                             bg-slate-100 dark:bg-slate-800
                             text-slate-800 dark:text-slate-200
                             placeholder-slate-400 dark:placeholder-slate-500
                             border border-transparent focus:border-indigo-500/30
                             focus:outline-none focus:ring-2 focus:ring-indigo-500/20
                             transition-all disabled:opacity-50
                             max-h-[100px]"
                  style={{ minHeight: '40px' }}
                />
                <button
                  onClick={handleSubmit}
                  disabled={!inputValue.trim() || streaming}
                  className="w-10 h-10 rounded-2xl shrink-0
                             bg-gradient-to-r from-indigo-500 to-purple-600
                             text-white flex items-center justify-center
                             hover:from-indigo-600 hover:to-purple-700
                             disabled:opacity-40 disabled:cursor-not-allowed
                             transition-all active:scale-95"
                >
                  {streaming ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-2">
                由 DeepSeek V4 Pro 驱动 · 回复仅供参考
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
