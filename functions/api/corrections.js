const VALID_FIELDS = new Set(['offer', 'price', 'expiry', 'code', 'description', 'url', 'other']);

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'public, max-age=60',
    },
  });
}

/**
 * GET /api/corrections?deal_id=<id>
 *
 * Returns how many community corrections have been filed against a deal.
 * The count is public so deal pages can show "Updated N× from community
 * reports". The reports themselves are never public.
 */
export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const url = new URL(request.url);
  const dealId = (url.searchParams.get('deal_id') || '').trim().slice(0, 64);
  const field = (url.searchParams.get('field') || '').trim().toLowerCase();

  if (!dealId) return jsonResponse({ error: 'Missing deal_id' }, 400);
  if (field && !VALID_FIELDS.has(field)) return jsonResponse({ error: 'Invalid field' }, 400);

  const kv = env.SUBSCRIBERS;
  if (!kv) return jsonResponse({ count: 0, fields: {} }, 200);

  try {
    const countKey = `report_count:${dealId}`;
    const count = parseInt((await kv.get(countKey)) || '0', 10);

    const fields = {};
    for (const f of VALID_FIELDS) {
      const key = `report_field_count:${dealId}:${f}`;
      const n = parseInt((await kv.get(key)) || '0', 10);
      if (n > 0) fields[f] = n;
    }

    const total = parseInt((await kv.get('report_count:__all__')) || '0', 10);

    return jsonResponse({ count, fields, total }, 200);
  } catch (err) {
    console.error('Corrections KV read error:', err);
    return jsonResponse({ count: 0, fields: {} }, 200);
  }
}
