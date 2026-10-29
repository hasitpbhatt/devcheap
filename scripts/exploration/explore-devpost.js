#!/usr/bin/env node
/**
 * Devpost Exploration Agent
 * Searches Devpost for active hackathons with prizes, credits, and trials
 * Outputs structured deal data for deals.jsonl
 */

import { websearch } from 'websearch'; // Will use bash websearch tool instead

const DEVPOST_SEARCH_QUERIES = [
  'site:devpost.com hackathon "prize" "credits" 2026',
  'site:devpost.com hackathon "free credits" "API" 2026',
  'site:devpost.com "AWS credits" hackathon 2026',
  'site:devpost.com "Google Cloud credits" hackathon 2026',
  'site:devpost.com "Azure credits" hackathon 2026',
  'site:devpost.com "GitHub" "credits" hackathon 2026',
  'site:devpost.com "startup credits" hackathon 2026',
  'site:devpost.com "developer tools" "prize" 2026',
  'site:devpost.com "AI credits" hackathon 2026',
  'site:devpost.com "database credits" hackathon 2026',
  'site:devpost.com "MongoDB" hackathon 2026',
  'site:devpost.com "Supabase" hackathon 2026',
  'site:devpost.com "Vercel" hackathon 2026',
  'site:devpost.com "Cloudflare" hackathon 2026',
];

const DEVPOST_BASE = 'https://devpost.com';

async function searchDevpost(query) {
  // Use websearch tool via bash
  const { execSync } = await import('child_process');
  try {
    const result = execSync(`node -e "const {websearch} = await import('websearch'); console.log(JSON.stringify(await websearch('${query.replace(/'/g, "\\'")}', {numResults: 10, type: 'fast'})));"`, {
      encoding: 'utf-8',
      timeout: 30000
    });
    return JSON.parse(result);
  } catch (e) {
    console.error(`Search failed for: ${query}`, e.message);
    return [];
  }
}

function parseHackathonResult(result) {
  // Extract hackathon details from search result
  const title = result.title || '';
  const url = result.url || '';
  const snippet = result.snippet || '';
  
  // Extract prize/credit info
  const creditMatch = snippet.match(/(\$?\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:USD|credits?|credit)/gi);
  const prizeMatch = snippet.match(/prize[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d+)?)/gi);
  
  // Extract sponsor names
  const sponsors = snippet.match(/(AWS|Google Cloud|Azure|GitHub|MongoDB|Supabase|Vercel|Cloudflare|DigitalOcean|Stripe|Twilio|Auth0|OpenAI|Anthropic|Pinecone|Weaviate|Redis|PostgreSQL|MySQL|PlanetScale|Neon|Railway|Render|Fly\.io|Replicate|Hugging Face|Together AI|Groq|Cerebras|Fireworks|Baseten|Beam|Modal|RunPod|Lambda Labs|CoreWeave|Vast AI)/gi) || [];
  
  return {
    title,
    url,
    snippet,
    credits: creditMatch ? [...new Set(creditMatch)] : [],
    prizes: prizeMatch ? [...new Set(prizeMatch)] : [],
    sponsors: [...new Set(sponsors.map(s => s.toLowerCase()))],
    platform: 'devpost'
  };
}

function generateDealFromHackathon(hackathon) {
  const deals = [];
  const idBase = hackathon.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  
  // Generate deals from sponsors/credits mentioned
  for (const sponsor of hackathon.sponsors) {
    const sponsorDeals = getSponsorDeal(sponsor, hackathon);
    if (sponsorDeals) {
      deals.push(...sponsorDeals);
    }
  }
  
  // Generate deal from hackathon itself if it offers credits
  if (hackathon.credits.length > 0 || hackathon.prizes.length > 0) {
    deals.push({
      id: `${idBase}-hackathon`,
      name: hackathon.title,
      category: 'Developer Tools',
      pricing: 'free',
      deal: hackathon.credits.length > 0 ? hackathon.credits.join(', ') : hackathon.prizes.join(', '),
      code: 'Automatic (Link)',
      url: hackathon.url,
      affiliate_url: '',
      tracking_id: `${idBase}-hackathon`,
      has_affiliate: false,
      desc: `Hackathon with prizes/credits: ${hackathon.snippet.substring(0, 200)}`,
      tags: 'hackathon,prize,credits,' + hackathon.sponsors.join(','),
      why: `Active hackathon offering ${hackathon.credits.join(', ') || hackathon.prizes.join(', ')} - apply via Devpost`,
      expires: null,
      rating: 7.0
    });
  }
  
  return deals;
}

