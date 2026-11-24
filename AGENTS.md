# Agent Instructions — DevCheap

When adding, removing, or modifying deals in `data/deals.jsonl`, these files must also be kept in sync:

## Files to Update

| File | Action | Auto-generatable? |
|---|---|---|
| `data/deals.jsonl` | Edit deals directly | No (manual) |
| `index.html` | Homepage stats + category buttons | Yes — run `npm run build` (via `scripts/build.js`) |
| `deals/<id>/index.html` | Per-deal detail pages | Yes — run `npm run build` (via `scripts/build.js`) |
| `category/<slug>/index.html` | SEO-optimized category landing pages | Yes — run `npm run build` (via `scripts/build.js`) |
| `startup-programs/index.html` | Student / startup / accelerator program directory | Yes — run `npm run build`. Buckets on the `requiresProgram` field, so program deals MUST set it or the page renders empty. |
| `_redirects` | 301s from deleted duplicate deal ids to their canonical deal | No (manual) — add a rule for **both** the `/deals/<id>/` and `/deals/<id>` forms whenever a deal id is deleted or merged away, or the old URL 404s on Cloudflare Pages. Not needed when a deal is merely retired (its page stays). |
| `data/deals.json` | Plain-JSON mirror of `deals.jsonl` for non-JSONL consumers | Yes — emitted by `npm run build` (via `scripts/build.js`). Do NOT hand-edit. |
| `sitemap.xml` | Full sitemap rewritten from `deals.jsonl` | Yes — run `npm run build` (via `scripts/build.js`). Do NOT hand-edit; it will be overwritten on the next build. |
| `llms.txt` | LLM-friendly site summary generated from `deals.jsonl` | Yes — run `npm run build` (via `scripts/generate-llmstxt.js`). |
| `feed.xml` | RSS feed generated from `data/deals.jsonl` | Yes — `npm run build` runs `scripts/generate-feed.ps1` for you. Run `pwsh scripts/generate-feed.ps1` directly (or `powershell -File` if `pwsh` is missing) when you want to regenerate it on its own. |
| `README.md` | Update deal count, category list, date | No (manual) |
| `CONTRIBUTING.md` | Update category list, file references | No (manual) |
| `tests/deals-schema.test.js` | Add new categories to the `validCategories` array | No (manual) |
| `data/category-seo.json` | Add `{title, h1, intro, faqs}` copy for new categories (keys are lowercase category names) | No (manual) — the build falls back to generic copy if a category is missing, but search-visible copy should be written for every new category. |

## Regeneration Commands

```powershell
# Regenerate index.html, deals/<id>/index.html pages, category pages, sitemap.xml,
# llms.txt, data/deals.json, AND feed.xml from deals.jsonl
npm run build

# Regenerate feed.xml on its own (already covered by the build above)
pwsh scripts/generate-feed.ps1
# fallback if pwsh is unavailable:
powershell -File scripts/generate-feed.ps1
```

## Eligibility & Status Fields

Deal rows carry structured eligibility metadata (see `README.md` § Deal data & eligibility for the full field list). Two rules are load-bearing when you edit a row:

- **A gate you have not verified stays `null`.** `gates.card: false` renders a "No credit card" badge that readers rely on to avoid surprise charges — never write `false` just because you did not find a credit-card requirement. Set it `null` and stay silent instead.
- **`verification.source_url` must point at the page where the offer is stated** (pricing or free-tier page), not the provider homepage. A claim link that lands on a sales page is the single fastest way to make a curated listing read as a referral wrapper.

To take an offer off the site, set `status: "retired"` and `claim.method: "none"` — **do not delete the row.** A retired deal keeps its detail page, `/r/` redirect, `/alternatives/` page, and sitemap entries (that URL has inbound links), drops out of the homepage grid, Top Picks, comparison pages, and related-deals lists, and renders a non-clickable "No longer available". Deleting a row instead breaks the orphan-directory and sitemap-count tests and strands the URL.

Allowed `status` values: `active`, `unverified`, `paused`, `retired`. Allowed `offer_type` values: `credits`, `free_plan`, `allocation`, `membership`, `stepped_discount`, `discount`, `spend_match`. `disclosure` must agree with `has_affiliate`. `tests/deals-schema.test.js` enforces all of this — extend it when you add a new field or allowed value.

## Known Categories

When adding a new category to a deal, add it to all three:
1. `data/deals.jsonl` (in the `category` field of the deal)
2. `tests/deals-schema.test.js` (in the `validCategories` array)
3. `data/category-seo.json` (lowercase key with `title`, `h1`, `intro`, `faqs`)

Current categories:
- Hosting & Cloud, Database, APIs & Email, APIs & Payments, APIs & Search
- AI & LLM, Auth, Developer Tools, Monitoring, Domains & Hosting
- Storage & Cloud, Security, Productivity, SEO, AI, Social Media
- Customer Support, Sales & Marketing, Services
- Design & Collaboration, Web Analytics, Media & Images, CI/CD, Testing & QA
- Students & Education, Open Source Programs, GPU Compute
- Startup Perks, Self-Hosted Tools

## Encoding Guardrail

All source files are UTF-8. Never use PowerShell `Set-Content` / `Out-File` for Markdown, JSONL, or HTML files — PowerShell defaults to legacy codepages and will introduce mojibake e.g. `â€”`. Always write files with Python using `encoding='utf-8'` or use the `npm` build scripts. After any edit, grep for mojibake patterns like `\xc3\xa2` / `â€` in `data/deals.jsonl` and README.

## Validation

After editing `data/deals.jsonl`, always run:
```powershell
npm run validate:jsonl   # ensures each line is valid JSON
npm test                 # runs schema, UI, HTML, and accessibility tests
```

Before committing:
1. Run the build to regenerate the homepage, per-deal pages, sitemap, `data/deals.json`, and `feed.xml`:
   `npm run build`
2. If you regenerated the feed separately, or the build warned that feed generation failed, run `pwsh scripts/generate-feed.ps1`
3. Update README deal count and category table if categories/counts changed
4. Run validation and tests (`npm run validate:jsonl && npm test`)

## AI-Generated Content

When generating or editing any long-form copy (use-case pages, pillar articles, newsletter drafts):

1. **Read [`VOICE.md`](VOICE.md) first.** The Sahil Bloom persona is the house style. Banned words and tone rules are non-negotiable.
2. **Use the persona prompt in `VOICE.md` §4** as the system prompt. Do not invent your own voice rules.
3. **Ground every claim in the deal data.** No invented offers, no invented dollar amounts.
4. **End on a practical next step**, not a platitude.
5. **Reference the strategy** in [`STRATEGY.md`](STRATEGY.md) §4 (Plan of Record) so generated content matches the active month of the 6-month plan.

## Strategy & Committee

The site operates under a 6-month time-box with a 5-person committee model (Mitchell / Dharmesh / Lenny / Bret / Sahil). For **why** we build what we build, see [`STRATEGY.md`](STRATEGY.md). For **how** to build it, this file. For **what to write**, see [`VOICE.md`](VOICE.md).

When in doubt about a decision: read `STRATEGY.md` §2 (The Committee) to find which persona owns the call.
