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
    $schema: 'https://agentskills.io/schemas/v0.2.0/skills-index.json',
    skills: [
      {
        name: 'browse-deals',
        type: 'capability',
        description: 'Browse and filter developer tool deals by category, search query, or pricing model',
        url: 'https://devcheap.click/'
      },
      {
        name: 'view-deal-detail',
        type: 'capability',
        description: 'View detailed information about a specific developer tool deal',
        url: 'https://devcheap.click/deals/{id}/'
      },
      {
        name: 'discover-categories',
        type: 'capability',
        description: 'Discover available deal categories including Hosting, AI, APIs, Security, and more',
        url: 'https://devcheap.click/'
      },
      {
        name: 'dns-aid-discovery',
        type: 'discovery',
        description: 'DNS for AI Discovery (DNS-AID) SVCB record published at _index._agents.devcheap.click for agent endpoint discovery via DNS',
        url: 'https://devcheap.click/'
      }
    ]
  };

  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...cors
    }
  });
}
