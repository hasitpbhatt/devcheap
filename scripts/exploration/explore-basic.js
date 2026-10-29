#!/usr/bin/env node

/**
 * Basic Exploration Agent
 * Simple demonstration of exploring hackathon deals from various platforms
 */

const SAMPLE_HACKATHONS = [
  {
    title: 'YouCam API Skin AI & Apparel VTO Hackathon',
    url: 'https://app.perfectcorp.com/',
    snippet: 'YouCam offers 1,000 free API units (a $179 value) for hackathon participants. Use redeem code YOUCAMHACK2607 to instantly add API units to your account. Skin AI & Virtual Try-On platform for apparel applications.',
    credits: [`1,000`],
    prizes: [],
    grants: [],
    sponsors: ['youcam'],
    platform: 'perfectcorp'
  },
  {
    title: 'VocalBridge Developer Hackathon',
    url: 'https://vocalbridge.ai',
    snippet: 'VocalBridge offers 1-month free access to Developer plan ($49/month) for hackathon participants. Use code VBHACKMONTH for 100% off first month. Voice AI platform with 1,000 voice minutes, 5 agents, inbound+outbound calling (10/day).',
    credits: [`$49/mo`],
    prizes: [],
    grants: [],
    sponsors: ['vocalbridge'],
    platform: 'vocalbridge'
  },
  {
    title: 'AWS Activate Hackathon 2026',
    url: 'https://aws.amazon.com/activate/',
    snippet: 'AWS Activate provides up to $100,000 in startup credits, technical resources, and training. Founders tier offers $1,000-$5,000 automatically. Portfolio tier (VC-backed) offers up to $100,000. Available through AWS Activate Hackathon 2026.',
    credits: [`$100,000`],
    prizes: [],
    grants: [],
    sponsors: ['aws'],
    platform: 'devpost'
  },
  {
    title: 'Google Cloud Startup Program',
    url: 'https://cloud.google.com/startup',
    snippet: 'Google for Startups offers up to $350,000 in AI credits and partner perks. Scale tier includes $100,000 credits plus Datadog free 1yr, GitLab Ultimate free 1yr, MongoDB $5K, Grafana $100K, Temporal $12K.',
    credits: [`$350,000`],
    prizes: [],
    grants: [],
    sponsors: ['google cloud'],
    platform: 'dorahacks'
  },
  {
    title: 'Microsoft for Startups',
    url: 'https://foundershub.microsoft.com',
    snippet: 'Microsoft for Startups offers up to $150,000 in Azure credits. Eligible companies include verified startups, accelerator/incubator/VC-backed applicants.',
    credits: [`$150,000`],
    prizes: [],
    grants: [],
    sponsors: ['azure'],
    platform: 'devfolio'
  },
  {
    title: 'GitHub for Startups',
    url: 'https://github.com/enterprise/startups',
    snippet: 'GitHub for Startups provides 20 Enterprise seats free for 12 months plus $10,000 in flexible platform credits for Copilot, Advanced Security, Actions, and more.',
    credits: [`$10,000`],
    prizes: [],
    grants: [],
    sponsors: ['github'],
    platform: 'hackerearth'
  },
  {
    title: 'Cloudflare for Startups',
    url: 'https://www.cloudflare.com/forstartups/',
    snippet: 'Cloudflare for Startups offers $250,000 in enterprise credits for qualifying startups and non-profits. Access to Workers, Workers AI, CDN, DDoS protection, D1 database, and R2 storage.',
    credits: [`$250,000`],
    prizes: [],
    grants: [],
    sponsors: ['cloudflare'],
    platform: 'topcoder'
  },
  {
    title: 'Y Combinator Demo Day',
    url: 'https://www.ycombinator.com',
    snippet: 'Y Combinator offers seed funding and mentorship to early-stage startups. Demo Day features presentations from portfolio companies seeking follow-on funding.',
    credits: [],
    prizes: [`$50,000-$500,000`],
    grants: [],
    sponsors: ['y combinator'],
    platform: 'angel-list'
  },
];

