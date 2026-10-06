import { setupMotion } from './motion';
import { setupFAQ } from './faq';
import { setupAgenda } from './agenda';
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
let agenda: ReturnType<typeof setupAgenda> | undefined;
let disposed = false;
function initializeAgenda() {
  try { agenda = setupAgenda(); } catch { releaseReveals('agenda-setup-failure'); }
}
function reconcile() {
  cleanMotion?.(); cleanMotion = undefined;
  cleanFAQ?.(); cleanFAQ = undefined;
  if (disposed) return;
  if (motionQuery.matches) {
    releaseReveals('reduced'); agenda?.activate(false); return;
  }
  try { cleanMotion = setupMotion(); } catch { releaseReveals('setup-failure'); }
  try { agenda?.activate(window.tutorpalRevealBoot?.phase === 'claimed'); }
  catch {
    cleanMotion?.(); cleanMotion = undefined; releaseReveals('agenda-setup-failure');
    agenda?.cleanup(); agenda = undefined;
    const week = document.querySelector<HTMLDetailsElement>('[data-agenda-remainder]');
    if (week) { week.open = true; week.dataset.compactExpanded = 'true'; week.dataset.agendaPhase = 'full-week'; }
  }
  try { cleanFAQ = setupFAQ(); } catch { /* Native disclosures remain available. */ }
}
motionQuery.addEventListener('change', reconcile);
initializeAgenda();
reconcile();
window.addEventListener('pagehide', () => { disposed = true; cleanMotion?.(); cleanMotion = undefined; cleanFAQ?.(); cleanFAQ = undefined; agenda?.cleanup(); agenda = undefined; });
window.addEventListener('pageshow', event => {
  if (event.persisted) { disposed = false; initializeAgenda(); reconcile(); }
});
