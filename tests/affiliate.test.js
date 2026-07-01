import { describe, it, expect, vi, beforeEach } from 'vitest';

const { buildTrackedUrl, trackOutboundClick, handleClaim } = window;

describe('buildTrackedUrl', () => {
  const deals = [
    { id: 'test-1', url: 'https://example.com', affiliate_url: 'https://example.com/ref', has_affiliate: true, tracking_id: 'test_001' },
    { id: 'test-2', url: 'https://example.com', affiliate_url: '', has_affiliate: false, tracking_id: 'test_002' },
    { id: 'test-3', url: 'https://example.com/path?q=1', has_affiliate: false, tracking_id: 'test_003' },
  ];

  it('uses affiliate_url when has_affiliate is true', () => {
    const url = buildTrackedUrl(deals[0]);
    expect(url).toContain('example.com/ref');
  });

  it('falls back to regular url when has_affiliate is false', () => {
    const url = buildTrackedUrl(deals[1]);
    expect(url).toContain('example.com');
    expect(url).not.toContain('/ref');
  });

  it('appends UTM parameters', () => {
    const url = buildTrackedUrl(deals[2]);
    expect(url).toContain('utm_source=devcheap.click');
    expect(url).toContain('utm_medium=website');
    expect(url).toContain('utm_campaign=deal_click');
    expect(url).toContain('utm_content=test_003');
  });

  it('preserves existing query parameters when appending UTM', () => {
    const url = buildTrackedUrl(deals[2]);
    expect(url).toContain('q=1');
  });

  it('handles malformed URLs gracefully', () => {
    const deal = { id: 'bad', url: 'not-a-url', has_affiliate: false };
    const url = buildTrackedUrl(deal);
    expect(url).toBe('not-a-url');
  });
});

describe('trackOutboundClick', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('does not throw when tracking a click', () => {
    const deal = { id: 'test', name: 'Test', tracking_id: 't1', category: 'tools' };
    expect(() => trackOutboundClick(deal, 'claim_deal')).not.toThrow();
  });

  it('logs to console', () => {
    const spy = vi.spyOn(console, 'log');
    const deal = { id: 'test', name: 'Test', tracking_id: 't1', category: 'tools' };
    trackOutboundClick(deal, 'coupon_copy');
    expect(spy).toHaveBeenCalledWith('Outbound click tracked:', expect.objectContaining({
      deal_id: 'test',
      link_type: 'coupon_copy',
    }));
    spy.mockRestore();
  });
});

describe('copyCoupon', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('copies code to clipboard', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.assign(navigator, { clipboard: { writeText } });
    const btn = document.createElement('button');
    btn.innerHTML = 'SAVE20';
    await window.copyCoupon(btn, 'SAVE20', 'test-id');
    expect(writeText).toHaveBeenCalledWith('SAVE20');
  });
});

describe('handleClaim', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('tracks claim without throwing', () => {
    window.dealsData = [{ id: 'test', name: 'T', tracking_id: 't1', category: 'tools' }];
    const event = { target: document.createElement('a') };
    expect(() => handleClaim(event, 'test')).not.toThrow();
  });
});