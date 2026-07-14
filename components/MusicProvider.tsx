"use client";

import { createContext, useContext, useState, useRef, useEffect, ReactNode, useCallback } from 'react';
import { siteConfig } from '../siteConfig';

// 【增强版 LRC 歌词解析】
function parseLrc(lrcText: string) {
  if (!lrcText || lrcText.length > 30000) return [];

  const lines = lrcText.split(/\r?\n/);
  const result = [];

  for (let line of lines) {
    const matches = [...line.matchAll(/\[(\d{2,}):(\d{2})(?:\.(\d{2,3}))?\]/g)];
    if (matches.length > 0) {
      let text = line.replace(/\[\d{2,}:\d{2}(?:\.\d{2,3})?\]/g, '').trim();

      // 剔除控制字符
      const cleanText = text.replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, "");

      if (cleanText) {
        for (const match of matches) {
          const min = parseInt(match[1]);
          const sec = parseInt(match[2]);
          const ms = match[3] ? parseInt(match[3]) : 0;
          const divisor = match[3] && match[3].length === 3 ? 1000 : 100;
          const time = min * 60 + sec + ms / divisor;
          result.push({ time, text: cleanText });
        }
      }
    }
  }
  return result.sort((a, b) => a.time - b.time);
}

type PlayMode = 'loop' | 'single' | 'random';

interface MusicContextType {
  playlist: any[];
  currentIndex: number;
  currentSong: any;
  isPlaying: boolean;
  progress: number;
  currentTime: number;
  duration: number;
  currentLyric: string;
  isLoading: boolean;
  volume: number;
  isMuted: boolean;
  playMode: PlayMode;

  togglePlay: () => void;
  nextSong: () => void;
  prevSong: () => void;
  handleSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  playSong: (index: number) => void;
  setVolume: (value: number) => void;
  toggleMute: () => void;
  togglePlayMode: () => void;
  addSong: (songId: string) => Promise<{ error?: string }>;
  removeSong: (songId: string) => void;
}

const MusicContext = createContext<MusicContextType | null>(null);

const PLAYLIST_CACHE_KEY = 'music_playlist_cache';
const CUSTOM_IDS_KEY = 'music_custom_ids';

