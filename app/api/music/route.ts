/**
 * ✅ Step3: 网易云音乐 API — 改用 Meting API 获取歌曲
 *
 * 原方案直接调 music.163.com 公开 API，经常被封禁
 * 现改用第三方 Meting API（api.injahow.cn）绕过限制
 *
 * Meting API 返回格式：
 *   [{ id, name, artist, cover, url, lrc, ... }]
 */

import { NextRequest, NextResponse } from 'next/server'

type SongResult = {
  id: string
  name?: string
  artist?: string
  author?: string
  cover?: string
  pic?: string
  url?: string
  lrc?: string
  error?: string
}

// 服务端内存缓存：避免每次请求都调外部 API
const cache = new Map<string, { data: SongResult[]; ts: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 分钟

export async function GET(request: NextRequest) {
  const ids = request.nextUrl.searchParams.get('ids')
  if (!ids) {
    return NextResponse.json({ error: 'Missing ids parameter' }, { status: 400 })
  }

  // 检查缓存
  const cacheKey = ids;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  const songIds = ids.split(',').map((id) => id.trim()).filter(Boolean)

  // 逐个通过 Meting API 查询歌曲信息
  const results: SongResult[] = await Promise.all(
    songIds.map(async (songId): Promise<SongResult> => {
      try {
        const res = await fetch(
          `https://api.injahow.cn/meting/?server=netease&type=song&id=${songId}`,
          { signal: AbortSignal.timeout(8000) }
        )

        if (!res.ok) {
          return { id: songId, error: `Meting API 返回 ${res.status}` }
        }

        const data = await res.json()
        if (!data || data.length === 0) {
          return { id: songId, error: 'not_found' }
        }

        const song = data[0]

        return {
          id: songId,
          name: song.name,
          artist: song.artist,
          author: song.artist,
          cover: song.cover || '',
          pic: song.cover || '',
          url: song.url || '',
          lrc: song.lrc || '',
        }
      } catch (error) {
        console.error(`[api/music] Meting API 获取歌曲 ${songId} 失败:`, error)
        return { id: songId, error: String(error) }
      }
    }),
  )

  // 写入缓存
  cache.set(cacheKey, { data: results, ts: Date.now() });

  return NextResponse.json(results)
}
