const UTM_SOURCE = 'devcheap.click';
const UTM_MEDIUM = 'website';
const UTM_CAMPAIGN = 'deal_click';

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
    link_type: linkType,
    timestamp: new Date().toISOString(),
    url: window.location.href
  };
  console.log('Outbound click tracked:', payload);
}
