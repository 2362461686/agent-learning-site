"use client";

/**
 * 首页"继续学习"区域 - ContinueLearningSection
 *
 * 根据用户的学习记忆数据显示：
 * - 进行中的文章列表（最多 3 篇，带进度条）
 * - 当全部完成时显示祝贺信息
 * - 无学习记录时完全隐藏，不占空间
 */

import Link from "next/link";
import { useLearning } from "./LearningProvider";
import { BookOpen, ArrowRight, CheckCircle } from "lucide-react";

interface PostInfo {
  slug: string;
  title: string;
  description: string;
  cover: string;
}

export default function ContinueLearningSection({ allPosts }: { allPosts: PostInfo[] }) {
  const { getContinueLearning, getProgress, getCompleted } = useLearning();

  const allSlugs = allPosts.map((p) => p.slug);
  // 获取待继续学习的前 3 篇文章 slug
  const continueSlugs = getContinueLearning(allSlugs);
  const completedSlugs = getCompleted();

  // 无任何学习记录 → 不显示此区块
  if (continueSlugs.length === 0 && completedSlugs.length === 0) {
    return null;
  }

  // 构建 slug → 文章信息的快速查找 Map
  const postMap = new Map(allPosts.map((p) => [p.slug, p]));

  return (
    <div className="w-full rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-md overflow-hidden">
      <div className="p-5 sm:p-6">
        {/* 区块标题 */}
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={18} className="text-indigo-500" />
          <h3 className="font-black text-slate-800 dark:text-slate-200 text-lg">继续学习</h3>
          {completedSlugs.length > 0 && (
            <span className="ml-auto text-xs font-medium text-slate-400 dark:text-slate-500">
              {completedSlugs.length}/{allPosts.length} 篇已完成
            </span>
          )}
        </div>

        {/* 有待继续的文章 → 显示列表 */}
        {continueSlugs.length > 0 ? (
          <div className="flex flex-col gap-3">
            {continueSlugs.map((slug) => {
              const post = postMap.get(slug);
              const progress = getProgress(slug);
              if (!post) return null; // 文章已删除等异常情况
              return (
                <Link
                  key={slug}
                  href={`/posts/${slug}`}
                  className="group flex items-center gap-4 p-3 rounded-xl hover:bg-white/40 dark:hover:bg-white/5 transition-all border border-transparent hover:border-indigo-500/10"
                >
                  {/* 左侧图标 */}
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform">
                    <BookOpen size={16} className="text-white" />
                  </div>
                  {/* 中间：标题 + 进度条 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {post.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 shrink-0">{progress}%</span>
                    </div>
                  </div>
                  {/* 右侧箭头 */}
                  <ArrowRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors shrink-0" />
                </Link>
              );
            })}
          </div>
        ) : (
          // 全部完成 → 显示祝贺
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
            <CheckCircle size={20} className="text-emerald-500" />
            <div>
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">太棒了！你已经完成了所有教程</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">回顾已完成的文章巩固知识，或等待新教程发布</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
