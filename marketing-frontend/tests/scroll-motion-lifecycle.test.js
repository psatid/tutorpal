import { beforeEach, afterEach, describe, expect, test } from 'bun:test';
import { setupMotion } from '../src/scripts/motion.ts';
import { Element, installBoundary, flush } from './support/dom-boundary.js';
let env, calendar, events, workspace, bars, title, body, clean;
beforeEach(() => {
  calendar = new Element(); events = Array.from({length: 12}, () => new Element('LI'));
  workspace = new Element(); bars = Array.from({length: 4}, () => new Element('SPAN'));
  title = new Element('H2'); body = new Element('P'); body.intro = true;
  for (const target of [calendar,workspace,title,body,...events,...bars]) target.rect={top:1200,bottom:1300,height:100,width:300,left:0};
  env = installBoundary({queries: new Map([['[data-calendar-frame]', calendar], ['.workspace-frame', workspace]]),
    lists: new Map([['[data-calendar-frame]', [calendar]], ['[data-reveal]', [title, body, workspace]], ['[data-calendar-event]', events], ['[data-balance-fill]', bars]])});
});
afterEach(async () => { clean?.(); clean = undefined; await flush(); env.restore(); });
const start = () => {
  clean = setupMotion();
  for (const target of [calendar,workspace,title,body,...events,...bars]) {
    if (target.rect.top === 1200) target.rect={top:100,bottom:200,height:100,width:300,left:0};
  }
  return env.observers[0];
};
const final = element => { expect(element.dataset.motionDone).toBe('true'); expect(element.dataset.motionPhase).toBe('settled'); };

