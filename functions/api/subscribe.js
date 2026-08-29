const ALLOWED_ORIGINS = ['https://devcheap.click', 'https://devcheap-3uq.pages.dev', 'http://localhost:8788', 'http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:8788', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'];

async function verifyTurnstile(token, secret) {
  if (!token || !secret) return false;
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token }),
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const origin = request.headers.get('Origin') || request.headers.get('Referer') || '';
  const allowed = ALLOWED_ORIGINS.some(a => origin.startsWith(a));
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { email, source, 'cf-turnstile-response': turnstileResp } = body;
  if (!email || typeof email !== 'string') {
    return new Response(JSON.stringify({ error: 'Email is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const normalized = email.trim().toLowerCase();
  // RFC-ish: local@domain, neither side empty, domain has a dot.
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
  if (!emailOk) {
    return new Response(JSON.stringify({ error: 'Invalid email' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const turnstileSecret = env.TURNSTILE_SECRET_KEY;
  const turnstileValid = await verifyTurnstile(turnstileResp, turnstileSecret);
  if (!turnstileValid) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (normalized.length > 320) {
    return new Response(JSON.stringify({ error: 'Email too long' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const record = {
    email: normalized,
    source: source || 'devcheap.click',
    ts: new Date().toISOString(),
  };

  const errors = [];

  // Store in KV (optional) so we always have our own copy.
  try {
    if (env.SUBSCRIBERS) {
      await env.SUBSCRIBERS.put(`sub:${normalized}`, JSON.stringify(record));
    }
  } catch (err) {
    errors.push('kv');
    console.error('Subscriber KV storage error:', err);
  }

  // Add the subscriber to Resend if configured.
  // Resend migrated Audiences -> Segments: contacts are now global objects created
  // via POST /contacts, with optional segment membership. RESEND_AUDIENCE_ID is
  // still accepted as an alias so older deployments keep working.
  const resendApiKey = env.RESEND_API_KEY;
  const resendSegmentId = env.RESEND_SEGMENT_ID || env.RESEND_AUDIENCE_ID;
  if (resendApiKey) {
    try {
      const payload = { email: normalized, unsubscribed: false };
      if (resendSegmentId) {
        payload.segments = [{ id: resendSegmentId }];
      }
      const resendRes = await fetch('https://api.resend.com/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`,
          // Resend returns 403 (error 1010) when User-Agent is absent.
          'User-Agent': 'devcheap-newsletter/1.0',
        },
        body: JSON.stringify(payload),
      });
      if (!resendRes.ok) {
        const detail = await resendRes.text().catch(() => '');
        errors.push('resend');
        console.error('Resend add-contact error:', resendRes.status, detail);
      }
    } catch (err) {
      errors.push('resend');
      console.error('Resend add-contact error:', err);
    }
  }

  return new Response(JSON.stringify({ ok: true, warnings: errors }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
}
