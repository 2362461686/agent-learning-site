/**
 * 歌词代理路由
 * 通过服务端请求 Meting API type=lrc，返回纯文本 LRC 歌词
 * 避免客户端 CORS 问题
 *
 * GET /api/music/lrc?id=1809646618
 */

import { NextRequest, NextResponse } from 'next/server'

// 服务端内存缓存
const cache = new Map<string, { data: string; ts: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 分钟

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
  }

  // 检查缓存
  const cached = cache.get(id);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return new NextResponse(cached.data, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  try {
    const res = await fetch(
      `https://api.injahow.cn/meting/?server=netease&type=lrc&id=${id}`,
      { signal: AbortSignal.timeout(8000) }
    )

    if (!res.ok) {
      return NextResponse.json(
        { error: `Meting API 返回 ${res.status}` },
        { status: 502 }
      )
    }

    const text = await res.text()

    // 写入缓存
    cache.set(id, { data: text, ts: Date.now() });

    return new NextResponse(text, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (error) {
    console.error(`[api/music/lrc] 获取歌词 ${id} 失败:`, error)
    return NextResponse.json(
      { error: '获取歌词失败' },
      { status: 500 }
    )
  }
}
