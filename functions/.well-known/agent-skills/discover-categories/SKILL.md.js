const ALLOWED_ORIGINS = ['https://devcheap.click', 'https://devcheap-3uq.pages.dev'];

const SKILL_MD = `---
name: discover-categories
description: List all available deal categories on DevCheap with their deal counts.
---

# Discover Categories

DevCheap organizes deals into categories for easy browsing.

## Categories

- Hosting & Cloud
- AI & LLM
- APIs & Email
- APIs & Payments
- APIs & Search
- Databases
- Security
- Auth
- Developer Tools
- Domain & Hosting
- Monitoring
- Storage & Cloud
- Productivity
- SEO
- Social Media
- Customer Support
- Sales & Marketing
- Design & Collaboration
- Web Analytics
- Media & Images
- CI/CD
- Testing & QA
- Services
- AI

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
