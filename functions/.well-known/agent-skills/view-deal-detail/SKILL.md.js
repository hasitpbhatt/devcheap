const ALLOWED_ORIGINS = ['https://devcheap.click', 'https://devcheap-3uq.pages.dev'];

const SKILL_MD = `---
name: view-deal-detail
description: View detailed information about a specific developer tool deal including pricing, category, and affiliate link.
---

# View Deal Detail

Each deal on DevCheap has a dedicated detail page.

## Information Available

- Deal name and description
- Category classification
- Pricing model (Free, Freemium, Free Trial, Credit-based, Discounted)
- Affiliate / claim link
- Coupon code (if available)
- Breadcrumb navigation
- JSON-LD structured data

## URL Pattern
https://devcheap.click/deals/{id}/
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
