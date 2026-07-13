"use client";

/**
 * 文章页面进度追踪器 - PostProgressTracker
 *
 * 固定在文章页右下角的浮动组件，包含：
 * - 阅读进度条（实时显示滚动百分比）
 * - "标记为已完成"按钮（进度 > 60% 时显示）
 * - "已完成学习"徽章（已完成时显示）
 *
 * 进度追踪通过监听 window scroll 事件实现，300ms 节流。
 */

import { useEffect, useRef } from "react";
import { useLearning } from "./LearningProvider";
import { CheckCircle, BookOpen } from "lucide-react";

export default function PostProgressTracker({ slug }: { slug: string }) {
  const { visitPost, setProgress, toggleComplete, isCompleted, getProgress } = useLearning();
  const completed = isCompleted(slug);
  const progress = getProgress(slug);
  // 节流锁，防止滚动事件过于频繁触发
  const trackedRef = useRef(false);

  // 进入文章页时记录访问（仅运行一次）
  useEffect(() => {
    visitPost(slug);
  }, [slug, visitPost]);

  // 监听滚动事件，实时计算并更新阅读进度
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return; // 极端情况：内容不足以滚动
      const percent = Math.round((scrollTop / docHeight) * 100);
      setProgress(slug, percent);
    };

    // 300ms 节流：避免高频滚动事件阻塞主线程
    let timeout: ReturnType<typeof setTimeout>;
    const throttled = () => {
      if (trackedRef.current) return; // 节流锁激活中，跳过
      trackedRef.current = true;
      handleScroll();
      timeout = setTimeout(() => {
        trackedRef.current = false; // 释放节流锁
      }, 300);
    };

    window.addEventListener("scroll", throttled, { passive: true });
    handleScroll(); // 首屏立即计算一次进度
    return () => {
      window.removeEventListener("scroll", throttled);
      clearTimeout(timeout);
    };
  }, [slug, setProgress]);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-center gap-2">
      {/* 进度条：显示当前阅读百分比 */}
      <div className="flex items-center gap-3 bg-white/70 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl px-4 py-2.5 shadow-xl border border-white/40 dark:border-white/10">
        <BookOpen size={14} className="text-indigo-500" />
        <div className="w-20 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 min-w-[32px]">{progress}%</span>
      </div>

      {/* 手动标记完成按钮：进度超过 60% 且未完成时显示 */}
      {progress > 60 && !completed && (
        <button
          onClick={() => toggleComplete(slug)}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl px-4 py-2.5 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/35 transition-all active:scale-95 text-xs font-bold"
        >
          <CheckCircle size={14} />
          标记为已完成
        </button>
      )}

      {/* 已完成徽章：文章已标记为完成时显示 */}
      {completed && (
        <div className="flex items-center gap-2 bg-emerald-500/20 dark:bg-emerald-500/15 backdrop-blur-xl rounded-2xl px-4 py-2.5 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
          <CheckCircle size={14} />
          已完成学习
        </div>
      )}
    </div>
  );
}
