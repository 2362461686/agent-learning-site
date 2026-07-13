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

export async function GET(request: NextRequest) {
  const ids = request.nextUrl.searchParams.get('ids')
  if (!ids) {
    return NextResponse.json({ error: 'Missing ids parameter' }, { status: 400 })
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
          lrc: '', // Meting API 返回的 lrc 是歌词 URL，由 MusicProvider 自己 fetch
        }
      } catch (error) {
        console.error(`[api/music] Meting API 获取歌曲 ${songId} 失败:`, error)
        return { id: songId, error: String(error) }
      }
    }),
  )

  return NextResponse.json(results)
}
