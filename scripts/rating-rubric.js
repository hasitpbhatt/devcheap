/**
 * Deal rating rubric — 6 weighted factors (sum = 1.0).
 * Each factor returns a 1–10 score from the raw deal object.
 * Composite is weighted sum rounded to tenths.
 *
 * @typedef {{
 *   id: string,
 *   pricing: string,
 *   deal: string,
 *   code: string,
 *   desc: string,
 *   why: string,
 *   tags: string,
 *   expires: string | null,
 *   has_affiliate: boolean
 * }} Deal
 *
 * @param {Deal} d
 * @returns {{ score: number, factors: Record<string, number> }}
 */
export function rateDeal(d) {
  if (!d) return { score: 5, factors: zeroed() };

  const factors = {
    dollarValue:       factorDollarValue(d),
    longevity:         factorLongevity(d),
    devRelevance:      factorDevRelevance(d),
    audienceBreadth:   factorAudienceBreadth(d),
    friction:          factorFriction(d),
    ecosystemMaturity: factorEcosystemMaturity(d),
  };
  const weights = {
    dollarValue:       0.25,
    longevity:         0.20,
    devRelevance:      0.20,
    audienceBreadth:   0.15,
    friction:          0.10,
    ecosystemMaturity: 0.10,
  };
  const score = Object.entries(weights).reduce(
    (acc, [k, w]) => acc + (factors[k] ?? 5) * w,
    0,
  );

  return { score: Math.round(score * 10) / 10, factors };
}

function zeroed() {
  return {
    dollarValue: 5,
    longevity: 5,
    devRelevance: 5,
    audienceBreadth: 5,
    friction: 5,
    ecosystemMaturity: 5,
  };
}

/* ------------------------------------------------------------------ factors */

const MARKET_LEADERS = new Set([
  'cloudflare','github','gitlab','vercel','netlify','stripe','twilio',
  'sentry','datadog','hubspot','airtable','figma','miro','canva',
  'notion','linear','clickup','loom','zendesk','webflow','twilio-sendgrid',
  'brevo','algolia','auth0','clerk','github-copilot','posthog','plausible',
  'retool','circleci','github-models','google-gemini','mistral','groq',
  'cohere','elevenlabs','ollama','deepgram','assemblyai','nvidia-nim',
  'huggingface-providers','cloudflare-workers-ai','codeium','replit',
  'coderabbit','launchdarkly','pagerduty','grafana-cloud','supabase',
  'mongodb','neon','planetscale','upstash','redis-cloud','aiven','render',
  'railway','flyio','digitalocean','linode','vultr','backblaze-b2',
  'hoppscotch','bruno','coolify','appwrite','umami','cal-com','penpot',
  'excalidraw','webflow','coda','minio','postmark','resend','snyk','ngrok',
  'nx','gitpod','cron-job',
]);

function factorDollarValue(d) {
  const blob = `${d.deal || ''} ${d.why || ''} ${d.desc || ''}`.toLowerCase();
  let score = 4; // baseline

  // Dollar/credit amounts mentioned in text
  const amounts = [];
  const re = /(?:\$|€)\s?(\d[\d,]*)\s*(?:k|,000|m|mo|month)?/gi;
  let m;
  while ((m = re.exec(blob)) !== null) {
    const n = parseFloat(m[1].replace(/,/g, ''));
    if (!isNaN(n)) {
      let v = n;
      if (/k|,000/i.test(m[0]) || n >= 1000) v = n * (n < 100 ? 1000 : 1);
      if (/m/i.test(m[0])) v = n * 1_000_000;
      amounts.push(v);
    }
  }
  const maxD = amounts.length ? Math.max(...amounts) : 0;

  if (maxD >= 5000) score += 5;
  else if (maxD >= 2000) score += 4;
  else if (maxD >= 1000) score += 3.5;
  else if (maxD >= 500) score += 3;
  else if (maxD >= 200) score += 2.5;
  else if (maxD >= 100) score += 2;
  else if (maxD >= 50) score += 1.5;
  else if (maxD >= 10) score += 1;

  // Generous permanent free tier indicators
  if (/unlimited|forever-free|always free|10,?000 maus|7,?000 maus|75k mau|100k mau|1m events|1 million events/i.test(blob)) score += 2;
  if (/generous free tier|free forever|always-free|no credit card/i.test(blob)) score += 1;

  // Lifetime vs monthly competitor savings
  const savings = (d.why || '').match(/vs\.?\s*\$?(\d+)\s*\/mo/i);
  if (savings) {
    const monthly = parseInt(savings[1], 10);
    if (monthly >= 50) score += 2;
    else if (monthly >= 25) score += 1.5;
    else if (monthly >= 10) score += 1;
  }

  return clamp(score, 1, 10);
}

