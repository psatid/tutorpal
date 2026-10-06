import { releaseReveals, revealTargets, settleTarget } from './reveal-state';

/** Entrance and floating keep separate transforms. Copy and actions never move. */
function setupHeroMotion(prepare: boolean): () => void {
  const hero = document.querySelector<HTMLElement>('.hero');
  const scene = document.querySelector<HTMLElement>('.hero-product');
  const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-hero-card]'));
  if (!hero || !scene || !cards.length || !('IntersectionObserver' in window)) return () => {};
  let visible = false;
  let disposed = false;
  const finishEntrance = (card: HTMLElement) => {
    card.classList.remove('hero-motion-enter'); card.classList.add('hero-motion-ready'); settleTarget(card);
  };
  const update = () => {
    const running = visible && !document.hidden && !disposed;
    hero.dataset.motionRunning = String(running);
    if (!running) cards.forEach(finishEntrance);
  };
  const onAnimationEnd = (event: AnimationEvent) => {
    if (event.animationName === 'hero-spread' && event.target instanceof HTMLElement) finishEntrance(event.target);
  };
  const onResize = () => { cards.forEach(finishEntrance); };
  const onFocus = () => { cards.forEach(finishEntrance); };
  const observer = new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); update(); });
  const cleanup = () => {
    disposed = true; observer.disconnect();
    document.removeEventListener('visibilitychange', update); window.removeEventListener('resize', onResize);
    hero.removeEventListener('animationend', onAnimationEnd); hero.removeEventListener('focusin', onFocus);
    delete hero.dataset.motionRunning;
    cards.forEach(card => { finishEntrance(card); card.classList.remove('hero-motion-ready'); });
  };
  try {
    const rect = hero.getBoundingClientRect(); visible = rect.bottom > 0 && rect.top < window.innerHeight;
    hero.addEventListener('animationend', onAnimationEnd); hero.addEventListener('focusin', onFocus);
    document.addEventListener('visibilitychange', update); window.addEventListener('resize', onResize, { passive: true });
    observer.observe(hero);
    const sceneRect = scene.getBoundingClientRect();
    const actions = hero.querySelector<HTMLElement>('.actions')?.getBoundingClientRect();
    const originX = sceneRect.left + sceneRect.width / 2;
    const tallestCard = Math.max(...cards.map(card => card.getBoundingClientRect().height));
    const originY = (actions?.bottom ?? sceneRect.top) + tallestCard / 2 + 24;
    cards.forEach((card, index) => {
      if (!prepare || card.dataset.motionDone || !visible || document.hidden || window.scrollY > 0) { finishEntrance(card); return; }
      const cardRect = card.getBoundingClientRect();
      card.style.setProperty('--from-x', `${originX - cardRect.left - cardRect.width / 2}px`);
      card.style.setProperty('--from-y', `${originY - cardRect.top - cardRect.height / 2}px`);
      card.style.setProperty('--enter-delay', `${index * 80}ms`);
      card.dataset.motionPhase = 'revealing'; card.classList.add('hero-motion-enter');
    });
    update();
  } catch (error) { cleanup(); throw error; }
  return cleanup;
}

function setupClosingMotion(): () => void {
  const closing = document.querySelector<HTMLElement>('.closing');
  if (!closing || !('IntersectionObserver' in window)) return () => {};
  let visible = false;
  const update = () => { closing.dataset.motionRunning = String(visible && !document.hidden); };
  const observer = new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); update(); });
  const cleanup = () => {
    observer.disconnect(); document.removeEventListener('visibilitychange', update);
    delete closing.dataset.motionReady; delete closing.dataset.motionRunning;
  };
  try {
    const rect = closing.getBoundingClientRect(); visible = rect.bottom > 0 && rect.top < window.innerHeight;
    observer.observe(closing); document.addEventListener('visibilitychange', update);
    closing.dataset.motionReady = 'true'; update();
  } catch { cleanup(); }
  return cleanup;
}

