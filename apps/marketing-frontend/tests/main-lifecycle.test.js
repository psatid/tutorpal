import { expect, test } from 'bun:test';
import { Element, installBoundary, flush } from './support/dom-boundary.js';

test('main reduced preference and BFCache-style events settle pending work without replay', async () => {
  const title=new Element('H2');
  const heroTargets=[new Element('DIV'),new Element('DIV'),new Element('DIV')];
  title.rect={top:1200,bottom:1300,height:100,width:300,left:0};
  const env=installBoundary({wide:false,lists:new Map([['[data-reveal]',[title]],['.hero-copy,[data-hero-card],[data-hero-icon]',heroTargets]])});
  const reduced=Object.assign(new EventTarget(),{matches:false});
  env.window.matchMedia=query => query.includes('prefers-reduced-motion') ? reduced : env.media;
  try {
    await import('../src/scripts/main.ts');
    expect(title.dataset.motionPhase).toBe('pending');
    env.window.dispatchEvent(new Event('pagehide')); await flush();
    expect(title.dataset.motionDone).toBe('true'); expect(env.observers[0].disconnected).toBe(true);
    const show=new Event('pageshow'); Object.defineProperty(show,'persisted',{value:true}); env.window.dispatchEvent(show);
    expect(title.animations).toHaveLength(0);
    reduced.matches=true; reduced.dispatchEvent(new Event('change')); expect(title.dataset.motionPhase).toBe('settled');
    for(const target of heroTargets) expect(target.dataset.heroDone).toBe('true');
    reduced.matches=false; reduced.dispatchEvent(new Event('change')); expect(title.animations).toHaveLength(0);
    for(const target of heroTargets) expect(target.dataset.heroDone).toBe('true');
  } finally {env.window.dispatchEvent(new Event('pagehide')); await flush(); env.restore();}
});

test('initial reduced motion keeps hero and sections settled after preference is disabled', async () => {
  const title=new Element('H2');
  const heroTargets=[new Element('DIV'),new Element('DIV'),new Element('DIV')];
  title.rect={top:1200,bottom:1300,height:100,width:300,left:0};
  const env=installBoundary({wide:false,lists:new Map([['[data-reveal]',[title]],['.hero-copy,[data-hero-card],[data-hero-icon]',heroTargets]])});
  const reduced=Object.assign(new EventTarget(),{matches:true});
  env.window.matchMedia=query => query.includes('prefers-reduced-motion') ? reduced : env.media;
  try {
    await import('../src/scripts/main.ts?initial-reduced');
    for(const target of heroTargets) expect(target.dataset.heroDone).toBe('true');
    expect(title.dataset.motionPhase).toBe('settled');
    reduced.matches=false; reduced.dispatchEvent(new Event('change'));
    for(const target of heroTargets) expect(target.dataset.heroDone).toBe('true');
    expect(title.animations).toHaveLength(0);
    expect(title.dataset.motionPhase).toBe('settled');
  } finally {env.window.dispatchEvent(new Event('pagehide')); await flush(); env.restore();}
});
