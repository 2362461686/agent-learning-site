/**
 * 月薪喵 Chat API — RAG 增强 + 多轮对话
 *
 * 功能：
 *   1. RAG 检索：加载 public/rag-index.json，TF-IDF + 余弦相似度取 top-3 相关片段
 *   2. 多轮对话：内存 Map 按 sessionId 管理对话历史，30 分钟过期，保留最近 10 轮
 *   3. 猫猫人格：保持月薪喵傲娇风格，但回答可引用网站知识
 *
 * 运行时：Node.js（需要文件系统读取 RAG 索引）
 */

import { siteConfig } from '../../../../siteConfig';
import { readFileSync } from 'fs';
import { join } from 'path';

// ---------------------------------------------------------------------------
// RAG 索引（懒加载 + 缓存）
// ---------------------------------------------------------------------------
let _ragCache: any = null;
let _ragCacheTime = 0;
const RAG_CACHE_TTL = 10 * 60 * 1000; // 10 分钟重新加载

function loadRagIndex() {
  const now = Date.now();
  if (_ragCache && now - _ragCacheTime < RAG_CACHE_TTL) {
    return _ragCache;
  }
  try {
    const raw = readFileSync(join(process.cwd(), 'public', 'rag-index.json'), 'utf-8');
    _ragCache = JSON.parse(raw);
    _ragCacheTime = now;
    return _ragCache;
  } catch {
    console.warn('[CatAPI] RAG index not found, falling back to no-knowledge mode');
    return null;
  }
}

// ---------------------------------------------------------------------------
// 与 build-rag-index.mjs 一致的 tokenize 实现
// ---------------------------------------------------------------------------
function* tokenize(text: string): Generator<string> {
  const cleaned = text.replace(/[^\u4e00-\u9fff\w]/g, ' ').trim();
  const segments = cleaned.split(/\s+/).filter(Boolean);
  for (const seg of segments) {
    if (/^[\u4e00-\u9fff]+$/.test(seg)) {
      for (let i = 0; i < seg.length; i++) {
        yield seg[i];
        if (i + 1 < seg.length) yield seg[i] + seg[i + 1];
      }
    } else {
      yield seg.toLowerCase();
    }
  }
}

// ---------------------------------------------------------------------------
// 构建查询的 TF 向量（稀疏：vocabIndex → count）
// ---------------------------------------------------------------------------
function queryTF(text: string, vocab: string[]): Map<number, number> {
  const vocabIndex = new Map(vocab.map((t, i) => [t, i]));
  const tf = new Map<number, number>();
  for (const token of tokenize(text)) {
    const idx = vocabIndex.get(token);
    if (idx !== undefined) {
      tf.set(idx, (tf.get(idx) || 0) + 1);
    }
  }
  return tf;
}

// ---------------------------------------------------------------------------
// 余弦相似度：queryTF(稀疏) vs chunkVector(稠密)
// ---------------------------------------------------------------------------
function cosineSimilarity(
  queryTF: Map<number, number>,
  chunkVec: number[],
): number {
  let dot = 0;
  let queryNorm2 = 0;

  for (const [idx, count] of queryTF.entries()) {
    dot += count * (chunkVec[idx] || 0);
    queryNorm2 += count * count;
  }

  if (queryNorm2 === 0) return 0;

  let chunkNorm2 = 0;
  for (let i = 0; i < chunkVec.length; i++) {
    chunkNorm2 += chunkVec[i] * chunkVec[i];
  }
  if (chunkNorm2 === 0) return 0;

  return dot / (Math.sqrt(queryNorm2) * Math.sqrt(chunkNorm2));
}

// ---------------------------------------------------------------------------
// RAG 检索：返回 top-K 相关片段
// ---------------------------------------------------------------------------
function retrieveRelevantChunks(
  query: string,
  ragIndex: any,
  topK: number = 3,
): { title: string; content: string }[] {
  const { vocab, chunks } = ragIndex;
  if (!vocab || !chunks || chunks.length === 0) return [];

  const qTF = queryTF(query, vocab);

  const scored = chunks.map((chunk: any) => ({
    ...chunk,
    score: cosineSimilarity(qTF, chunk.vector),
  }));

  scored.sort((a: any, b: any) => b.score - a.score);

  return scored
    .slice(0, topK)
    .filter((c: any) => c.score > 0)
    .map((c: any) => ({
      title: c.title,
      content: c.content,
    }));
}

