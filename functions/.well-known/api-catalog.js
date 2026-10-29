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
    linkset: [
      {
        anchor: 'https://devcheap.click',
        'service-desc': [
          { href: 'https://devcheap.click/data/deals.jsonl', type: 'application/jsonl+json' }
        ],
        'service-doc': [
          { href: 'https://devcheap.click/', type: 'text/html' }
        ]
      }
    ]
  };

  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/linkset+json; charset=utf-8',
      ...cors
    }
  });
}