type ActiveReveal = { animation: Animation; finish: (runAfter?: boolean) => void };
function setupScrollMotion(prepare: boolean): () => void {
  const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal],[data-calendar-frame],[data-calendar-event],[data-balance-fill]'));
  if (!prepare) { targets.forEach(settleTarget); return () => {}; }
  if (typeof window.requestAnimationFrame !== 'function' || typeof window.cancelAnimationFrame !== 'function') throw new Error('Scroll scheduling is unavailable');
  const active = new Map<HTMLElement, ActiveReveal>();
  const generic = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
  const calendar = document.querySelector<HTMLElement>('[data-calendar-frame]');
  const events = Array.from(document.querySelectorAll<HTMLElement>('[data-calendar-event]'));
  const workspace = document.querySelector<HTMLElement>('.workspace-frame');
  const bars = Array.from(document.querySelectorAll<HTMLElement>('[data-balance-fill]'));
  const remainder = document.querySelector<HTMLDetailsElement>('[data-agenda-remainder]');
  const wide = window.matchMedia('(min-width: 1024px)');
  let calendarReady = !calendar || calendar.dataset.motionDone === 'true';
  let disposed = false;
  let settling = false;
  let scrollFrame: number | undefined;
  const rendered = (element: HTMLElement) => {
    // Chromium can retain positive geometry for closed details descendants.
    // Native disclosure state determines whether these lessons are exposed.
    if (element.closest('details:not([open])')) return false;
    return element.getClientRects().length > 0 && element.getBoundingClientRect().height > 0;
  };
  const passed = (element: HTMLElement) => rendered(element) && element.getBoundingClientRect().bottom <= 0;
  const inView = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect(); return rendered(element) && rect.bottom > 0 && rect.top < window.innerHeight * .9;
  };
  const settleQueued = (element: HTMLElement) => {
    if (element === calendar) {
      calendarReady = true;
      events.filter(rendered).forEach(event => { active.get(event)?.finish(false); settleTarget(event); });
    }
    if (element === workspace) bars.forEach(bar => { active.get(bar)?.finish(false); settleTarget(bar); });
  };
  const play = (element: HTMLElement, duration: number, delay = 0, bar = false, after?: () => void) => {
    if (disposed || active.has(element) || !rendered(element)) return;
    if (element.dataset.motionDone === 'true') { after?.(); return; }
    if (settling || document.hidden || passed(element)) { settleTarget(element); after?.(); return; }
    let animation: Animation;
    try {
      animation = element.animate(bar ? [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }] : [
        { transform: 'translateY(24px)', opacity: 0, filter: 'blur(6px)' },
        { transform: 'translateY(0)', opacity: 1, filter: 'blur(0px)' },
      ], { duration, delay, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' });
    } catch { settleTarget(element); after?.(); return; }
    element.dataset.motionPhase = 'revealing';
    const finish = (runAfter = true) => {
      if (active.get(element)?.animation !== animation) return;
      active.delete(element); animation.cancel(); settleTarget(element);
      if (!runAfter) settleQueued(element);
      if (!disposed && runAfter) after?.();
    };
    active.set(element, { animation, finish });
    void animation.finished.then(() => finish()).catch(() => {
      if (active.get(element)?.animation === animation) finish(false);
    });
  };
  const fillBars = () => { bars.forEach((bar, index) => play(bar, 750, index * 80, true)); };
  const startEvents = () => {
    if (disposed) return;
    calendarReady = true;
    events.forEach((event, index) => {
      if (wide.matches || inView(event) || passed(event)) play(event, 800, wide.matches ? index * 80 : 0);
    });
  };
  const settle = (elements: HTMLElement[], all = false) => {
    settling = true;
    elements.forEach(element => {
      if (all || rendered(element)) {
        active.get(element)?.finish(); settleTarget(element);
        if (element === calendar) startEvents();
        if (element === workspace) bars.forEach(settleTarget);
      }
    });
    settling = false;
  };
  const observer = new IntersectionObserver(entries => {
    if (disposed) return;
    for (const entry of entries) {
      const element = entry.target as HTMLElement;
      if (!entry.isIntersecting) {
        if (!rendered(element)) continue; // Closed native details are still unseen.
        if (events.includes(element) && wide.matches && !passed(element)) continue;
        if (active.has(element) || passed(element)) {
          if (element === calendar) settle(events);
          settle([element]);
        }
        continue;
      }
      if (element === calendar) play(element, 700, 0, false, startEvents);
      else if (events.includes(element)) { if (calendarReady && !wide.matches) play(element, 800); }
      else {
        const delay = element.tagName === 'P' && element.closest('.section-intro,.line-copy,.closing-copy') ? 100 : 0;
        play(element, 850, delay, false, element === workspace ? fillBars : undefined);
      }
    }
  }, { rootMargin: '0px 0px -10% 0px' });
  const onVisibility = () => { if (document.hidden) settle(targets, true); };
  const onScroll = () => {
    if (disposed || scrollFrame !== undefined) return;
    scrollFrame = window.requestAnimationFrame(() => {
      scrollFrame = undefined;
      if (disposed) return;
      // IO may miss a below-to-above jump whose intersection state stays false.
      // This sweep only releases passed effects; it never starts an entrance.
      targets.filter(element => (element.dataset.motionPhase === 'pending' || active.has(element)) && passed(element)).forEach(element => {
        active.get(element)?.finish(false); settleTarget(element); settleQueued(element);
      });
    });
  };
  const onResize = () => {
    settle(Array.from(active.keys()));
    settle(targets.filter(element => inView(element) || passed(element)));
    if (calendarReady) startEvents();
  };
  const onFocus = (event: FocusEvent) => {
    if (!(event.target instanceof Element)) return;
    const section = event.target.closest('section');
    if (section) settle(targets.filter(element => section.contains(element)));
  };
  const onHash = () => {
    let id = location.hash.slice(1);
    try { id = decodeURIComponent(id); } catch { /* Preserve malformed hashes as literal IDs. */ }
    const destination = document.getElementById(id);
    if (destination) settle(targets.filter(element => destination.contains(element) || element.closest('section') === destination.closest('section')));
  };
  const onAgenda = () => {
    if (!remainder?.open) {
      settling = true;
      events.filter(event => remainder?.contains(event)).forEach(event => active.get(event)?.finish(false));
      settling = false;
    } else if (calendarReady) startEvents();
  };
  const cleanup = () => {
    disposed = true; observer.disconnect();
    document.removeEventListener('visibilitychange', onVisibility); document.removeEventListener('focusin', onFocus);
    window.removeEventListener('resize', onResize); window.removeEventListener('hashchange', onHash);
    window.removeEventListener('scroll', onScroll);
    if (scrollFrame !== undefined) { window.cancelAnimationFrame(scrollFrame); scrollFrame = undefined; }
    remainder?.removeEventListener('toggle', onAgenda); remainder?.removeEventListener('tutorpal:agenda-change', onAgenda);
    Array.from(active.values()).forEach(item => item.finish(false)); targets.forEach(settleTarget);
  };
  try {
    targets.forEach(element => { if (!element.dataset.motionDone) element.dataset.motionPhase = 'pending'; });
    document.addEventListener('visibilitychange', onVisibility); document.addEventListener('focusin', onFocus);
    window.addEventListener('resize', onResize, { passive: true }); window.addEventListener('hashchange', onHash);
    window.addEventListener('scroll', onScroll, { passive: true });
    remainder?.addEventListener('toggle', onAgenda); remainder?.addEventListener('tutorpal:agenda-change', onAgenda);
    generic.forEach(element => observer.observe(element)); if (calendar) observer.observe(calendar);
    events.forEach(element => observer.observe(element));
    if (calendarReady) startEvents(); if (workspace?.dataset.motionDone === 'true') fillBars();
  } catch (error) { cleanup(); throw error; }
  return cleanup;
}

export function setupMotion(): () => void {
  const cleanups: Array<() => void> = [];
  const boot = window.tutorpalRevealBoot;
  let prepare = boot?.phase === 'preparing';
  if (prepare && (window.scrollY > 0 || location.hash || document.hidden)) { releaseReveals('initial-bypass'); prepare = false; }
  try {
    cleanups.push(setupHeroMotion(prepare)); cleanups.push(setupScrollMotion(prepare));
    if (prepare && !boot?.claim()) { cleanups.splice(0).forEach(cleanup => cleanup()); releaseReveals('late-entry'); cleanups.push(setupHeroMotion(false)); }
  } catch {
    cleanups.splice(0).forEach(cleanup => cleanup()); releaseReveals('setup-failure');
    try { cleanups.push(setupHeroMotion(false)); } catch { /* Static cards remain readable. */ }
  }
  try { cleanups.push(setupClosingMotion()); } catch { /* Decorative tiles stay static. */ }
  return () => {
    cleanups.forEach(cleanup => cleanup());
    document.querySelectorAll<HTMLElement>(revealTargets).forEach(settleTarget);
  };
}
