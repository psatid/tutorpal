import { releaseReveals, revealTargets, settleTarget } from './reveal-state';

const SCROLL_REVEAL_INSET_PX = 200;

/** CSS owns the finite entrances; JavaScript only controls later floating. */
function setupHeroMotion(): () => void {
  const hero = document.querySelector<HTMLElement>('.hero');
  const copy = document.querySelector<HTMLElement>('.hero-copy');
  const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-hero-card]'));
  const icons = Array.from(document.querySelectorAll<HTMLElement>('[data-hero-icon]'));
  if (!hero || !('IntersectionObserver' in window)) return () => {};
  const targets = [...cards, ...icons];
  const entrances = [...targets, ...(copy ? [copy] : [])];
  const seenRendered = new Set<HTMLElement>();
  let visible = false;
  const finishEntrance = (target: HTMLElement) => {
    target.dataset.heroDone = 'true';
    if (cards.includes(target)) target.classList.add('hero-motion-ready');
    else if (icons.includes(target)) target.classList.add('hero-icon-ready');
  };
  const update = () => {
    hero.dataset.motionRunning = String(visible && !document.hidden);
  };
  const onAnimationEnd = (event: AnimationEvent) => {
    if ((event.animationName === 'hero-spread' || event.animationName === 'hero-icon-reveal' || event.animationName === 'hero-copy-reveal') && event.target instanceof HTMLElement && entrances.includes(event.target)) finishEntrance(event.target);
  };
  const onAnimationCancel = (event: AnimationEvent) => {
    if ((event.animationName === 'hero-spread' || event.animationName === 'hero-icon-reveal' || event.animationName === 'hero-copy-reveal') && event.target instanceof HTMLElement && seenRendered.has(event.target)) finishEntrance(event.target);
  };
  const markFinished = () => {
    entrances.forEach(target => {
      if (!target.getClientRects().length) {
        if (seenRendered.has(target)) finishEntrance(target);
        return;
      }
      seenRendered.add(target);
      if (!target.getAnimations?.().some(animation => animation.playState === 'running')) finishEntrance(target);
    });
  };
  const observer = new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); update(); });
  const cleanup = () => {
    observer.disconnect(); document.removeEventListener('visibilitychange', update); window.removeEventListener('resize', markFinished);
    hero.removeEventListener('animationend', onAnimationEnd);
    hero.removeEventListener('animationcancel', onAnimationCancel);
    delete hero.dataset.motionRunning;
    entrances.forEach(target => { target.dataset.heroDone = 'true'; });
    targets.forEach(target => { target.classList.remove('hero-motion-ready', 'hero-icon-ready'); });
  };
  try {
    const rect = hero.getBoundingClientRect(); visible = rect.bottom > 0 && rect.top < window.innerHeight;
    hero.addEventListener('animationend', onAnimationEnd);
    hero.addEventListener('animationcancel', onAnimationCancel);
    document.addEventListener('visibilitychange', update);
    window.addEventListener('resize', markFinished, { passive: true });
    observer.observe(hero);
    markFinished();
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

/** LINE checks are decorative and only animate after the list is scrolled into view. */
function setupLineCheckMotion(): () => void {
  const checks = Array.from(document.querySelectorAll<SVGSVGElement>('[data-line-check]'));
  if (!checks.length) return () => {};
  if (!('IntersectionObserver' in window)) throw new Error('IntersectionObserver is unavailable');
  const list = checks[0].closest<HTMLElement>('.line-notes');
  if (!list) return () => {};
  let disposed = false;
  const settle = () => {
    if (disposed) return;
    disposed = true; observer.disconnect();
    document.removeEventListener('visibilitychange', onVisibility); document.removeEventListener('focusin', settle);
    window.removeEventListener('hashchange', settle);
    checks.forEach(check => check.classList.remove('line-check-draw'));
  };
  const play = () => {
    if (disposed) return;
    checks.forEach((check, index) => { check.style.setProperty('--check-delay', `${index * 90}ms`); check.classList.add('line-check-draw'); });
    observer.disconnect(); document.removeEventListener('visibilitychange', onVisibility); document.removeEventListener('focusin', settle);
    window.removeEventListener('hashchange', settle);
    disposed = true;
  };
  const onVisibility = () => { if (document.hidden) settle(); };
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) play();
  }, { rootMargin: `0px 0px -${SCROLL_REVEAL_INSET_PX}px 0px` });
  try {
    if (document.hidden || location.hash || document.activeElement !== document.body || list.getBoundingClientRect().top < window.innerHeight) { settle(); return () => {}; }
    observer.observe(list); document.addEventListener('visibilitychange', onVisibility); document.addEventListener('focusin', settle);
    window.addEventListener('hashchange', settle);
  } catch (error) { settle(); throw error; }
  return settle;
}

