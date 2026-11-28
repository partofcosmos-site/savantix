/**
 * @file functions/api/logout.ts
 * @description
 * OWASP Session Management / Multi-Tenant Isolation logout endpoint.
 * Returns Clear-Site-Data headers so shared devices purge local cache & storage cleanly.
 */

export async function onRequest(context: { request: Request }) {
  const { request } = context;
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  return new Response(JSON.stringify({ success: true, cleared: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Clear-Site-Data': '"cache", "storage"',
    },
  });
}
