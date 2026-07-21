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

  // No external ESP configured. Store subscriber in a KV namespace if bound,
  // otherwise log for later import. Both paths return success to the user.
  if (normalized.length > 320) {
    return new Response(JSON.stringify({ error: 'Email too long' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const record = JSON.stringify({
    email: normalized,
    source: source || 'devcheap.click',
    ts: new Date().toISOString(),
  });

  try {
    if (env.SUBSCRIBERS) {
      await env.SUBSCRIBERS.put(`sub:${email}`, record);
    } else {
      console.log('NEW_SUBSCRIBER', record);
    }
  } catch (err) {
    console.error('Subscriber storage error:', err);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
}
