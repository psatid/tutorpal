import { beforeEach, afterEach, describe, expect, test } from 'bun:test';
import { setupMotion } from '../src/scripts/motion.ts';
import { Element, installBoundary, flush } from './support/dom-boundary.js';
let env, calendar, events, workspace, bars, title, body, clean;
beforeEach(() => {
  calendar = new Element(); events = Array.from({length: 12}, () => new Element('LI'));
  workspace = new Element(); bars = Array.from({length: 4}, () => new Element('SPAN'));
  title = new Element('H2'); body = new Element('P'); body.intro = true;
  env = installBoundary({preparing: true, queries: new Map([['[data-calendar-frame]', calendar], ['.workspace-frame', workspace]]),
    lists: new Map([['[data-calendar-frame]', [calendar]], ['[data-reveal]', [title, body, workspace]], ['[data-calendar-event]', events], ['[data-balance-fill]', bars]])});
});
afterEach(async () => { clean?.(); clean = undefined; await flush(); env.restore(); });
const start = () => { clean = setupMotion(); return env.observers[0]; };
const final = element => { expect(element.dataset.motionDone).toBe('true'); expect(element.dataset.motionPhase).toBe('settled'); };

describe('section motion sequencing and cancellation', () => {
  test('heading/body reveal on approach; calendar frame completes before twelve staggered desktop events', async () => {
    const observer = start(); expect(title.animations).toHaveLength(0);
    observer.approach(title, body, calendar);
    expect(title.animations[0].options.duration).toBe(850); expect(body.animations[0].options.delay).toBe(100);
    expect(title.animations[0].frames[0]).toEqual({transform: 'translateY(24px)', opacity: 0, filter: 'blur(6px)'});
    expect(calendar.animations[0].options.duration).toBe(700); expect(events.every(event => !event.animations.length)).toBe(true);
    calendar.animations[0].complete(); await flush(); final(calendar);
    expect(events.map(event => event.animations[0].options.delay)).toEqual(Array.from({length: 12}, (_,i) => i * 80));
    for (const event of events) expect(event.animations[0].options.duration).toBe(800);
    events.forEach(event => event.animations[0].complete()); await flush();
    observer.approach(calendar, ...events); expect(calendar.animations).toHaveLength(1);
    for (const event of events) { final(event); expect(event.animations).toHaveLength(1); }
  });
  test('compact agenda waits for frame settlement and reveals only approaching items without stagger', async () => {
    env.media.matches = false; events.forEach(event => { event.rect = {top: 1500, bottom: 1600, height: 100}; });
    const observer = start(); observer.approach(events[0]); expect(events[0].animations).toHaveLength(0);
    observer.approach(calendar); calendar.animations[0].complete(); await flush();
    expect(events.every(event => !event.animations.length)).toBe(true);
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
    const observer = start(); observer.approach(calendar,workspace); observer.leave(calendar,workspace); await flush();
    for (const child of [...events,...bars]) { final(child); expect(child.animations).toHaveLength(0); }
    observer.approach(title); clean(); await flush(); expect(observer.disconnected).toBe(true); final(title);
    observer.approach(body); expect(body.animations).toHaveLength(0);
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
    clean = setupMotion(); const observer = env.observers[0];
    expect(closing.dataset.motionReady).toBe('true'); expect(closing.dataset.motionRunning).toBe('false');
    observer.approach(closing); expect(closing.dataset.motionRunning).toBe('true');
    env.document.hidden = true; env.document.dispatchEvent(new Event('visibilitychange')); expect(closing.dataset.motionRunning).toBe('false');
    env.document.hidden = false; env.document.dispatchEvent(new Event('visibilitychange')); expect(closing.dataset.motionRunning).toBe('true');
    clean(); expect(observer.disconnected).toBe(true); expect(closing.dataset.motionReady).toBeUndefined(); expect(closing.dataset.motionRunning).toBeUndefined();
  });
  test('missing WAAPI leaves section content static without installing a reveal observer', () => {
    const animate = Element.prototype.animate;
    try { delete Element.prototype.animate; delete env.window.tutorpalRevealBoot; clean = setupMotion(); expect(env.observers).toHaveLength(0); expect(title.animations).toHaveLength(0); }
    finally { Element.prototype.animate = animate; }
  });
  test('API failure and unsupported enhancement preserve static content and do not prepare hidden elements', async () => {
    calendar.failAnimation = true; const observer = start(); observer.approach(calendar); await flush(); final(calendar);
    expect(events.every(event => event.animations.length === 1)).toBe(true);
    clean(); delete env.window.IntersectionObserver; delete env.window.tutorpalRevealBoot;
    clean = setupMotion(); expect(env.observers).toHaveLength(1);
    expect(title.animations).toHaveLength(0); final(title);
  });
});

