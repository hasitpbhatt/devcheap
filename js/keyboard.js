/**
 * keyboard.js — global keyboard shortcuts.
 *
 * Power users navigate a deals grid with the keyboard, not the mouse.
 * Shortcuts are ignored while you're typing in a field.
 *
 *   /  or  s   focus the search box
 *   j / k      move the selection down / up through deal cards
 *   Enter      open the selected deal's claim link
 *   Esc        clear the search / close the help overlay
 *   ?          toggle the shortcuts overlay
 *   g then t  jump to Top Picks
 *   g then a  jump to All Deals
 *   g then l  jump to the LLM Providers directory
 *   g then s  jump to the Stack calculator
 */

(() => {
  if (window.__devcheapKeyboardReady) return;
  window.__devcheapKeyboardReady = true;

  const isTypingTarget = (el) => {
    if (!el) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  };

  const getSearchInput = () =>
    document.getElementById('search-input') || document.querySelector('input[type="search"], input[name="q"]');

  const getCards = () => Array.from(document.querySelectorAll('.deal-card, .top-picks-card'));

  let selectedIndex = -1;
  let pendingG = false;
  let gTimer = null;

  function clearSelection() {
    document.querySelectorAll('.deal-card.keyboard-selected, .top-picks-card.keyboard-selected')
      .forEach((el) => el.classList.remove('keyboard-selected'));
    selectedIndex = -1;
  }

  function selectCard(index) {
    const cards = getCards();
    if (!cards.length) return;

    const bounded = Math.max(0, Math.min(index, cards.length - 1));
    if (selectedIndex >= 0 && cards[selectedIndex]) {
      cards[selectedIndex].classList.remove('keyboard-selected');
    }
    selectedIndex = bounded;
    const card = cards[bounded];
    card.classList.add('keyboard-selected');
    card.scrollIntoView({ block: 'center', behavior: 'smooth' });

    const title = card.querySelector('.deal-card-title, .top-picks-card-title');
    if (title) {
      const sr = document.getElementById('keyboard-live-region');
      if (sr) sr.textContent = `Selected: ${title.textContent.trim()}`;
    }
  }

  function claimSelected() {
    const cards = getCards();
    if (selectedIndex < 0 || !cards[selectedIndex]) return false;
    const link = cards[selectedIndex].querySelector('a.deal-card-btn-primary, a.sidebar-btn-primary');
    if (!link) return false;
    link.click();
    return true;
  }

  function focusSearch() {
    const input = getSearchInput();
    if (!input) return false;
    input.focus();
    input.select();
    return true;
  }

  function clearSearch() {
    const input = getSearchInput();
    if (!input) return false;
    if (input.value) {
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    input.blur();
    return true;
  }

  function jump(selector) {
    const target = document.querySelector(selector);
    if (!target) return false;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return true;
  }

  function toggleHelp(force) {
    let overlay = document.getElementById('keyboard-help');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'keyboard-help';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', 'Keyboard shortcuts');
      overlay.className = 'keyboard-help-overlay';
      overlay.innerHTML = `
        <div class="keyboard-help-panel">
          <h2>Keyboard shortcuts</h2>
          <dl>
            <div><dt><kbd>/</kbd> or <kbd>s</kbd></dt><dd>Search deals</dd></div>
            <div><dt><kbd>j</kbd> / <kbd>k</kbd></dt><dd>Move down / up</dd></div>
            <div><dt><kbd>Enter</kbd></dt><dd>Claim the selected deal</dd></div>
            <div><dt><kbd>Esc</kbd></dt><dd>Clear search / close this</dd></div>
            <div><dt><kbd>?</kbd></dt><dd>Toggle this panel</dd></div>
            <div><dt><kbd>g</kbd> then <kbd>t</kbd></dt><dd>Go to Top Picks</dd></div>
            <div><dt><kbd>g</kbd> then <kbd>a</kbd></dt><dd>Go to All Deals</dd></div>
            <div><dt><kbd>g</kbd> then <kbd>l</kbd></dt><dd>Go to LLM Providers</dd></div>
            <div><dt><kbd>g</kbd> then <kbd>s</kbd></dt><dd>Go to Stack calculator</dd></div>
          </dl>
          <button type="button" class="keyboard-help-close" id="keyboard-help-close">Close</button>
        </div>`;
      document.body.appendChild(overlay);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay || e.target.id === 'keyboard-help-close') toggleHelp(false);
      });
    }
    const shouldShow = force !== undefined ? force : overlay.hidden;
    overlay.hidden = !shouldShow;
    if (shouldShow) {
      const close = overlay.querySelector('#keyboard-help-close');
      if (close) close.focus();
    }
    return true;
  }

  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    const overlay = document.getElementById('keyboard-help');
    if (overlay && !overlay.hidden) {
      if (e.key === 'Escape' || e.key === '?') {
        e.preventDefault();
        toggleHelp(false);
      }
      return;
    }

    if (isTypingTarget(e.target)) {
      if (e.key === 'Escape') {
        e.preventDefault();
        clearSearch();
      }
      return;
    }

    // "g" prefix chords: g then t/a/l/s
    if (pendingG) {
      pendingG = false;
      clearTimeout(gTimer);
      const key = e.key.toLowerCase();
      const destinations = {
        t: '#top-picks',
        a: '#deals',
        l: '/llm-providers/',
        s: '/stack/',
      };
      if (destinations[key]) {
        e.preventDefault();
        if (destinations[key].startsWith('/')) {
          window.location.href = destinations[key];
        } else {
          jump(destinations[key]);
        }
        return;
      }
    }

    switch (e.key) {
      case '/':
      case 's':
        if (focusSearch()) e.preventDefault();
        break;
      case 'j':
      case 'ArrowDown':
        if (getCards().length) {
          e.preventDefault();
          selectCard(selectedIndex + 1);
        }
        break;
      case 'k':
      case 'ArrowUp':
        if (getCards().length) {
          e.preventDefault();
          selectCard(selectedIndex <= 0 ? 0 : selectedIndex - 1);
        }
        break;
      case 'Enter':
        if (claimSelected()) e.preventDefault();
        break;
      case 'Escape':
        if (clearSearch()) e.preventDefault();
        break;
      case '?':
        e.preventDefault();
        toggleHelp();
        break;
      case 'g':
        pendingG = true;
        clearTimeout(gTimer);
        gTimer = setTimeout(() => { pendingG = false; }, 1200);
        break;
      default:
        break;
    }
  });
})();
