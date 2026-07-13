"use client";

/**
 * AI Agent 学习记忆系统 - LearningProvider
 *
 * 功能：追踪用户的学习进度并持久化到 localStorage
 * - 记录每篇文章的访问时间、阅读进度（0-100%）、完成状态
 * - 阅读超过 80% 时自动标记为已完成
 * - 首页"继续学习"区域展示最近未完成的文章
 * - 时间线页面显示进度条和完成徽章
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

// ======================== 类型定义 ========================

/** 单篇文章的学习数据 */
interface PostLearningData {
  lastVisited: number; // 最后访问时间戳
  progress: number;     // 阅读进度 0-100（滚动百分比）
  completed: boolean;   // 是否已完成学习
}

/** 全局学习状态 */
interface LearningState {
  posts: Record<string, PostLearningData>; // slug → 学习数据映射
}

/** Context 对外暴露的方法和状态 */
interface LearningContextValue {
  state: LearningState;
  visitPost: (slug: string) => void;
  setProgress: (slug: string, progress: number) => void;
  toggleComplete: (slug: string) => void;
  getContinueLearning: (allSlugs: string[]) => string[]; // 获取最多 3 篇待继续的文章
  getInProgress: () => string[];   // 获取所有进行中的文章
  getCompleted: () => string[];    // 获取所有已完成的文章
  isCompleted: (slug: string) => boolean;
  isInProgress: (slug: string) => boolean;
  getProgress: (slug: string) => number;
}

// ======================== 本地存储 ========================

const STORAGE_KEY = "ai-agent-learning-memory";
const defaultState: LearningState = { posts: {} };

/** 创建 Context，初始值为 null（SSR 期间 Provider 未包裹时回退到安全默认值） */
const LearningContext = createContext<LearningContextValue | null>(null);

/** 从 localStorage 加载学习状态 */
function loadState(): LearningState {
  // SSR 环境下无 window 对象
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    return JSON.parse(raw) as LearningState;
  } catch {
    return defaultState; // JSON 解析失败时静默回退
  }
}

/** 将学习状态写入 localStorage */
function saveState(state: LearningState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage 空间满或不可用时静默忽略
  }
}

// ======================== Provider 组件 ========================

export function LearningProvider({ children }: { children: ReactNode }) {
  // 初始化为空状态，避免 SSR/CSR hydration 不匹配
  const [state, setState] = useState<LearningState>(defaultState);
  // mounted 标记用于判断是否已完成客户端挂载
  const [mounted, setMounted] = useState(false);

  // 客户端挂载后从 localStorage 恢复状态
  useEffect(() => {
    setState(loadState());
    setMounted(true);
  }, []);

  // 状态变更后自动持久化到 localStorage
  useEffect(() => {
    if (mounted) saveState(state);
  }, [state, mounted]);

  // ==================== 操作方法 ====================

  /** 记录文章访问（进入文章页时调用） */
  const visitPost = useCallback((slug: string) => {
    setState((prev) => {
      const existing = prev.posts[slug];
      return {
        posts: {
          ...prev.posts,
          [slug]: {
            lastVisited: Date.now(),
            progress: existing?.progress ?? 0,       // 保留已有进度
            completed: existing?.completed ?? false, // 保留完成状态
          },
        },
      };
    });
  }, []);

  /** 更新阅读进度（文章页滚动时调用，300ms 节流） */
  const setProgress = useCallback((slug: string, progress: number) => {
    setState((prev) => {
      const existing = prev.posts[slug];
      // 进度值钳制在 0-100 范围内
      const clampedProgress = Math.min(100, Math.max(0, progress));
      // 自动完成逻辑：从 < 80% 跨越到 >= 80% 时自动标记完成
      const wasBelowThreshold = (existing?.progress ?? 0) < 80;
      const nowAboveThreshold = clampedProgress >= 80;
      const autoCompleted = wasBelowThreshold && nowAboveThreshold;
      return {
        posts: {
          ...prev.posts,
          [slug]: {
            lastVisited: existing?.lastVisited ?? Date.now(),
            progress: clampedProgress,
            completed: existing?.completed || autoCompleted,
          },
        },
      };
    });
  }, []);

  /** 切换完成状态（手动标记/取消完成） */
  const toggleComplete = useCallback((slug: string) => {
    setState((prev) => {
      const existing = prev.posts[slug];
      return {
        posts: {
          ...prev.posts,
          [slug]: {
            lastVisited: existing?.lastVisited ?? Date.now(),
            progress: existing?.progress ?? 0,
            completed: !(existing?.completed ?? false),
          },
        },
      };
    });
  }, []);

  // ==================== 查询方法 ====================

  const isCompleted = useCallback(
    (slug: string) => state.posts[slug]?.completed ?? false,
    [state]
  );

  const isInProgress = useCallback(
    (slug: string) => {
      const p = state.posts[slug];
      return p ? p.progress > 0 && !p.completed : false;
    },
    [state]
  );

  const getProgress = useCallback(
    (slug: string) => state.posts[slug]?.progress ?? 0,
    [state]
  );

  /** 获取"继续学习"列表：已访问但未完成的前 3 篇文章，按最近访问排序 */
  const getContinueLearning = useCallback(
    (allSlugs: string[]) => {
      const inProgress = allSlugs
        .filter((slug) => {
          const p = state.posts[slug];
          return p && !p.completed;
        })
        .sort((a, b) => {
          const dateA = state.posts[a]?.lastVisited ?? 0;
          const dateB = state.posts[b]?.lastVisited ?? 0;
          return dateB - dateA; // 最近访问的排在前面
        });
      return inProgress.slice(0, 3); // 最多返回 3 篇
    },
    [state]
  );

  /** 获取所有进行中文章的 slug 列表 */
  const getInProgress = useCallback(() => {
    return Object.entries(state.posts)
      .filter(([, v]) => v.progress > 0 && !v.completed)
      .sort(([, a], [, b]) => b.lastVisited - a.lastVisited)
      .map(([k]) => k);
  }, [state]);

  /** 获取所有已完成文章的 slug 列表 */
  const getCompleted = useCallback(() => {
    return Object.entries(state.posts)
      .filter(([, v]) => v.completed)
      .map(([k]) => k);
  }, [state]);

  // SSR 期间不提供 Context Provider，子组件通过 useLearning 的安全回退获取默认值
  // 这样避免了 SSG 时渲染客户端专属 UI 导致的水合不一致
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <LearningContext.Provider
      value={{
        state,
        visitPost,
        setProgress,
        toggleComplete,
        getContinueLearning,
        getInProgress,
        getCompleted,
        isCompleted,
        isInProgress,
        getProgress,
      }}
    >
      {children}
    </LearningContext.Provider>
  );
}

// ======================== Hook ========================

/**
 * 获取学习记忆 Context 的 Hook
 *
 * 在 SSR 期间或 LearningProvider 未挂载时，返回安全默认值（空状态 + noop 函数），
 * 避免抛出异常导致页面构建失败。
 * 客户端挂载后，会自动从 localStorage 恢复真实数据。
 */
export function useLearning(): LearningContextValue {
  const ctx = useContext(LearningContext);
  if (!ctx) {
    // SSR / 未挂载 → 返回无操作的假数据，保证子组件不会崩溃
    return {
      state: { posts: {} },
      visitPost: () => {},
      setProgress: () => {},
      toggleComplete: () => {},
      getContinueLearning: () => [],
      getInProgress: () => [],
      getCompleted: () => [],
      isCompleted: () => false,
      isInProgress: () => false,
      getProgress: () => 0,
    };
  }
  return ctx;
}