function getSponsorDeal(sponsor, hackathon) {
  const sponsorMap = {
    'aws': {
      id: 'aws-activate-hackathon',
      name: 'AWS Activate (via Hackathon)',
      category: 'Hosting & Cloud',
      deal: 'Up to $100,000 Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://aws.amazon.com/activate/',
      tracking_id: 'aws-hackathon'
    },
    'google cloud': {
      id: 'google-cloud-hackathon',
      name: 'Google Cloud for Startups (via Hackathon)',
      category: 'Hosting & Cloud',
      deal: 'Up to $350,000 AI Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://cloud.google.com/startup',
      tracking_id: 'gcp-hackathon'
    },
    'azure': {
      id: 'azure-hackathon',
      name: 'Microsoft for Startups (via Hackathon)',
      category: 'Hosting & Cloud',
      deal: 'Up to $150,000 Azure Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://foundershub.microsoft.com',
      tracking_id: 'azure-hackathon'
    },
    'github': {
      id: 'github-hackathon',
      name: 'GitHub for Startups (via Hackathon)',
      category: 'Developer Tools',
      deal: '20 Enterprise Seats + $10K Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://github.com/enterprise/startups',
      tracking_id: 'github-hackathon'
    },
    'mongodb': {
      id: 'mongodb-atlas-hackathon',
      name: 'MongoDB Atlas (via Hackathon)',
      category: 'Database',
      deal: 'Free Atlas Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://www.mongodb.com/atlas',
      tracking_id: 'mongodb-hackathon'
    },
    'supabase': {
      id: 'supabase-hackathon',
      name: 'Supabase (via Hackathon)',
      category: 'Database',
      deal: 'Free Pro Tier Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://supabase.com',
      tracking_id: 'supabase-hackathon'
    },
    'vercel': {
      id: 'vercel-hackathon',
      name: 'Vercel for Startups (via Hackathon)',
      category: 'Hosting & Cloud',
      deal: '$5K Credits + Enterprise Features via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://vercel.com/startups',
      tracking_id: 'vercel-hackathon'
    },
    'cloudflare': {
      id: 'cloudflare-hackathon',
      name: 'Cloudflare for Startups (via Hackathon)',
      category: 'Hosting & Cloud',
      deal: '$250K Enterprise Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://www.cloudflare.com/forstartups/',
      tracking_id: 'cloudflare-hackathon'
    },
    'digitalocean': {
      id: 'digitalocean-hackathon',
      name: 'DigitalOcean Hatch (via Hackathon)',
      category: 'Hosting & Cloud',
      deal: 'Up to $100K Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://www.digitalocean.com/hatch',
      tracking_id: 'do-hackathon'
    },
    'stripe': {
      id: 'stripe-hackathon',
      name: 'Stripe for Startups (via Hackathon)',
      category: 'APIs & Payments',
      deal: 'Fee Waivers + Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://stripe.com/startups',
      tracking_id: 'stripe-hackathon'
    },
    'twilio': {
      id: 'twilio-hackathon',
      name: 'Twilio for Startups (via Hackathon)',
      category: 'APIs & Email',
      deal: '$500 Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://www.twilio.com/startups',
      tracking_id: 'twilio-hackathon'
    },
    'auth0': {
      id: 'auth0-hackathon',
      name: 'Auth0 for Startups (via Hackathon)',
      category: 'Auth',
      deal: 'Free Developer Pro for 1 Year via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://auth0.com/startups',
      tracking_id: 'auth0-hackathon'
    },
    'openai': {
      id: 'openai-hackathon',
      name: 'OpenAI API Credits (via Hackathon)',
      category: 'AI & LLM',
      deal: 'API Credits via Hackathon Partnership',
      code: 'Automatic (Link)',
      url: 'https://openai.com',
      tracking_id: 'openai-hackathon'
    },
    'anthropic': {
      id: 'anthropic-hackathon',
      name: 'Anthropic Claude Credits (via Hackathon)',
      category: 'AI & LLM',
      deal: 'Up to $25K API Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://claude.com/programs/startups',
      tracking_id: 'anthropic-hackathon'
    },
    'pinecone': {
      id: 'pinecone-hackathon',
      name: 'Pinecone (via Hackathon)',
      category: 'AI & LLM',
      deal: 'Free Vector Database Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://pinecone.io',
      tracking_id: 'pinecone-hackathon'
    },
    'weaviate': {
      id: 'weaviate-hackathon',
      name: 'Weaviate (via Hackathon)',
      category: 'AI & LLM',
      deal: 'Free Vector Database Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://weaviate.io',
      tracking_id: 'weaviate-hackathon'
    },
    'redis': {
      id: 'redis-hackathon',
      name: 'Redis Cloud (via Hackathon)',
      category: 'Database',
      deal: 'Free Cloud Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://redis.com',
      tracking_id: 'redis-hackathon'
    },
    'postgresql': {
      id: 'postgresql-hackathon',
      name: 'PostgreSQL Cloud (via Hackathon)',
      category: 'Database',
      deal: 'Free Managed Postgres Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://www.postgresql.org',
      tracking_id: 'postgres-hackathon'
    },
    'mysql': {
      id: 'mysql-hackathon',
      name: 'MySQL Cloud (via Hackathon)',
      category: 'Database',
      deal: 'Free Managed MySQL Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://www.mysql.com',
      tracking_id: 'mysql-hackathon'
    },
    'planetscale': {
      id: 'planetscale-hackathon',
      name: 'PlanetScale (via Hackathon)',
      category: 'Database',
      deal: 'Free Scaler Plan Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://planetscale.com',
      tracking_id: 'planetscale-hackathon'
    },
    'neon': {
      id: 'neon-hackathon',
      name: 'Neon (via Hackathon)',
      category: 'Database',
      deal: 'Free Serverless Postgres Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://neon.tech',
      tracking_id: 'neon-hackathon'
    },
    'railway': {
      id: 'railway-hackathon',
      name: 'Railway (via Hackathon)',
      category: 'Hosting & Cloud',
      deal: 'Free Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://railway.app',
      tracking_id: 'railway-hackathon'
    },
    'render': {
      id: 'render-hackathon',
      name: 'Render (via Hackathon)',
      category: 'Hosting & Cloud',
      deal: 'Free Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://render.com',
      tracking_id: 'render-hackathon'
    },
    'fly.io': {
      id: 'fly-hackathon',
      name: 'Fly.io (via Hackathon)',
      category: 'Hosting & Cloud',
      deal: 'Free Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://fly.io',
      tracking_id: 'fly-hackathon'
    },
    'replicate': {
      id: 'replicate-hackathon',
      name: 'Replicate (via Hackathon)',
      category: 'AI & LLM',
      deal: 'Free GPU Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://replicate.com',
      tracking_id: 'replicate-hackathon'
    },
    'hugging face': {
      id: 'huggingface-hackathon',
      name: 'Hugging Face (via Hackathon)',
      category: 'AI & LLM',
      deal: 'Free GPU/Inference Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://huggingface.co',
      tracking_id: 'hf-hackathon'
    },
    'together ai': {
      id: 'together-hackathon',
      name: 'Together AI (via Hackathon)',
      category: 'AI & LLM',
      deal: 'Free API Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://together.ai',
      tracking_id: 'together-hackathon'
    },
    'groq': {
      id: 'groq-hackathon',
      name: 'Groq (via Hackathon)',
      category: 'AI & LLM',
      deal: 'Free API Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://groq.com',
      tracking_id: 'groq-hackathon'
    },
    'cerebras': {
      id: 'cerebras-hackathon',
      name: 'Cerebras (via Hackathon)',
      category: 'AI & LLM',
      deal: 'Free Inference Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://cerebras.ai',
      tracking_id: 'cerebras-hackathon'
    },
    'fireworks': {
      id: 'fireworks-hackathon',
      name: 'Fireworks AI (via Hackathon)',
      category: 'AI & LLM',
      deal: 'Free Inference Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://fireworks.ai',
      tracking_id: 'fireworks-hackathon'
    },
    'baseten': {
      id: 'baseten-hackathon',
      name: 'Baseten (via Hackathon)',
      category: 'AI & LLM',
      deal: 'Free GPU Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://baseten.co',
      tracking_id: 'baseten-hackathon'
    },
    'beam': {
      id: 'beam-hackathon',
      name: 'Beam Cloud (via Hackathon)',
      category: 'AI & LLM',
      deal: 'Free GPU Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://beam.cloud',
      tracking_id: 'beam-hackathon'
    },
    'modal': {
      id: 'modal-hackathon',
      name: 'Modal (via Hackathon)',
      category: 'AI & LLM',
      deal: 'Free GPU Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://modal.com',
      tracking_id: 'modal-hackathon'
    },
    'runpod': {
      id: 'runpod-hackathon',
      name: 'RunPod (via Hackathon)',
      category: 'AI & LLM',
      deal: 'Free GPU Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://runpod.io',
      tracking_id: 'runpod-hackathon'
    },
    'lambda labs': {
      id: 'lambdalabs-hackathon',
      name: 'Lambda Labs (via Hackathon)',
      category: 'AI & LLM',
      deal: 'Free GPU Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://lambdalabs.com',
      tracking_id: 'lambdalabs-hackathon'
    },
    'coreweave': {
      id: 'coreweave-hackathon',
      name: 'CoreWeave (via Hackathon)',
      category: 'AI & LLM',
      deal: 'Free GPU Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://coreweave.com',
      tracking_id: 'coreweave-hackathon'
    },
    'vast ai': {
      id: 'vastai-hackathon',
      name: 'Vast.ai (via Hackathon)',
      category: 'AI & LLM',
      deal: 'Free GPU Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://vast.ai',
      tracking_id: 'vastai-hackathon'
    }
  };
  
  return sponsorMap[sponsor] ? [{
    ...sponsorMap[sponsor],
    pricing: 'free',
    affiliate_url: '',
    has_affiliate: false,
    desc: `${sponsorMap[sponsor].deal} - Available through ${hackathon.title} on Devpost. ${hackathon.snippet.substring(0, 150)}...`,
    tags: 'hackathon,credits,startup,' + sponsor.replace(/\s+/g, '-'),
    why: `${sponsorMap[sponsor].deal} - apply through ${hackathon.title} on Devpost`,
    expires: null,
    rating: 7.5
  }] : null;
}

