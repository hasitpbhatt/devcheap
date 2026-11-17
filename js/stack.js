/**
 * stack.js — Speed-to-Value stack builder.
 *
 * "I have $0 and I need a SaaS backend. Show me the stack."
 *
 * Reads the live catalog from /data/deals.jsonl, matches deals against the
 * budget, use case, and team size, then renders a role-by-role stack with a
 * monthly cost estimate. The result is shareable via URL query params.
 */

(() => {
  const form = document.getElementById('stack-form');
  if (!form) return;

  const output = document.getElementById('stack-output');
  const summary = document.getElementById('stack-summary');
  const loading = document.getElementById('stack-loading');
  const shareUrl = document.getElementById('stack-share-url');
  const copyBtn = document.getElementById('stack-copy-url');

  let deals = [];

  /**
   * Role map. Each use case picks one deal per role.
   * `must` = the role is required for this stack shape.
   */
  const USE_CASES = {
    saas: {
      label: 'SaaS product',
      blurb: 'Postgres, auth, file storage, email, monitoring, and a host.',
      roles: [
        { role: 'Database', match: { category: ['Database'] }, prefer: ['neon', 'supabase', 'cockroachdb-cloud', 'turso'], must: true },
        { role: 'Auth', match: { category: ['Auth'] }, prefer: ['clerk', 'auth0', 'fusionauth-free', 'workos'], must: true },
        { role: 'Email', match: { category: ['APIs & Email'] }, prefer: ['resend', 'twilio-sendgrid', 'postmark', 'brevo', 'mailgun'], must: false },
        { role: 'Hosting', match: { category: ['Hosting & Cloud'] }, prefer: ['cloudflare', 'vercel', 'netlify', 'render', 'railway', 'flyio'], must: true },
        { role: 'Monitoring', match: { category: ['Monitoring'] }, prefer: ['better-stack', 'sentry', 'grafana-cloud', 'posthog', 'axiom-logs'], must: false },
      ],
    },
    'ai-app': {
      label: 'AI app',
      blurb: 'An inference provider, an API key, plus the SaaS plumbing around it.',
      roles: [
        { role: 'LLM API', match: { category: ['AI & LLM'], tag: 'llm' }, prefer: ['groq', 'cerebras', 'google-ai-studio', 'github-models', 'openrouter', 'together-ai'], must: true },
        { role: 'Gateway', match: { type: 'LLM-Gateway' }, prefer: ['openrouter', 'litellm', 'pollinations'], must: false },
        { role: 'Database', match: { category: ['Database'] }, prefer: ['neon', 'supabase', 'turso'], must: true },
        { role: 'Hosting', match: { category: ['Hosting & Cloud'] }, prefer: ['cloudflare', 'vercel', 'render'], must: false },
      ],
    },
    api: {
      label: 'Public API',
      blurb: 'Edge hosting, a database, auth, and monitoring for a public endpoint.',
      roles: [
        { role: 'Hosting', match: { category: ['Hosting & Cloud'] }, prefer: ['cloudflare-workers', 'cloudflare', 'vercel', 'render', 'flyio'], must: true },
        { role: 'Database', match: { category: ['Database'] }, prefer: ['neon', 'supabase', 'upstash', 'turso'], must: true },
        { role: 'Auth', match: { category: ['Auth'] }, prefer: ['clerk', 'auth0', 'workos'], must: false },
        { role: 'Monitoring', match: { category: ['Monitoring'] }, prefer: ['better-stack', 'sentry', 'grafana-cloud'], must: false },
      ],
    },
    website: {
      label: 'Marketing site / docs',
      blurb: 'Static hosting, a CMS, and a place to send email from.',
      roles: [
        { role: 'Hosting', match: { category: ['Hosting & Cloud'] }, prefer: ['cloudflare', 'netlify', 'vercel', 'github-pages'], must: true },
        { role: 'CMS / Design', match: { category: ['Design & Collaboration'] }, prefer: ['figma', 'webflow', 'excalidraw'], must: false },
        { role: 'Email', match: { category: ['APIs & Email'] }, prefer: ['resend', 'brevo', 'mailgun'], must: false },
        { role: 'SEO', match: { category: ['SEO'] }, prefer: [], must: false },
      ],
    },
    mobile: {
      label: 'Mobile app backend',
      blurb: 'Auth, a database, push-capable email, and app monitoring.',
      roles: [
        { role: 'Backend / Database', match: { category: ['Database'] }, prefer: ['supabase', 'appwrite', 'neon', 'firebase'], must: true },
        { role: 'Auth', match: { category: ['Auth'] }, prefer: ['clerk', 'auth0', 'appwrite'], must: true },
        { role: 'Hosting', match: { category: ['Hosting & Cloud'] }, prefer: ['cloudflare', 'vercel', 'render'], must: false },
        { role: 'Monitoring', match: { category: ['Monitoring'] }, prefer: ['sentry', 'better-stack'], must: false },
      ],
    },
  };

  const COST_ESTIMATES = {
    free: 0,
    trial: 0,
    paid: 25,
    lifetime: 0,
  };

  function parseMonthlyCost(deal) {
    if (deal.pricing === 'free' || deal.pricing === 'trial' || deal.pricing === 'lifetime') return 0;
    const match = String(deal.deal || '').match(/\$(\d+(?:\.\d+)?)/);
    if (match) {
      const n = parseFloat(match[1]);
      if (String(deal.deal).includes('/mo') || String(deal.deal).includes('/month')) return n;
      if (n < 200) return n;
    }
    return COST_ESTIMATES.paid;
  }

  function matchesRole(deal, role) {
    const { category, tag, type } = role.match;
    if (category && !category.includes(deal.category)) return false;
    if (tag && !String(deal.tags || '').toLowerCase().includes(tag)) return false;
    if (type === 'LLM-Gateway' && !/gateway/i.test(`${deal.tags || ''} ${deal.desc || ''}`)) return false;
    return true;
  }

  function pickForRole(role, budget, teamSize) {
    const candidates = deals.filter((d) => matchesRole(d, role));

    const budgetOk = (d) => {
      if (budget === 'any') return true;
      if (budget === 'zero') return d.pricing === 'free' || d.pricing === 'lifetime';
      if (budget === 'under25') return d.pricing !== 'paid' || parseMonthlyCost(d) <= 25;
      return true;
    };

    const teamOk = (d) => {
      // Startup-only offers need a company; solo builders usually cannot use them.
      if (teamSize === 'solo' && /startup-only/.test(String(d.tags || ''))) return false;
      return true;
    };

    const pool = candidates.filter((d) => budgetOk(d) && teamOk(d));
    if (!pool.length) return null;

    const preferIndex = (d) => {
      const i = role.prefer.indexOf(d.id);
      return i === -1 ? 999 : i;
    };

    return [...pool].sort((a, b) => {
      const pa = preferIndex(a);
      const pb = preferIndex(b);
      if (pa !== pb) return pa - pb;
      return (b.rating || 0) - (a.rating || 0);
    })[0];
  }

  function renderStack(stack, useCase, budget, teamSize) {
    const rows = stack.filter((s) => s.deal);
    const monthly = rows.reduce((sum, s) => sum + s.cost, 0);
    const freeCount = rows.filter((s) => s.deal.pricing === 'free' || s.deal.pricing === 'lifetime').length;

    const cards = rows.map((s) => `
      <article class="stack-card">
        <div class="stack-role">${s.role}</div>
        <h3><a href="/deals/${s.deal.id}/">${s.deal.name}</a></h3>
        <p class="stack-offer">${s.deal.deal}</p>
        <p class="stack-why">${s.deal.why}</p>
        <div class="stack-card-foot">
          <span class="stack-badge stack-badge--${s.deal.pricing}">${s.deal.pricing}</span>
          <span class="stack-cost">${s.cost === 0 ? '$0/mo' : `~$${s.cost}/mo`}</span>
          <a class="stack-claim" href="/deals/${s.deal.id}/">Details →</a>
        </div>
      </article>`).join('');

    const missing = stack.filter((s) => !s.deal).map((s) => s.role);

    summary.innerHTML = `
      <div class="stack-summary-grid">
        <div><strong>${rows.length}</strong><span>tools</span></div>
        <div><strong>${freeCount}</strong><span>free tiers</span></div>
        <div><strong>$${monthly}</strong><span>est. monthly</span></div>
      </div>
      <p class="stack-summary-line">
        ${useCase.blurb} ${missing.length ? `No match for: ${missing.join(', ')}. Try widening the budget.` : 'Every role filled.'}
      </p>`;

    output.innerHTML = `<div class="stack-grid">${cards}</div>`;
  }

  function buildStack(params) {
    const useCase = USE_CASES[params.usecase] || USE_CASES.saas;
    const stack = useCase.roles.map((role) => {
      const deal = pickForRole(role, params.budget, params.team);
      return {
        role: role.role,
        deal,
        cost: deal ? parseMonthlyCost(deal) : 0,
      };
    });
    return { useCase, stack };
  }

  function readParams() {
    const p = new URLSearchParams(window.location.search);
    return {
      usecase: p.get('usecase') || 'saas',
      budget: p.get('budget') || 'zero',
      team: p.get('team') || 'solo',
    };
  }

  function writeParams(params) {
    const p = new URLSearchParams();
    p.set('usecase', params.usecase);
    p.set('budget', params.budget);
    p.set('team', params.team);
    const url = `${window.location.origin}${window.location.pathname}?${p.toString()}`;
    window.history.replaceState({}, '', `?${p.toString()}`);
    if (shareUrl) shareUrl.value = url;
    return url;
  }

  async function loadDeals() {
    const res = await fetch('/data/deals.jsonl');
    if (!res.ok) throw new Error('Could not load the catalog');
    const text = await res.text();
    return text.split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
  }

  function update() {
    const params = {
      usecase: form.querySelector('[name="usecase"]').value,
      budget: form.querySelector('[name="budget"]').value,
      team: form.querySelector('[name="team"]').value,
    };
    writeParams(params);
    const { useCase, stack } = buildStack(params);
    renderStack(stack, useCase, params.budget, params.team);
  }

  if (copyBtn && shareUrl) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(shareUrl.value);
        copyBtn.textContent = 'Copied';
        setTimeout(() => { copyBtn.textContent = 'Copy link'; }, 1500);
      } catch {
        shareUrl.select();
      }
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    update();
  });
  form.addEventListener('change', update);

  (async () => {
    try {
      deals = await loadDeals();
      if (loading) loading.hidden = true;

      const params = readParams();
      form.querySelector('[name="usecase"]').value = params.usecase;
      form.querySelector('[name="budget"]').value = params.budget;
      form.querySelector('[name="team"]').value = params.team;
      writeParams(params);
      update();
    } catch (err) {
      if (loading) loading.textContent = 'Could not load the deal catalog. Try reloading the page.';
    }
  })();
})();
