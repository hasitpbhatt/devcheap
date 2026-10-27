const UTM_SOURCE = 'devcheap.click';
const UTM_MEDIUM = 'website';
const UTM_CAMPAIGN = 'deal_click';

const GA4_EVENT_MAP = {
  claim_deal: 'affiliate_click',
  top_picks_claim: 'affiliate_click',
  coupon_copy: 'coupon_copy',
  llm_provider: 'llm_provider_click',
  nav_click: 'nav_click'
};

export function buildTrackedUrl(deal) {
  let targetUrl = deal.url;
  if (deal.has_affiliate && deal.affiliate_url) {
    targetUrl = deal.affiliate_url;
  }
  try {
    const url = new URL(targetUrl);
    url.searchParams.set('utm_source', UTM_SOURCE);
    url.searchParams.set('utm_medium', UTM_MEDIUM);
    url.searchParams.set('utm_campaign', UTM_CAMPAIGN);
    url.searchParams.set('utm_content', deal.tracking_id || deal.id);
    return url.toString();
  } catch (e) {
    return targetUrl;
  }
}

export function trackOutboundClick(deal, linkType) {
  const payload = {
    deal_id: deal.id,
    deal_name: deal.name,
    tracking_id: deal.tracking_id,
    category: deal.category,
    has_affiliate: deal.has_affiliate === true,
    link_type: linkType,
    timestamp: new Date().toISOString(),
    url: window.location.href
  };
  console.log('Outbound click tracked:', payload);
  sendClickEvent(payload);
  sendGa4Event(deal, linkType);
}

function sendClickEvent(payload) {
  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    try {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      const ok = navigator.sendBeacon('/api/track-click', blob);
      if (ok) return;
    } catch (e) {
    }
  }
  try {
    fetch('/api/track-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch (e) {
  }
}

function sendGa4Event(deal, linkType) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  const eventName = GA4_EVENT_MAP[linkType] || 'affiliate_click';
  window.gtag('event', eventName, {
    deal_id: deal.id,
    deal_name: deal.name,
    tracking_id: deal.tracking_id,
    category: deal.category,
    has_affiliate: deal.has_affiliate === true,
    link_type: linkType,
    value: deal.has_affiliate ? 1 : 0
  });
}
