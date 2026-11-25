const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

function extractVideos(obj: any, results: any[] = []): any[] {
  if (!obj || typeof obj !== 'object') return results;
  if (obj.videoRenderer && obj.videoRenderer.videoId) {
    const v = obj.videoRenderer;
    const title =
      v.title?.runs?.map((r: any) => r.text).join('') ||
      v.title?.simpleText ||
      '';
    const author =
      v.ownerText?.runs?.map((r: any) => r.text).join('') ||
      v.shortBylineText?.runs?.map((r: any) => r.text).join('') ||
      '';
    const duration = v.lengthText?.simpleText || '';
    if (v.videoId && title) {
      results.push({
        id: 'yt_live_' + v.videoId,
        youtubeId: v.videoId,
        title: title
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'"),
        artist: author.replace(/&amp;/g, '&'),
        category: 'custom',
        tag: duration ? `${duration}` : 'YouTube Video',
        duration: duration || 'Video',
      });
    }
  }
  for (const k of Object.keys(obj)) {
    extractVideos(obj[k], results);
  }
  return results;
}

export async function onRequest(context: { request: Request }) {
  const { request } = context;
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  const url = new URL(request.url);
  const query = (url.searchParams.get('q') || '').trim();
  if (!query) {
    return new Response(JSON.stringify({ results: [] }), { status: 200, headers: corsHeaders });
  }

  try {
    const ytUrl = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query);
    const ytRes = await fetch(ytUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    if (ytRes.ok) {
      const html = await ytRes.text();
      const match =
        html.match(/var ytInitialData = ({.*?});<\/script>/s) ||
        html.match(/ytInitialData\s*=\s*({.+?});/);
      if (match) {
        const json = JSON.parse(match[1]);
        const rawVideos = extractVideos(json);
        const seen = new Set<string>();
        const unique = rawVideos.filter((v) => {
          if (seen.has(v.youtubeId)) return false;
          seen.add(v.youtubeId);
          return true;
        });
        return new Response(
          JSON.stringify({ results: unique.slice(0, 12) }),
          { status: 200, headers: corsHeaders }
        );
      }
    }
  } catch (e) {
    // fallback empty
  }

  return new Response(JSON.stringify({ results: [] }), { status: 200, headers: corsHeaders });
}
