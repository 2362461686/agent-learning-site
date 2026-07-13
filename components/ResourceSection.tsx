/**
 * ✅ Phase2: 学习资源展示组件 — ResourceSection
 *
 * 纯渲染组件，无客户端交互，SSR 安全。
 * 在文章页侧边栏显示：
 * - 推荐学习视频（Bilibili / YouTube 平台图标 + 标题 + 播放链接）
 * - 相关学习链接（标题 + 描述 + URL）
 *
 * 当 videos 和 links 都为空时返回 null，不影响页面布局。
 */

import { Tv } from 'lucide-react';

// ======================== 类型定义 ========================

interface VideoItem {
  title: string;
  url: string;
  platform: 'bilibili' | 'youtube';
}

interface LinkItem {
  title: string;
  url: string;
  description: string;
}

interface ResourceSectionProps {
  videos: VideoItem[];
  links: LinkItem[];
}

// ======================== 内联 SVG 图标 ========================

/** Bilibili 图标 */
function BilibiliIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
      <path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 01-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 01.16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373z" />
    </svg>
  );
}

/** YouTube 图标（内联 SVG，避免依赖 lucide-react 导出） */
function YoutubeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

// ======================== 平台配置 ========================

const PLATFORM_CONFIG: Record<string, { name: string; color: string; Icon: React.FC<{className?: string}> }> = {
  bilibili: {
    name: 'Bilibili',
    color: 'text-pink-500 dark:text-pink-400 bg-pink-50 dark:bg-pink-500/10 border-pink-200/50 dark:border-pink-500/20',
    Icon: BilibiliIcon,
  },
  youtube: {
    name: 'YouTube',
    color: 'text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200/50 dark:border-red-500/20',
    Icon: YoutubeIcon,
  },
};

// ======================== 组件 ========================

export default function ResourceSection({ videos, links }: ResourceSectionProps) {
  const hasVideos = videos && videos.length > 0;
  const hasLinks = links && links.length > 0;

  // 两个字段都为空 → 不渲染
  if (!hasVideos && !hasLinks) return null;

  return (
    <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 border border-white/40 dark:border-white/10 shadow-xl">
      <h3 className="font-black text-slate-900 dark:text-white mb-4 border-l-4 border-indigo-500 pl-2 text-sm">
        学习资源
      </h3>

      {/* ====== 推荐视频 ====== */}
      {hasVideos && (
        <div className="mb-4">
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wide">
            推荐视频
          </h4>
          <div className="space-y-2">
            {videos.map((video, idx) => {
              const config = PLATFORM_CONFIG[video.platform] || PLATFORM_CONFIG.youtube;
              return (
                <a
                  key={idx}
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors
                    hover:scale-[1.02] hover:shadow-sm
                    ${config.color}`}
                >
                  {/* 平台图标 */}
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white/50 dark:bg-slate-700/50">
                    <config.Icon className="w-4 h-4" />
                  </div>
                  {/* 视频标题 + 平台名称 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">
                      {video.title}
                    </p>
                    <p className="text-[10px] opacity-60 mt-0.5">{config.name} 视频</p>
                  </div>
                  {/* 播放图标 */}
                  <Tv size={14} className="shrink-0 opacity-60" />
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* ====== 相关链接 ====== */}
      {hasLinks && (
        <div>
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wide">
            相关链接
          </h4>
          <ul className="space-y-2">
            {links.map((link, idx) => (
              <li key={idx}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-xl hover:bg-white/40 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-indigo-500/10"
                >
                  <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
                    {link.title}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {link.description}
                  </p>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
