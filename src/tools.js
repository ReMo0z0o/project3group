/* Outils partagés par l’application et le simulateur autonome (formats français, sélecteurs). */
// ====================== OUTILS ======================
const $ = s => document.querySelector(s);
const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
function fr(x, dec = 1) {
  if (!Number.isFinite(x)) return x > 0 ? '+∞' : x < 0 ? '−∞' : '—';
  const r = Math.round(x * 10 ** dec) / 10 ** dec;
  let s = Math.abs(r).toFixed(dec); if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  s = s.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return (r < 0 ? '−' : '') + s;
}
const pct = (x, d = 1) => Number.isFinite(x) ? fr(x * 100, d) + ' %' : '—';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const subH = s => s.replace(/([A-Za-zθ])_([A-Z])/g, '$1<sub>$2</sub>');
const clamp01 = x => Math.max(0, Math.min(1, x));
const vec = v => '(' + v.map(x => fr(x, 2)).join(' ; ') + ')';
const dec = x => fr(x, 2);
