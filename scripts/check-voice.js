#!/usr/bin/env node
/**
 * check-voice.js — DevCheap voice linter.
 *
 * Enforces the house style defined in VOICE.md. Every word that reaches a
 * visitor has to pass this check before the build ships.
 *
 *   node scripts/check-voice.js           # human-readable report
 *   node scripts/check-voice.js --json    # machine-readable report
 *
 * Exit code 1 when a violation is found. CI runs this on every push.
 *
 * What gets scanned:
 *   - data/deals.jsonl      → name, deal, desc, why
 *   - data/category-seo.json → every string value
 *   - data/articles.json    → every string value
 *   - templates/*.html      → visible prose (scripts/styles stripped)
 *   - data/llm-providers.json → provider descriptions
 *
 * Exemptions live in data/voice-exemptions.json. Each entry needs a reason —
 * VOICE.md §6 allows only three exceptions: direct quotes from an official
 * description, legal copy, and code/config/technical reference.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');

/** Marketing speak + AI tells + generic filler. Zero tolerance. */
export const BANNED_WORDS = [
  // marketing speak
  'leverage',
  'synergy',
  'revolutionize',
  'revolutionise',
  'unlock',
  'supercharge',
  'empower',
  'transform',
  'game-changer',
  'game changer',
  'ultimate',
  'robust',
  'seamless',
  'cutting-edge',
  'cutting edge',
  'next-generation',
  'next generation',
  'world-class',
  'world class',
  'industry-leading',
  'industry leading',
  'best-in-class',
  'best in class',
  // AI tells
  'as an ai',
  'as a language model',
  "it's important to note",
  'it is important to note',
  "it's worth noting that",
  'it is worth noting that',
  'in conclusion',
  'furthermore',
  'moreover',
  'on the other hand',
  'delve into',
  'dive deep into',
  'explore the world of',
  'navigate the complexities of',
  // generic filler
  "in today's fast-paced world",
  'in the modern era',
  'at the end of the day',
  'when it comes to',
  'in terms of',
  'a wide range of',
  'a variety of',
  'needless to say',
];

/** Regex-level exemptions that still need to be justified in the exemptions file. */
const BUILTIN_EXEMPT_PATTERNS = [
  // CSS/media terminology. "Image transformations" is a Cloudinary/ImageKit
  // feature name, not marketing copy. VOICE.md §6: technical reference.
  { re: /\btransformations?\b/i, reason: 'technical reference — media transformation feature name' },
];

/**
 * Load data/voice-exemptions.json.
 * Shape: { "<locator>": "<reason>" }
 * The locator identifies one spot in one source, e.g.
 * "deals.jsonl:jetbrains-junie.desc" or "template:deal-detail.html".
 */
async function loadExemptions() {
  try {
    const raw = await fs.readFile(path.join(ROOT_DIR, 'data', 'voice-exemptions.json'), 'utf-8');
    const parsed = JSON.parse(raw);
    delete parsed._comment;
    return parsed;
  } catch {
    return {};
  }
}

/**
 * Find banned words in a block of text.
 * @param {string} text
 * @param {Record<string,string>} exemptions  keyed by locator
 * @param {string} locator  where this text came from
 * @returns {Array<{word: string, reason?: string}>}
 */
export function findViolations(text, exemptions = {}, locator = '') {
  if (!text || typeof text !== 'string') return [];
  const lower = text.toLowerCase();
  const out = [];

  for (const word of BANNED_WORDS) {
    const idx = lower.indexOf(word);
    if (idx === -1) continue;

    let exempted = false;
    let reason = null;

    // 1. Explicit per-location exemption.
    if (locator && exemptions[locator]) {
      exempted = true;
      reason = exemptions[locator];
    }

    // 2. Built-in technical-term exemption (regex over the whole phrase).
    if (!exempted) {
      for (const pattern of BUILTIN_EXEMPT_PATTERNS) {
        const match = text.match(pattern.re);
        if (match && match[0].toLowerCase().includes(word)) {
          exempted = true;
          reason = pattern.reason;
          break;
        }
      }
    }

    if (exempted) {
      out.push({ word, reason, exempted: true });
    } else {
      out.push({ word, index: idx, excerpt: text.slice(Math.max(0, idx - 40), idx + word.length + 40).replace(/\s+/g, ' ') });
    }
  }

  return out;
}

