// Minimal controllable browser boundaries for lifecycle tests, not a renderer.
export class Element extends EventTarget {
  constructor(tag = 'DIV', rect = {top: 100, bottom: 200, height: 100, width: 300, left: 0}) {
    super(); this.tagName = tag; this.rect = rect; this.dataset = {}; this.open = false;
    this.classes = new Set(); this.children = new Map(); this.animations = [];
    this.classList = {add: name => this.classes.add(name), remove: name => this.classes.delete(name), contains: name => this.classes.has(name)};
    this.style = {setProperty(name, value) { this[name] = value; }, removeProperty(name) { delete this[name]; }};
  }
  getBoundingClientRect() { return this.rect; }
  getClientRects() { return this.rect.height === 0 || this.rendered === false ? [] : [this.rect]; }
  contains(element) { return this === element || this.descendants?.includes(element) || false; }
  querySelector(selector) { return this.children.get(selector) ?? null; }
  closest(selector) {
    if (selector === 'section') return this.section ?? null;
    if (selector === 'details:not([open])') return this.details && !this.details.open ? this.details : null;
    return this.intro ? this : null;
  }
  animate(frames, options) {
    if (this.failAnimation) throw new Error('Intentional animation API error');
    let resolve, reject; const element = this;
    const animation = {frames, options, cancelCount: 0,
      finished: new Promise((yes, no) => { resolve = yes; reject = no; }),
      complete() { resolve(); }, cancel() { this.cancelCount++; element.onAnimationCancel?.(); reject(new Error('Animation cancelled')); },
    };
    this.animations.push(animation); return animation;
  }
}
export function installBoundary({queries = new Map(), lists = new Map(), wide = true} = {}) {
  const keys = ['window', 'document', 'HTMLElement', 'IntersectionObserver', 'getComputedStyle', 'location', 'Element', 'requestAnimationFrame', 'cancelAnimationFrame'];
  const saved = new Map(keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const observers = [];
  const frames = new Map(); let nextFrame = 1;
  const requestAnimationFrame = callback => {const id = nextFrame++; frames.set(id, callback); return id;};
  const cancelAnimationFrame = id => frames.delete(id);
  const media = Object.assign(new EventTarget(), {matches: wide});
  const document = Object.assign(new EventTarget(), {hidden: false, querySelector: selector => queries.get(selector) ?? null, querySelectorAll: selector => lists.get(selector) ?? [...new Set(selector.split(',').flatMap(part => lists.get(part.trim()) ?? []))]});
  const window = Object.assign(new EventTarget(), {innerHeight: 900, scrollY: 0, IntersectionObserver: true, requestAnimationFrame, cancelAnimationFrame, matchMedia: () => media});
  class Observer {
    constructor(callback) { this.callback = callback; this.targets = []; this.disconnected = false; observers.push(this); }
    observe(target) { this.targets.push(target); }
    disconnect() { this.disconnected = true; }
    approach(...targets) { this.callback(targets.map(target => ({target, isIntersecting: true}))); }
    leave(...targets) { this.callback(targets.map(target => ({target, isIntersecting: false}))); }
  }
  for (const [key,value] of Object.entries({window, document, HTMLElement: Element, Element, requestAnimationFrame, cancelAnimationFrame, location: {hash: ''}, IntersectionObserver: Observer, getComputedStyle: element => ({opacity: element.opacity ?? '1'})}))
    Object.defineProperty(globalThis, key, {configurable: true, writable: true, value});
  return {window, document, media, observers, frames, flushFrame() {const batch = [...frames.entries()]; frames.clear(); for (const [,callback] of batch) callback(0);}, restore() {
    for (const key of keys) { const value = saved.get(key); if (value) Object.defineProperty(globalThis, key, value); else delete globalThis[key]; }
  }};
}
export const flush = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };
