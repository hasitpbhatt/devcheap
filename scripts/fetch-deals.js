#!/usr/bin/env node

/**
 * fetch-deals.js
 * Offline tool to add new developer deals to data/deals.json.
 * Edit the `newDeals` array below, then run: node scripts/fetch-deals.js
 *
 * data/deals.json is the source of truth for the site.
 * After adding deals, update the inline JSON in index.html if needed
 * (search for `<script id="deals-data">`).
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEALS_PATH = path.join(__dirname, '..', 'data', 'deals.json');

// ── Add new deals below ────────────────────────────────────────
const newDeals = [
  {
    id: 'checkly',
    name: 'Checkly',
    category: 'Monitoring',
    deal: '20% Off Annual Plan',
    code: 'CHECKLY20',
    url: 'https://www.checklyhq.com',
    affiliate_url: 'https://www.checklyhq.com',
    tracking_id: 'checkly_001',
    has_affiliate: false,
    desc: 'Synthetic monitoring for APIs and browser apps. Uptime checks, Playwright-based browser checks, and alerting.',
    tags: 'monitoring,uptime,playwright,browser,api,testing'
  },
  {
    id: 'clickup',
    name: 'ClickUp',
    category: 'Developer Tools',
    deal: '20% Off Workspace Plans',
    code: 'CLICKUP20',
    url: 'https://clickup.com',
    affiliate_url: 'https://clickup.com',
    tracking_id: 'clickup_001',
    has_affiliate: false,
    desc: 'All-in-one productivity platform with docs, sprints, goals, and AI-powered project management.',
    tags: 'project-management,productivity,tasks,docs,sprints'
  },
  {
    id: 'hetzner',
    name: 'Hetzner Cloud',
    category: 'Hosting & Cloud',
    deal: '€20 Cloud Credit for New Users',
    code: 'HETZNER20',
    url: 'https://www.hetzner.com/cloud',
    affiliate_url: 'https://www.hetzner.com/cloud',
    tracking_id: 'hetzner_001',
    has_affiliate: false,
    desc: 'European cloud provider with affordable VPS, dedicated servers, and storage. €20 credit for new accounts.',
    tags: 'vps,cloud,hosting,europe,dedicated'
  },
  {
    id: 'hostinger',
    name: 'Hostinger',
    category: 'Hosting & Cloud',
    deal: '80% OFF Web Hosting Plans',
    code: 'HOSTINGER80',
    url: 'https://www.hostinger.com',
    affiliate_url: 'https://www.hostinger.com',
    tracking_id: 'hostinger_001',
    has_affiliate: true,
    desc: 'Budget-friendly hosting with shared, VPS, and cloud plans. Includes free SSL, domain, and 24/7 support.',
    tags: 'hosting,vps,shared-hosting,ssl,domain'
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    category: 'APIs & Email',
    deal: 'Free CRM + $1,000 Startup Credits',
    code: 'HUBSPOT1000',
    url: 'https://www.hubspot.com',
    affiliate_url: 'https://www.hubspot.com',
    tracking_id: 'hubspot_001',
    has_affiliate: true,
    desc: 'CRM, marketing automation, and sales tools with generous startup program credits.',
    tags: 'crm,marketing,sales,automation,email'
  },
  {
    id: 'ionos',
    name: 'IONOS',
    category: 'Domains & Hosting',
    deal: '93% OFF All Hosting Plans + Free Domain',
    code: 'IONOS93',
    url: 'https://www.ionos.com',
    affiliate_url: 'https://www.ionos.com',
    tracking_id: 'ionos_001',
    has_affiliate: true,
    desc: 'Web hosting, domains, VPS, and cloud solutions from a global provider. Deep discounts on hosting plans.',
    tags: 'hosting,domains,vps,ssl,cloud'
  },
  {
    id: 'linode',
    name: 'Linode (Akamai)',
    category: 'Hosting & Cloud',
    deal: '$100 Free Credit for New Accounts',
    code: 'LINODE100',
    url: 'https://www.linode.com',
    affiliate_url: 'https://www.linode.com',
    tracking_id: 'linode_001',
    has_affiliate: true,
    desc: 'Developer-friendly cloud hosting with high-performance compute instances, GPU, and global data centers.',
    tags: 'vps,cloud,compute,gpu,hosting,linux'
  },
  {
    id: 'notion',
    name: 'Notion',
    category: 'Developer Tools',
    deal: 'Team Plan Trial + Bonus Credits',
    code: 'NOTIONTEAM',
    url: 'https://www.notion.so',
    affiliate_url: 'https://www.notion.so',
    tracking_id: 'notion_001',
    has_affiliate: false,
    desc: 'All-in-one workspace for docs, wikis, databases, and project management with AI features.',
    tags: 'docs,wiki,database,productivity,notes'
  },
  {
    id: 'scaleway',
    name: 'Scaleway',
    category: 'Hosting & Cloud',
    deal: '€20 Cloud Credits for New Users',
    code: 'SCALEWAY20',
    url: 'https://www.scaleway.com',
    affiliate_url: 'https://www.scaleway.com',
    tracking_id: 'scaleway_001',
    has_affiliate: false,
    desc: 'European cloud provider with VMs, Kubernetes, object storage, and serverless functions.',
    tags: 'cloud,vps,kubernetes,storage,serverless'
  },
  {
    id: 'siteground',
    name: 'SiteGround',
    category: 'Domains & Hosting',
    deal: '75% OFF Web Hosting Plans',
    code: 'SITEGROUND75',
    url: 'https://www.siteground.com',
    affiliate_url: 'https://www.siteground.com',
    tracking_id: 'siteground_001',
    has_affiliate: true,
    desc: 'Premium web hosting with managed WordPress, WooCommerce, and cloud hosting solutions.',
    tags: 'hosting,wordpress,woocommerce,managed,ssl'
  },
  {
    id: 'twilio',
    name: 'Twilio',
    category: 'APIs & Email',
    deal: '$15 Free API Credit',
    code: 'TWILIO15',
    url: 'https://www.twilio.com',
    affiliate_url: 'https://www.twilio.com',
    tracking_id: 'twilio_001',
    has_affiliate: false,
    desc: 'Cloud communications platform for SMS, voice, video, email (SendGrid), and authentication APIs.',
    tags: 'sms,voice,email,api,communications,authentication'
  },
  {
    id: 'vultr',
    name: 'Vultr',
    category: 'Hosting & Cloud',
    deal: '$100 Free Credit (New Customers)',
    code: 'VULTR100',
    url: 'https://www.vultr.com',
    affiliate_url: 'https://www.vultr.com',
    tracking_id: 'vultr_001',
    has_affiliate: true,
    desc: 'Global cloud infrastructure with bare metal, GPU instances, object storage, and 33 data center regions.',
    tags: 'vps,cloud,gpu,bare-metal,compute,hosting'
  },
];
// ───────────────────────────────────────────────────────────────

async function mergeDeals() {
  const raw = await fs.readFile(DEALS_PATH, 'utf-8');
  const existing = JSON.parse(raw);
  const existingIds = new Set(existing.map(d => d.id));
  const added = [];

  for (const deal of newDeals) {
    if (existingIds.has(deal.id)) {
      console.warn(`⚠️  Skipping duplicate: ${deal.id} (${deal.name})`);
      continue;
    }
    existing.push(deal);
    existingIds.add(deal.id);
    added.push(deal.name);
  }

  existing.sort((a, b) => a.name.localeCompare(b.name));
  await fs.writeFile(DEALS_PATH, JSON.stringify(existing, null, 2) + '\n', 'utf-8');

  if (added.length > 0) {
    console.log(`✅ Added: ${added.join(', ')}`);
  } else {
    console.log('📭 No new deals to add.');
  }
  console.log(`📊 Total: ${existing.length} deals in ${DEALS_PATH}`);
}

try {
  await mergeDeals();
} catch (err) {
  console.error('❌ Failed:', err.message);
  process.exit(1);
}
