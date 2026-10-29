/**
 * Deal rating rubric — 6 weighted factors (sum = 1.0).
 *
 * Each factor is scored 1-10 from the raw deal object; the composite is the
 * weighted sum in tenths.  Re-use this module anywhere you need to rate a deal.
 *
 * @param {{ id, pricing, deal, code, desc, why, tags, expires, has_affiliate }} d
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

/* ------------------------------------------------------------------ factors */

const marketLeaders = new Set([
  'cloudflare','github','gitlab','vercel','netlify','stripe','twilio',
  'sentry','datadog','hubspot','airtable','figma','miro','canva',
  'notion','linear','clickup','loom','zendesk','webflow','twilio-sendgrid',
  'brevo','algolia','auth0','clerk','github-copilot','posthog',
  'plausible','retool','circleci','github-models','google-gemini',
  'mistral','groq','cohere','elevenlabs','ollama','deepgram',
  'assemblyai','nvidia-nim','huggingface-providers',
  'cloudflare-workers-ai','codeium','replit','coderabbit',
  'launchdarkly','pagerduty','grafana-cloud','supabase','mongodb',
  'neon','planetscale','upstash','redis-cloud','aiven','render',
  'railway','flyio','digitalocean','linode','vultr','backblaze-b2',
  'hoppscotch','bruno','coolify','appwrite','umami','cal-com',
  'penpot','excalidraw','coda','minio','postmark','resend',
  'snyk','ngrok','nx','gitpod','cron-job',
]);

function blob(d) {
  return `${d.deal ?? ''} ${d.why ?? ''} ${d.desc ?? ''} ${d.tags ?? ''}`.toLowerCase();
}

function factorDollarValue(d) {
  const b = blob(d);
  let s = 4;

  const dollars = [];
  const moneyRe = /(?:\$|€)\s?(\d[\d,]*)\s*(?:k|,000)?/g;
  let m;
  while ((m = moneyRe.exec(b)) !== null) {
    let v = parseFloat(m[1].replace(/,/g, ''));
    if (/k|,000/i.test(m[0])) v = v * 1000;
    dollars.push(v);
  }
  const max = dollars.length ? Math.max(...dollars) : 0;
  if (max >= 5000) s += 5;
  else if (max >= 2000) s += 4;
  else if (max >= 1000) s += 3.5;
  else if (max >= 500) s += 3;
  else if (max >= 200) s += 2.5;
  else if (max >= 100) s += 2;
  else if (max >= 50) s += 1.5;
  else if (max >= 10) s += 1;

  if (/unlimited|forever-free|always free|10,?000 maus|7,?000 maus|75k mau|100k mau|1m events|1 million events|forever/i.test(b)) s += 2;
  if (/generous free tier|free forever|always-free|no credit card/i.test(b)) s += 1;

  const vs = (d.why ?? '').match(/vs\.?\s*\$?(\d+)\s*\/mo/i);
  if (vs) {
    const monthly = parseInt(vs[1], 10);
    if (monthly >= 50) s += 2;
    else if (monthly >= 25) s += 1.5;
    else if (monthly >= 10) s += 1;
  }

  return clamp(s);
}

function factorLongevity(d) {
  if (d.pricing === 'free' && isNullish(d.expires)) return 9;
  if (d.pricing === 'free') return 7;
  if (d.pricing === 'lifetime' && isNullish(d.expires)) return 8;
  if (d.pricing === 'lifetime') return 6;
  if (d.pricing === 'trial') return 4;
  if (d.pricing === 'paid') return 3;
  return 5;
}

function factorDevRelevance(d) {
  const t = `${d.tags ?? ''} ${d.category ?? ''}`.toLowerCase();
  const core = [
    'git','ci-cd','devops','database','postgres','mysql','redis',
    'hosting','serverless','docker','ide','api','monitoring','logs',
    'auth','security','code-review','autocomplete','completion','testing',
    'vps','cloud','workers','functions','bg-removal',
  ];
  const adjacent = [
    'productivity','scheduling','email','marketing','seo','forms',
    'design','collaboration','social-media','crm','whiteboard',
    'wireframing','voice','tts','speech','image','no-code',
    'nocode','tickets','background',
  ];
  let s = 4;
  if (core.some((c) => t.includes(c))) s += 4;
  else if (adjacent.some((c) => t.includes(c))) s += 2;

  const coreCategories = [
    'Developer Tools','Hosting & Cloud','Database','Monitoring',
    'CI/CD','Testing & QA','Storage & Cloud','Auth','AI & LLM',
  ];
  if (coreCategories.includes(d.category)) s += 1;

  // No-code/social are useful but not core workflow for many serious developers.
  if (['Social Media','Design & Collaboration'].includes(d.category)) s -= 1;

  return clamp(s);
}

function factorAudienceBreadth(d) {
  const t = `${d.tags ?? ''}`.toLowerCase();
  let s = 5;
  if (/\brecommended\b/.test(t)) s += 3;
  if (/\bspotlight\b/.test(t)) s += 1;
  if (/\blimited-audience\b|\benterprise\b|\bstartup-only\b/.test(t)) s -= 3;
  return clamp(s);
}

function factorFriction(d) {
  const b = `${d.desc ?? ''} ${d.why ?? ''}`.toLowerCase();
  const code = (d.code ?? '').toLowerCase();
  if (/no credit card required|no cc|no account needed|without.*credit card/i.test(b)) return 9;
  if (code === 'automatic (link)') return 8;
  if (code && code !== 'automatic (link)') return 6;
  if (/credit card required|requires credit card/i.test(b)) return 3;
  if (/phone verification|phone required/i.test(b)) return 2;
  if (/frequently reported as broken|verification.*broken/i.test(b)) return 1;
  return 7;
}

function factorEcosystemMaturity(d) {
  if (marketLeaders.has(d.id)) return 9;
  if (d.has_affiliate === true) return 7;
  return 6;
}

/* ------------------------------------------------------------------ helpers */

function isNullish(v) {
  return v === null || v === undefined;
}

function clamp(n) {
  return Math.min(10, Math.max(1, Math.round(n)));
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