// 从 localStorage 读取用户添加的歌单 ID
function getCustomIds(): string[] {
  try {
    const raw = localStorage.getItem(CUSTOM_IDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustomIds(ids: string[]) {
  localStorage.setItem(CUSTOM_IDS_KEY, JSON.stringify(ids));
}

export function MusicProvider({ children }: { children: ReactNode }) {
  const [playlist, setPlaylist] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lyrics, setLyrics] = useState<{ time: number; text: string }[]>([]);
  const [currentLyric, setCurrentLyric] = useState("正在连接高可用神经云端...");
  const [isLoading, setIsLoading] = useState(true);

  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playMode, setPlayMode] = useState<PlayMode>('loop');

  const audioRef = useRef<HTMLAudioElement>(null);
  const isMountedRef = useRef(true);

  // 合并默认 + 自定义歌单 ID
  const getAllIds = useCallback((): string[] => {
    const defaults = siteConfig.cloudMusicIds || [];
    const customs = getCustomIds();
    // 去重，自定义在前（优先保留用户选择）
    const merged = [...new Set([...defaults, ...customs])];
    return merged;
  }, []);

  // 拉取歌曲数据
  const fetchMusicData = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return [];
    const res = await fetch(`/api/music?ids=${ids.join(',')}`);
    const rawResults = await res.json();
    return rawResults
      .filter((song: any) => song && song.url && !song.error)
      .map((song: any) => ({
        id: song.id || Math.random().toString(),
        title: song.name || '未知歌曲',
        artist: song.artist || song.author || '未知歌手',
        cover: song.cover || song.pic || 'https://bu.dusays.com/2026/03/24/69c24230a5ff8.jpg',
        src: song.url,
        lrcUrl: null,
        lyrics: song.lrc ? parseLrc(song.lrc) : []
      }));
  }, []);

  // 初始化：localStorage 秒开 + 后台刷新
  useEffect(() => {
    isMountedRef.current = true;
    const loadPlaylist = async () => {
      // Step 1: 先从 localStorage 读缓存，立即显示（秒开）
      const cached = localStorage.getItem(PLAYLIST_CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            if (isMountedRef.current) {
              setPlaylist(parsed);
              setIsLoading(false);
            }
          }
        } catch { /* ignore cache parse error */ }
      }

      // Step 2: 后台请求 API 刷新数据
      const ids = getAllIds();
      if (ids.length > 0) {
        const data = await fetchMusicData(ids);
        if (isMountedRef.current && data.length > 0) {
          setPlaylist(data);
          localStorage.setItem(PLAYLIST_CACHE_KEY, JSON.stringify(data));
        }
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    loadPlaylist();

    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (playlist.length === 0) return;
    let isMounted = true;
    const currentSong = playlist[currentIndex];
    setLyrics([]);
    setCurrentLyric("♪ 正在缓冲 ♪");
    if (currentSong.lyrics && currentSong.lyrics.length > 0) {
      if (isMounted) {
        setLyrics(currentSong.lyrics);
        setCurrentLyric(currentSong.lyrics[0]?.text || "\u266a \u7eaf\u4eab\u97f3\u4e50 \u266a");
      }
    } else if (currentSong.lrcUrl) {
      fetch(currentSong.lrcUrl)
        .then(res => res.text())
        .then(text => {
          if (isMounted) {
             const parsed = parseLrc(text);
             setLyrics(parsed);
             setPlaylist(prev => {
                const newPlaylist = [...prev];
                newPlaylist[currentIndex].lyrics = parsed;
                return newPlaylist;
             });
          }
        })
        .catch(() => { if (isMounted) setCurrentLyric("\u266a \u7eaf\u4eab\u97f3\u4e50 \u266a"); });
    }

    if (isPlaying && audioRef.current) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => setIsPlaying(false));
      }
    }
    return () => { isMounted = false; };
  }, [currentIndex, playlist.length]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(!isPlaying);
    }
  };

  const nextSong = () => {
    if (playMode === 'random') {
      setCurrentIndex(Math.floor(Math.random() * playlist.length));
    } else {
      setCurrentIndex((prev) => (prev + 1) % playlist.length);
    }
  };

  const prevSong = () => {
    if (playMode === 'random') {
      setCurrentIndex(Math.floor(Math.random() * playlist.length));
    } else {
      setCurrentIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
    }
  };

  const playSong = (index: number) => {
    setCurrentIndex(index);
    if (!isPlaying) setIsPlaying(true);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const { currentTime, duration } = audioRef.current;
      setCurrentTime(currentTime);
      setDuration(duration || 0);
      setProgress((currentTime / (duration || 1)) * 100);

      if (lyrics.length > 0) {
        const activeLyric = lyrics.slice().reverse().find(l => currentTime >= l.time);
        if (activeLyric && activeLyric.text !== currentLyric) {
          setCurrentLyric(activeLyric.text);
        }
      }
    }
  };

  const handleEnded = () => {
    if (playMode === 'single' && audioRef.current) {
       audioRef.current.currentTime = 0;
       audioRef.current.play();
    } else {
       nextSong();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = Number(e.target.value);
    setProgress(newProgress);
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = (newProgress / 100) * audioRef.current.duration;
    }
  };

  const setVolume = (val: number) => {
    setVolumeState(val);
    if (isMuted && val > 0) setIsMuted(false);
  };

  const toggleMute = () => setIsMuted(!isMuted);

  const togglePlayMode = () => {
    setPlayMode(prev => {
      if (prev === 'loop') return 'single';
      if (prev === 'single') return 'random';
      return 'loop';
    });
  };

  // ===== 新增：网站内添加/删除歌曲 =====

  const addSong = async (songId: string): Promise<{ error?: string }> => {
    // 去重检查
    const customs = getCustomIds();
    const existing = [...siteConfig.cloudMusicIds, ...customs];
    if (existing.includes(songId)) {
      return { error: '这首歌已经在歌单里了' };
    }

    // 验证歌曲是否存在
    try {
      const res = await fetch(`/api/music/add?id=${songId}`);
      const data = await res.json();
      if (data.error || !data.url) {
        return { error: data.error || '无法获取歌曲信息' };
      }

      // 保存到 localStorage
      const newIds = [...customs, songId];
      saveCustomIds(newIds);

      // 刷新歌单
      const allIds = [...siteConfig.cloudMusicIds, ...newIds];
      const newPlaylist = await fetchMusicData(allIds);
      if (newPlaylist.length > 0) {
        setPlaylist(newPlaylist);
        localStorage.setItem(PLAYLIST_CACHE_KEY, JSON.stringify(newPlaylist));
      }

      return {};
    } catch {
      return { error: '网络错误，请重试' };
    }
  };

  const removeSong = (songId: string) => {
    const customs = getCustomIds();
    // 只能移除用户自己添加的歌曲，不能移除默认歌曲
    if (!customs.includes(songId)) return;

    const newIds = customs.filter(id => id !== songId);
    saveCustomIds(newIds);

    // 刷新歌单
    const allIds = [...siteConfig.cloudMusicIds, ...newIds];
    fetchMusicData(allIds).then(newPlaylist => {
      if (newPlaylist.length > 0) {
        setPlaylist(newPlaylist);
        localStorage.setItem(PLAYLIST_CACHE_KEY, JSON.stringify(newPlaylist));
        // 如果当前歌曲被删了，切到第一首
        if (currentIndex >= newPlaylist.length) {
          setCurrentIndex(0);
        }
      }
    });
  };

  const currentSong = playlist[currentIndex];

  return (
    <MusicContext.Provider value={{
        playlist, currentIndex, currentSong, isPlaying, progress, currentTime, duration, currentLyric, isLoading,
        volume, isMuted, playMode,
        togglePlay, nextSong, prevSong, handleSeek,
        playSong, setVolume, toggleMute, togglePlayMode,
        addSong, removeSong
    }}>
      {children}
      {currentSong && (
        <audio
          ref={audioRef}
          src={currentSong.src}
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onLoadedMetadata={handleTimeUpdate}
        />
      )}
    </MusicContext.Provider>
  );
}

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) throw new Error("useMusic must be used within MusicProvider");
  return context;
};
