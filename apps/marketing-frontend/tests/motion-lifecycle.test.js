import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { setupMotion } from '../src/scripts/motion.ts';

// CSS owns the entrance. These doubles only verify visibility-controlled floating.
const globals = ['document', 'window', 'HTMLElement', 'IntersectionObserver', 'location'];
const saved = new Map(globals.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
class Element extends EventTarget {
  constructor(rect = {top: 0, bottom: 900, height: 100}) {
    super(); this.rect = rect; this.dataset = {}; this.classes = new Set(); this.children = new Map();
    this.classList = {add: name => this.classes.add(name), remove: name => this.classes.delete(name), contains: name => this.classes.has(name)};
  }
  getBoundingClientRect() { return this.rect; }
  getClientRects() { return this.rendered === false ? [] : [this.rect]; }
  getAnimations() { return this.runningEntrance ? [{playState: 'running'}] : []; }
  querySelector(selector) { return this.children.get(selector) ?? null; }
}
let hero, cards, icons, documentMock, windowMock, observers;
beforeEach(() => {
  observers = [];
  hero = new Element({top: 0, bottom: 850, height: 850});
  cards = Array.from({length: 4}, () => new Element());
  icons = Array.from({length: 6}, () => new Element());
  for (const target of [...cards, ...icons]) target.runningEntrance = true;
  documentMock = Object.assign(new EventTarget(), {hidden: false,
    querySelector: selector => selector === '.hero' ? hero : null,
    querySelectorAll: selector => selector === '[data-hero-card]' ? cards : selector === '[data-hero-icon]' ? icons : []});
  windowMock = Object.assign(new EventTarget(), {innerHeight: 900, IntersectionObserver: true,
    requestAnimationFrame: () => 1, cancelAnimationFrame: () => {}, matchMedia: () => ({matches: true})});
  class Observer {
    constructor(callback) { this.callback = callback; this.disconnected = false; observers.push(this); }
    observe(target) { this.target = target; }
    disconnect() { this.disconnected = true; }
    change(visible) { this.callback([{target: this.target, isIntersecting: visible}]); }
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
const finish = (target, animationName) => {
  target.runningEntrance = false;
  const event = new Event('animationend');
  Object.defineProperties(event, {animationName: {value: animationName}, target: {value: target}});
  hero.dispatchEvent(event);
};

describe('CSS hero entrance and optional floating lifecycle', () => {
  test('animation completion enables floating for rendered cards and icons', () => {
    const cleanup = setupMotion();
    expect(observers[0].target).toBe(hero);
    expect(hero.dataset.motionRunning).toBe('true');
    for (const card of cards) { finish(card, 'hero-spread'); expect(card.classList.contains('hero-motion-ready')).toBe(true); }
    for (const icon of icons) { finish(icon, 'hero-icon-reveal'); expect(icon.classList.contains('hero-icon-ready')).toBe(true); }
    cleanup();
  });

  test('offscreen and hidden states pause floating without restarting entrance', () => {
    const cleanup = setupMotion();
    finish(cards[0], 'hero-spread'); observers[0].change(false);
    expect(hero.dataset.motionRunning).toBe('false');
    observers[0].change(true); expect(hero.dataset.motionRunning).toBe('true');
    documentMock.hidden = true; documentMock.dispatchEvent(new Event('visibilitychange'));
    expect(hero.dataset.motionRunning).toBe('false');
    documentMock.hidden = false; documentMock.dispatchEvent(new Event('visibilitychange'));
    expect(hero.dataset.motionRunning).toBe('true');
    expect(cards[0].classList.contains('hero-motion-ready')).toBe(true);
    cleanup();
  });

  test('resize recognizes entrances already finished and cleanup removes enhancement state', () => {
    const cleanup = setupMotion();
    cards[0].runningEntrance = false; icons[0].runningEntrance = false;
    windowMock.dispatchEvent(new Event('resize'));
    expect(cards[0].classList.contains('hero-motion-ready')).toBe(true);
    expect(icons[0].classList.contains('hero-icon-ready')).toBe(true);
    expect(cards[1].classList.contains('hero-motion-ready')).toBe(false);
    cleanup();
    expect(observers[0].disconnected).toBe(true);
    expect(hero.dataset.motionRunning).toBeUndefined();
    expect(cards[0].classList.contains('hero-motion-ready')).toBe(false);
    windowMock.dispatchEvent(new Event('resize'));
    expect(cards[0].classList.contains('hero-motion-ready')).toBe(false);
  });

  test('a target hidden from startup can animate on first display, while an interrupted entrance cannot replay', () => {
    cards[0].rendered = false;
    const cleanup = setupMotion();
    expect(cards[0].dataset.heroDone).toBeUndefined();
    windowMock.dispatchEvent(new Event('resize'));
    expect(cards[0].dataset.heroDone).toBeUndefined();
    cards[0].rendered = true;
    windowMock.dispatchEvent(new Event('resize'));
    expect(cards[0].dataset.heroDone).toBeUndefined();
    finish(cards[0], 'hero-spread');
    expect(cards[0].dataset.heroDone).toBe('true');

    icons[0].rendered = false;
    icons[0].runningEntrance = false;
    windowMock.dispatchEvent(new Event('resize'));
    expect(icons[0].dataset.heroDone).toBe('true');
    icons[0].rendered = true;
    icons[0].runningEntrance = true;
    windowMock.dispatchEvent(new Event('resize'));
    expect(icons[0].dataset.heroDone).toBe('true');
    cleanup();
  });

  test('cancelled entrance settles only a target previously rendered', () => {
    cards[0].rendered = false;
    const cleanup = setupMotion();
    const cancel = target => {
      const event = new Event('animationcancel');
      Object.defineProperties(event, {animationName: {value: 'hero-spread'}, target: {value: target}});
      hero.dispatchEvent(event);
    };
    cancel(cards[0]); expect(cards[0].dataset.heroDone).toBeUndefined();
    cancel(cards[1]); expect(cards[1].dataset.heroDone).toBe('true');
    cleanup();
  });

  test('unsupported observer leaves CSS entrance alone', () => {
    delete windowMock.IntersectionObserver;
    const cleanup = setupMotion(); cleanup();
    expect(observers).toHaveLength(0);
    for (const target of [...cards, ...icons]) expect(target.classes.size).toBe(0);
  });
});