function factorLongevity(d) {
  const p = d.pricing;
  if (p === 'free' && d.expires === null) return 9;
  if (p === 'free' && d.expires !== null) return 7;
  if (p === 'lifetime' && d.expires === null) return 8;
  if (p === 'lifetime' && d.expires !== null) return 6;
  if (p === 'trial') return 4;
  if (p === 'paid') return 3;
  return 5;
}

function factorDevRelevance(d) {
  const tags = (d.tags || '').toLowerCase();
  const core = ['git','ci-cd','devops','database','postgres','mysql','redis',
    'hosting','serverless','docker','ide','api','monitoring','logs',
    'auth','security','code-review','autocomplete','completion','testing',
    'vps','cloud','workers','functions'];
  const adjacent = ['productivity','scheduling','email','marketing',
    'seo','forms','design','collaboration','social-media','crm',
    'whiteboard','wireframing','voice','tts','speech','image','image-generation',
    'no-code','nocode','tickets'];

  let s = 4;
  const hasCore = core.some(c => tags.includes(c));
  const hasAdj = adjacent.some(c => tags.includes(c));
  if (hasCore) s += 4;
  else if (hasAdj) s += 2;

  const cat = d.category;
  if (cat === 'Developer Tools' || cat === 'Hosting & Cloud' ||
      cat === 'Database' || cat === 'Monitoring' ||
      cat === 'CI/CD' || cat === 'Testing & QA' ||
      cat === 'Storage & Cloud' || cat === 'Auth') s += 1;

  if (cat === 'AI & LLM') {
    if (/inference|llm|api|coding|completion|chat/.test(tags)) s += 2;
    else s -= 1;
  }

  return clamp(s, 1, 10);
}

function factorAudienceBreadth(d) {
  const tags = (d.tags || '').toLowerCase();
  let s = 5;
  if (/\brecommended\b/.test(tags)) s += 3;
  if (/\bspotlight\b/.test(tags)) s += 1;
  if (/\blimited-audience\b|\benterprise\b|\bstartup-only\b/.test(tags)) s -= 3;
  return clamp(s, 1, 10);
}

function factorFriction(d) {
  const code = (d.code || '').toLowerCase();
  const desc = (d.desc || '').toLowerCase();
  const why = (d.why || '').toLowerCase();
  const blob = `${desc} ${why}`;

  if (/no credit card required|no cc|no account needed|without.*credit card/i.test(blob)) return 9;
  if (code === 'automatic (link)') return 8;
  if (code && code !== 'automatic (link)') return 6;
  if (/credit card required|cc required|cc-required|requires credit card/i.test(blob)) return 3;
  if (/phone verification|phone required/i.test(blob)) return 2;
  if (/frequently reported as broken|verification.*broken/i.test(blob)) return 1;
  return 7;
}

function factorEcosystemMaturity(d) {
  if (MARKET_LEADERS.has(d.id)) return 9;
  if (d.has_affiliate === true) return 7;
  return 6;
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, Math.round(v * 10) / 10));
}