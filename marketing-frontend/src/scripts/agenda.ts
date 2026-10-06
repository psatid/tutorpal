/** SSR stays open. Only an on-time claimed preparation may shorten the week. */
export function setupAgenda() {
  const details = document.querySelector<HTMLDetailsElement>('[data-agenda-remainder]');
  const summary = details?.querySelector('summary');
  if (!details || !summary) return { activate: (_collapse: boolean) => {}, cleanup: () => {} };
  const wide = window.matchMedia('(min-width: 1024px)');
  let activated = false;
  let expanded = details.dataset.compactExpanded === undefined ? details.open : details.dataset.compactExpanded !== 'false';
  const report = () => {
    details.dataset.compactExpanded = String(expanded);
    details.dataset.agendaPhase = wide.matches ? 'desktop' : details.open ? 'full-week' : 'three-days';
    details.dispatchEvent(new Event('tutorpal:agenda-change'));
  };
  const resize = () => {
    if (!activated) return;
    details.open = wide.matches || expanded; report();
  };
  const onSummary = () => {
    if (!wide.matches) expanded = !details.open;
    // Native activation owns the toggle; responsive toggles never change intent.
  };
  try {
    summary.addEventListener('click', onSummary); details.addEventListener('toggle', report);
    wide.addEventListener('change', resize);
  } catch (error) {
    summary.removeEventListener('click', onSummary); details.removeEventListener('toggle', report);
    wide.removeEventListener('change', resize); throw error;
  }
  return {
    activate(collapse: boolean) {
      if (collapse && details.dataset.compactExpanded === undefined) expanded = false;
      activated = true; resize();
    },
    cleanup() { summary.removeEventListener('click', onSummary); details.removeEventListener('toggle', report); wide.removeEventListener('change', resize); },
  };
}
