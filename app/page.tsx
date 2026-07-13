import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';

import Navbar from '../components/Navbar';
import PageTransition from '../components/PageTransition';
import SearchBar from '../components/SearchBar';
import { siteConfig } from '../siteConfig';
import CloudPlayer from '../components/CloudPlayer';
import ThemeToggleBlock from '../components/ThemeToggleBlock';
import LyricBar from '../components/LyricBar';
import { ToastProvider } from '../components/ToastProvider';
import LatestPostsCarousel from '../components/LatestPostsCarousel';
import ContinueLearningSection from '../components/ContinueLearningSection';

function formatUpdateTime(dateString: string) {
  if (!dateString || dateString === '1970-01-01') return '刚刚更新';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    if (hours === '00' && mins === '00') return `${year}.${month}.${day}`;
    return `${year}.${month}.${day} ${hours}:${mins}`;
  } catch { return dateString; }
}

const TOPIC_CARDS = [
  {
    title: 'AI Agent 概述',
    desc: '什么是智能体？从 LLM 到 Agent 的演进之路',
    icon: '🤖',
    color: 'from-indigo-500 to-blue-600',
    tag: '入门',
  },
  {
    title: 'LangChain',
    desc: 'Chain、Tool、Memory — 构建 Agent 的核心组件',
    icon: '⛓️',
    color: 'from-emerald-500 to-teal-600',
    tag: '框架',
  },
  {
    title: 'RAG 实战',
    desc: '检索增强生成：让 Agent 学会"查资料"',
    icon: '📚',
    color: 'from-orange-500 to-red-600',
    tag: '进阶',
  },
  {
    title: 'Prompt Engineering',
    desc: '写好 Prompt 是驾驭 Agent 的第一步',
    icon: '✍️',
    color: 'from-purple-500 to-pink-600',
    tag: '基础',
  },
  {
    title: 'Agent 架构',
    desc: 'ReAct、Plan-Execute、Multi-Agent 协作模式',
    icon: '🏗️',
    color: 'from-cyan-500 to-blue-600',
    tag: '架构',
  },
  {
    title: '工具调用',
    desc: 'Function Calling 与 Tool Use 深度解析',
    icon: '🔧',
    color: 'from-rose-500 to-pink-600',
    tag: '进阶',
  },
];

export default function Home() {
  const postsDirectory = path.join(process.cwd(), 'posts');
  let allPosts: any[] = [];
  try {
    if (fs.existsSync(postsDirectory)) {
      const fileNames = fs.readdirSync(postsDirectory).filter(f => f.endsWith('.md'));
      allPosts = fileNames.map(fileName => {
        const fullPath = path.join(postsDirectory, fileName);
        const { data, content } = matter(fs.readFileSync(fullPath, 'utf8'));
        const rawDate = data.date || '1970-01-01';
        return {
          slug: fileName.replace(/\.md$/, ''),
          ...data,
          title: data.title || '',
          description: data.description || '',
          content: content || '',
          date: rawDate,
          formattedDate: formatUpdateTime(rawDate)
        };
      }).sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateB !== dateA) return dateB - dateA;
        return b.slug.localeCompare(a.slug);
      });
    }
  } catch (e) {}
  const top5Posts = allPosts.length > 0 ? allPosts.slice(0, 5) : [{ slug: 'none', title: '暂无文章', description: '教程正在赶来...', cover: '', date: '', formattedDate: '' }];

  return (
    <ToastProvider>
      <div className="min-h-screen relative pb-10">
        <Navbar />
        <PageTransition>
          <div className="w-full max-w-6xl mx-auto mt-24 sm:mt-28 px-4 sm:px-6 lg:px-10 relative z-10">
            <SearchBar posts={allPosts} />

            <main className="flex flex-col gap-6 w-full mt-6">

              {/* Hero Section */}
              <div className="w-full rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl overflow-hidden relative p-8 sm:p-10">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-cyan-500/10 dark:from-indigo-500/20 dark:via-purple-500/10 dark:to-cyan-500/20" />
                <div className="relative">
                  <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
                    AI Agent 学习笔记
                  </h1>
                  <p className="mt-3 text-slate-500 dark:text-slate-400 max-w-2xl text-sm sm:text-base leading-relaxed">
                    从零开始学习 AI Agent 开发。涵盖 LangChain 框架入门、RAG 检索增强生成、
                    Prompt Engineering 提示词工程、Agent 架构设计等核心技术栈。
                    每篇教程都是实战笔记，边学边写，记录踩坑与心得。
                  </p>
                  <div className="flex items-center gap-3 mt-4 flex-wrap">
                    <Link href="/timeline" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/35 active:scale-95">
                      浏览全部教程
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    </Link>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{allPosts.length} 篇教程</span>
                  </div>
                </div>
              </div>

              {/* Continue Learning */}
              <ContinueLearningSection allPosts={allPosts} />

              {/* Topic Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                {TOPIC_CARDS.map((topic) => (
                  <div key={topic.title} className="group rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-md hover:shadow-xl hover:shadow-indigo-500/5 dark:hover:shadow-indigo-500/10 transition-all duration-300 overflow-hidden">
                    <div className={`h-1.5 bg-gradient-to-r ${topic.color}`} />
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{topic.icon}</span>
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">{topic.title}</h3>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-3">{topic.desc}</p>
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/10">{topic.tag}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Row: Posts + Cloud Player */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
                <div className="col-span-1 lg:col-span-7 flex flex-col min-h-[300px]">
                  <LatestPostsCarousel posts={top5Posts} />
                </div>
                <div className="col-span-1 lg:col-span-5 flex flex-col">
                  <CloudPlayer />
                </div>
              </div>

              {/* Lyric bar */}
              <div className="w-full mt-[-10px]"><LyricBar /></div>

              {/* Bottom row: Theme + About */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
                <div className="sm:col-span-2 flex flex-col">
                  <Link href="/about" className="group rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-md hover:shadow-xl transition-all duration-300 p-5 h-full flex flex-col justify-center hover:scale-[1.02]">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg mb-2">关于本站</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                      基于 Next.js 16 + Tailwind CSS 4 构建的 AI Agent 学习笔记站点。
                      记录从零学习智能体开发的完整历程，包含理论讲解与代码实战。
                    </p>
                    <p className="text-indigo-500 dark:text-indigo-400 text-xs mt-3 font-medium group-hover:underline">
                      了解更多 →
                    </p>
                  </Link>
                </div>
                <div className="sm:col-span-1 flex flex-col min-h-[120px]">
                  <ThemeToggleBlock />
                </div>
              </div>

            </main>
          </div>
        </PageTransition>
      </div>
    </ToastProvider>
  );
}
