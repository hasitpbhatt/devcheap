const ALLOWED_ORIGINS = ['https://devcheap.click', 'https://devcheap-3uq.pages.dev'];

export async function onRequest(context) {
  const { request } = context;
  const origin = request.headers.get('Origin') || '';
  const cors = ALLOWED_ORIGINS.some(a => origin.startsWith(a))
    ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Accept' }
    : {};

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { ...cors, 'Access-Control-Max-Age': '86400' } });
  }

  const url = new URL(request.url);
  const indexUrl = url.origin + '/.well-known/agent-skills/index.json';

  return new Response(null, {
    status: 301,
    headers: {
      'Location': indexUrl,
      'Cache-Control': 'public, max-age=3600',
      ...cors
    }
  });
}
