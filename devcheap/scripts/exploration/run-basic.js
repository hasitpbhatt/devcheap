#!/usr/bin/env node

// Quick test script to verify our basic exploration is working
const SAMPLE_HACKATHONS = [
  {
    title: 'YouCam API Skin AI & Apparel VTO Hackathon',
    url: 'https://app.perfectcorp.com/',
    snippet: 'YouCam offers 1,000 free API units (a $179 value) for hackathon participants. Use redeem code YOUCAMHACK2607 to instantly add API units to your account. Skin AI & Virtual Try-On platform for apparel applications.',
    credits: ['1,000'],
    prizes: [],
    grants: [],
    sponsors: ['youcam'],
    platform: 'perfectcorp'
  },
  {
    title: 'VocalBridge Developer Hackathon',
    url: 'https://vocalbridge.ai',
    snippet: 'VocalBridge offers 1-month free access to Developer plan ($49/month) for hackathon participants. Use code VBHACKMONTH for 100% off first month. Voice AI platform with 1,000 voice minutes, 5 agents, inbound+outbound calling (10/day).',
    credits: ['$49/mo'],
    prizes: [],
    grants: [],
    sponsors: ['vocalbridge'],
    platform: 'vocalbridge'
  }
];

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
  if (hackathon.credits.length > 0) {
    const totalAmount = hackathon.credits.join(', ');
    
    deals.push({
      id: `${idBase}-hackathon`,
      name: hackathon.title,
      category: 'Developer Tools',
      pricing: 'free',
      deal: totalAmount,
      code: 'Automatic (Link)',
      url: hackathon.url,
      affiliate_url: '',
      tracking_id: `${idBase}-hackathon`,
      has_affiliate: false,
      desc: `Hackathon with ${hackathon.platform} offering ${totalAmount}. ${hackathon.snippet.substring(0, 200)}`,
      tags: 'hackathon,prize,credits,2026,' + hackathon.sponsors.join(','),
      why: `Active ${hackathon.platform} program offering ${totalAmount} - apply via ${hackathon.platform}`,
      expires: null,
      rating: 8.0
    });
  }
  
  return deals;
}

function getSponsorDeal(sponsor, hackathon) {
  const sponsorMap = {
    'youcam': {
      id: 'youcam-api-hackathon',
      name: 'YouCam API Skin AI & Apparel',
      category: 'Developer Tools',
      pricing: 'free',
      deal: '1,000 Free API Units',
      code: 'YOUCAMHACK2607',
      url: 'https://app.perfectcorp.com/',
      tracking_id: 'youcam-api-hackathon'
    },
    'vocalbridge': {
      id: 'vocalbridge-hackathon',
      name: 'VocalBridge Developer Hackathon',
      category: 'AI & LLM',
      pricing: 'paid',
      deal: '$49/mo with VBHACKMONTH code',
      code: 'VBHACKMONTH',
      url: 'https://vocalbridge.ai',
      tracking_id: 'vocalbridge-hackathon'
    }
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
  
  console.log('\n✅ Ready for addition to deals.jsonl');
  console.log('\n🎉 Successfully tested hackathon exploration!');
}

main().catch(console.error);