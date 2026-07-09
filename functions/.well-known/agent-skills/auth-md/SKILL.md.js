const ALLOWED_ORIGINS = ['https://devcheap.click', 'https://devcheap-3uq.pages.dev'];

const SKILL_MD = `---
name: auth-md
description: Agent registration system using auth.md with anonymous OAuth flow for AI agent authentication.
---

# auth.md — Agent Registration

DevCheap implements the auth.md specification for agent registration.

## Endpoints

- \`/auth.md\` — Agent registration document (text/markdown)
- \`/.well-known/oauth-protected-resource\` — OAuth Protected Resource Metadata (RFC 8707)
- \`/.well-known/oauth-authorization-server\` — Authorization Server Metadata (RFC 8414)

## Anonymous Flow

DevCheap has no user accounts. Agents register anonymously:

1. Fetch \`/auth.md\` to discover registration endpoints
2. Follow \`register_uri\` to complete anonymous registration
3. Server issues a bearer token scoped to \`deals:read\`

## Skills Discovery

Agent skills are published at \`/.well-known/agent-skills/index.json\` per the Agent Skills Discovery RFC v0.2.0.

## URL
https://devcheap.click/auth.md
`;

export async function onRequest(context) {
  const { request } = context;
  const origin = request.headers.get('Origin') || '';
  const cors = ALLOWED_ORIGINS.some(a => origin.startsWith(a))
    ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Accept' }
    : {};

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { ...cors, 'Access-Control-Max-Age': '86400' } });
  }

  return new Response(SKILL_MD, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      ...cors
    }
  });
}
