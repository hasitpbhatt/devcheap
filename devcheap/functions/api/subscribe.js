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

async function checkRateLimit(env, ip) {
  if (!ip || !env.SUBSCRIBERS) return true;
  const windowMs = 10 * 60 * 1000;
  const key = `rl:${ip}:${Math.floor(Date.now() / windowMs)}`;
  try {
    const cur = parseInt((await env.SUBSCRIBERS.get(key)) || '0', 10);
    if (cur >= 5) return false;
    await env.SUBSCRIBERS.put(key, String(cur + 1));
    return true;
  } catch {
    return true;
  }
}

const WELCOME_SUBJECT = 'Your first 5 free LLM APIs (start in 10 minutes)';

function buildWelcome(email) {
  const u = (extra) => `utm_source=resend&utm_medium=email&utm_campaign=welcome${extra ? '&' + extra : ''}`;
  const hub = `https://devcheap.click/llm-providers/?${u()}`;
  const article = `https://devcheap.click/articles/how-to-pick-free-llm-api/?${u('utm_content=article')}`;
  const unsub = `https://devcheap.click/api/unsubscribe?email=${encodeURIComponent(email)}`;
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#0f172a;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e2e8f0;">
<div style="max-width:600px;margin:0 auto;padding:32px 24px;">
  <div style="font-size:13px;letter-spacing:0.5px;color:#94a3b8;text-transform:uppercase;margin-bottom:8px;">DevCheap</div>
  <h1 style="font-size:22px;line-height:1.3;margin:0 0 16px;color:#f8fafc;font-weight:700;">Your first 5 free LLM APIs (start in 10 minutes)</h1>
  <p style="font-size:15px;line-height:1.6;margin:0 0 12px;">Every Tuesday, one verified free-LLM-API offer. No filler, no roundup of 30 tools you won't read.</p>
  <p style="font-size:15px;line-height:1.6;margin:0 0 12px;">The one thing to do today: open the hub, filter by "No credit card," grab the first key. You'll be pinging an LLM in ten minutes.</p>
  <p style="font-size:15px;line-height:1.6;margin:0 0 24px;">Next Tuesday: a teardown of which providers actually throttle free tiers (and which lie about it).</p>
  <p style="margin:0 0 24px;"><a href="${hub}" style="display:inline-block;background:#38bdf8;color:#0f172a;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:8px;font-size:15px;">Open the LLM Providers hub →</a></p>
  <p style="font-size:14px;line-height:1.6;margin:0 0 4px;color:#cbd5e1;">If you want the framework first: <a href="${article}" style="color:#38bdf8;">how to pick a free LLM API →</a></p>
  <p style="font-size:14px;line-height:1.6;margin:24px 0 0;color:#94a3b8;">P.S. Hub data last verified ${today}. The numbers and rate limits are checked before every issue.</p>
  <hr style="border:none;border-top:1px solid #1e293b;margin:32px 0 16px;">
  <p style="font-size:12px;line-height:1.6;color:#64748b;margin:0;">You're getting this because you subscribed at devcheap.click/llm-providers/.<br><a href="${unsub}" style="color:#94a3b8;">Unsubscribe</a></p>
</div>
</body></html>`;
  const text = `DevCheap — Your first 5 free LLM APIs (start in 10 minutes)

Every Tuesday, one verified free-LLM-API offer. No filler, no roundup of 30 tools you won't read.

The one thing to do today: open the hub, filter by "No credit card," grab the first key. You'll be pinging an LLM in ten minutes.

Next Tuesday: a teardown of which providers actually throttle free tiers (and which lie about it).

Open the hub: ${hub}
Framework first: ${article}

P.S. Hub data last verified ${today}.

You're getting this because you subscribed at devcheap.click/llm-providers/.
Unsubscribe: ${unsub}`;
  return { html, text };
}

async function sendWelcome(env, email) {
  if (!env.RESEND_API_KEY || !env.RESEND_FROM) return { ok: false, skipped: true };
  const { html, text } = buildWelcome(email);
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'User-Agent': 'devcheap-newsletter/1.0',
      },
      body: JSON.stringify({
        from: env.RESEND_FROM,
        to: [email],
        subject: WELCOME_SUBJECT,
        html,
        text,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('Resend send-email error:', res.status, detail);
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error('Resend send-email error:', err);
    return { ok: false };
  }
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json' },
    });
  }

  const origin = request.headers.get('Origin') || request.headers.get('Referer') || '';
  const allowed = ALLOWED_ORIGINS.some(a => origin.startsWith(a));
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403, headers: { 'Content-Type': 'application/json' },
    });
  }

  let body;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const { email, source, 'cf-turnstile-response': turnstileResp } = body;
  if (!email || typeof email !== 'string') {
    return new Response(JSON.stringify({ error: 'Email is required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  const normalized = email.trim().toLowerCase();
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
  if (!emailOk) {
    return new Response(JSON.stringify({ error: 'Invalid email' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const ip = request.headers.get('CF-Connecting-IP') || '';
  const withinLimit = await checkRateLimit(env, ip);
  if (!withinLimit) {
    return new Response(JSON.stringify({ error: 'Too many attempts. Try again in a few minutes.' }), {
      status: 429, headers: { 'Content-Type': 'application/json' },
    });
  }

  const turnstileSecret = env.TURNSTILE_SECRET_KEY;
  const turnstileValid = await verifyTurnstile(turnstileResp, turnstileSecret);
  if (!turnstileValid) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403, headers: { 'Content-Type': 'application/json' },
    });
  }

  if (normalized.length > 320) {
    return new Response(JSON.stringify({ error: 'Email too long' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  if (env.SUBSCRIBERS) {
    try {
      const existing = await env.SUBSCRIBERS.get(`sub:${normalized}`);
      if (existing) {
        const rec = JSON.parse(existing);
        if (rec.welcomed === true) {
          return new Response(JSON.stringify({ ok: true, duplicate: true }), {
            status: 200, headers: { 'Content-Type': 'application/json' },
          });
        }
      }
    } catch (err) {
      console.error('Subscriber KV read error:', err);
    }
  }

  const baseRecord = { email: normalized, source: source || 'devcheap.click', ts: new Date().toISOString() };
  let resendContactId = null;
  let contactInResend = false;
  const resendApiKey = env.RESEND_API_KEY;
  const resendSegmentId = env.RESEND_SEGMENT_ID || env.RESEND_AUDIENCE_ID;

  if (resendApiKey) {
    try {
      const payload = { email: normalized, unsubscribed: false };
      if (resendSegmentId) payload.segments = [{ id: resendSegmentId }];
      const resendRes = await fetch('https://api.resend.com/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`,
          'User-Agent': 'devcheap-newsletter/1.0',
        },
        body: JSON.stringify(payload),
      });
      if (resendRes.ok) {
        const data = await resendRes.json().catch(() => ({}));
        resendContactId = data.id || null;
        contactInResend = true;
      } else {
        const detail = await resendRes.text().catch(() => '');
        const alreadyExists = resendRes.status === 409 || /already\s*exists/i.test(detail);
        if (alreadyExists) {
          contactInResend = true;
        } else {
          console.error('Resend add-contact error:', resendRes.status, detail);
          return new Response(JSON.stringify({ error: 'Subscription failed. Please try again.' }), {
            status: 502, headers: { 'Content-Type': 'application/json' },
          });
        }
      }
    } catch (err) {
      console.error('Resend add-contact error:', err);
      return new Response(JSON.stringify({ error: 'Subscription failed. Please try again.' }), {
        status: 502, headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  let welcomeSent = false;
  if (contactInResend) {
    const w = await sendWelcome(env, normalized);
    welcomeSent = !!w.ok;
  }

  if (env.SUBSCRIBERS) {
    try {
      const record = { ...baseRecord, welcomed: welcomeSent, resendContactId };
      if (ip) record.ip = ip;
      await env.SUBSCRIBERS.put(`sub:${normalized}`, JSON.stringify(record));
    } catch (err) {
      console.error('Subscriber KV storage error:', err);
    }
  }

  return new Response(JSON.stringify({ ok: true, duplicate: false, welcomed: welcomeSent }), {
    status: 201, headers: { 'Content-Type': 'application/json' },
  });
}
