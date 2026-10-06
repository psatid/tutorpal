/** Native multi-open disclosures with an optional reversible height transition. */
export function setupFAQ(): () => void {
  if (typeof HTMLElement.prototype.animate !== 'function') return () => {};
  const cleanups: Array<() => void> = [];
  let disposed = false;
  const cleanup = () => { disposed = true; cleanups.forEach(clean => clean()); };
  try {
    document.querySelectorAll<HTMLDetailsElement>('.faq-list details').forEach(details => {
      const summary = details.querySelector<HTMLElement>('summary');
      const answer = details.querySelector<HTMLElement>('.faq-answer');
      if (!summary || !answer) return;
      let desired = details.open;
      let animation: Animation | undefined;
      const settle = () => {
        animation?.cancel(); animation = undefined;
        details.open = desired; answer.style.removeProperty('overflow');
        details.dataset.faqPhase = desired ? 'open' : 'closed';
      };
      const toggle = (event: MouseEvent) => {
        event.preventDefault();
        desired = animation ? !desired : !details.open;
        const fromHeight = details.open ? answer.getBoundingClientRect().height : 0;
        const fromOpacity = details.open ? Number(getComputedStyle(answer).opacity) : 0;
        animation?.cancel(); animation = undefined;
        details.open = true;
        const naturalHeight = answer.getBoundingClientRect().height;
        answer.style.overflow = 'hidden';
        details.dataset.faqPhase = desired ? 'opening' : 'closing';
        try {
          const current = answer.animate([
            { height: `${fromHeight}px`, opacity: fromOpacity },
            { height: `${desired ? naturalHeight : 0}px`, opacity: desired ? 1 : 0 },
          ], { duration: 320, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' });
          animation = current;
          void current.finished.then(() => {
            if (!disposed && animation === current) settle();
          }).catch(() => { /* Reversal or cleanup owns the current intended state. */ });
        } catch { settle(); }
      };
      const onResize = () => { if (!animation) desired = details.open; settle(); };
      const dispose = () => { summary.removeEventListener('click', toggle); window.removeEventListener('resize', onResize); onResize(); };
      cleanups.push(dispose);
      summary.addEventListener('click', toggle); window.addEventListener('resize', onResize, { passive: true });
    });
  } catch { cleanup(); }
  return cleanup;
}
