# Agent Instructions — DevCheap

When adding, removing, or modifying deals in `data/deals.jsonl`, these files must also be kept in sync:

## Files to Update

| File | Action | Auto-generatable? |
|---|---|---|
| `data/deals.jsonl` | Edit deals directly | No (manual) |
| `index.html` | Homepage stats + category buttons | Yes — run `npm run build` (via `scripts/build.js`) |
| `deals/<id>/index.html` | Per-deal detail pages | Yes — run `npm run build` (via `scripts/build.js`) |
| `sitemap.xml` | Full sitemap rewritten from `deals.jsonl` | Yes — run `npm run build` (via `scripts/build.js`). Do NOT hand-edit; it will be overwritten on the next build. |
| `feed.xml` | Regenerate from `data/deals.jsonl` | Yes — run `pwsh scripts/generate-feed.ps1` (use `powershell` if `pwsh` is not installed) |
| `README.md` | Update deal count, category list, date | No (manual) |
| `CONTRIBUTING.md` | Update category list, file references | No (manual) |
| `tests/deals-schema.test.js` | Add new categories to the `validCategories` array | No (manual) |

## Regeneration Commands

```powershell
# Regenerate index.html, deals/<id>/index.html pages, and sitemap.xml from deals.jsonl
npm run build

# Regenerate feed.xml from deals.jsonl (RSS feed is NOT covered by `npm run build`)
pwsh scripts/generate-feed.ps1
# fallback if pwsh is unavailable:
powershell -File scripts/generate-feed.ps1
```

## Known Categories

When adding a new category to a deal, add it to both:
1. `data/deals.jsonl` (in the `category` field of the deal)
2. `tests/deals-schema.test.js` (in the `validCategories` array)

Current categories:
- Hosting & Cloud, Database, APIs & Email, APIs & Payments, APIs & Search
- AI & LLM, Auth, Developer Tools, Monitoring, Domains & Hosting
- Storage & Cloud, Security, Productivity, SEO, AI, Social Media
- Customer Support, Sales & Marketing, Services
- Design & Collaboration, Web Analytics, Media & Images, CI/CD, Testing & QA

## Validation

After editing `data/deals.jsonl`, always run:
```powershell
npm run validate:jsonl   # ensures each line is valid JSON
npm test                 # runs schema, UI, HTML, and accessibility tests
```

Before committing:
1. Run the build to regenerate the homepage, per-deal pages, and sitemap:
   `npm run build`
2. Regenerate the RSS feed (the build does NOT cover this):
   `pwsh scripts/generate-feed.ps1`
3. Update README deal count and category table if categories/counts changed
4. Run validation and tests (`npm run validate:jsonl && npm test`)
