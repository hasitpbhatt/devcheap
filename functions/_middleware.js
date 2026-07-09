const ALLOWED_ORIGINS = ['https://devcheap.click', 'https://devcheap-3uq.pages.dev'];

function htmlToMarkdown(html) {
  let md = html;

  // Remove script and style tags
  md = md.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  md = md.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  md = md.replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '');
  md = md.replace(/<path[^>]*\/>/gi, '');
  md = md.replace(/<use[^>]*\/>/gi, '');

  // Headings
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
  md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');

  // Links
  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

  // Images
  md = md.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)');
  md = md.replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, '![]($1)');

  // Bold / Strong
  md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');

  // Italic
  md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

  // Line breaks
  md = md.replace(/<br\s*\/?>/gi, '\n');
  md = md.replace(/<hr\s*\/?>/gi, '\n---\n');

  // Code blocks
  md = md.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '```\n$1\n```\n');
  md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');

  // Lists
  md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
  md = md.replace(/<ol[^>]*>/gi, '\n');
  md = md.replace(/<\/ol>/gi, '\n');
  md = md.replace(/<ul[^>]*>/gi, '\n');
  md = md.replace(/<\/ul>/gi, '\n');

  // Paragraphs
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');

  // Strip remaining tags
  md = md.replace(/<[^>]+>/g, '');

  // Decode entities
  md = md.replace(/&amp;/g, '&');
  md = md.replace(/&lt;/g, '<');
  md = md.replace(/&gt;/g, '>');
  md = md.replace(/&quot;/g, '"');
  md = md.replace(/&#039;/g, "'");
  md = md.replace(/&nbsp;/g, ' ');

  // Clean up excessive whitespace
  md = md.replace(/[ \t]+\n/g, '\n');
  md = md.replace(/\n{3,}/g, '\n\n');

  return md.trim();
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const accept = request.headers.get('Accept') || '';
  const url = new URL(request.url);

  // Skip well-known routes, API routes, and non-HTML assets — let their own handlers serve them
  const skipPaths = ['/.well-known/', '/api/', '/data/', '/images/', '/css/', '/js/'];
  if (skipPaths.some(p => url.pathname.startsWith(p))) {
    if (next) return next(request);
    return env.ASSETS.fetch(request);
  }

  // CORS preflight
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('Origin') || '';
    const cors = ALLOWED_ORIGINS.some(a => origin.startsWith(a))
      ? { 'Access-Control-Allow-Origin': origin }
      : {};
    return new Response(null, { status: 204, headers: { ...cors, 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Accept, Content-Type', 'Access-Control-Max-Age': '86400' } });
  }

  if (request.method !== 'GET') {
    if (next) return next(request);
    return env.ASSETS.fetch(request);
  }

  // Serve HTML normally, except when agent requests markdown
  const wantsMarkdown = accept.includes('text/markdown') || accept.includes('text/x-markdown');

  if (!wantsMarkdown) {
    if (next) return next(request);
    return env.ASSETS.fetch(request);
  }

  try {
    const htmlReq = new Request(url, { headers: { 'Accept': 'text/html' } });
    const response = await env.ASSETS.fetch(htmlReq);

    if (!response.ok) return response;

    const contentType = response.headers.get('Content-Type') || '';
    if (!contentType.includes('text/html')) return response;

    const html = await response.text();
    const markdown = htmlToMarkdown(html);

    return new Response(markdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'X-Markdown-Tokens': String(markdown.split(/\s+/).length)
      }
    });
  } catch {
    if (next) return next(request);
    return env.ASSETS.fetch(request);
  }
}
