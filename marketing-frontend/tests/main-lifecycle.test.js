import { expect, test } from 'bun:test';
import { Element, installBoundary, flush } from './support/dom-boundary.js';

test('main reduced preference and BFCache-style events settle pending work and retain agenda intent without replay', async () => {
  const title=new Element('H2'); const details=new Element('DETAILS'); details.open=true;
  const summary=new Element('SUMMARY'); details.children.set('summary',summary);
  const env=installBoundary({preparing:true,wide:false,queries:new Map([['[data-agenda-remainder]',details]]),lists:new Map([['[data-reveal]',[title]]])});
  const reduced=Object.assign(new EventTarget(),{matches:false});
  env.window.matchMedia=query => query.includes('prefers-reduced-motion') ? reduced : env.media;
  try {
    await import('../src/scripts/main.ts');
    expect(env.window.tutorpalRevealBoot.phase).toBe('claimed'); expect(title.dataset.motionPhase).toBe('pending'); expect(details.open).toBe(false);
    summary.dispatchEvent(new Event('click')); details.open=true; details.dispatchEvent(new Event('toggle'));
    env.window.dispatchEvent(new Event('pagehide')); await flush();
    expect(title.dataset.motionDone).toBe('true'); expect(env.observers[0].disconnected).toBe(true);
    const show=new Event('pageshow'); Object.defineProperty(show,'persisted',{value:true}); env.window.dispatchEvent(show);
    expect(details.open).toBe(true); expect(details.dataset.compactExpanded).toBe('true'); expect(title.animations).toHaveLength(0);
    reduced.matches=true; reduced.dispatchEvent(new Event('change')); expect(env.window.tutorpalRevealBoot.phase).toBe('expired'); expect(title.dataset.motionPhase).toBe('settled'); expect(details.open).toBe(true);
    reduced.matches=false; reduced.dispatchEvent(new Event('change')); expect(title.animations).toHaveLength(0); expect(details.open).toBe(true);
  } finally {env.window.dispatchEvent(new Event('pagehide')); await flush(); env.restore();}
});
