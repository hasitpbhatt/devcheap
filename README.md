# DevCheap

[![GitHub License](https://img.shields.io/github/license/hasitpbhatt/devcheap)](LICENSE)
[![GitHub last commit](https://img.shields.io/github/last-commit/hasitpbhatt/devcheap)](https://github.com/hasitpbhatt/devcheap/commits/main)
[![Deployed](https://img.shields.io/badge/Cloudflare%20Pages-Deployed-brightgreen)](https://devcheap.click)

Curated developer deals, promos, and free tiers for cloud, databases, APIs, AI & LLM, and dev tools — **121 deals** across **23 categories**.

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
│   └── deals.jsonl      # Deal database (JSONL format, 121 lines)
├── functions/api/       # Cloudflare Functions (email subscribe)
├── js/                  # Search, category filter, affiliate tracking
├── scripts/             # Utility scripts (feed generation, data entry)
├── tests/               # Vitest: schema validation, UI, HTML, a11y
├── AGENTS.md            # Agent sync instructions (auto-aware bots)
├── CNAME                # Custom domain (devcheap.click)
├── CONTRIBUTING.md      # Contribution guide
├── README.md            # This file
├── index.html           # Main page
├── feed.xml             # RSS feed (auto-generated from deals.jsonl)
├── sitemap.xml          # Sitemap
└── package.json         # Scripts: validate, test, lint
```

---

## Categories

| Category | Deals |
|---|---|
| AI & LLM | 30 |
| Developer Tools | 18 |
| Hosting & Cloud | 13 |
| Database | 10 |
| APIs & Email | 8 |
| AI | 7 |
| Security | 6 |
| Monitoring | 4 |
| Productivity | 4 |
| Domains & Hosting | 3 |
| Auth | 2 |
| Storage & Cloud | 2 |
| APIs & Payments | 2 |
| SEO | 2 |
| Web Analytics | 2 |
| APIs & Search | 1 |
| Social Media | 1 |
| Customer Support | 1 |
| Sales & Marketing | 1 |
| Design & Collaboration | 1 |
| Media & Images | 1 |
| CI/CD | 1 |
| Testing & QA | 1 |

---

## Filters

The site offers three toggle-able filter chips below the category buttons:

| Chip | Behaviour | Group |
|---|---|---|
| **Recommended** | Shows only deals tagged `recommended`. Independent toggle — combinable with any other filter. | None (standalone) |
| **Expiring Soon** | Deals with an `expires` date within the next 30 days. Mutually exclusive with No Expiry. | Expiry |
| **No Expiry** | Deals with no `expires` field. Mutually exclusive with Expiring Soon. | Expiry |

Category buttons for categories present in `data/deals.jsonl` but not hardcoded in `index.html` are generated dynamically on page load. Deals tagged `recommended` also show a star badge on their card.

All filter state is persisted in URL query parameters (e.g. `?recommended=1&expiringSoon=1`).

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
3. `pwsh scripts/generate-feed.ps1` (regenerate RSS)
4. Update `sitemap.xml` lastmod date
5. Update README deal count if changed
6. Commit and push

---

## License

MIT — see [LICENSE](LICENSE).

**Maintainer:** [@hasitpbhatt](https://github.com/hasitpbhatt)
