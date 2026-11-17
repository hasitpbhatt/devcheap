/**
 * report-deal.js — "Report an issue" on deal detail pages.
 *
 * Lets a visitor flag a wrong price, a dead expiry date, or a bad coupon
 * without an account. Reports land in Cloudflare KV and the deal page shows
 * how many corrections have been filed against it.
 */

(() => {
  const form = document.getElementById('report-deal-form');
  if (!form) return;

  const panel = document.getElementById('report-deal-panel');
  const toggle = document.getElementById('report-deal-toggle');
  const status = document.getElementById('report-deal-status');
  const counter = document.getElementById('correction-count');
  const dealId = form.dataset.dealId || '';

  function setStatus(message, kind) {
    if (!status) return;
    status.textContent = message;
    status.className = `report-status report-status--${kind || 'info'}`;
    status.hidden = !message;
  }

  if (toggle && panel) {
    toggle.addEventListener('click', () => {
      const open = panel.hidden;
      panel.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      if (open) {
        const field = panel.querySelector('select, textarea');
        if (field) field.focus();
      }
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submit = form.querySelector('button[type="submit"]');
    const field = form.querySelector('select[name="field"]')?.value || 'other';
    const detail = form.querySelector('textarea[name="detail"]')?.value.trim() || '';
    const reportedValue = form.querySelector('input[name="reported_value"]')?.value.trim() || '';

    if (detail.length < 4) {
      setStatus('Tell us what looks wrong (4 characters minimum).', 'error');
      return;
    }

    if (submit) submit.disabled = true;
    setStatus('Sending…', 'info');

    try {
      const res = await fetch('/api/report-deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deal_id: dealId,
          field,
          detail,
          reported_value: reportedValue,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus(data.error || 'Could not send that report. Try again shortly.', 'error');
        return;
      }

      setStatus('Thanks. A human reads every report and updates the page when the offer changes.', 'success');
      form.reset();
      if (counter) {
        const current = parseInt(counter.textContent.trim(), 10) || 0;
        counter.textContent = String(current + 1);
      }
    } catch (err) {
      setStatus('Network error. Your report was not sent.', 'error');
    } finally {
      if (submit) submit.disabled = false;
    }
  });
})();
