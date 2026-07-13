/**
 * ✅ Step4: AI 猫猫助理 API 路由 — DeepSeek 驱动的暹罗猫煤球
 *
 * 与 AgentAssistant 的 /api/chat 不同：
 *   - 非流式：返回 JSON { reply: "..." }
 *   - 猫猫人格：system prompt 从 siteConfig.catAssistantConfig 读取
 *   - 简短回复：maxOutputTokens 150，temperature 0.85（更有随机性）
 */

import { siteConfig } from '../../../../siteConfig';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: 'Missing message' }), { status: 400 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key missing' }), { status: 500 });
    }

    const config = siteConfig.catAssistantConfig;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.modelId,
        messages: [
          { role: 'system', content: config.systemPrompt },
          { role: 'user', content: message },
        ],
        max_tokens: config.maxOutputTokens,
        temperature: config.temperature,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return new Response(JSON.stringify({
        error: `DeepSeek API 返回 ${response.status}`,
        details: err.error?.message || '未知错误',
      }), { status: response.status });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || '喵... 本喵的脑回路短路了喵...';

    return new Response(JSON.stringify({ reply }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function GET() {
  return new Response(JSON.stringify({ status: 'Ready', model: 'CyberCat - DeepSeek' }), { status: 200 });
}
