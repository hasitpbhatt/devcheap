const ALLOWED_ORIGINS = ['https://devcheap.click', 'https://devcheap-3uq.pages.dev', 'http://localhost:8788', 'http://localhost:3000', 'http://localhost:5173'];

function page(title, body) {
  return `<!doctype html><html lang="en-US"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} — DevCheap</title>
<style>body{font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0f172a;color:#e2e8f0;margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px;}.box{max-width:480px;text-align:center;}h1{font-size:22px;margin:0 0 12px;color:#f8fafc;font-weight:700;}p{font-size:15px;line-height:1.6;color:#cbd5e1;margin:0 0 16px;}a{color:#38bdf8;}</style>
</head><body><div class="box">${body}</div></body></html>`;
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const email = (url.searchParams.get('email') || '').trim().toLowerCase();
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!emailOk) {
    return new Response(page('Unsubscribe', '<h1>Unsubscribe</h1><p>That link looks off. Forward the email to <a href="mailto:hello@devcheap.click">hello@devcheap.click</a> and we will remove you.</p>'), {
      status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const origin = request.headers.get('Origin') || request.headers.get('Referer') || '';
  if (origin && !ALLOWED_ORIGINS.some(a => origin.startsWith(a))) {
    return new Response(page('Unsubscribe', '<h1>Unsubscribe</h1><p>Open this link from the email itself to unsubscribe.</p>'), {
      status: 403, headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  let resendContactId = null;
  if (env.SUBSCRIBERS) {
    try {
      const existing = await env.SUBSCRIBERS.get(`sub:${email}`);
      if (existing) {
        const rec = JSON.parse(existing);
        resendContactId = rec.resendContactId || null;
      }
    } catch (err) {
      console.error('Unsubscribe KV read error:', err);
    }
  }

  if (env.RESEND_API_KEY && resendContactId) {
    try {
      const res = await fetch(`https://api.resend.com/contacts/${resendContactId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'User-Agent': 'devcheap-newsletter/1.0',
        },
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        console.error('Resend delete-contact error:', res.status, detail);
      }
    } catch (err) {
      console.error('Resend delete-contact error:', err);
    }
  }

  if (env.SUBSCRIBERS) {
    try {
      await env.SUBSCRIBERS.delete(`sub:${email}`);
    } catch (err) {
      console.error('Unsubscribe KV delete error:', err);
    }
  }

  return new Response(page('Unsubscribed', `<h1>You're unsubscribed.</h1><p>${email} is off the list. No more emails from DevCheap.</p><p><a href="https://devcheap.click/llm-providers/">Back to the LLM Providers hub →</a></p>`), {
    status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
