# Review & Remove Low-Value Deals

## Findings

Scanned all 215 deals in `data/deals.jsonl`. No deals are critically broken, but 5 entries are clearly low-value based on **low rating + off-audience + weak/vague deal text**:

| # | id | name | rating | category | reason |
|---|---|---|---|---|---|
| 1 | `brevo` | Brevo | 5.1 | APIs & Email | Marketing automation suite (email/SMS/CRM), not a developer tool. Low rating. Off-audience for DevCheap. |
| 2 | `canva` | Canva | 5.1 | Design & Collaboration | Graphic design for non-developers. 20% off is a weak discount. Off-audience. |
| 3 | `rezi` | Rezi | 5.2 | Productivity | AI resume builder for job seekers. Consumer product, not a developer productivity tool. |
| 4 | `zencall` | ZenCall | 5.4 | AI & LLM | Empty deal description (`"Lifetime License - "`). Vague AI phone agent. Low rating. |
| 5 | `incogniton` | Incogniton | 6.0 | Security | Empty deal description (`"Lifetime License - "`). Anti-detect browser for marketers/scrapers. Off-audience. |

**Not removed (keep):**
- `siteground`, `hostinger` (5.3/5.5) — shared hosting is in a relevant category; weak but not off-audience.
- `loom`, `clickup`, `notion` (5.4-5.9) — generic but used by devs; real products.
- `getterms`/`axeptio` (5.8/5.9) — cookie consent tools overlap but both are legitimate security/privacy deals.
- `chatplayground`, `sturppy`, `supportboard` — niche or borderline but not empty/off-audience.

## Steps

1. Remove the 5 lines from `data/deals.jsonl` by filtering out their `id`.
2. Update `README.md`:
   - Header: `215 deals` → `210 deals`, `23 categories` unchanged.
   - Project structure line: `215 lines` → `210 lines`.
   - Category table updates:
     - APIs & Email: 10 → 9
     - Design & Collaboration: 9 → 8
     - Productivity: 9 → 8
     - AI & LLM: 44 → 43
     - Security: 9 → 8
3. Run `npm run validate:jsonl && npm test`.
4. Run `npm run build` (regenerates `index.html`, `deals/<id>/index.html`, `sitemap.xml`, `llms.txt`).
5. Run `pwsh scripts/generate-feed.ps1` (regenerates `feed.xml`).
6. Verify no stale references remain in generated files.

## Validation

- `npm test` should pass all 147 tests.
- `data/deals.jsonl` should have 210 valid JSON lines.
- `feed.xml` should contain 210 `<item>` entries.
- `sitemap.xml` should list 210 deal URLs.
