/**
 * theme.js — shared light/dark theme toggle.
 *
 * Loaded as a classic script on every static page that has a theme toggle
 * button. The homepage uses js/search.js and deal pages use js/detail-page.js,
 * which carry their own copy of this logic.
 */
(() => {
  if (window.__devcheapThemeReady) return;
  window.__devcheapThemeReady = true;

  function updateThemeIcons(theme) {
    const moonIcon = document.querySelector('.icon-moon');
    const sunIcon = document.querySelector('.icon-sun');
    if (!moonIcon || !sunIcon) return;
    if (theme === 'light') {
      moonIcon.style.display = 'block';
      sunIcon.style.display = 'none';
    } else {
      moonIcon.style.display = 'none';
      sunIcon.style.display = 'block';
    }
  }

  function setupTheme() {
    const themeBtn = document.getElementById('theme-toggle');
    if (!themeBtn) return;
    const currentTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcons(currentTheme);
    themeBtn.addEventListener('click', () => {
      const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateThemeIcons(newTheme);
    });
  }

  window.updateThemeIcons = updateThemeIcons;
  window.setupTheme = setupTheme;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupTheme);
  } else {
    setupTheme();
  }
})();
