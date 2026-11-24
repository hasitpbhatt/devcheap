# DevCheap

[![GitHub License](https://img.shields.io/github/license/hasitpbhatt/devcheap)](LICENSE)
[![GitHub last commit](https://img.shields.io/github/last-commit/hasitpbhatt/devcheap)](https://github.com/hasitpbhatt/devcheap/commits/main)
[![Deployed](https://img.shields.io/badge/Cloudflare%20Pages-Deployed-brightgreen)](https://devcheap.click)

Curated developer deals, promos, and free tiers for cloud, databases, APIs, AI & LLM, and dev tools — **355 deals** across **26 categories**. Six **Top Picks** (hand-curated, affiliate-supported) sit above the full grid.

The site is built and operated under a documented 6-month strategy with a 5-person committee model (Mitchell / Dharmesh / Lenny / Bret / Sahil). For the strategic frame, decision criteria, and the editorial voice rules, see:

- **[`STRATEGY.md`](STRATEGY.md)** — why we build what we build, who owns what, the 6-month plan of record
- **[`VOICE.md`](VOICE.md)** — the Sahil Bloom persona system used for AI-generated use-case pages and pillar articles
- **[`AGENTS.md`](AGENTS.md)** — operational sync instructions for AI agents and contributors

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
│   ├── deals.jsonl      # Deal database (JSONL format, 355 lines)
│   └── deals.json       # Same data as a plain JSON array (auto-generated via build.js — do not hand-edit)
├── functions/api/       # Cloudflare Functions (email subscribe)
├── js/                  # Search, category filter, affiliate tracking
├── scripts/             # Utility scripts (feed generation, data entry)
├── tests/               # Vitest: schema validation, UI, HTML, a11y
├── AGENTS.md            # Agent sync instructions (auto-aware bots)
├── CNAME                # Custom domain (devcheap.click)
├── _redirects           # 301s from retired deal slugs to their canonical deal (hand-maintained)
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
| AI & LLM | 58 |
| Developer Tools | 57 |
| Database | 43 |
| Hosting & Cloud | 33 |
| Monitoring | 19 |
| Auth | 14 |
| GPU Compute | 14 |
| Open Source Programs | 13 |
| Students & Education | 12 |
| APIs & Email | 11 |
| APIs & Payments | 9 |
| Self-Hosted Tools | 9 |
| Web Analytics | 9 |
| Design & Collaboration | 8 |
| Security | 8 |
| Productivity | 6 |
| APIs & Search | 5 |
| CI/CD | 5 |
| Customer Support | 4 |
| Startup Perks | 4 |
| Storage & Cloud | 4 |
| Testing & QA | 3 |
| AI | 2 |
| Domains & Hosting | 2 |
| Media & Images | 2 |
| Sales & Marketing | 1 |

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

## Top Picks

Above the full deals grid, the homepage renders a 6-card **Top Picks for Developers** strip. The selection is computed at build time by `scripts/build.js`:

1. The `minimax-week` deal is pinned to slot 1 while its `expires` date is in the future.
2. Remaining slots are filled with active, high-rated affiliate deals (sorted by `rating` desc).
3. If fewer than 6 affiliate deals qualify, the strip is topped up with the highest-rated non-affiliate deals.
4. The strip is capped at 6 cards.

Affiliated Top Picks render with a gradient accent on the left edge; non-affiliated picks render with a single-color accent. Click events are tracked with `link_type: 'top_picks_claim'` so you can measure Top Picks CTR vs. the full grid.

---

## Deal data & eligibility

`data/deals.jsonl` is the source of truth — one JSON object per line — and it is the published dataset: `js/search.js` fetches it directly, and `_headers` serves it with permissive CORS so anyone can build on it. `npm run build` also emits the same array as `data/deals.json` for consumers that would rather not parse JSONL.

Beyond the catalog fields, each deal may carry a structured eligibility block. It is deliberately fields rather than prose, so the pages stay filterable and every claim is traceable to a source.

| Field | Meaning |
|---|---|
| `offer_type` | `credits` \| `free_plan` \| `allocation` \| `membership` \| `stepped_discount` \| `discount` \| `spend_match`. A `discount` is a percentage off; `credits` is a balance. They are kept distinct on purpose. |
| `value` | `{ headline, usd, unit }` — the headline shown on the card, plus a nullable machine-readable amount. A null `usd` must carry a null `unit`. |
| `eligibility` | `audience[]`, `stage_max`, `funding_max_usd`, `company_age_max_years`, `employees_max`, `incorporation_required`, `referral_required`, `partner_code_required`, `geo_allow[]`, `geo_exclude[]`, `new_customers_only`, `company_email_required`, `card_required` |
| `terms` | `expiry_days`, `activation_window_days`, `stackable`, `post_credit_billing`, `renewable` |
| `gates` | `card`, `phone`, `kyc`, `oauth`, `captcha` (each `true`/`false`/`null`) and `ease_score` (0–100) |
| `verification` | `verified_at` (ISO date), `source_url` (the page where the offer is stated), `verified_by` |
| `claim` | `url` plus `method`: `link` \| `coupon` \| `form` \| `application` \| `self-serve` \| `none` |
| `status` | `active` \| `unverified` \| `paused` \| `retired` |
| `disclosure` | `editorial` \| `affiliate` — must agree with `has_affiliate` |

Two rules matter more than the rest:

1. **A gate you have not established stays `null`, never `false`.** Card, phone, and KYC badges render only for a known value, so the absence of a "No credit card" chip is never read as a promise.
2. **A gate you know is `true` is published anyway.** Eight deals require a card; those get a "Card required" badge instead of being quietly omitted.

`status: "retired"` is how a dead offer is handled. The deal keeps its detail page, its `/r/` redirect, its `/alternatives/` page, and its sitemap entries — that URL has SEO value and inbound links — but it drops out of the homepage grid, Top Picks, comparison pages, and related-deals lists. It stays in the archive list carrying a **Retired** badge, and its claim button is replaced with a non-clickable "No longer available". Retiring a deal is therefore *not* the same as deleting it, and the build does not prune its directories.

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
