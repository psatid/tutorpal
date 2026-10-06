import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { createBoot } from './support/dom-boundary.js';
import { setupMotion } from '../src/scripts/motion.ts';

// Dependency-free DOM boundary doubles. Browser fixtures verify actual CSS,
// geometry, preference changes, focus, and BFCache behavior separately.
const globals = ['document', 'window', 'HTMLElement', 'IntersectionObserver', 'location'];
const saved = new Map(globals.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
class Element extends EventTarget {
  constructor(rect) {
    super(); this.rect = rect; this.dataset = {}; this.classes = new Set(); this.properties = new Map();
    this.classList = {add: name => this.classes.add(name), remove: name => this.classes.delete(name), contains: name => this.classes.has(name)};
    this.style = {setProperty: (name, value) => this.properties.set(name, value)};
    this.children = new Map();
  }
  getBoundingClientRect() { return this.rect; }
  querySelector(selector) { return this.children.get(selector) ?? null; }
}
let hero, scene, cards, documentMock, windowMock, observer;
beforeEach(() => {
  observer = undefined;
  hero = new Element({top: 0, bottom: 850});
  scene = new Element({left: 50, top: 174, width: 1240});
  hero.children.set('.actions', new Element({bottom: 470}));
  cards = [
    new Element({left: 64, top: 500, width: 300, height: 250}),
    new Element({left: 511, top: 641, width: 318, height: 132}),
    new Element({left: 960, top: 569, width: 330, height: 98}),
  ];
  documentMock = Object.assign(new EventTarget(), {hidden: false,
    querySelector: selector => selector === '.hero' ? hero : selector === '.hero-product' ? scene : null,
    querySelectorAll: selector => selector.includes('[data-hero-card]') ? cards : []});
  windowMock = Object.assign(new EventTarget(), {innerHeight: 900, scrollY: 0, IntersectionObserver: true, requestAnimationFrame: () => 1, cancelAnimationFrame: () => {}, matchMedia: () => ({matches: true}), tutorpalRevealBoot: createBoot()});
  class Observer {
    constructor(callback) { this.callback = callback; this.disconnected = false; observer ??= this; }
    observe(target) { this.target = target; }
    disconnect() { this.disconnected = true; }
    change(visible) { this.callback([{isIntersecting: visible}]); }
  }
  for (const [key, value] of Object.entries({location: {hash: ''}, document: documentMock, window: windowMock, HTMLElement: Element, IntersectionObserver: Observer}))
    Object.defineProperty(globalThis, key, {configurable: true, writable: true, value});
});
afterEach(() => {
  for (const key of globals) {
    const descriptor = saved.get(key);
    if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
  }
});
const finish = card => {
  const event = new Event('animationend');
  Object.defineProperties(event, {animationName: {value: 'hero-spread'}, target: {value: card}});
  hero.dispatchEvent(event);
};
const expectFinalCards = () => {
  for (const card of cards) { expect(card.classList.contains('hero-motion-enter')).toBe(false); expect(card.dataset.motionDone).toBe('true'); expect(card.dataset.motionPhase).toBe('settled'); }
};

describe('optional hero motion lifecycle', () => {
  test('spreads all three cards from a shared origin below the CTA, then floats after entrance', () => {
    const cleanup = setupMotion();
    expect(observer.target).toBe(hero);
    expect(hero.dataset.motionRunning).toBe('true');
    const origins = cards.map(card => ({
      x: card.rect.left + card.rect.width / 2 + parseFloat(card.properties.get('--from-x')),
      y: card.rect.top + card.rect.height / 2 + parseFloat(card.properties.get('--from-y')),
    }));
    expect(origins).toEqual(Array(3).fill({x: 670, y: 619}));
    expect(Math.min(...cards.map(card => 619 - card.rect.height / 2))).toBeGreaterThan(470);
    expect(cards.map(card => card.properties.get('--enter-delay'))).toEqual(['0ms', '80ms', '160ms']);
    for (const card of cards) { expect(card.classList.contains('hero-motion-enter')).toBe(true); finish(card); expect(card.classList.contains('hero-motion-ready')).toBe(true); }
    expectFinalCards(); cleanup();
  });

  test('offscreen interruption restores fully settled cards and resumes without replay', () => {
    const cleanup = setupMotion(); observer.change(false);
    expect(hero.dataset.motionRunning).toBe('false'); expectFinalCards();
    observer.change(true);
    expect(hero.dataset.motionRunning).toBe('true'); expectFinalCards(); cleanup();
  });

  test('hidden document settles entrance and pauses, returning visibility resumes float state', () => {
    const cleanup = setupMotion();
    documentMock.hidden = true; documentMock.dispatchEvent(new Event('visibilitychange'));
    expect(hero.dataset.motionRunning).toBe('false'); expectFinalCards();
    documentMock.hidden = false; documentMock.dispatchEvent(new Event('visibilitychange'));
    expect(hero.dataset.motionRunning).toBe('true'); expectFinalCards(); cleanup();
  });

  test('resize settles unfinished cards; disposal removes active state and event effects', () => {
    const cleanup = setupMotion(); expect(windowMock.tutorpalRevealBoot.phase).toBe('claimed');
    for (const card of cards) expect(card.dataset.motionPhase).toBe('revealing');
    windowMock.dispatchEvent(new Event('resize')); expectFinalCards(); expect(windowMock.tutorpalRevealBoot.phase).toBe('claimed');
    cleanup();
    expect(observer.disconnected).toBe(true); expect(hero.dataset.motionRunning).toBeUndefined();
    for (const card of cards) expect(card.classList.contains('hero-motion-ready')).toBe(false);
    documentMock.dispatchEvent(new Event('visibilitychange'));
    windowMock.dispatchEvent(new Event('resize'));
    expect(hero.dataset.motionRunning).toBeUndefined();
  });

  test('already completed, initially hidden, or scrolled cards never replay an entrance', () => {
    cards[0].dataset.motionDone = 'true';
    let cleanup = setupMotion();
    expect(cards[0].classList.contains('hero-motion-enter')).toBe(false); cleanup();
    for (const card of cards) delete card.dataset.motionDone;
    documentMock.hidden = true; cleanup = setupMotion(); expectFinalCards(); cleanup();
    for (const card of cards) delete card.dataset.motionDone;
    documentMock.hidden = false; windowMock.scrollY = 101;
    cleanup = setupMotion(); expectFinalCards(); cleanup();
  });

  test('unsupported observers leave content untouched; setup failure releases partial effects', () => {
    delete windowMock.IntersectionObserver; delete windowMock.tutorpalRevealBoot;
    const cleanup = setupMotion(); cleanup();
    expect(observer).toBeUndefined();
    for (const card of cards) expect(card.classes.size).toBe(0);
    windowMock.IntersectionObserver = true; windowMock.tutorpalRevealBoot = createBoot();
    cards.forEach(card => {delete card.dataset.motionDone;});
    cards[1].style.setProperty = () => { throw new Error('Intentional setup failure'); };
    setupMotion();
    expectFinalCards();
    for (const card of cards) expect(card.classList.contains('hero-motion-enter')).toBe(false);
    expect(windowMock.tutorpalRevealBoot.phase).toBe('expired');
  });
});
