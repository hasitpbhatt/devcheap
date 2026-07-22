# DevCheap

[![GitHub License](https://img.shields.io/github/license/hasitpbhatt/devcheap)](LICENSE)
[![GitHub last commit](https://img.shields.io/github/last-commit/hasitpbhatt/devcheap)](https://github.com/hasitpbhatt/devcheap/commits/main)
[![Deployed](https://img.shields.io/badge/Cloudflare%20Pages-Deployed-brightgreen)](https://devcheap.click)

Curated developer deals, promos, and free tiers for cloud, databases, APIs, AI & LLM, and dev tools — **196 deals** across **22 categories**.

---

## Site

Visit the live site: **[https://devcheap.click](https://devcheap.click)**

- RSS feed: [feed.xml](https://devcheap.click/feed.xml)

---

## Project Structure

```
devcheap/
├── .github/workflows/   # CI/deploy pipelines (Cloudflare Pages)
├── css/                 # Stylesheets (light/dark theme)
├── data/
│   └── deals.jsonl      # Deal database (JSONL format, 196 lines)
├── functions/api/       # Cloudflare Functions (email subscribe)
├── js/                  # Search, category filter, affiliate tracking
├── scripts/             # Utility scripts (feed generation, data entry)
├── tests/               # Vitest: schema validation, UI, HTML, a11y
├── AGENTS.md            # Agent sync instructions (auto-aware bots)
├── CNAME                # Custom domain (devcheap.click)
├── CONTRIBUTING.md      # Contribution guide
├── README.md            # This file
├── index.html           # Main page
├── feed.xml             # RSS feed (auto-generated from deals.jsonl via scripts/generate-feed.ps1)
├── category/             # Category SEO landing pages (auto-generated via build.js — do not hand-edit)
├── sitemap.xml          # Sitemap (auto-generated from deals.jsonl via scripts/build.js — do not hand-edit)
└── package.json         # Scripts: validate, test, lint
```

---

## Categories

| Category | Deals |
|---|---|
| AI & LLM | 40 |
| Developer Tools | 34 |
| Hosting & Cloud | 22 |
| Database | 15 |
| APIs & Email | 10 |
| Design & Collaboration | 8 |
| Productivity | 8 |
| Security | 7 |
| Monitoring | 6 |
| AI | 7 |
| Web Analytics | 4 |
| APIs & Payments | 4 |
| Domains & Hosting | 3 |
| CI/CD | 2 |
| Auth | 2 |
| Storage & Cloud | 2 |
| Customer Support | 2 |
| APIs & Search | 1 |
| Testing & QA | 1 |
| Media & Images | 1 |
| Social Media | 1 |
| SEO | 1 |

---

## Filters

The site offers filter chips below the category buttons:

| Chip | Behaviour | Group |
|---|---|---|
| **Recommended** | Shows only deals tagged `recommended`. Independent toggle — combinable with any other filter. | None (standalone) |
| **Spotlight** | Shows only deals tagged `spotlight`. Independent toggle — combinable with any other filter. | None (standalone) |
| **Expiring Soon** | Deals with an `expires` date within the next 30 days. Mutually exclusive with No Expiry. | Expiry |
| **No Expiry** | Deals with no `expires` field. Mutually exclusive with Expiring Soon. | Expiry |
| **Coupons** | Shows only deals with a copyable coupon code (excludes automatic/link codes). Independent toggle — combinable with any other filter. | None (standalone) |
| **Free** | Shows only deals with `pricing: free`. Mutually exclusive with Trial, Paid, and Lifetime. | Pricing |
| **Trial** | Shows only deals with `pricing: trial`. Mutually exclusive with Free, Paid, and Lifetime. | Pricing |
| **Paid** | Shows only deals with `pricing: paid`. Mutually exclusive with Free, Trial, and Lifetime. | Pricing |
| **Lifetime** | Shows only deals with `pricing: lifetime`. Mutually exclusive with Free, Trial, and Paid. | Pricing |

Category buttons for categories present in `data/deals.jsonl` but not hardcoded in `index.html` are generated dynamically on page load. Deals tagged `recommended` show a star badge and deals tagged `spotlight` show a sparkle badge on their card. Every deal also shows a pricing badge (`Free`, `Trial`, `Paid`, or `Lifetime`).

All filter state is persisted in URL query parameters (e.g. `?recommended=1&free=1`).

---

## Local Development

```bash
git clone https://github.com/hasitpbhatt/devcheap.git
cd devcheap
npm install
npm run validate:jsonl   # validate deal syntax
npm test                 # run test suite
```

Serve with `python -m http.server 8000` or VS Code Live Server.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Quick checklist:

1. Add/update deal in `data/deals.jsonl`
2. `npm run validate:jsonl && npm test`
3. `npm run build` (regenerates `index.html`, `deals/<id>/index.html`, and `sitemap.xml`)
4. `pwsh scripts/generate-feed.ps1` (regenerate RSS feed; the build does NOT cover it)
5. Update README deal count + category table if counts changed
6. Commit and push

---

## License

MIT — see [LICENSE](LICENSE).

**Maintainer:** [@hasitpbhatt](https://github.com/hasitpbhatt)
