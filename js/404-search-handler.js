const input = document.getElementById('search-input');
if (input) {
input.addEventListener('keydown', function(e) {
if (e.key === 'Enter') {
const q = input.value.trim();
if (q) {
window.location.href = '/#search?q=' + encodeURIComponent(q);
}
}
});
}