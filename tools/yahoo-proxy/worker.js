// Cloudflare Worker: lets Income Factory read Yahoo Finance quotes from the browser.
// Yahoo sends no CORS headers, so the app asks this Worker, which asks Yahoo and adds them.
// Only the chart endpoint is forwarded (no open proxy). Responses are cached for 5 minutes.

// Sites allowed to call this Worker from a browser. Add your own if you host the app elsewhere.
const ALLOWED_ORIGINS = ['https://cescorcio.github.io'];

const SYMBOL_PATH = /^\/v8\/finance\/chart\/[A-Za-z0-9.\-^=]{1,20}$/;

export default {
  async fetch(request) {
    const origin = request.headers.get('Origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Vary': 'Origin',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    const url = new URL(request.url);
    if (request.method !== 'GET' || !SYMBOL_PATH.test(url.pathname)) {
      return new Response(JSON.stringify({ chart: { error: { code: 'Not Found', description: 'Only /v8/finance/chart/<symbol> is supported' } } }),
        { status: 404, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const upstream = new URL('https://query1.finance.yahoo.com' + url.pathname);
    for (const key of ['range', 'interval']) {
      const value = url.searchParams.get(key);
      if (value && /^[0-9a-z]{1,4}$/.test(value)) upstream.searchParams.set(key, value);
    }
    const response = await fetch(upstream, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
      cf: { cacheTtl: 300, cacheEverything: true },
    });
    return new Response(response.body, {
      status: response.status,
      headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
    });
  },
};
