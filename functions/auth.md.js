const AUTH_MD = `# auth.md — DevCheap Agent Registration

DevCheap is a public directory of developer tool deals. Agents can browse, search, filter, and discover deals on behalf of users without authentication.

## For Agents

This file tells agents how to register and access DevCheap resources programmatically.

## Supported Flows

DevCheap supports the **anonymous** flow — no user identity assertion is required. The agent registers directly for a scoped bearer token.

## Scopes

| Scope | Description |
|---|---|
| \`deals:read\` | Browse, search, filter, and read deal details |

## Registration

Send a \`POST\` request to \`/agent/register\`:

\`\`\`json
{
  "scope": "deals:read"
}
\`\`\`

Response:

\`\`\`json
{
  "access_token": "dc_...",
  "token_type": "bearer",
  "scope": "deals:read"
}
\`\`\`

## Using Credentials

Include the token in the \`Authorization: Bearer <token>\` header when accessing DevCheap resources.

## Endpoints

| Endpoint | Description |
|---|---|
| \`POST /agent/register\` | Register for a new access token |
| \`POST /agent/claim\` | Claim an issued credential |
| \`POST /agent/auth\` | Authorization endpoint |
| \`POST /agent/token\` | Token exchange |

## Discovery Metadata

- OAuth Protected Resource: \`/.well-known/oauth-protected-resource\`
- OAuth Authorization Server: \`/.well-known/oauth-authorization-server\`
- Agent Skills: \`/.well-known/agent-skills\`

## Contact

For questions or partnership inquiries, visit https://devcheap.click
`;

export async function onRequest(context) {
  return new Response(AUTH_MD, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
