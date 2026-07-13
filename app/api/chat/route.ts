/**
 * ✅ Phase1: DeepSeek AI 学习助手 API 代理
 *
 * 将客户端请求转发到 DeepSeek V4 Pro API（OpenAI 兼容格式），
 * 支持流式 SSE 响应。API key 仅在服务端使用，不会暴露到客户端。
 *
 * 请求体:
 *   { messages: [{ role: "user" | "assistant", content: string }], slug?: string }
 *
 * 响应: SSE 流式事件（text/event-stream）
 */

import { NextRequest } from 'next/server';
import { siteConfig } from '../../../siteConfig';

// DeepSeek API 端点（OpenAI 兼容）
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, slug } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'messages 数组不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 从环境变量获取 API key（服务端安全）
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'DEEPSEEK_API_KEY 未配置，请在 .env.local 中设置' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 从 siteConfig 读取助手配置
    const { modelId, systemPrompt, maxOutputTokens, temperature } = siteConfig.aiAssistantConfig;

    // 构建系统提示：如果有 slug，追加当前学习上下文
    let fullSystemPrompt = systemPrompt;
    if (slug) {
      fullSystemPrompt += ` 当前用户正在学习教程「${slug}」，请结合该教程的主题回答他的问题，可以适当引用教程中的知识点。`;
    }

    // 构建 OpenAI 格式的消息列表
    const apiMessages = [
      { role: 'system', content: fullSystemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    ];

    // 调用 DeepSeek API（流式）
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        model: modelId,
        messages: apiMessages,
        stream: true,
        max_tokens: maxOutputTokens,
        temperature,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '未知错误');
      console.error(`[api/chat] DeepSeek API 错误 (${response.status}):`, errorText);
      return new Response(
        JSON.stringify({ error: `AI 服务暂时不可用 (${response.status})，请稍后重试` }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 将 DeepSeek 的流式响应透传给客户端
    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('[api/chat] 服务器内部错误:', error);
    return new Response(
      JSON.stringify({ error: '服务器内部错误，请稍后重试' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
