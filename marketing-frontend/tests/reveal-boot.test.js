import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { Element } from './support/dom-boundary.js';

// Execute the actual emitted guard with controlled clock/event boundaries.
// These doubles verify ownership/deadline semantics, not browser paint or CSS.
const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
const guard = html.match(/<script>([\s\S]*?tutorpalRevealBoot[\s\S]*?)<\/script>/)[1];
function boot({reduced = false, hash = '', scroll = 0, restored = false, hidden = false, observer = true, animate = true, raf = true, cancelFrame = true, failListen = false} = {}) {
  let now = 1000; const timers = new Map();
  const root = new Element(); const targets = [new Element(), new Element(), new Element('SPAN')];
  targets.forEach(target => {target.classes.add('hero-motion-enter'); target.cancelled=0; target.getAnimations=() => [{cancel() {target.cancelled++;}}];});
  const media = Object.assign(new EventTarget(), {matches: reduced});
  const document = Object.assign(new EventTarget(), {documentElement: root, hidden, querySelectorAll: () => targets});
  const window = Object.assign(new EventTarget(), {scrollY: scroll, matchMedia: () => media});
  if (observer) window.IntersectionObserver = true;
  if (raf) window.requestAnimationFrame = () => 1;
  if (cancelFrame) window.cancelAnimationFrame = () => {};
  const prototype = animate ? {animate() {}} : {};
  const location = {hash};
  if (failListen) document.addEventListener = () => { throw new Error('Partial listener registration'); };
  runInNewContext(guard, {document, window, location, HTMLElement: {prototype}, Date: {now: () => now}, performance: {getEntriesByType: () => [{type: restored ? 'back_forward' : 'navigate'}]},
    setTimeout: (fn, delay) => {timers.set(1,{fn,delay,at:now+delay}); return 1;}, clearTimeout: id => timers.delete(id)});
  return {root, targets, media, document, window, state: window.tutorpalRevealBoot,
    advance(ms) {now += ms; for (const [id,item] of [...timers]) if (now >= item.at) {timers.delete(id); item.fn();}},
    setNow(value) {now=value;}, timers};
}
const settled = env => {expect(env.root.classes.has('reveal-preparing')).toBe(false); for (const target of env.targets) {expect(target.dataset).toMatchObject({motionDone:'true',motionPhase:'settled'}); expect(target.classes.has('hero-motion-enter')).toBe(false); expect(target.cancelled).toBeGreaterThan(0);}};
describe('before-paint reveal guard ownership', () => {
  test('prepares once and unclaimed two-second deadline permanently releases every target', () => {
    const env = boot(); expect(env.state.phase).toBe('preparing'); expect(env.state.deadline).toBe(3000); expect(env.root.classes.has('reveal-preparing')).toBe(true);
    env.advance(2000); expect(env.state.phase).toBe('expired'); expect(env.state.reason).toBe('deadline'); settled(env);
    expect(env.state.claim()).toBe(false); settled(env);
  });
  test('ordinary startup viewport resize retains preparation and permits an on-time claim', () => {
    const env = boot(); const deadline = env.state.deadline;
    // A fresh dev page can receive viewport resize while CSS/app modules load.
    // It carries no user interaction and must not consume every reveal.
    env.window.innerHeight = 860; env.window.dispatchEvent(new Event('resize'));
    env.window.innerHeight = 900; env.window.dispatchEvent(new Event('resize'));
    expect(env.state.phase).toBe('preparing');
    expect(env.root.classes.has('reveal-preparing')).toBe(true);
    expect(env.state.reason).toBe(''); expect(env.state.deadline).toBe(deadline); expect(env.timers.size).toBe(1);
    for (const target of env.targets) expect(target.dataset.motionDone).toBeUndefined();
    env.setNow(1500); expect(env.state.claim()).toBe(true); expect(env.state.phase).toBe('claimed'); expect(env.timers.size).toBe(0);
  });
  test('startup resize neither extends the watchdog nor re-arms expired preparation', () => {
    const env = boot(); env.setNow(2999); env.window.dispatchEvent(new Event('resize'));
    expect(env.state.phase).toBe('preparing'); expect(env.state.deadline).toBe(3000);
    env.advance(1); expect(env.state.reason).toBe('deadline'); settled(env);
    env.window.dispatchEvent(new Event('resize')); expect(env.state.phase).toBe('expired'); expect(env.state.claim()).toBe(false); settled(env);
  });
  test('claim before deadline clears timer/listeners; claim exactly at boundary fails', () => {
    const env = boot(); env.setNow(2999); expect(env.state.claim()).toBe(true); expect(env.state.phase).toBe('claimed'); expect(env.timers.size).toBe(0);
    env.document.dispatchEvent(new Event('keydown')); env.window.dispatchEvent(new Event('resize')); expect(env.state.phase).toBe('claimed');
    const late = boot(); late.setNow(3000); expect(late.state.claim()).toBe(false); settled(late);
  });
  test('hash, restored navigation, hidden, reduced and unsupported APIs bypass preparation', () => {
    for (const options of [{hash:'#workspace'},{restored:true},{hidden:true},{reduced:true},{observer:false},{animate:false},{raf:false},{cancelFrame:false},{failListen:true}]) {
      const env = boot(options); expect(env.state.phase).toBe('expired'); expect(env.timers.size).toBe(0); settled(env);
    }
  });
  test('early click, focus, hash, pagehide and preference changes release permanently', () => {
    for (const event of ['click','focusin','visibilitychange','hashchange','pagehide','change']) {
      const env = boot(); let target=env.document;
      if (event==='visibilitychange') env.document.hidden=true;
      if (['hashchange','pagehide'].includes(event)) target=env.window;
      if (event==='change') {target=env.media; env.media.matches=true;}
      const dispatched=new Event(event);
      if (event==='focusin') Object.defineProperty(dispatched,'target',{value:new Element('BUTTON')});
      target.dispatchEvent(dispatched); expect(env.state.phase).toBe('expired'); settled(env); expect(env.state.claim()).toBe(false);
    }
  });
});
