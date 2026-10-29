const DEALS_URL = '/data/deals.jsonl';

async function fetchDeals() {
  const res = await fetch(DEALS_URL);
  const text = await res.text();
  return text.split('\n').filter(Boolean).map(line => JSON.parse(line));
}

function getCategories(deals) {
  return [...new Set(deals.map(d => d.category))].sort();
}

function matchDeal(deal, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  return deal.name.toLowerCase().includes(q)
    || deal.desc.toLowerCase().includes(q)
    || deal.deal.toLowerCase().includes(q)
    || deal.category.toLowerCase().includes(q)
    || (deal.tags && deal.tags.toLowerCase().includes(q))
    || (deal.why && deal.why.toLowerCase().includes(q));
}

const mc = typeof navigator !== 'undefined' && navigator.modelContext
  || typeof document !== 'undefined' && document.modelContext;

if (mc) {
  const ac = new AbortController();

  mc.registerTool({
    name: 'search_deals',
    description: 'Search and filter developer tool deals by query text, category, or pricing model. Returns matching deals with their name, description, category, pricing, and claim URLs.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Text to search for in deal names, descriptions, categories, and tags' },
        category: { type: 'string', description: 'Filter by category slug (e.g. "hosting & cloud", "ai & llm", "security")' },
        pricing: { type: 'string', enum: ['free', 'paid', 'trial'], description: 'Filter by pricing model' }
      }
    },
    annotations: { readOnlyHint: true },
    async execute(input) {
      const deals = await fetchDeals();
      let results = deals;
      if (input.query) results = results.filter(d => matchDeal(d, input.query));
      if (input.category) results = results.filter(d => d.category.toLowerCase() === input.category.toLowerCase());
      if (input.pricing) results = results.filter(d => (d.tags || '').toLowerCase().includes(input.pricing));
      return results.map(d => ({
        id: d.id,
        name: d.name,
        category: d.category,
        deal: d.deal,
        desc: d.desc,
        tags: d.tags ? d.tags.split(',').map(t => t.trim()) : [],
        url: d.url,
        expires: d.expires || null
      }));
    }
  }, { signal: ac.signal });

  mc.registerTool({
    name: 'get_deal_by_id',
    description: 'Get detailed information about a specific developer tool deal by its unique ID.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'The unique deal identifier (e.g. "neon", "supabase", "railway")' }
      },
      required: ['id']
    },
    annotations: { readOnlyHint: true },
    async execute(input) {
      const deals = await fetchDeals();
      const deal = deals.find(d => d.id === input.id);
      if (!deal) throw new Error(`Deal not found: ${input.id}`);
      return {
        id: deal.id,
        name: deal.name,
        category: deal.category,
        deal: deal.deal,
        desc: deal.desc,
        why: deal.why || null,
        tags: deal.tags ? deal.tags.split(',').map(t => t.trim()) : [],
        url: deal.url,
        code: deal.code,
        expires: deal.expires || null,
        has_affiliate: !!deal.has_affiliate,
        detail_url: `https://devcheap.click/deals/${deal.id}/`
      };
    }
  }, { signal: ac.signal });

  mc.registerTool({
    name: 'list_categories',
    description: 'List all available deal categories with the count of deals in each category.',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    annotations: { readOnlyHint: true },
    async execute() {
      const deals = await fetchDeals();
      const cats = getCategories(deals);
      return cats.map(cat => ({
        category: cat,
        count: deals.filter(d => d.category === cat).length
      }));
    }
  }, { signal: ac.signal });

  mc.registerTool({
    name: 'get_deal_stats',
    description: 'Get overall statistics about the DevCheap deals directory including total deals, categories, and deal count by pricing model.',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    annotations: { readOnlyHint: true },
    async execute() {
      const deals = await fetchDeals();
      const cats = getCategories(deals);
      return {
        total_deals: deals.length,
        total_categories: cats.length,
        categories: cats,
        by_pricing: {
          free: deals.filter(d => (d.tags || '').toLowerCase().includes('free')).length,
          paid: deals.filter(d => (d.tags || '').toLowerCase().includes('paid')).length,
          trial: deals.filter(d => (d.tags || '').toLowerCase().includes('trial')).length
        }
      };
    }
  }, { signal: ac.signal });
}