type ActiveReveal = { animation: Animation; finish: (runAfter?: boolean) => void };
function setupScrollMotion(): () => void {
  const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal],[data-calendar-frame],[data-calendar-event],[data-balance-fill]'));
  if (typeof window.requestAnimationFrame !== 'function' || typeof window.cancelAnimationFrame !== 'function') throw new Error('Scroll scheduling is unavailable');
  const active = new Map<HTMLElement, ActiveReveal>();
  const calendar = document.querySelector<HTMLElement>('[data-calendar-frame]');
  const events = Array.from(document.querySelectorAll<HTMLElement>('[data-calendar-event]'));
  const workspace = document.querySelector<HTMLElement>('.workspace-frame');
  const bars = Array.from(document.querySelectorAll<HTMLElement>('[data-balance-fill]'));
  let calendarReady = !calendar || calendar.dataset.motionDone === 'true';
  let disposed = false;
  let settling = false;
  let scrollFrame: number | undefined;
  const rendered = (element: HTMLElement) => {
    return element.getClientRects().length > 0 && element.getBoundingClientRect().height > 0;
  };
  const below = (element: HTMLElement) => rendered(element) && element.getBoundingClientRect().top >= window.innerHeight;
  const passed = (element: HTMLElement) => rendered(element) && element.getBoundingClientRect().bottom <= 0;
  const physicallyVisible = (element: HTMLElement) => {
    if (!rendered(element)) return false;
    const rect = element.getBoundingClientRect(); return rect.bottom > 0 && rect.top < window.innerHeight;
  };
  const inView = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect(); return rendered(element) && rect.bottom > 0 && rect.top < window.innerHeight - SCROLL_REVEAL_INSET_PX;
  };
  const settleQueued = (element: HTMLElement) => {
    if (element === calendar) {
      calendarReady = true;
      events.filter(rendered).forEach(event => { active.get(event)?.finish(false); settleTarget(event); });
    }
    if (element === workspace) bars.filter(rendered).forEach(bar => { active.get(bar)?.finish(false); settleTarget(bar); });
  };
  const revealEvents = (candidates: HTMLElement[]) => {
    const eligible = Array.from(new Set(candidates))
      .filter(event => events.includes(event) && inView(event) && event.dataset.motionPhase === 'pending' && !active.has(event))
      .sort((a, b) => {
        const first = a.getBoundingClientRect(); const second = b.getBoundingClientRect();
        return first.top - second.top || first.left - second.left;
      });
    eligible.forEach((event, index) => play(event, 800, Math.min(index * 90, 450)));
  };
  const play = (element: HTMLElement, duration: number, delay = 0, bar = false, after?: () => void) => {
    if (disposed || active.has(element) || !rendered(element)) return;
    if (element.dataset.motionPhase !== 'pending') { after?.(); return; }
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
  const fillBars = () => { bars.forEach((bar, index) => { if (inView(bar)) play(bar, 750, index * 80, true); }); };
  const startEvents = () => {
    if (disposed) return;
    calendarReady = true;
    events.filter(event => event.dataset.motionPhase === 'pending' && passed(event)).forEach(event => settleTarget(event));
    revealEvents(events);
  };
  const settle = (elements: HTMLElement[], all = false) => {
    settling = true;
    elements.forEach(element => {
      if (all || rendered(element)) {
        active.get(element)?.finish(); settleTarget(element);
        if (element === calendar) startEvents();
        if (element === workspace) bars.filter(bar => rendered(bar) && !below(bar)).forEach(settleTarget);
      }
    });
    settling = false;
  };
  const observer = new IntersectionObserver(entries => {
    if (disposed) return;
    const enteredEvents = entries
      .filter(entry => events.includes(entry.target as HTMLElement) && entry.isIntersecting)
      .map(entry => entry.target as HTMLElement);
    for (const entry of entries) {
      const element = entry.target as HTMLElement;
      if (!entry.isIntersecting) {
        if (!rendered(element)) continue;
        if (active.has(element)) {
          if (!physicallyVisible(element)) active.get(element)?.finish(false);
        }
        else if (element.dataset.motionPhase === 'pending' && passed(element)) {
          settleTarget(element); settleQueued(element);
        }
        continue;
      }
      if (element.dataset.motionPhase !== 'pending') continue;
      if (element === calendar) play(element, 700, 0, false, startEvents);
      else if (events.includes(element)) continue;
      else if (bars.includes(element)) { if (workspace?.dataset.motionDone === 'true') play(element, 750, bars.indexOf(element) * 80, true); }
      else {
        const delay = element.tagName === 'P' && element.closest('.section-intro,.line-copy,.closing-copy') ? 100 : 0;
        play(element, 850, delay, false, element === workspace ? fillBars : undefined);
      }
    }
    if (calendarReady) revealEvents(enteredEvents);
  }, { rootMargin: `0px 0px -${SCROLL_REVEAL_INSET_PX}px 0px` });
  const onVisibility = () => { if (document.hidden) settle(targets, true); };
  const onScroll = () => {
    if (disposed || scrollFrame !== undefined) return;
    scrollFrame = window.requestAnimationFrame(() => {
      scrollFrame = undefined;
      if (disposed) return;
      // IO may stay false as an active target moves from the trigger band offscreen.
      // This sweep only releases offscreen effects; it never starts an entrance.
      targets.filter(element => active.has(element) ? !physicallyVisible(element) : element.dataset.motionPhase === 'pending' && passed(element)).forEach(element => {
        active.get(element)?.finish(false); settleTarget(element); settleQueued(element);
      });
    });
  };
  const onResize = () => {
    settle(Array.from(active.keys()));
    settle(targets.filter(element => element.dataset.motionPhase === 'pending' && rendered(element) && !below(element)));
    prepareTargets();
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
  const cleanup = () => {
    disposed = true; observer.disconnect();
    document.removeEventListener('visibilitychange', onVisibility); document.removeEventListener('focusin', onFocus);
    window.removeEventListener('resize', onResize); window.removeEventListener('hashchange', onHash);
    window.removeEventListener('scroll', onScroll);
    if (scrollFrame !== undefined) { window.cancelAnimationFrame(scrollFrame); scrollFrame = undefined; }
    Array.from(active.values()).forEach(item => item.finish(false)); targets.forEach(settleTarget);
  };
  const prepareTargets = () => {
    targets.forEach(element => {
      if (element.dataset.motionDone === 'true' || element.dataset.motionPhase === 'pending' || !rendered(element)) return;
      if (below(element)) { element.dataset.motionPhase = 'pending'; observer.observe(element); }
      else settleTarget(element);
    });
  };
  try {
    prepareTargets();
    if (calendar?.dataset.motionDone === 'true') calendarReady = true;
    document.addEventListener('visibilitychange', onVisibility); document.addEventListener('focusin', onFocus);
    window.addEventListener('resize', onResize, { passive: true }); window.addEventListener('hashchange', onHash);
    window.addEventListener('scroll', onScroll, { passive: true });
    if (calendarReady) startEvents(); if (workspace?.dataset.motionDone === 'true') fillBars();
  } catch (error) { cleanup(); throw error; }
  return cleanup;
}

export function setupMotion(): () => void {
  const cleanups: Array<() => void> = [];
  const canReveal = 'IntersectionObserver' in window && typeof HTMLElement.prototype.animate === 'function' && !document.hidden && !location.hash;
  try {
    cleanups.push(setupHeroMotion());
    if (canReveal) { cleanups.push(setupScrollMotion()); cleanups.push(setupLineCheckMotion()); }
    else releaseReveals();
  } catch {
    cleanups.splice(0).forEach(cleanup => cleanup()); releaseReveals();
  }
  try { cleanups.push(setupClosingMotion()); } catch { /* Decorative tiles stay static. */ }
  return () => {
    cleanups.forEach(cleanup => cleanup());
    document.querySelectorAll<HTMLElement>(revealTargets).forEach(settleTarget);
  };
}
