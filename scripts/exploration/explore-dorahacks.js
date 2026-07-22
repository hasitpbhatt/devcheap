#!/usr/bin/env node
/**
 * DoraHacks Exploration Agent
 * Searches DoraHacks for active hackathons with prizes, credits, and trials
 * Outputs structured deal data for deals.jsonl
 */

import { websearch } from 'websearch'; // Will use bash websearch tool instead

const DORAHACKS_SEARCH_QUERIES = [
  'site:dorahacks.io hackathon "$ credits" 2026',
  'site:dorahacks.io hackathon "prize" 2026',
  'site:dorahacks.io "AWS credits" hackathon 2026',
  'site:dorahacks.io "Google Cloud credits" hackathon 2026',
  'site:dorahacks.io "Azure credits" hackathon 2026',
  'site:dorahacks.io "GitHub" "credits" hackathon 2026',
  'site:dorahacks.io "startup credits" hackathon 2026',
  'site:dorahacks.io "developer tools" "prize" 2026',
  'site:dorahacks.io "AI credits" hackathon 2026',
  'site:dorahacks.io "machine learning" "credits" hackathon 2026',
  'site:dorahacks.io "MongoDB" hackathon 2026',
  'site:dorahacks.io "Supabase" hackathon 2026',
  'site:dorahacks.io "Vercel" hackathon 2026',
  'site:dorahacks.io "Cloudflare" hackathon 2026',
  'site:dorahacks.io "Next.js" hackathon 2026',
  'site:dorahacks.io "React" hackathon 2026',
  'site:dorahacks.io "Node.js" hackathon 2026',
  'site:dorahacks.io "Web3" "credits" hackathon 2026',
  'site:dorahacks.io "Blockchain" hackathon 2026',
  'site:dorahacks.io "DeFi" hackathon 2026',
];

const DORAHACKS_BASE = 'https://dorahacks.io';

async function searchDorahacks(query) {
  // Use websearch tool via bash
  const { execSync } = await import('child_process');
  try {
    const result = execSync(`node -e "const {websearch} = await import('websearch'); console.log(JSON.stringify(await websearch('${query.replace(/'/g, "\\'")}', {numResults: 10, type: 'fast'}));"`, {
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
  const creditMatch = snippet.match(/(\$?\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:USD|US dollars?|dollars?|credits?|credit)/gi);
  const prizeMatch = snippet.match(/prize[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d+)?)/gi);
  
  // Extract sponsor names
  const sponsors = snippet.match(/(AWS|Google Cloud|Azure|GitHub|MongoDB|Supabase|Vercel|Cloudflare|DigitalOcean|Stripe|Twilio|Auth0|OpenAI|Anthropic|Pinecone|Weaviate|Redis|PostgreSQL|MySQL|PlanetScale|Neon|Railway|Render|Fly\.io|Replicate|Hugging Face|Together AI|Groq|Cerebras|Fireworks|Baseten|Beam|Modal|RunPod|Lambda Labs|CoreWeave|Vast AI|Meta|Facebook|Google|Meta Platforms)/gi) || [];
  
  return {
    title,
    url,
    snippet,
    credits: creditMatch ? [...new Set(creditMatch)] : [],
    prizes: prizeMatch ? [...new Set(prizeMatch)] : [],
    sponsors: [...new Set(sponsors.map(s => s.toLowerCase()))],
    platform: 'dorahacks'
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
      why: `Active hackathon offering ${hackathon.credits.join(', ') || hackathon.prizes.join(', ')} - apply via DoraHacks`,
      expires: null,
      rating: 7.0
    });
  }
  
  return deals;
}

