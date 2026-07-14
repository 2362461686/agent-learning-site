/**
 * 单曲查询 API — 用于网站内添加歌曲到歌单
 *
 * GET /api/music/add?id=1809646618
 * → { id, name, artist, cover, url }
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
  }

  try {
    const res = await fetch(
      `https://api.injahow.cn/meting/?server=netease&type=song&id=${id}`,
      { signal: AbortSignal.timeout(8000) }
    )

    if (!res.ok) {
      return NextResponse.json({ error: `API returned ${res.status}` }, { status: 502 })
    }

    const data = await res.json()
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 })
    }

    const song = data[0]
    return NextResponse.json({
      id: id,
      name: song.name || '未知歌曲',
      artist: song.artist || '未知歌手',
      cover: song.cover || '',
      url: song.url || '',
      lrc: '',
    })
  } catch (error) {
    console.error('[api/music/add] Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
