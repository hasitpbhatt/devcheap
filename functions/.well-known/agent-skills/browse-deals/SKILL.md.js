const ALLOWED_ORIGINS = ['https://devcheap.click', 'https://devcheap-3uq.pages.dev'];

const SKILL_MD = `---
name: browse-deals
description: Browse and search developer tool deals by category, pricing model, or keyword.
---

# Browse Deals

Browse and filter developer tool deals on DevCheap.

## Capabilities

### Browse by category
View deals filtered by category. Available categories: Hosting & Cloud, AI & LLM, APIs & Email, Databases, Security, Developer Tools, and more.

### Search
Search deals by keyword across name and description.

### Filter by pricing
Filter by pricing model: Free, Freemium, Free Trial, Credit-based, Discounted.

### Pagination
Results are paginated; navigate between pages.

## URL
https://devcheap.click/
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
