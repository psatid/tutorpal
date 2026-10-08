export const revealTargets = '[data-hero-card],[data-hero-icon],[data-hero-copy],[data-reveal],[data-calendar-frame],[data-calendar-event],[data-balance-fill]';
export interface RevealBoot {
  phase: 'preparing' | 'claimed' | 'expired'; deadline: number; reason: string;
  claim: () => boolean; release: (reason: string) => void;
}
declare global { interface Window { tutorpalRevealBoot?: RevealBoot } }
export function settleTarget(element: HTMLElement) {
  element.dataset.motionDone = 'true'; element.dataset.motionPhase = 'settled';
}
export function releaseReveals(reason: string) {
  window.tutorpalRevealBoot?.release(reason);
  document.querySelectorAll<HTMLElement>(revealTargets).forEach(settleTarget);
}
