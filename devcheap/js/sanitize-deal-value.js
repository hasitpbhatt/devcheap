const CORRUPT_DEAL_VALUE_RE = /playwright-mcp|\.\.\//;

const SAFE_FALLBACK = 'See details';

export function sanitizeDealValue(value) {
  if (typeof value !== 'string') return value;
  if (CORRUPT_DEAL_VALUE_RE.test(value)) {
    console.error(
      '[DevCheap::sanitizeDealValue] Corrupt deal value detected — rendering safe fallback instead.',
      'Offending value:',
      value
    );
    return SAFE_FALLBACK;
  }
  return value;
}