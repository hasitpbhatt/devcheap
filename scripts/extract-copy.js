#!/usr/bin/env node
/**
 * extract-copy.js
 * One-off migration helper: pulls the two long-form copy blocks out of
 * scripts/build.js and writes them to JSON so they can be linted, reviewed,
 * and edited without touching build logic.
 *
 *   node scripts/extract-copy.js
 *
 * After running once, scripts/build.js reads from data/category-seo.json and
 * data/articles.json instead of holding the copy inline.
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const BUILD_PATH = path.join(ROOT_DIR, 'scripts', 'build.js');

function extractBlock(source, startMarker, openChar, closeChar) {
  const start = source.indexOf(startMarker);
  if (start === -1) throw new Error(`Could not find ${startMarker}`);
  const open = source.indexOf(openChar, start);
  let depth = 0;
  let inStr = false;
  let quote = '';
  let escaped = false;
  for (let i = open; i < source.length; i++) {
    const ch = source[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (inStr) {
      if (ch === quote) inStr = false;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') { inStr = true; quote = ch; continue; }
    if (ch === openChar) depth++;
    else if (ch === closeChar) {
      depth--;
      if (depth === 0) return source.slice(open, i + 1);
    }
  }
  throw new Error(`Unbalanced block for ${startMarker}`);
}

const source = await fs.readFile(BUILD_PATH, 'utf-8');

const categorySEO = eval(`(${extractBlock(source, 'const categorySEO = {', '{', '}')})`);
const articles = eval(`(${extractBlock(source, 'const articles = [', '[', ']')})`);

await fs.writeFile(
  path.join(ROOT_DIR, 'data', 'category-seo.json'),
  JSON.stringify(categorySEO, null, 2) + '\n',
  'utf-8'
);
await fs.writeFile(
  path.join(ROOT_DIR, 'data', 'articles.json'),
  JSON.stringify(articles, null, 2) + '\n',
  'utf-8'
);

console.log(`✅ Extracted ${Object.keys(categorySEO).length} category SEO entries → data/category-seo.json`);
console.log(`✅ Extracted ${articles.length} articles → data/articles.json`);
