interface Env {
  AI?: {
    run: (model: string, input: any) => Promise<any>;
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};

export async function onRequest(context: { request: Request; env: Env }) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const body: any = await request.json();
    const prompt = String(body?.prompt || '').trim();
    const systemPrompt = String(
      body?.systemPrompt ||
        'You are Savantix STEM Solver. Provide rigorous, concise, first-principles derivations with clean LaTeX math.'
    );
    const jsonMode = Boolean(body?.jsonMode);

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (!env?.AI) {
      return new Response(
        JSON.stringify({ success: false, error: 'Workers AI binding unavailable' }),
        { status: 503, headers: corsHeaders }
      );
    }

    const aiRes = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1400,
    });

    const content =
      typeof aiRes?.response === 'string'
        ? aiRes.response
        : typeof aiRes === 'string'
        ? aiRes
        : JSON.stringify(aiRes);

    if (jsonMode) {
      let parsed: any = null;
      try {
        const cleaned = content.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
        parsed = JSON.parse(cleaned);
      } catch {
        const match = content.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            parsed = JSON.parse(match[0]);
          } catch {}
        }
      }
      return new Response(
        JSON.stringify({ success: true, provider: 'cloudflare-workers-ai', json: parsed, text: content }),
        { status: 200, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ success: true, provider: 'cloudflare-workers-ai', text: content }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || 'AI request failed' }),
      { status: 500, headers: corsHeaders }
    );
  }
}
