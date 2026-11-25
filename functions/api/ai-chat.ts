const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};

export async function onRequest(context: { request: Request }) {
  const { request } = context;

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

    const upstream = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      }),
    });

    if (!upstream.ok) {
      return new Response(
        JSON.stringify({ success: false, error: `Upstream AI error (${upstream.status})` }),
        { status: 502, headers: corsHeaders }
      );
    }

    const data: any = await upstream.json();
    const content = data?.choices?.[0]?.message?.content || '';

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
        JSON.stringify({ success: true, json: parsed, text: content }),
        { status: 200, headers: corsHeaders }
      );
    }

    return new Response(JSON.stringify({ success: true, text: content }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || 'AI request failed' }),
      { status: 500, headers: corsHeaders }
    );
  }
}
