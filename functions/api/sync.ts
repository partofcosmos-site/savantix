const syncStore: Record<string, { payload: any; updatedAt: string }> = {};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

const cleanKey = (key: string) =>
  (key || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

export async function onRequest(context: { request: Request }) {
  const { request } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(request.url);

  if (request.method === 'GET') {
    const rawId =
      url.searchParams.get('canonicalId') ||
      url.searchParams.get('key') ||
      url.searchParams.get('email') ||
      '';
    if (!rawId) {
      return new Response(
        JSON.stringify({ success: false, message: 'canonicalId parameter is required' }),
        { status: 400, headers: corsHeaders }
      );
    }
    const id = cleanKey(rawId);
    const item = syncStore[id];
    return new Response(
      JSON.stringify({
        success: true,
        exists: Boolean(item),
        canonicalId: id,
        payload: item ? item.payload : null,
        updatedAt: item ? item.updatedAt : null,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: corsHeaders }
    );
  }

  if (request.method === 'POST') {
    try {
      const body: any = await request.json();
      const rawId = body?.canonicalId || body?.key || body?.email || '';
      if (!rawId) {
        return new Response(
          JSON.stringify({ success: false, message: 'canonicalId is required in body' }),
          { status: 400, headers: corsHeaders }
        );
      }
      const id = cleanKey(rawId);
      const payload = body.snapshot || body.payload || body.data || body;
      const updatedAt = new Date().toISOString();
      syncStore[id] = { payload, updatedAt };
      return new Response(
        JSON.stringify({ success: true, canonicalId: id, updatedAt }),
        { status: 200, headers: corsHeaders }
      );
    } catch (e: any) {
      return new Response(
        JSON.stringify({ success: false, message: e?.message || 'Invalid JSON body' }),
        { status: 400, headers: corsHeaders }
      );
    }
  }

  return new Response(
    JSON.stringify({ success: false, message: 'Method not allowed' }),
    { status: 405, headers: corsHeaders }
  );
}