describe('prepared reveal ownership and unread-content safety', () => {
  test('registration prepares all targets before claim; pending cleanup settles every target', () => {
    const targets=[title,body,workspace,calendar,...events,...bars];
    env.window.tutorpalRevealBoot.claim=function() {
      expect(env.observers[0].targets).toHaveLength(16);
      for (const target of targets) expect(target.dataset.motionPhase).toBe('pending');
      this.phase='claimed'; return true;
    };
    start(); expect(env.window.tutorpalRevealBoot.phase).toBe('claimed');
    clean(); for (const target of targets) {final(target); expect(target.animations).toHaveLength(0);}
  });
  test('missing or expired boot never re-hides already readable section content', () => {
    for (const boot of [undefined,{phase:'expired'}]) {
      env.window.tutorpalRevealBoot=boot; clean=setupMotion(); expect(env.observers).toHaveLength(0);
      for (const target of [title,body,workspace,calendar,...events,...bars]) {final(target); expect(target.animations).toHaveLength(0);}
      clean();
    }
  });
  test('deadline claim race releases pending targets and removes reveal observer', () => {
    env.window.tutorpalRevealBoot.claim=() => false; clean=setupMotion();
    expect(env.window.tutorpalRevealBoot.phase).toBe('expired'); expect(env.observers[0].disconnected).toBe(true);
    for (const target of [title,body,workspace,calendar,...events,...bars]) final(target);
    env.observers[0].approach(title,calendar,workspace); expect(title.animations).toHaveLength(0);
  });
  test('partial observer registration failure releases all prepared descendants', () => {
    const observe=IntersectionObserver.prototype.observe;
    IntersectionObserver.prototype.observe=function(target) {if(target===calendar) throw new Error('Partial registration failure'); observe.call(this,target);};
    try {clean=setupMotion(); expect(env.window.tutorpalRevealBoot.reason).toBe('setup-failure'); expect(env.observers[0].disconnected).toBe(true);
      for(const target of [title,body,workspace,calendar,...events,...bars]) final(target);
    } finally {IntersectionObserver.prototype.observe=observe;}
  });
  test('zero-size items in closed remainder remain pending and reveal after native expansion', async () => {
    env.media.matches=false; const remainder=new Element('DETAILS'); remainder.open=false;
    remainder.descendants=events.slice(6); const query=env.document.querySelector;
    env.document.querySelector=selector => selector==='[data-agenda-remainder]' ? remainder : query(selector);
    events.slice(6).forEach(event => event.rect={top:0,bottom:0,height:0});
    const observer=start(); observer.leave(...events.slice(6));
    observer.approach(calendar); calendar.animations[0].complete(); await flush();
    for(const event of events.slice(6)) {expect(event.dataset.motionPhase).toBe('pending'); expect(event.dataset.motionDone).toBeUndefined();}
    remainder.open=true; events.slice(6).forEach(event => event.rect={top:100,bottom:200,height:100}); remainder.dispatchEvent(new Event('toggle'));
    for(const event of events.slice(6)) expect(event.animations).toHaveLength(1);
    remainder.open=false; remainder.dispatchEvent(new Event('toggle')); await flush();
    for(const event of events.slice(6)) final(event);
  });
  test('hiding settles far-away pending and collapsed targets, with no subsequent replay', () => {
    title.rect={top:4000,bottom:4100,height:100}; events[0].rect={top:0,bottom:0,height:0};
    const observer=start(); env.document.hidden=true; env.document.dispatchEvent(new Event('visibilitychange'));
    for(const target of [title,body,workspace,calendar,...events,...bars]) final(target);
    env.document.hidden=false; observer.approach(title); expect(title.animations).toHaveLength(0);
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

test('closed native details with positive child geometry cannot consume unseen lesson reveals', async () => {
  env.media.matches=false; const remainder=new Element('DETAILS'); remainder.open=false;
  remainder.descendants=events.slice(6); const query=env.document.querySelector;
  env.document.querySelector=selector => selector==='[data-agenda-remainder]' ? remainder : query(selector);
  // Chromium may expose positive rects inside closed details. Ancestor state,
  // rather than zero geometry alone, determines whether these are visible.
  events.slice(6).forEach(event => {event.details=remainder; event.rect={top:-200,bottom:-100,height:100};});
  const observer=start(); observer.leave(...events.slice(6));
  observer.approach(calendar); calendar.animations[0].complete(); await flush();
  for(const event of events.slice(6)) {expect(event.dataset.motionPhase).toBe('pending'); expect(event.dataset.motionDone).toBeUndefined(); expect(event.animations).toHaveLength(0);}
  remainder.open=true; events.slice(6).forEach(event => event.rect={top:100,bottom:200,height:100}); remainder.dispatchEvent(new Event('toggle'));
  for(const event of events.slice(6)) expect(event.animations).toHaveLength(1);
});


test('cancelled calendar releases exposed lessons while closed remainder stays eligible for later expansion', async () => {
  env.media.matches=false; const remainder=new Element('DETAILS'); remainder.open=false;
  remainder.descendants=events.slice(6); const query=env.document.querySelector;
  env.document.querySelector=selector => selector==='[data-agenda-remainder]' ? remainder : query(selector);
  events.slice(6).forEach(event => {event.details=remainder; event.rect={top:-200,bottom:-100,height:100};});
  const observer=start(); observer.approach(calendar);
  expect(calendar.dataset.motionPhase).toBe('revealing');
  calendar.animations[0].cancel(); await flush(); final(calendar);
  for(const event of events.slice(0,6)) {final(event); expect(event.animations).toHaveLength(0);}
  for(const event of events.slice(6)) {expect(event.dataset.motionPhase).toBe('pending'); expect(event.dataset.motionDone).toBeUndefined(); expect(event.animations).toHaveLength(0);}
  observer.leave(...events.slice(6));
  remainder.open=true; events.slice(6).forEach(event => event.rect={top:100,bottom:200,height:100}); remainder.dispatchEvent(new Event('toggle'));
  for(const event of events.slice(6)) {expect(event.animations).toHaveLength(1); expect(event.animations[0].options).toMatchObject({duration:800,delay:0}); event.animations[0].complete();}
  await flush(); remainder.dispatchEvent(new Event('toggle')); observer.approach(...events); await flush();
  for(const event of events) {final(event); expect(event.animations).toHaveLength(event.details ? 1 : 0);}
});

test('fast scroll jump settles passed pending content without an observer transition or new animation', async () => {
  env.media.matches=false; const remainder=new Element('DETAILS'); remainder.open=false;
  remainder.descendants=events.slice(6); const query=env.document.querySelector;
  env.document.querySelector=selector => selector==='[data-agenda-remainder]' ? remainder : query(selector);
  for(const target of [title,body,calendar,workspace,...events]) target.rect={top:1500,bottom:1600,height:100};
  events.slice(6).forEach(event => {event.details=remainder;});
  const observer=start();
  // A single jump from below to above can remain non-intersecting throughout,
  // so no new IntersectionObserver entry is delivered at all.
  for(const target of [title,calendar,workspace,...events]) target.rect={top:-200,bottom:-100,height:100};
  env.window.dispatchEvent(new Event('scroll')); env.window.dispatchEvent(new Event('scroll'));
  expect(env.frames.size).toBe(1); expect(title.dataset.motionPhase).toBe('pending');
  env.flushFrame(); await flush();
  for(const target of [title,calendar,workspace,...events.slice(0,6),...bars]) {final(target); expect(target.animations).toHaveLength(0);}
  expect(body.dataset.motionPhase).toBe('pending'); expect(body.dataset.motionDone).toBeUndefined();
  for(const event of events.slice(6)) {expect(event.dataset.motionPhase).toBe('pending'); expect(event.dataset.motionDone).toBeUndefined(); expect(event.animations).toHaveLength(0);}
  observer.approach(title,calendar,workspace,...events); env.window.dispatchEvent(new Event('scroll')); env.flushFrame(); await flush();
  for(const target of [title,calendar,workspace,...events.slice(0,6),...bars]) expect(target.animations).toHaveLength(0);
  body.rect={top:100,bottom:200,height:100}; observer.approach(body); expect(body.animations).toHaveLength(1);
  remainder.open=true; events.slice(6).forEach(event => event.rect={top:100,bottom:200,height:100}); remainder.dispatchEvent(new Event('toggle'));
  for(const event of events.slice(6)) expect(event.animations).toHaveLength(1);
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
  clean=setupMotion(); expect(env.window.tutorpalRevealBoot.reason).toBe('setup-failure');
  expect(env.observers).toHaveLength(0);
  for(const target of [title,body,calendar,workspace,...events,...bars]) {final(target); expect(target.animations).toHaveLength(0);}
});
