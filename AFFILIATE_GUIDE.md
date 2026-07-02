# Affiliate Program Guide for DevCheap

## Updated Deals.jsonl Status
- ✅ All `affiliate_url` values set to `""` (clean slate)
- ✅ Schema test updated (removed URL validation for empty strings)
- ✅ Validation passed: 143 deals validated
- ✅ Tests passed: 52/52 tests passed

## Vultr Deal Updated
- Line 49: Vultr now has `affiliate_url: "https://www.vultr.com/?ref=9910327"`

## Affiliate Program Signup Links

### Impact.com (Recommended - One signup, Many Programs)
**Programs you can access:** Notion, Canva, Vercel, Cloudflare, GitHub, Sentry, DigitalOcean, Stripe, and 1000+ others

**Signup URLs:**
- Main: https://impact.com/partners/affiliate-partners/
- Direct publisher signup: https://app.impact.com/signup/none/create-new-mediapartner-account-flow.ihtml

**What's Required:**
- Email address
- Website URL (use: https://devcheap.click)
- Company name
- Basic contact info
- **No phone number required for publisher signup**
- **No business entity required**

**Signup Flow:**
1. Go to Impact.com partner page
2. Click "Sign up" or "Join as Publisher"
3. Select "Affiliate Publisher"
4. Fill in your email and devcheap.click as website
5. Complete basic profile
6. Once approved, search for and apply to individual programs

### SiteGround (Very Easy)
**Signup:** https://siteground.com/affiliates
**What's Required:**
- Name
- Social media or YouTube channel URL (can use devcheap.click)
- PayPal or bank account
- **No phone number required**
- **No business entity required**
- Auto-approved in most cases

**Commission:** $40-100 per sale (tiered)

### Hostinger (Easy)
**Signup:** https://affiliates.hostinger.com/signup
**What's Required:**
- Email
- Channel type (blog, social, etc.)
- Website URLs
- **No phone number required**
- Quick approval

**Commission:** 40%+ per sale (tiered)

### IONOS (Easy)
**Signup:** https://affiliate.ionos.com/signup
**What's Required:**
- Email
- Short business description
- **No phone number required**

### Sentry Referral Program (Email Only)
**Signup:** https://sentry.io/referral
**What's Required:**
- Just your email
- **No website required**
- **No approval needed**
- **$10 credit per referral**

## Recommended Next Steps

1. **Sign up for Impact.com** (takes 5 minutes, covers 1000+ programs)
2. **Sign up for SiteGround** (easiest individual program)
3. **Sign up for Hostinger** (good commission)
4. **Sign up for IONOS** (if you want another easy one)
5. **Add your affiliate links** to deals.jsonl once you get them
6. **Regenerate feed.xml** after adding links

## Adding Affiliate Links

Once you have your affiliate links, update deals.jsonl like:

```json
{
  "id": "siteground",
  "name": "SiteGround",
  "category": "Hosting & Cloud",
  "deal": "75% OFF Web Hosting Plans",
  "code": "SITEGROUND75",
  "url": "https://www.siteground.com",
  "affiliate_url": "https://www.siteground.com/affiliates/idevaff_123456",
  "tracking_id": "siteground_001",
  "has_affiliate": true,
  ...
}
```

## Commands to Run After Adding Links

```bash
# Regenerate feed.xml
pwsh scripts/generate-feed.ps1

# Validate
npm run validate:jsonl

# Test
npm test
```

## Notes

- **devcheap.click** works as your website URL for all signups
- Use **affiliates@devcheap.click** as your email alias for tracking
- Start with Impact.com for maximum coverage
- SiteGround is the easiest individual program to get started with
