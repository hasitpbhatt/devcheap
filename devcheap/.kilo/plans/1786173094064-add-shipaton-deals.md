# Add Shipaton 2026 Deals

Add 7 new deals from RevenueCat Shipaton 2026 sponsor perks to `data/deals.jsonl`.

## Deals to Add

1. **Limrun** — `limrun`
   - Category: Developer Tools
   - Pricing: free
   - Deal: 2,000 Free Credits ($100 Value)
   - Code: LIMSHIPATON2026
   - URL: https://lim.run/
   - Desc: Cloud infrastructure for mobile development with remote Xcode, iOS/Android simulators, and Xcode build environments. 2,000 free credits ($100 value) upon account creation, plus 50% off additional credits with code LIMSHIPATON2026.
   - Tags: mobile,ios,android,xcode,simulators,cloud,shipaton2026
   - Why: 2,000 free mobile dev credits ($100 value) — cloud Xcode and iOS/Android simulators for AI agents
   - Expires: null
   - Rating: 7.0

2. **Tenjin** — `tenjin`
   - Category: Sales & Marketing
   - Pricing: trial
   - Deal: All-Inclusive Plan S Free for 3 Months ($600 Value)
   - Code: SHIPATON2026
   - URL: https://tenjin.com/
   - Desc: Mobile marketing analytics and attribution platform. All-Inclusive Plan S free for 3 months ($600 value) using promo code SHIPATON2026. Includes attribution, cohort reports, LTV, ROAS, SKAN, raw data access, and fraud prevention.
   - Tags: mobile,marketing,analytics,attribution,shipaton2026
   - Why: 3 months free Tenjin Plan S ($600 value) — mobile attribution and analytics for gaming studios and app teams
   - Expires: null
   - Rating: 7.0

3. **OneSignal** — `onesignal`
   - Category: Customer Support
   - Pricing: trial
   - Deal: 100% Off Growth Plan for Up to 3 Months
   - Code: Automatic (Link)
   - URL: https://onesignal.com/
   - Desc: Customer engagement platform for push notifications, in-app messaging, email, and SMS. 100% off the Growth plan for up to 3 months (up to $600/month in usage) through Shipaton 2026.
   - Tags: push-notifications,email,sms,customer-engagement,shipaton2026
   - Why: 3 months free OneSignal Growth plan — push, in-app, email, and SMS at no cost
   - Expires: null
   - Rating: 7.5

4. **Noise** — `noise`
   - Category: Sales & Marketing
   - Pricing: free
   - Deal: $1,000 Matching Credits
   - Code: shipaton2026
   - URL: https://www.getnoise.com/
   - Desc: UGC creator platform that helps apps achieve explosive growth by connecting them with 1.5M+ pay-as-you-go creators. $1,000 in matching credits applied automatically or with code shipaton2026 — dollar-for-dollar matching on spend.
   - Tags: ugc,creators,marketing,matching-credits,shipaton2026
   - Why: $1,000 matching UGC creator credits — pay-as-you-go content creation with dollar-for-dollar match
   - Expires: null
   - Rating: 7.0

5. **Bitrig** — `bitrig`
   - Category: Developer Tools
   - Pricing: paid
   - Deal: 60% Off Bitrig Pro ($10/month)
   - Code: Automatic (Link)
   - URL: https://bitrig.com/
   - Desc: Build native Swift apps with AI. 60% off Bitrig Pro ($10/month) through Shipaton 2026. Unlimited daily requests, 200 monthly credits, TestFlight and App Store distribution, and Claude/ChatGPT integration.
   - Tags: swift,ios,ai,app-builder,shipaton2026
   - Why: 60% off Bitrig Pro ($10/mo) — build native Swift apps with AI and distribute to TestFlight/App Store
   - Expires: null
   - Rating: 7.0

6. **JetBrains Junie** — `jetbrains-junie`
   - Category: Developer Tools
   - Pricing: trial
   - Deal: 2 Months Free Access
   - Code: Automatic (Link)
   - URL: https://www.jetbrains.com/junie/
   - Desc: AI coding agent by JetBrains that plans, writes, and tests code directly in your IDE. 2 months of free access through Shipaton 2026. Available in IntelliJ IDEA Ultimate, PyCharm, WebStorm, GoLand, PhpStorm, Rider, and RustRover.
   - Tags: ai,ide,coding-agent,junie,shipaton2026
   - Why: 2 months free JetBrains Junie — AI coding agent that writes and tests code in your IDE
   - Expires: null
   - Rating: 7.5

7. **Layers** — `layers`
   - Category: Design & Collaboration
   - Pricing: trial
   - Deal: 2 Months Free Access
   - Code: Automatic (Link)
   - URL: https://www.layers.com/
   - Desc: AI skills for product designers that walks through seven layers of product design. 2 months of free Layers Pro access through Shipaton 2026. Automate content generation, paid ads, social management, and App Store listing optimization.
   - Tags: product-design,ai,design-framework,shipaton2026
   - Why: 2 months free Layers Pro — AI-powered product design framework for content, ads, social, and ASO
   - Expires: null
   - Rating: 7.0

## Steps

1. Append 7 new JSON objects to `data/deals.jsonl` (one per line).
2. Update `README.md`:
   - Change deal count in header from 209 to 216.
   - Change category count in header from 22 to 22 (no new categories added).
   - Update category counts:
     - Developer Tools: 36 → 38
     - Sales & Marketing: 0 → 2
     - Customer Support: 9 → 10
     - Design & Collaboration: 8 → 9
3. Run `npm run validate:jsonl && npm test`.
4. Run `npm run build` (regenerates `index.html`, `deals/<id>/index.html`, `sitemap.xml`, `llms.txt`).
5. Run `pwsh scripts/generate-feed.ps1` (regenerates `feed.xml`).
6. Verify site renders correctly.

## Notes

- No new categories are needed; all used categories already exist in `tests/deals-schema.test.js`.
- All `id`, `tracking_id`, and `url` values must be unique across the dataset.
- `expires: null` is used because the Shipaton 2026 perks do not list explicit end dates.
- `has_affiliate: false` and `affiliate_url: ""` for all new deals (no affiliate relationships).
- Codes sourced from user input / Ship Kit page: Limrun uses `LIMSHIPATON2026`, Tenjin uses `SHIPATON2026`, Noise uses `shipaton2026`. Others have no explicit code and use `Automatic (Link)`.