async function main() {
  console.log('🔍 Devpost Exploration Agent Starting...\n');
  
  const allHackathons = [];
  
  for (const query of DEVPOST_SEARCH_QUERIES) {
    console.log(`Searching: ${query}`);
    const results = await searchDevpost(query);
    
    for (const result of results) {
      const hackathon = parseHackathonResult(result);
      if (hackathon.sponsors.length > 0 || hackathon.credits.length > 0 || hackathon.prizes.length > 0) {
        allHackathons.push(hackathon);
      }
    }
    
    // Rate limiting
    await new Promise(r => setTimeout(r, 1000));
  }
  
  // Deduplicate by URL
  const uniqueHackathons = [...new Map(allHackathons.map(h => [h.url, h])).values()];
  
  console.log(`\n📊 Found ${uniqueHackathons.length} unique hackathons with prizes/credits\n`);
  
  // Generate deals
  const allDeals = [];
  for (const hackathon of uniqueHackathons) {
    const deals = generateDealFromHackathon(hackathon);
    allDeals.push(...deals);
  }
  
  // Deduplicate deals by tracking_id
  const uniqueDeals = [...new Map(allDeals.map(d => [d.tracking_id, d])).values()];
  
  console.log(`\n✨ Generated ${uniqueDeals.length} potential deals\n`);
  
  // Output as JSONL for easy addition to deals.jsonl
  const jsonl = uniqueDeals.map(d => JSON.stringify(d)).join('\n');
  console.log('--- DEALS JSONL OUTPUT ---');
  console.log(jsonl);
  
  // Also save to file
  const fs = await import('fs/promises');
  await fs.writeFile('devpost-deals.jsonl', jsonl + '\n', 'utf-8');
  console.log('\n💾 Saved to devpost-deals.jsonl');
}

main().catch(console.error);