/** Strip markup so we only lint what a human actually reads. */
export function extractVisibleText(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/\{\{[^}]*\}\}/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function walkStrings(value, pathParts, out) {
  if (typeof value === 'string') {
    out.push({ path: pathParts.join('.'), text: value });
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => walkStrings(v, [...pathParts, String(i)], out));
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      walkStrings(v, [...pathParts, k], out);
    }
  }
}

async function scanDeals(exemptions) {
  const raw = await fs.readFile(path.join(ROOT_DIR, 'data', 'deals.jsonl'), 'utf-8');
  const deals = raw.split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const violations = [];
  for (const deal of deals) {
    for (const field of ['name', 'deal', 'desc', 'why']) {
      const text = deal[field];
      if (typeof text !== 'string') continue;
      const found = findViolations(text, exemptions, `deals.jsonl:${deal.id}.${field}`);
      for (const v of found) {
        if (v.exempted) continue;
        violations.push({
          file: 'data/deals.jsonl',
          locator: `${deal.id}.${field}`,
          ...v,
        });
      }
    }
  }
  return violations;
}

async function scanJsonFile(relPath, exemptions) {
  const full = path.join(ROOT_DIR, relPath);
  let data;
  try {
    data = JSON.parse(await fs.readFile(full, 'utf-8'));
  } catch {
    return [];
  }
  const strings = [];
  walkStrings(data, [], strings);
  const violations = [];
  for (const { path: p, text } of strings) {
    const found = findViolations(text, exemptions, `${relPath}:${p}`);
    for (const v of found) {
      if (v.exempted) continue;
      violations.push({ file: relPath, locator: p, ...v });
    }
  }
  return violations;
}

async function scanTemplates(exemptions) {
  const dir = path.join(ROOT_DIR, 'templates');
  let files = [];
  try {
    files = await fs.readdir(dir);
  } catch {
    return [];
  }
  const violations = [];
  for (const file of files.filter((f) => f.endsWith('.html'))) {
    const raw = await fs.readFile(path.join(dir, file), 'utf-8');
    const text = extractVisibleText(raw);
    const found = findViolations(text, exemptions, `template:${file}`);
    for (const v of found) {
      if (v.exempted) continue;
      violations.push({ file: `templates/${file}`, locator: 'visible text', ...v });
    }
  }
  return violations;
}

export async function runVoiceCheck() {
  const exemptions = await loadExemptions();
  const violations = [
    ...(await scanDeals(exemptions)),
    ...(await scanJsonFile('data/category-seo.json', exemptions)),
    ...(await scanJsonFile('data/articles.json', exemptions)),
    ...(await scanJsonFile('data/llm-providers.json', exemptions)),
    ...(await scanTemplates(exemptions)),
  ];
  return violations;
}

// ── CLI ───────────────────────────────────────────────────────────────────
const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  const asJson = process.argv.includes('--json');
  const violations = await runVoiceCheck();

  if (asJson) {
    console.log(JSON.stringify({ ok: violations.length === 0, violations }, null, 2));
  } else if (violations.length === 0) {
    console.log('✅ Voice check passed — no banned words in user-facing copy.');
  } else {
    console.error(`❌ Voice check failed — ${violations.length} violation${violations.length === 1 ? '' : 's'}:\n`);
    for (const v of violations) {
      console.error(`  ${v.file} :: ${v.locator}`);
      console.error(`    banned: "${v.word}"`);
      if (v.excerpt) console.error(`    near:   …${v.excerpt}…`);
      console.error('');
    }
    console.error('Fix the copy or add a justified entry to data/voice-exemptions.json.');
    console.error('See VOICE.md for the full house style.');
  }

  process.exit(violations.length === 0 ? 0 : 1);
}
