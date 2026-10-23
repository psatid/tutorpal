export const revealTargets = '[data-reveal],[data-calendar-frame],[data-calendar-event],[data-balance-fill]';
const heroTargets = '.hero-copy,[data-hero-card],[data-hero-icon]';
export function settleTarget(element: HTMLElement) {
  element.dataset.motionDone = 'true'; element.dataset.motionPhase = 'settled';
}
export function releaseReveals() {
  document.querySelectorAll<HTMLElement>(revealTargets).forEach(settleTarget);
}
export function settleHero() {
  document.querySelectorAll<HTMLElement>(heroTargets).forEach(element => { element.dataset.heroDone = 'true'; });
}