function getSponsorDeal(sponsor, hackathon) {
  const sponsorMap = {
    'aws': {
      id: 'aws-activate-dorahacks',
      name: 'AWS Activate (via DoraHacks)',
      category: 'Hosting & Cloud',
      deal: 'Up to $100,000 Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://aws.amazon.com/activate/',
      tracking_id: 'aws-dorahacks'
    },
    'google cloud': {
      id: 'google-cloud-dorahacks',
      name: 'Google Cloud for Startups (via DoraHacks)',
      category: 'Hosting & Cloud',
      deal: 'Up to $350,000 AI Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://cloud.google.com/startup',
      tracking_id: 'gcp-dorahacks'
    },
    'azure': {
      id: 'azure-dorahacks',
      name: 'Microsoft for Startups (via DoraHacks)',
      category: 'Hosting & Cloud',
      deal: 'Up to $150,000 Azure Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://foundershub.microsoft.com',
      tracking_id: 'azure-dorahacks'
    },
    'github': {
      id: 'github-dorahacks',
      name: 'GitHub for Startups (via DoraHacks)',
      category: 'Developer Tools',
      deal: '20 Enterprise Seats + $10K Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://github.com/enterprise/startups',
      tracking_id: 'github-dorahacks'
    },
    'mongodb': {
      id: 'mongodb-atlas-dorahacks',
      name: 'MongoDB Atlas (via DoraHacks)',
      category: 'Database',
      deal: 'Free Atlas Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://www.mongodb.com/atlas',
      tracking_id: 'mongodb-dorahacks'
    },
    'supabase': {
      id: 'supabase-dorahacks',
      name: 'Supabase (via DoraHacks)',
      category: 'Database',
      deal: 'Free Pro Tier Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://supabase.com',
      tracking_id: 'supabase-dorahacks'
    },
    'vercel': {
      id: 'vercel-dorahacks',
      name: 'Vercel for Startups (via DoraHacks)',
      category: 'Hosting & Cloud',
      deal: '$5K Credits + Enterprise Features via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://vercel.com/startups',
      tracking_id: 'vercel-dorahacks'
    },
    'cloudflare': {
      id: 'cloudflare-dorahacks',
      name: 'Cloudflare for Startups (via DoraHacks)',
      category: 'Hosting & Cloud',
      deal: '$250K Enterprise Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://www.cloudflare.com/forstartups/',
      tracking_id: 'cloudflare-dorahacks'
    },
    'digitalocean': {
      id: 'digitalocean-dorahacks',
      name: 'DigitalOcean Hatch (via DoraHacks)',
      category: 'Hosting & Cloud',
      deal: 'Up to $100K Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://www.digitalocean.com/hatch',
      tracking_id: 'do-dorahacks'
    },
    'stripe': {
      id: 'stripe-dorahacks',
      name: 'Stripe for Startups (via DoraHacks)',
      category: 'APIs & Payments',
      deal: 'Fee Waivers + Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://stripe.com/startups',
      tracking_id: 'stripe-dorahacks'
    },
    'twilio': {
      id: 'twilio-dorahacks',
      name: 'Twilio for Startups (via DoraHacks)',
      category: 'APIs & Email',
      deal: '$500 Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://www.twilio.com/startups',
      tracking_id: 'twilio-dorahacks'
    },
    'auth0': {
      id: 'auth0-dorahacks',
      name: 'Auth0 for Startups (via DoraHacks)',
      category: 'Auth',
      deal: 'Free Developer Pro for 1 Year via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://auth0.com/startups',
      tracking_id: 'auth0-dorahacks'
    },
    'openai': {
      id: 'openai-dorahacks',
      name: 'OpenAI API Credits (via DoraHacks)',
      category: 'AI & LLM',
      deal: 'API Credits via Hackathon Partnership',
      code: 'Automatic (Link)',
      url: 'https://openai.com',
      tracking_id: 'openai-dorahacks'
    },
    'anthropic': {
      id: 'anthropic-dorahacks',
      name: 'Anthropic Claude Credits (via DoraHacks)',
      category: 'AI & LLM',
      deal: 'Up to $25K API Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://claude.com/programs/startups',
      tracking_id: 'anthropic-dorahacks'
    },
    'pinecone': {
      id: 'pinecone-dorahacks',
      name: 'Pinecone (via DoraHacks)',
      category: 'AI & LLM',
      deal: 'Free Vector Database Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://pinecone.io',
      tracking_id: 'pinecone-dorahacks'
    },
    'weaviate': {
      id: 'weaviate-dorahacks',
      name: 'Weaviate (via DoraHacks)',n      category: 'AI & LLM',
      deal: 'Free Vector Database Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://weaviate.io',
      tracking_id: 'weaviate-dorahacks'
    },
    'redis': {
      id: 'redis-dorahacks',
      name: 'Redis Cloud (via DoraHacks)',
      category: 'Database',
      deal: 'Free Cloud Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://redis.com',
      tracking_id: 'redis-dorahacks'
    },
    'postgresql': {
      id: 'postgresql-dorahacks',
      name: 'PostgreSQL Cloud (via DoraHacks)',
      category: 'Database',
      deal: 'Free Managed Postgres Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://www.postgresql.org',
      tracking_id: 'postgres-dorahacks'
    },
    'mysql': {
      id: 'mysql-dorahacks',
      name: 'MySQL Cloud (via DoraHacks)',
      category: 'Database',
      deal: 'Free Managed MySQL Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://www.mysql.com',
      tracking_id: 'mysql-dorahacks'
    },
    'planetscale': {
      id: 'planetscale-dorahacks',
      name: 'PlanetScale (via DoraHacks)',
      category: 'Database',
      deal: 'Free Scaler Plan Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://planetscale.com',
      tracking_id: 'planetscale-dorahacks'
    },
    'neon': {
      id: 'neon-dorahacks',
      name: 'Neon (via DoraHacks)',
      category: 'Database',
      deal: 'Free Serverless Postgres Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://neon.tech',
      tracking_id: 'neon-dorahacks'
    },
    'railway': {
      id: 'railway-dorahacks',
      name: 'Railway (via DoraHacks)',
      category: 'Hosting & Cloud',
      deal: 'Free Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://railway.app',
      tracking_id: 'railway-dorahacks'
    },
    'render': {
      id: 'render-dorahacks',
      name: 'Render (via DoraHacks)',
      category: 'Hosting & Cloud',
      deal: 'Free Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://render.com',
      tracking_id: 'render-dorahacks'
    },
    'fly.io': {
      id: 'fly-dorahacks',
      name: 'Fly.io (via DoraHacks)',
      category: 'Hosting & Cloud',
      deal: 'Free Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://fly.io',
      tracking_id: 'fly-dorahacks'
    },
    'replicate': {
      id: 'replicate-dorahacks',
      name: 'Replicate (via DoraHacks)',
      category: 'AI & LLM',
      deal: 'Free GPU Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://replicate.com',
      tracking_id: 'replicate-dorahacks'
    },
    'hugging face': {
      id: 'huggingface-dorahacks',
      name: 'Hugging Face (via DoraHacks)',
      category: 'AI & LLM',
      deal: 'Free GPU/Inference Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://huggingface.co',
      tracking_id: 'hf-dorahacks'
    },
    'together ai': {
      id: 'together-dorahacks',
      name: 'Together AI (via DoraHacks)',
      category: 'AI & LLM',
      deal: 'Free API Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://together.ai',
      tracking_id: 'together-dorahacks'
    },
    'groq': {
      id: 'groq-dorahacks',
      name: 'Groq (via DoraHacks)',
      category: 'AI & LLM',
      deal: 'Free API Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://groq.com',
      tracking_id: 'groq-dorahacks'
    },
    'cerebras': {
      id: 'cerebras-dorahacks',
      name: 'Cerebras (via DoraHacks)',
      category: 'AI & LLM',
      deal: 'Free Inference Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://cerebras.ai',
      tracking_id: 'cerebras-dorahacks'
    },
    'fireworks': {
      id: 'fireworks-dorahacks',
      name: 'Fireworks AI (via DoraHacks)',
      category: 'AI & LLM',
      deal: 'Free Inference Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://fireworks.ai',
      tracking_id: 'fireworks-dorahacks'
    },
    'baseten': {
      id: 'baseten-dorahacks',
      name: 'Baseten (via DoraHacks)',
      category: 'AI & LLM',
      deal: 'Free GPU Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://baseten.co',
      tracking_id: 'baseten-dorahacks'
    },
    'beam': {
      id: 'beam-dorahacks',
      name: 'Beam Cloud (via DoraHacks)',
      category: 'AI & LLM',
      deal: 'Free GPU Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://beam.cloud',
      tracking_id: 'beam-dorahacks'
    },
    'modal': {
      id: 'modal-dorahacks',
      name: 'Modal (via DoraHacks)',
      category: 'AI & LLM',
      deal: 'Free GPU Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://modal.com',
      tracking_id: 'modal-dorahacks'
    },
    'runpod': {
      id: 'runpod-dorahacks',
      name: 'RunPod (via DoraHacks)',
      category: 'AI & LLM',
      deal: 'Free GPU Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://runpod.io',
      tracking_id: 'runpod-dorahacks'
    },
    'lambda labs': {
      id: 'lambdalabs-dorahacks',
      name: 'Lambda Labs (via DoraHacks)',
      category: 'AI & LLM',
      deal: 'Free GPU Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://lambdalabs.com',
      tracking_id: 'lambdalabs-dorahacks'
    },
    'coreweave': {
      id: 'coreweave-dorahacks',
      name: 'CoreWeave (via DoraHacks)',
      category: 'AI & LLM',
      deal: 'Free GPU Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://coreweave.com',
      tracking_id: 'coreweave-dorahacks'
    },
    'vast ai': {
      id: 'vastai-dorahacks',
      name: 'Vast.ai (via DoraHacks)',
      category: 'AI & LLM',
      deal: 'Free GPU Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://vast.ai',
      tracking_id: 'vastai-dorahacks'
    },
    'meta': {
      id: 'meta-dorahacks',
      name: 'Meta (via DoraHacks)',
      category: 'AI & LLM',
      deal: 'AI Credits for Hackathons',
      code: 'Automatic (Link)',
      url: 'https://ai.meta.com',
      tracking_id: 'meta-dorahacks'
    },
    'facebook': {
      id: 'facebook-dorahacks',
      name: 'Meta (via DoraHacks)',
      category: 'AI & LLM',
      deal: 'AI Credits for Hackathons',
      code: 'Automatic (Link)',
      url: 'https://ai.meta.com',
      tracking_id: 'facebook-dorahacks'
    },
    'google': {
      id: 'google-dorahacks',
      name: 'Google for Startups (via DoraHacks)',
      category: 'Hosting & Cloud',
      deal: 'Up to $350K AI Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://cloud.google.com/startup',
      tracking_id: 'google-dorahacks'
    },
    'meta platforms': {
      id: 'meta-platforms-dorahacks',
      name: 'Meta (via DoraHacks)',
      category: 'AI & LLM',
      deal: 'AI Credits for Hackathons',
      code: 'Automatic (Link)',
      url: 'https://ai.meta.com',
      tracking_id: 'meta-platforms-dorahacks'
    },
    'nextjs': {
      id: 'nextjs-dorahacks',
      name: 'Next.js (via DoraHacks)',
      category: 'Developer Tools',
      deal: 'Infrastructure Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://nextjs.org',
      tracking_id: 'nextjs-dorahacks'
    },
    'react': {
      id: 'react-dorahacks',
      name: 'Meta React (via DoraHacks)',
      category: 'Developer Tools',
      deal: 'Development Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://react.dev',
      tracking_id: 'react-dorahacks'
    },
    'node.js': {
      id: 'nodejs-dorahacks',
      name: 'Node.js Foundation (via DoraHacks)',
      category: 'Developer Tools',
      deal: 'Development Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://nodejs.org',
      tracking_id: 'nodejs-dorahacks'
    },
    'web3': {
      id: 'web3-dorahacks',
      name: 'Web3 (via DoraHacks)',
      category: 'Developer Tools',
      deal: 'Development Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://web3.foundation',
      tracking_id: 'web3-dorahacks'
    },
    'blockchain': {
      id: 'blockchain-dorahacks',
      name: 'Blockchain (via DoraHacks)',
      category: 'Developer Tools',
      deal: 'Development Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://blockchain.org',
      tracking_id: 'blockchain-dorahacks'
    },
    'defi': {
      id: 'defi-dorahacks',
      name: 'DeFi (via DoraHacks)',
      category: 'Developer Tools',
      deal: 'Development Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://defi.org',
      tracking_id: 'defi-dorahacks'
    }
  };
  
  return sponsorMap[sponsor] ? [{
    ...sponsorMap[sponsor],
    pricing: 'free',
    affiliate_url: '',
    has_affiliate: false,
    desc: `${sponsorMap[sponsor].deal} - Available through ${hackathon.title} on DoraHacks. ${hackathon.snippet.substring(0, 150)}...`,
    tags: 'hackathon,credits,startup,' + sponsor.replace(/\s+/g, '-'),
    why: `${sponsorMap[sponsor].deal} - apply through ${hackathon.title} on DoraHacks`,
    expires: null,
    rating: 7.5
  }] : null;
}

async function main() {
  console.log('🔍 DoraHacks Exploration Agent Starting...\n');
  
  const allHackathons = [];
  
  for (const query of DORAHACKS_SEARCH_QUERIES) {
    console.log(`Searching: ${query}`);
    const results = await searchDorahacks(query);
    
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
  await fs.writeFile('dorahacks-deals.jsonl', jsonl + '\n', 'utf-8');
  console.log('\n💾 Saved to dorahacks-deals.jsonl');
}

main().catch(console.error);