// ---------------------------------------------------------------------------
// 多轮对话存储
// ---------------------------------------------------------------------------
interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface Session {
  messages: Message[];
  lastActive: number;
}

const sessions = new Map<string, Session>();
const SESSION_TTL = 30 * 60 * 1000; // 30 分钟过期
const MAX_HISTORY = 20; // 最多保留 10 轮（20 条消息）

// 定期清理过期会话
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 每 5 分钟
let _cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (_cleanupTimer) return;
  _cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [id, session] of sessions.entries()) {
      if (now - session.lastActive > SESSION_TTL) {
        sessions.delete(id);
      }
    }
  }, CLEANUP_INTERVAL);
  if (typeof _cleanupTimer === 'object' && 'unref' in _cleanupTimer) {
    (_cleanupTimer as NodeJS.Timeout).unref();
  }
}
ensureCleanup();

function getOrCreateSession(sessionId: string): Session {
  let session = sessions.get(sessionId);
  if (!session) {
    session = { messages: [], lastActive: Date.now() };
    sessions.set(sessionId, session);
  } else {
    session.lastActive = Date.now();
  }
  return session;
}

function addMessage(sessionId: string, msg: Message) {
  const session = getOrCreateSession(sessionId);
  session.messages.push(msg);

  // 裁剪到最近 MAX_HISTORY 条
  if (session.messages.length > MAX_HISTORY) {
    session.messages = session.messages.slice(-MAX_HISTORY);
  }
}

// ---------------------------------------------------------------------------
// API 路由
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, sessionId } = body as { message: string; sessionId?: string };

    if (!message) {
      return new Response(JSON.stringify({ error: 'Missing message' }), { status: 400 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key missing' }), { status: 500 });
    }

    const config = siteConfig.catAssistantConfig;
    const sid = sessionId || `sess_${Math.random().toString(36).slice(2, 10)}`;

    // ---- RAG 检索 ----
    const ragIndex = loadRagIndex();
    let ragContext = '';
    if (ragIndex) {
      const relevant = retrieveRelevantChunks(message, ragIndex, 3);
      if (relevant.length > 0) {
        ragContext =
          '以下网页知识可能对回答用户问题有帮助，请参考这些内容（但不要逐字复制，用你自己的话表达）：\n' +
          relevant.map((c) => `【${c.title}】${c.content}`).join('\n\n');
      }
    }

    // ---- 构建 system prompt ----
    let systemPrompt =
      config.systemPrompt +
      '\n\n你是这个 AI Agent 学习网站的守护喵，网站上的文章知识你都知道。用户问技术问题时，用你的猫猫风格回答，但内容可以参考网站知识。';

    if (ragContext) {
      systemPrompt += '\n\n' + ragContext;
    }

    // ---- 多轮对话历史 ----
    const session = getOrCreateSession(sid);
    addMessage(sid, { role: 'user', content: message });

    const apiMessages: { role: string; content: string }[] = [
      { role: 'system', content: systemPrompt },
      ...session.messages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    ];

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.modelId,
        messages: apiMessages,
        max_tokens: config.maxOutputTokens,
        temperature: config.temperature,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return new Response(
        JSON.stringify({
          error: `DeepSeek API 返回 ${response.status}`,
          details: err.error?.message || '未知错误',
        }),
        { status: response.status },
      );
    }

    const data = await response.json();
    const reply =
      data.choices?.[0]?.message?.content || '喵... 本喵的脑回路短路了喵...';

    // 保存助手回复到历史
    addMessage(sid, { role: 'assistant', content: reply });

    return new Response(JSON.stringify({ reply, sessionId: sid }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function GET() {
  return new Response(
    JSON.stringify({ status: 'Ready', model: 'CyberCat - DeepSeek (RAG enabled)' }),
    { status: 200 },
  );
}
