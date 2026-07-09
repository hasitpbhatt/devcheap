const ALLOWED_ORIGINS = ['https://devcheap.click', 'https://devcheap-3uq.pages.dev'];

export async function onRequest(context) {
  const { request } = context;
  const origin = request.headers.get('Origin') || '';
  const cors = ALLOWED_ORIGINS.some(a => origin.startsWith(a))
    ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Accept' }
    : {};

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { ...cors, ...{ 'Access-Control-Max-Age': '86400' } } });
  }

  const body = {
    schema: 'https://modelcontextprotocol.io/schemas/server-card.json',
    serverInfo: {
      name: 'devcheap',
      version: '1.0.0',
      description: 'Developer tool deal discovery and browsing'
    },
    capabilities: {
      resources: {
        supported: true,
        resources: [
          { uri: 'data://deals.jsonl', name: 'Deals Database', description: 'Full list of developer tool deals in JSONL format', mimeType: 'application/jsonl+json' }
        ]
      }
    }
  };

  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...cors
    }
  });
}
