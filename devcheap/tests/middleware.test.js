import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

function loadMiddleware() {
  const src = fs.readFileSync(path.resolve('functions/_middleware.js'), 'utf-8');
  const stub = `const require = () => ({});`;
  const module = { exports: {} };
  const fn = new Function('module', 'exports', stub + '\n' + src.replace(/export\s+async\s+function\s+onRequest/g, 'async function onRequest') + '\nreturn { onRequest };');
  return fn(module, module.exports);
}

function mockContext({ accept, method = 'GET', url = 'https://devcheap.click/', html = '<!DOCTYPE html><html><head><title>DevCheap</title></head><body><h1>Deals</h1><p>$200 free credits</p></body></html>' }) {
  const headers = new Headers();
  if (accept) headers.set('Accept', accept);
  const request = new Request(url, { method, headers });
  const response = new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
  const env = {
    ASSETS: { fetch: async () => response },
  };
  const next = vi.fn(async () => response);
  return { request, env, next };
}

describe('middleware content negotiation', () => {
  it('returns text/markdown with Vary: Accept when Accept: text/markdown', async () => {
    const { onRequest } = loadMiddleware();
    const ctx = mockContext({ accept: 'text/markdown' });
    const res = await onRequest(ctx);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/markdown');
    expect(res.headers.get('Vary')).toBe('Accept');
  });

  it('returns text/markdown with Vary: Accept for text/x-markdown', async () => {
    const { onRequest } = loadMiddleware();
    const ctx = mockContext({ accept: 'text/x-markdown' });
    const res = await onRequest(ctx);

    expect(res.headers.get('Content-Type')).toContain('text/markdown');
    expect(res.headers.get('Vary')).toBe('Accept');
  });

  it('passes through to next handler when Accept is text/html', async () => {
    const { onRequest } = loadMiddleware();
    const ctx = mockContext({ accept: 'text/html' });
    await onRequest(ctx);

    expect(ctx.next).toHaveBeenCalled();
  });

  it('skips well-known routes', async () => {
    const { onRequest } = loadMiddleware();
    const ctx = mockContext({
      accept: 'text/markdown',
      url: 'https://devcheap.click/.well-known/agent-skills',
    });
    await onRequest(ctx);

    expect(ctx.next).toHaveBeenCalled();
  });

  it('skips /data/, /js/, /css/, /images/, /auth.md routes', async () => {
    const { onRequest } = loadMiddleware();
    for (const p of ['/data/deals.jsonl', '/js/search.js', '/css/styles.css', '/images/logo.png', '/auth.md']) {
      const c = mockContext({ accept: 'text/markdown', url: 'https://devcheap.click' + p });
      await onRequest(c);
      expect(c.next).toHaveBeenCalled();
    }
  });

  it('strips nav, newsletter, and footer from markdown output', async () => {
    const { onRequest } = loadMiddleware();
    const noisyHtml = `<!DOCTYPE html><html><head><title>DevCheap</title></head><body>
<nav>Navigation links</nav>
<section id="newsletter"><h2>Subscribe</h2><p>Newsletter form</p></section>
<footer>Footer content</footer>
<h1>Deals</h1><p>$200 free credits</p>
<section class="spotlight-section"><p>Spotlight</p></section>
</body></html>`;
    const ctx = mockContext({ accept: 'text/markdown', html: noisyHtml });
    const res = await onRequest(ctx);
    const body = await res.text();

    expect(body).not.toContain('Navigation links');
    expect(body).not.toContain('Newsletter form');
    expect(body).not.toContain('Footer content');
    expect(body).not.toContain('Spotlight');
    expect(body).toContain('Deals');
    expect(body).toContain('$200 free credits');
  });
});