describe('section motion sequencing and cancellation', () => {
  test('heading/body reveal on approach; calendar frame completes before visible desktop events cascade', async () => {
    const observer = start(); expect(title.animations).toHaveLength(0);
    observer.approach(title, body, calendar);
    expect(title.animations[0].options.duration).toBe(850); expect(body.animations[0].options.delay).toBe(100);
    expect(title.animations[0].frames[0]).toEqual({transform: 'translateY(24px)', opacity: 0, filter: 'blur(6px)'});
    expect(calendar.animations[0].options.duration).toBe(700); expect(events.every(event => !event.animations.length)).toBe(true);
    calendar.animations[0].complete(); await flush(); final(calendar);
    expect(events.map(event => event.animations[0].options.delay)).toEqual(Array.from({length: 12}, (_,i) => Math.min(i * 90, 450)));
    for (const event of events) expect(event.animations[0].options.duration).toBe(800);
    events.forEach(event => event.animations[0].complete()); await flush();
    observer.approach(calendar, ...events); expect(calendar.animations).toHaveLength(1);
    for (const event of events) { final(event); expect(event.animations).toHaveLength(1); }
  });
  test('compact calendar waits for frame settlement and reveals only approaching items', async () => {
    env.media.matches = false; events.forEach(event => { event.rect = {top: 1500, bottom: 1600, height: 100}; });
    const observer = start(); observer.approach(events[0]); expect(events[0].animations).toHaveLength(0);
    observer.approach(calendar); calendar.animations[0].complete(); await flush();
    expect(events.every(event => !event.animations.length)).toBe(true);
    events[2].rect = {top: 150, bottom: 250, height: 100};
    observer.approach(events[2]); expect(events[2].animations[0].options).toMatchObject({duration: 800, delay: 0});
    expect(events.filter(event => event.animations.length)).toHaveLength(1);
  });
  test('workspace settles before decorative bars fill; repeated approach cannot replay balances', async () => {
    const observer = start(); observer.approach(workspace); expect(bars.every(bar => !bar.animations.length)).toBe(true);
    workspace.animations[0].complete(); await flush();
    expect(bars.map(bar => bar.animations[0].options.delay)).toEqual([0,80,160,240]);
    for (const bar of bars) { expect(bar.animations[0].options.duration).toBe(750); expect(bar.animations[0].frames).toEqual([{transform:'scaleX(0)'},{transform:'scaleX(1)'}]); bar.animations[0].complete(); }
    await flush(); observer.approach(workspace);
    for (const bar of bars) { final(bar); expect(bar.animations).toHaveLength(1); }
  });
  test('resize or hidden interruption settles parents and queued descendants without launching nested motion', async () => {
    title.rect = body.rect = {top: 1500, bottom: 1600, height: 100};
    const observer = start(); observer.approach(calendar, workspace);
    env.window.dispatchEvent(new Event('resize')); await flush(); final(calendar); final(workspace);
    for (const child of [...events,...bars]) { final(child); expect(child.animations).toHaveLength(0); }
    observer.approach(title,body); env.document.hidden = true; env.document.dispatchEvent(new Event('visibilitychange')); await flush();
    final(title); final(body); observer.approach(title); expect(title.animations).toHaveLength(1);
  });
  test('leaving a parent settles its descendants; disposal and cancel rejection cannot start queued animations', async () => {
    const observer = start(); observer.approach(calendar,workspace);
    calendar.rect = workspace.rect = {top: 950, bottom: 1050, height: 100, width: 300, left: 0};
    observer.leave(calendar,workspace); await flush();
    for (const child of [...events,...bars]) { final(child); expect(child.animations).toHaveLength(0); }
    observer.approach(title); clean(); await flush(); expect(observer.disconnected).toBe(true); final(title);
    observer.approach(body); expect(body.animations).toHaveLength(0);
  });
  test('leaving the trigger band keeps a physically visible reveal in progress', async () => {
    const observer = start(); observer.approach(title);
    const animation = title.animations[0];
    title.rect = {top: 760, bottom: 860, height: 100, width: 300, left: 0};
    observer.leave(title);
    env.window.dispatchEvent(new Event('scroll')); env.flushFrame(); await flush();
    expect(animation.cancelCount).toBe(0);
    expect(title.dataset.motionPhase).toBe('revealing');
    animation.complete(); await flush(); final(title);
    observer.approach(title); expect(title.animations).toHaveLength(1);

    observer.approach(body);
    body.rect = {top: 760, bottom: 860, height: 100, width: 300, left: 0};
    observer.leave(body); expect(body.dataset.motionPhase).toBe('revealing');
    body.rect = {top: 950, bottom: 1050, height: 100, width: 300, left: 0};
    env.window.dispatchEvent(new Event('scroll')); env.flushFrame(); await flush();
    final(body); expect(body.animations[0].cancelCount).toBe(1);
  });
  test('cleanup of an active parent cannot start queued descendants', async () => {
    const observer = start(); observer.approach(calendar,workspace);
    const parentAnimations = [calendar.animations[0],workspace.animations[0]];
    clean(); await flush(); parentAnimations.forEach(animation => animation.complete()); await flush();
    for (const child of [...events,...bars]) expect(child.animations).toHaveLength(0);
    observer.approach(calendar,workspace); await flush();
    expect(calendar.animations).toHaveLength(1); expect(workspace.animations).toHaveLength(1);
  });
  test('external calendar and workspace cancellation releases every queued rendered child without starting animations', async () => {
    const observer = start(); observer.approach(calendar,workspace);
    for (const child of [...events,...bars]) expect(child.dataset.motionPhase).toBe('pending');
    calendar.animations[0].cancel(); workspace.animations[0].cancel(); await flush();
    final(calendar); final(workspace);
    // Settled phase releases opacity:0 and scaleX(0) preparation in shipped CSS;
    // parent completion alone cannot prove its descendants are readable.
    for (const child of [...events,...bars]) {final(child); expect(child.animations).toHaveLength(0);}
    observer.approach(calendar,workspace,...events); await flush();
    for (const child of [...events,...bars]) {final(child); expect(child.animations).toHaveLength(0);}
  });
  test('closing loops track visibility and hidden state, then remove all enhancement state', () => {
    clean = setupMotion(); clean();
    const closing = new Element('SECTION',{top:1500,bottom:2200});
    env.restore(); env = installBoundary({queries:new Map([['.closing',closing]])});
    clean = setupMotion(); const observer = env.observers.find(item => item.targets.includes(closing));
    expect(closing.dataset.motionReady).toBe('true'); expect(closing.dataset.motionRunning).toBe('false');
    observer.approach(closing); expect(closing.dataset.motionRunning).toBe('true');
    env.document.hidden = true; env.document.dispatchEvent(new Event('visibilitychange')); expect(closing.dataset.motionRunning).toBe('false');
    env.document.hidden = false; env.document.dispatchEvent(new Event('visibilitychange')); expect(closing.dataset.motionRunning).toBe('true');
    clean(); expect(observer.disconnected).toBe(true); expect(closing.dataset.motionReady).toBeUndefined(); expect(closing.dataset.motionRunning).toBeUndefined();
  });
  test('missing WAAPI leaves section content static without installing a reveal observer', () => {
    const animate = Element.prototype.animate;
    try { delete Element.prototype.animate; clean = setupMotion(); expect(env.observers).toHaveLength(0); expect(title.animations).toHaveLength(0); }
    finally { Element.prototype.animate = animate; }
  });
  test('API failure and unsupported enhancement preserve static content and do not prepare hidden elements', async () => {
    calendar.failAnimation = true; const observer = start(); observer.approach(calendar); await flush(); final(calendar);
    expect(events.every(event => event.animations.length === 1)).toBe(true);
    clean(); delete env.window.IntersectionObserver;
    clean = setupMotion(); expect(env.observers).toHaveLength(1);
    expect(title.animations).toHaveLength(0); final(title);
  });
});

