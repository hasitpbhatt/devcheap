const ALLOWED_ORIGINS = ['https://devcheap.click', 'https://devcheap-3uq.pages.dev', 'http://localhost:8788', 'http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:8788', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'];

const VALID_LINK_TYPES = new Set(['claim_deal', 'top_picks_claim', 'coupon_copy', 'llm_provider', 'nav_click']);

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-store',
    },
  });
}

function isAllowedOrigin(origin) {
  if (!origin) return true;
  return ALLOWED_ORIGINS.some((a) => origin.startsWith(a));
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const origin = request.headers.get('Origin') || request.headers.get('Referer') || '';
  if (!isAllowedOrigin(origin)) {
    return jsonResponse({ error: 'Forbidden' }, 403);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const dealId = typeof body.deal_id === 'string' ? body.deal_id.trim().slice(0, 64) : '';
  const linkType = typeof body.link_type === 'string' ? body.link_type.trim() : '';
  const dealName = typeof body.deal_name === 'string' ? body.deal_name.trim().slice(0, 200) : '';
  const trackingId = typeof body.tracking_id === 'string' ? body.tracking_id.trim().slice(0, 64) : '';
  const category = typeof body.category === 'string' ? body.category.trim().slice(0, 64) : '';
  const url = typeof body.url === 'string' ? body.url.slice(0, 500) : '';
  const hasAffiliate = body.has_affiliate === true;

  if (!dealId) {
    return jsonResponse({ error: 'Missing deal_id' }, 400);
  }
  if (!VALID_LINK_TYPES.has(linkType)) {
    return jsonResponse({ error: 'Invalid link_type' }, 400);
  }

  const today = new Date().toISOString().slice(0, 10);
  const stamp = new Date().toISOString();
  const event = {
    deal_id: dealId,
    deal_name: dealName,
    tracking_id: trackingId,
    category,
    has_affiliate: hasAffiliate,
    link_type: linkType,
    url,
    timestamp: stamp,
  };

  if (env.SUBSCRIBERS) {
    try {
      const eventKey = `click:${today}:${dealId}:${linkType}:${Date.now()}`;
      const dailyKey = `click_count:${today}:${dealId}:${linkType}`;
      const dailyTotal = `click_total:${today}`;

      await env.SUBSCRIBERS.put(eventKey, JSON.stringify(event), { expirationTtl: 60 * 60 * 24 * 90 });

      const cur = await env.SUBSCRIBERS.get(dailyKey);
      const next = (cur ? parseInt(cur, 10) : 0) + 1;
      await env.SUBSCRIBERS.put(dailyKey, String(next), { expirationTtl: 60 * 60 * 24 * 90 });

      const totalCur = await env.SUBSCRIBERS.get(dailyTotal);
      const totalNext = (totalCur ? parseInt(totalCur, 10) : 0) + 1;
      await env.SUBSCRIBERS.put(dailyTotal, String(totalNext), { expirationTtl: 60 * 60 * 24 * 90 });
    } catch (err) {
      console.error('Click KV storage error:', err);
    }
  }

  return jsonResponse({ ok: true }, 200);
}
