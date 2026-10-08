import { setupMotion } from './motion';
import { setupFAQ } from './faq';
import { releaseReveals } from './reveal-state';
const menu = document.querySelector<HTMLDetailsElement>('.mobile-menu');
const closeMenu = () => { if (menu) menu.open = false; };
menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu?.open) { closeMenu(); menu.querySelector('summary')?.focus(); }
});
document.addEventListener('click', event => {
  if (menu?.open && event.target instanceof Node && !menu.contains(event.target)) closeMenu();
});
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let cleanMotion: (() => void) | undefined;
let cleanFAQ: (() => void) | undefined;
let disposed = false;
function reconcile() {
  cleanMotion?.(); cleanMotion = undefined;
  cleanFAQ?.(); cleanFAQ = undefined;
  if (disposed) return;
  if (motionQuery.matches) {
    releaseReveals('reduced'); return;
  }
  try { cleanMotion = setupMotion(); } catch { releaseReveals('setup-failure'); }
  try { cleanFAQ = setupFAQ(); } catch { /* Native disclosures remain available. */ }
}
motionQuery.addEventListener('change', reconcile);
reconcile();
window.addEventListener('pagehide', () => { disposed = true; cleanMotion?.(); cleanMotion = undefined; cleanFAQ?.(); cleanFAQ = undefined; });
window.addEventListener('pageshow', event => {
  if (event.persisted) { disposed = false; reconcile(); }
});
