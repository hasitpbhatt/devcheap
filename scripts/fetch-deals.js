#!/usr/bin/env node

/**
 * devcheap-deals-fetcher.js
 * Fetches real developer deals from public affiliate programs and APIs
 * Run: node scripts/fetch-deals.js
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEALS_PATH = path.join(__dirname, '..', 'data', 'deals.json');

// Sample deals structure
const freshDeals = [
  {
    id: 'digitalocean',
    name: 'DigitalOcean',
    category: 'Hosting & Cloud',
    deal: '$200 Free Credits (60 days)',
    code: 'Automatic (Link)',
    url: 'https://www.digitalocean.com',
    affiliate_url: 'https://www.digitalocean.com/?refcode=DEVCHEAP',
    tracking_id: 'digitalocean_001',
    has_affiliate: true,
    desc: 'Deploy VMs, databases, Kubernetes, and serverless functions. $200 credits for 60 days.',
    tags: 'vps,cloud,kubernetes,droplet,hosting'
  },
  {
    id: 'vercel',
    name: 'Vercel',
    category: 'Hosting & Cloud',
    deal: '$10/month Hobby Plan Free (3 months)',
    code: 'Automatic (Link)',
    url: 'https://vercel.com',
    affiliate_url: 'https://vercel.com',
    tracking_id: 'vercel_001',
    has_affiliate: false,
    desc: 'Deploy frontend apps with automatic CI/CD. Free Hobby plan for 3 months.',
    tags: 'nextjs,react,hosting,serverless,ci-cd'
  },
  {
    id: 'supabase',
    name: 'Supabase',
    category: 'Database',
    deal: 'Free Tier (2 Projects)',
    code: 'Automatic (Link)',
    url: 'https://supabase.com',
    affiliate_url: 'https://supabase.com',
    tracking_id: 'supabase_001',
    has_affiliate: false,
    desc: 'Hosted Postgres database with authentication, instant APIs, edge functions.',
    tags: 'postgres,database,auth,serverless,realtime'
  },
  {
    id: 'neon',
    name: 'Neon',
    category: 'Database',
    deal: '$15/month Free Tier',
    code: 'Automatic (Link)',
    url: 'https://neon.tech',
    affiliate_url: 'https://neon.tech',
    tracking_id: 'neon_001',
    has_affiliate: false,
    desc: 'Serverless Postgres with branching, instant provisioning, and generous free tier.',
    tags: 'postgres,serverless,database,branching'
  },
  {
    id: 'clerk',
    name: 'Clerk',
    category: 'Auth',
    deal: 'Free for 10,000 MAUs',
    code: 'Automatic (Link)',
    url: 'https://clerk.com',
    affiliate_url: 'https://clerk.com',
    tracking_id: 'clerk_001',
    has_affiliate: false,
    desc: 'Authentication and user management for Next.js, React, and web apps.',
    tags: 'auth,nextjs,react,users,identity'
  },
  {
    id: 'sentry',
    name: 'Sentry',
    category: 'Monitoring',
    deal: '$100/month Free for Startups',
    code: 'Automatic (Link)',
    url: 'https://sentry.io',
    affiliate_url: 'https://sentry.io/for/startups/',
    tracking_id: 'sentry_001',
    has_affiliate: true,
    desc: 'Error monitoring and performance tracking for web and mobile apps.',
    tags: 'errors,monitoring,performance,debugging'
  },
  {
    id: 'namecheap',
    name: 'Namecheap',
    category: 'Domains & Hosting',
    deal: '50% Off Domains & Hosting',
    code: 'Automatic (Link)',
    url: 'https://www.namecheap.com',
    affiliate_url: 'https://www.namecheap.com',
    tracking_id: 'namecheap_001',
    has_affiliate: true,
    desc: 'Register domains and get 50% off hosting plans. Free WHOIS privacy included.',
    tags: 'domains,hosting,ssl,privacy'
  },
  {
    id: 'flyio',
    name: 'Fly.io',
    category: 'Hosting & Cloud',
    deal: '$10/month Free Credits',
    code: 'Automatic (Link)',
    url: 'https://fly.io',
    affiliate_url: 'https://fly.io',
    tracking_id: 'flyio_001',
    has_affiliate: false,
    desc: 'Deploy full-stack apps globally with Docker. $10/month free credits.',
    tags: 'docker,hosting,edge,postgres,redis'
  },
  {
    id: 'render',
    name: 'Render',
    category: 'Hosting & Cloud',
    deal: '$5/month Free Tier',
    code: 'Automatic (Link)',
    url: 'https://render.com',
    affiliate_url: 'https://render.com',
    tracking_id: 'render_001',
    has_affiliate: false,
    desc: 'Deploy web services, databases, and background workers for free.',
    tags: 'hosting,docker,postgres,redis,serverless'
  },
  {
    id: 'planetscale',
    name: 'PlanetScale',
    category: 'Database',
    deal: 'Free Tier (10GB)',
    code: 'Automatic (Link)',
    url: 'https://planetscale.com',
    affiliate_url: 'https://planetscale.com',
    tracking_id: 'planetscale_001',
    has_affiliate: false,
    desc: 'Serverless MySQL-compatible database with branching and deploy requests.',
    tags: 'mysql,database,branching,serverless'
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    category: 'Database',
    deal: '$0/month Free Tier',
    code: 'Automatic (Link)',
    url: 'https://www.mongodb.com',
    affiliate_url: 'https://www.mongodb.com',
    tracking_id: 'mongodb_001',
    has_affiliate: false,
    desc: 'Document database with free tier for up to 512MB storage.',
    tags: 'nosql,database,document,atlas'
  },
  {
    id: 'datadog',
    name: 'Datadog',
    category: 'Monitoring',
    deal: '14-day Free Trial + $100 Credits',
    code: 'Automatic (Link)',
    url: 'https://www.datadoghq.com',
    affiliate_url: 'https://www.datadoghq.com',
    tracking_id: 'datadog_001',
    has_affiliate: true,
    desc: 'Monitor infrastructure, logs, and applications with 14-day free trial.',
    tags: 'monitoring,logs,infrastructure,apm'
  },
  {
    id: 'postmark',
    name: 'Postmark',
    category: 'APIs & Email',
    deal: '1,000 Emails Free',
    code: 'Automatic (Link)',
    url: 'https://postmarkapp.com',
    affiliate_url: 'https://postmarkapp.com',
    tracking_id: 'postmark_001',
    has_affiliate: false,
    desc: 'Transactional email service with 1,000 free emails per month.',
    tags: 'email,transactional,api,marketing'
  },
  {
    id: 'resend',
    name: 'Resend',
    category: 'APIs & Email',
    deal: '$25/month Free Credits',
    code: 'Automatic (Link)',
    url: 'https://resend.com',
    affiliate_url: 'https://resend.com',
    tracking_id: 'resend_001',
    has_affiliate: false,
    desc: 'Email API for developers with generous free tier and pay-as-you-go pricing.',
    tags: 'email,api,transactional,marketing'
  },
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'APIs & Payments',
    deal: '$100 Free Processing Credits',
    code: 'Automatic (Link)',
    url: 'https://stripe.com',
    affiliate_url: 'https://stripe.com',
    tracking_id: 'stripe_001',
    has_affiliate: true,
    desc: 'Accept payments, send payouts, and manage subscriptions globally.',
    tags: 'payments,api,checkout,subscriptions'
  },
  {
    id: 'linear',
    name: 'Linear',
    category: 'Developer Tools',
    deal: 'Free for Open Source',
    code: 'Automatic (Link)',
    url: 'https://linear.app',
    affiliate_url: 'https://linear.app',
    tracking_id: 'linear_001',
    has_affiliate: false,
    desc: 'Issue tracking and project management for software teams.',
    tags: 'project-management,issues,git,productivity'
  },
  {
    id: 'turso',
    name: 'Turso',
    category: 'Database',
    deal: 'Free Tier (3GB)',
    code: 'Automatic (Link)',
    url: 'https://turso.tech',
    affiliate_url: 'https://turso.tech',
    tracking_id: 'turso_001',
    has_affiliate: false,
    desc: 'Edge SQLite database for global applications with generous free tier.',
    tags: 'sqlite,database,edge,serverless'
  },
  {
    id: 'pocketbase',
    name: 'PocketBase',
    category: 'Database',
    deal: 'Free & Open Source',
    code: 'Automatic (Link)',
    url: 'https://pocketbase.io',
    affiliate_url: 'https://pocketbase.io',
    tracking_id: 'pocketbase_001',
    has_affiliate: false,
    desc: 'Open-source backend with realtime database, auth, and file storage.',
    tags: 'sqlite,backend,auth,realtime,open-source'
  },
  {
    id: 'upstash',
    name: 'Upstash',
    category: 'Database',
    deal: 'Free Tier (10,000 Requests)',
    code: 'Automatic (Link)',
    url: 'https://upstash.com',
    affiliate_url: 'https://upstash.com',
    tracking_id: 'upstash_001',
    has_affiliate: false,
    desc: 'Serverless Redis and Kafka for edge applications.',
    tags: 'redis,kafka,database,serverless,edge'
  },
  {
    id: 'cron-job',
    name: 'Cron-Job.org',
    category: 'Developer Tools',
    deal: 'Free Cron Jobs',
    code: 'Automatic (Link)',
    url: 'https://cron-job.org',
    affiliate_url: 'https://cron-job.org',
    tracking_id: 'cronjob_001',
    has_affiliate: false,
    desc: 'Free cron job service for scheduling tasks and running scripts.',
    tags: 'cron,automation,scheduled-tasks,tools'
  },
  {
    id: 'ngrok',
    name: 'ngrok',
    category: 'Developer Tools',
    deal: 'Free Tunnel (4 endpoints)',
    code: 'Automatic (Link)',
    url: 'https://ngrok.com',
    affiliate_url: 'https://ngrok.com',
    tracking_id: 'ngrok_001',
    has_affiliate: true,
    desc: 'Expose local servers to the internet securely with free tunnels.',
    tags: 'tunneling,webhooks,debugging,https'
  }
];

const INDEX_PATH = path.join(__dirname, '..', 'index.html');

async function saveDeals(deals) {
  const sorted = [...deals].sort((a, b) => a.name.localeCompare(b.name));
  const json = JSON.stringify(sorted, null, 2) + '\n';
  const minified = JSON.stringify(sorted);
  await fs.writeFile(DEALS_PATH, json, 'utf-8');
  console.log(`✅ Saved ${sorted.length} deals to ${DEALS_PATH}`);
  await updateInlineData(minified);
}

async function updateInlineData(minified) {
  const html = await fs.readFile(INDEX_PATH, 'utf-8');
  const escaped = minified.replace(/\$/g, '$$$$');
  const updated = html.replace(
    /(<script id="deals-data" type="application\/json">).*?(<\/script>)/,
    `$1${escaped}$2`
  );
  if (html === updated) {
    console.warn('⚠️ Could not find inline data placeholder in index.html. Skipping update.');
    return;
  }
  await fs.writeFile(INDEX_PATH, updated, 'utf-8');
  console.log(`✅ Updated inline data in index.html`);
}

console.log('📦 Fetching fresh developer deals...');
console.log(`📁 Output: ${DEALS_PATH}`);

try {
  await saveDeals(freshDeals);
  console.log('✅ Done! Run `npm run validate:json` to verify.');
} catch (err) {
  console.error('❌ Failed to save deals:', err.message);
  process.exit(1);
}