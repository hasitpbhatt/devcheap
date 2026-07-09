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
    issuer: 'https://devcheap.click',
    authorization_endpoint: 'https://devcheap.click/agent/auth',
    token_endpoint: 'https://devcheap.click/agent/token',
    response_types_supported: ['token'],
    service_documentation: 'https://devcheap.click/auth.md',
    agent_auth: {
      skill: 'https://devcheap.click/.well-known/agent-skills',
      register_uri: 'https://devcheap.click/agent/register',
      identity_types_supported: ['anonymous'],
      anonymous: {
        credential_types_supported: ['urn:ietf:params:oauth:token-type:access_token'],
        claim_uri: 'https://devcheap.click/agent/claim'
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
