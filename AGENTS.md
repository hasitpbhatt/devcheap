# Agent Instructions — DevCheap

When adding, removing, or modifying deals in `data/deals.jsonl`, these files must also be kept in sync:

## Files to Update

| File | Action | Auto-generatable? |
|---|---|---|
| `data/deals.jsonl` | Edit deals directly | No (manual) |
| `feed.xml` | Regenerate from `data/deals.jsonl` | Yes — run `pwsh scripts/generate-feed.ps1` |
| `sitemap.xml` | Bump `<lastmod>` date | No (manual) |
| `README.md` | Update deal count, category list, date | No (manual) |
| `CONTRIBUTING.md` | Update category list, file references | No (manual) |
| `tests/deals-schema.test.js` | Add new categories to the `validCategories` array | No (manual) |

## Regeneration Commands

```powershell
# Regenerate feed.xml from deals.jsonl
pwsh scripts/generate-feed.ps1
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
1. Regenerate feed: `pwsh scripts/generate-feed.ps1`
2. Update sitemap lastmod date
3. Update README deal count and categories
4. Run validation and tests
