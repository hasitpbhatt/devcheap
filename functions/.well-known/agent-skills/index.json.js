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

  const body = {
    $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
    skills: [
      {
        name: 'browse-deals',
        type: 'skill-md',
        description: 'Browse and search developer tool deals by category, pricing model, or keyword.',
        url: '/.well-known/agent-skills/browse-deals/SKILL.md',
        digest: 'sha256:d09e9a1a8dfab5a6ff6de510253583aa2977875378e327868e1d94fef83f6b85'
      },
      {
        name: 'view-deal-detail',
        type: 'skill-md',
        description: 'View detailed information about a specific developer tool deal including pricing, category, and affiliate link.',
        url: '/.well-known/agent-skills/view-deal-detail/SKILL.md',
        digest: 'sha256:7d6cc1f83cc046d2efeb57b455c1f66445ccaf2fb71fc555cb1ef5a4be286d49'
      },
      {
        name: 'discover-categories',
        type: 'skill-md',
        description: 'List all available deal categories on DevCheap with their deal counts.',
        url: '/.well-known/agent-skills/discover-categories/SKILL.md',
        digest: 'sha256:b0f8029eff6e162b8fc7bc1e46a1c9a6a89cf57384f00b71855f35b53696d5e0'
      },
      {
        name: 'auth-md',
        type: 'skill-md',
        description: 'Agent registration system using auth.md with anonymous OAuth flow for AI agent authentication.',
        url: '/.well-known/agent-skills/auth-md/SKILL.md',
        digest: 'sha256:49e6557f975d7c4e2073d2b3057d1e12de617b994a6dc0b93f8dce652366e96e'
      }
    ]
  };

  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      ...cors
    }
  });
}