describe('offscreen preparation and unread-content safety', () => {
  test('startup prepares only rendered targets wholly below viewport; pending cleanup settles them', () => {
    const targets=[title,body,workspace,calendar,...events,...bars];
    title.rect={top:100,bottom:200,height:100};
    events[0].rect={top:0,bottom:0,height:0};
    start(); expect(env.observers[0].targets).toHaveLength(targets.length-2);
    final(title); expect(events[0].dataset.motionPhase).toBeUndefined();
    for (const target of targets.filter(element => element!==title && element!==events[0])) expect(target.dataset.motionPhase).toBe('pending');
    clean(); for (const target of targets) {final(target); expect(target.animations).toHaveLength(0);}
  });
  test('late entry leaves already visible and passed sections static while later sections remain eligible', () => {
    title.rect={top:100,bottom:200,height:100}; body.rect={top:-300,bottom:-200,height:100};
    const observer=start(); final(title); final(body);
    expect(calendar.dataset.motionPhase).toBe('pending');
    expect(title.animations).toHaveLength(0); expect(body.animations).toHaveLength(0);
    observer.approach(calendar); expect(calendar.animations).toHaveLength(1);
  });
  test('partial observer registration failure releases all prepared descendants', () => {
    const observe=IntersectionObserver.prototype.observe;
    IntersectionObserver.prototype.observe=function(target) {if(target===calendar) throw new Error('Partial registration failure'); observe.call(this,target);};
    try {clean=setupMotion(); expect(env.observers[0].disconnected).toBe(true);
      for(const target of [title,body,workspace,calendar,...events,...bars]) final(target);
    } finally {IntersectionObserver.prototype.observe=observe;}
  });
  test('hiding settles far-away pending and collapsed targets, with no subsequent replay', () => {
    title.rect={top:4000,bottom:4100,height:100}; events[0].rect={top:0,bottom:0,height:0};
    const observer=start(); env.document.hidden=true; env.document.dispatchEvent(new Event('visibilitychange'));
    for(const target of [title,body,workspace,calendar,...events,...bars]) final(target);
    env.document.hidden=false; observer.approach(title); expect(title.animations).toHaveLength(0);
  });
  test('resize keeps below-viewport sections pending and settles newly visible targets', () => {
    title.rect={top:1500,bottom:1600,height:100};
    const observer=start(); expect(title.dataset.motionPhase).toBe('pending');
    env.window.dispatchEvent(new Event('resize')); expect(title.dataset.motionPhase).toBe('pending');
    title.rect={top:400,bottom:500,height:100}; env.window.dispatchEvent(new Event('resize')); final(title);
    observer.approach(title); expect(title.animations).toHaveLength(0);
  });
});

test('focus and hash destinations settle their pending section without affecting other sections', () => {
  const section=new Element('SECTION'); section.descendants=[title,calendar,...events];
  for(const element of section.descendants) element.section=section;
  const observer=start(); const focus=new Event('focusin'); Object.defineProperty(focus,'target',{value:title}); env.document.dispatchEvent(focus);
  for(const element of section.descendants) final(element);
  expect(workspace.dataset.motionPhase).toBe('pending');
  const otherSection=new Element('SECTION'); otherSection.descendants=[workspace,...bars]; workspace.section=otherSection;
  env.document.getElementById=id => id==='workspace' ? otherSection : null; location.hash='#workspace'; env.window.dispatchEvent(new Event('hashchange'));
  for(const element of otherSection.descendants) final(element);
  observer.approach(calendar,workspace); expect(calendar.animations).toHaveLength(0); expect(workspace.animations).toHaveLength(0);
});


test('scroll sweep cancels passed active parents and settles their queued children without starting descendants', async () => {
  const observer=start(); observer.approach(calendar,workspace);
  for(const target of [calendar,workspace]) target.rect={top:-200,bottom:-100,height:100};
  env.window.dispatchEvent(new Event('scroll')); env.flushFrame(); await flush();
  final(calendar); final(workspace);
  for(const child of [...events,...bars]) {final(child); expect(child.animations).toHaveLength(0);}
  for(const parent of [calendar,workspace]) expect(parent.animations[0].cancelCount).toBeGreaterThan(0);
  observer.approach(calendar,workspace); expect(calendar.animations).toHaveLength(1); expect(workspace.animations).toHaveLength(1);
});

test('cleanup cancels coalesced scroll work and stale frame callbacks cannot affect disposed state', async () => {
  start(); env.window.dispatchEvent(new Event('scroll'));
  expect(env.frames.size).toBe(1); const stale=[...env.frames.values()][0];
  clean(); await flush(); expect(env.frames.size).toBe(0);
  // Deliberately invoke a callback already copied by a browser scheduling turn.
  // A detached sentinel proves it cannot perform another settlement sweep.
  delete title.dataset.motionDone; title.dataset.motionPhase='sentinel'; title.rect={top:-200,bottom:-100,height:100};
  stale(0); await flush(); expect(title.dataset.motionPhase).toBe('sentinel'); expect(title.dataset.motionDone).toBeUndefined(); expect(title.animations).toHaveLength(0);
  env.window.dispatchEvent(new Event('scroll')); expect(env.frames.size).toBe(0);
});

test('RAF availability lost after preparation releases the entire pending scene through static fallback', () => {
  delete env.window.requestAnimationFrame;
  clean=setupMotion();
  expect(env.observers).toHaveLength(0);
  for(const target of [title,body,calendar,workspace,...events,...bars]) {final(target); expect(target.animations).toHaveLength(0);}
});