function generateDealFromHackathon(hackathon) {
  const deals = [];
  const idBase = hackathon.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  
  // Generate specific deals from sponsors/credits mentioned
  for (const sponsor of hackathon.sponsors) {
    const sponsorDeals = getSponsorDeal(sponsor, hackathon);
    if (sponsorDeals) {
      deals.push(...sponsorDeals);
    }
  }
  
  // Generate deal from hackathon itself if it offers credits
  if (hackathon.credits.length > 0 || hackathon.prizes.length > 0) {
    const totalAmount = [...hackathon.credits, ...hackathon.prizes].join(', ');
    
    deals.push({
      id: `${idBase}-hackathon`,
      name: hackathon.title,
      category: 'Developer Tools',
      pricing: 'free',
      deal: totalAmount ? totalAmount : 'Hackathon Participation',
      code: 'Automatic (Link)',
      url: hackathon.url,
      affiliate_url: '',
      tracking_id: `${idBase}-hackathon`,
      has_affiliate: false,
      desc: `Hackathon with ${hackathon.platform} offering ${totalAmount || 'prizes and grants'}. ${hackathon.snippet.substring(0, 200)}`,
      tags: 'hackathon,prize,credits,2026,' + hackathon.sponsors.join(','),
      why: `Active ${hackathon.platform} program offering ${totalAmount} - qualify as verified startup through official program`,
      expires: null,
      rating: 8.0
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
    'cloudflare': {
      id: 'cloudflare-hackathon',
      name: 'Cloudflare for Startups (via Hackathon)',
      category: 'Hosting & Cloud',
      deal: '$250K Enterprise Credits via Hackathon',
      code: 'Automatic (Link)',
      url: 'https://www.cloudflare.com/forstartups/',
      tracking_id: 'cloudflare-hackathon'
    },
    'y combinator': {
      id: 'ycombinator-hackathon',
      name: 'Y Combinator via Demo Day',
      category: 'Developer Tools',
      deal: 'Startup Seed Funding via YC Demo Day',
      code: 'Automatic (Link)',
      url: 'https://www.ycombinator.com',
      tracking_id: 'yc-hackathon'
    },
    'angel list': {
      id: 'angellist-hackathon',
      name: 'AngelList via Hackathon',
      category: 'Developer Tools',
      deal: 'Startup Listing + Angel Investment via AngelList',
      code: 'Automatic (Link)',
      url: 'https://angel.co',
      tracking_id: 'al-hackathon'
    },
  };
  
  return sponsorMap[sponsor] ? [{
    ...sponsorMap[sponsor],
    pricing: 'free',
    affiliate_url: '',
    has_affiliate: false,
    desc: `${sponsorMap[sponsor].deal} - Available through ${hackathon.title} on ${hackathon.platform}. ${hackathon.snippet.substring(0, 150)}...`,
    tags: 'hackathon,credits,startup,' + sponsor.replace(/\s+/g, '-'),
    why: `${sponsorMap[sponsor].deal} - apply through ${hackathon.title} on ${hackathon.platform}`,
    expires: null,
    rating: 7.5
  }] : null;
}

async function main() {
  console.log('🔍 Basic Exploration Agent Starting...\n');
  
  const allDeals = [];
  
  for (const hackathon of SAMPLE_HACKATHONS) {
    const deals = generateDealFromHackathon(hackathon);
    allDeals.push(...deals);
    console.log(`\n📋 Generated ${deals.length} deals from: ${hackathon.title}`);
  }
  
  const uniqueDeals = [...new Map(allDeals.map(d => [d.tracking_id, d])).values()];
  
  console.log(`\n📊 Total unique deals generated: ${uniqueDeals.length}\n`);
  
  console.log('--- DEALS JSONL OUTPUT ---');
  const jsonl = uniqueDeals.map(d => JSON.stringify(d)).join('\n');
  console.log(jsonl);
  
  console.log('\n💾 Ready for addition to deals.jsonl');
  console.log('\n--- SAMPLE DEALS ANALYSIS ---');
  
  const categories = [...new Set(uniqueDeals.map(d => d.category))];
  console.log(`Categories: ${categories.join(', ')}`);
  console.log(`Total Categories: ${categories.length}`);
  
  const pricingTypes = [...new Set(uniqueDeals.map(d => d.pricing))];
  console.log(`Pricing Types: ${pricingTypes.join(', ')}`);
  
  const avgRating = uniqueDeals.reduce((sum, d) => sum + d.rating, 0) / uniqueDeals.length;
  console.log(`Average Rating: ${avgRating.toFixed(1)}`);
}

main().catch(console.error);