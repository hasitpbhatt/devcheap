const themeBtn = document.getElementById('theme-toggle');
if (themeBtn) {
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

function updateThemeIcons(theme) {
const moonIcon = document.querySelector('.icon-moon');
const sunIcon = document.querySelector('.icon-sun');
if (moonIcon && sunIcon) {
if (theme === 'light') {
moonIcon.style.display = 'block';
sunIcon.style.display = 'none';
} else {
moonIcon.style.display = 'none';
sunIcon.style.display = 'block';
}
}
}

const copyBtn = document.getElementById('copy-coupon-btn');
if (copyBtn) {
copyBtn.addEventListener('click', () => {
const code = copyBtn.dataset.code;
navigator.clipboard.writeText(code).then(() => {
const originalHTML = copyBtn.innerHTML;
copyBtn.classList.add('copied');
copyBtn.innerHTML = `<svg class="icon icon-check" width="14" height="14"><use href="/images/icons.svg#icon-check"/></svg> Copied!`;
copyBtn.style.color = 'var(--green)';
copyBtn.style.borderColor = 'var(--green)';

setTimeout(() => {
copyBtn.innerHTML = originalHTML;
copyBtn.style.color = '';
copyBtn.style.borderColor = '';
copyBtn.classList.remove('copied');
}, 1500);
}).catch(err => console.error('Could not copy code:', err));
});
}