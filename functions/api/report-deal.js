const ALLOWED_ORIGINS = [
  'https://devcheap.click',
  'https://devcheap-3uq.pages.dev',
  'http://localhost:8788',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:8788',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];

const RATE_LIMIT = 5; // reports per IP per day
const RATE_WINDOW = '86400'; // seconds

const VALID_FIELDS = new Set(['offer', 'price', 'expiry', 'code', 'description', 'url', 'other']);

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

function getClientIp(request, env) {
  const cfIp = request.headers.get('CF-Connecting-IP');
  if (cfIp) return cfIp;
  const forwarded = request.headers.get('X-Forwarded-For');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'local';
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
        'Access-Control-Max-Content-Length': '8192',
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
  const field = typeof body.field === 'string' ? body.field.trim().toLowerCase() : '';
  const detail = typeof body.detail === 'string' ? body.detail.trim().slice(0, 1000) : '';
  const reportedValue = typeof body.reported_value === 'string' ? body.reported_value.trim().slice(0, 200) : '';

  if (!dealId) return jsonResponse({ error: 'Missing deal_id' }, 400);
  if (!VALID_FIELDS.has(field)) return jsonResponse({ error: 'Invalid field' }, 400);
  if (detail.length < 4) return jsonResponse({ error: 'Please describe the issue (4+ characters)' }, 400);

  const kv = env.SUBSCRIBERS;
  const ip = getClientIp(request, env);
  const today = new Date().toISOString().slice(0, 10);

  // ── Rate limit: 5 reports per IP per day ────────────────────────────────
  if (kv) {
    const rateKey = `report_rate:${today}:${ip}`;
    try {
      const current = parseInt((await kv.get(rateKey)) || '0', 10);
      if (current >= RATE_LIMIT) {
        return jsonResponse(
          { error: 'Too many reports today. Try again tomorrow.', limit: RATE_LIMIT },
          429
        );
      }
      await kv.put(rateKey, String(current + 1), { expirationTtl: Number(RATE_WINDOW) });
    } catch (err) {
      console.error('Rate limit KV error:', err);
      // Fail open — losing a report is better than blocking a real correction.
    }
  }

  const stamp = new Date().toISOString();
  const report = {
    id: `${dealId}:${field}:${Date.now()}`,
    deal_id: dealId,
    field,
    detail,
    reported_value: reportedValue,
    status: 'open',
    created_at: stamp,
  };

  if (kv) {
    try {
      const reportKey = `report:${report.id}`;
      await kv.put(reportKey, JSON.stringify(report), { expirationTtl: 60 * 60 * 24 * 180 });

      const countKey = `report_count:${dealId}`;
      const current = parseInt((await kv.get(countKey)) || '0', 10);
      await kv.put(countKey, String(current + 1), { expirationTtl: 60 * 60 * 24 * 365 });

      const fieldKey = `report_field_count:${dealId}:${field}`;
      const fieldCurrent = parseInt((await kv.get(fieldKey)) || '0', 10);
      await kv.put(fieldKey, String(fieldCurrent + 1), { expirationTtl: 60 * 60 * 24 * 365 });

      const totalKey = `report_count:__all__`;
      const totalCurrent = parseInt((await kv.get(totalKey)) || '0', 10);
      await kv.put(totalKey, String(totalCurrent + 1), { expirationTtl: 60 * 60 * 24 * 365 });
    } catch (err) {
      console.error('Report KV storage error:', err);
    }
  }

  return jsonResponse({ ok: true, id: report.id }, 200);
}
