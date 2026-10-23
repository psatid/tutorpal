import { beforeEach, afterEach, describe, expect, test } from 'bun:test';
import { setupFAQ } from '../src/scripts/faq.ts';
import { Element, installBoundary, flush } from './support/dom-boundary.js';
let env, items, clean;
beforeEach(() => {
  items = Array.from({length: 4}, () => {
    const details = new Element('DETAILS'), summary = new Element('SUMMARY'), answer = new Element();
    answer.rect.height = 120;
    // Cancelling WAAPI removes its temporary effect and restores natural CSS height.
    answer.onAnimationCancel = () => { answer.rect.height = 120; answer.opacity = '1'; };
    details.children.set('summary', summary); details.children.set('.faq-answer', answer);
    return {details,summary,answer};
  });
  env = installBoundary({lists: new Map([['.faq-list details', items.map(item => item.details)]])});
});
afterEach(async () => { clean?.(); clean = undefined; await flush(); env.restore(); });
const click = item => { const event = new Event('click',{cancelable:true}); item.summary.dispatchEvent(event); return event; };
const settle = async item => { item.answer.animations.at(-1).complete(); await flush(); };
const expectNatural = item => { expect(item.answer.style.height).toBeUndefined(); expect(item.answer.style.overflow).toBeUndefined(); };

describe('native FAQ enhancement lifecycle', () => {
  test('measures a 320ms height/fade, supports multiple open answers, and restores natural height', async () => {
    clean = setupFAQ(); expect(click(items[0]).defaultPrevented).toBe(true);
    const animation = items[0].answer.animations[0];
    expect(animation.options.duration).toBe(320);
    expect(animation.frames).toEqual([{height:'0px',opacity:0},{height:'120px',opacity:1}]);
    expect(items[0].details.open).toBe(true); expect(items[0].details.dataset.faqPhase).toBe('opening');
    click(items[1]); await settle(items[0]); await settle(items[1]);
    for (const item of items.slice(0,2)) { expect(item.details.open).toBe(true); expect(item.details.dataset.faqPhase).toBe('open'); expectNatural(item); }
    click(items[0]); expect(items[0].answer.animations[1].frames[1]).toEqual({height:'0px',opacity:0});
    await settle(items[0]); expect(items[0].details.open).toBe(false); expect(items[1].details.open).toBe(true); expectNatural(items[0]);
  });
  test('rapid open-close-open reverses from current rendered height and ignores stale completion', async () => {
    clean = setupFAQ(); const item = items[0]; click(item);
    const first = item.answer.animations[0]; item.answer.rect.height = 43; item.answer.opacity = '.3'; click(item);
    const second = item.answer.animations[1];
    expect(first.cancelCount).toBe(1); expect(second.frames[0]).toEqual({height:'43px',opacity:.3}); expect(item.details.dataset.faqPhase).toBe('closing');
    item.answer.rect.height = 20; item.answer.opacity = '.15'; click(item);
    const third = item.answer.animations[2]; expect(second.cancelCount).toBe(1);
    expect(third.frames).toEqual([{height:'20px',opacity:.15},{height:'120px',opacity:1}]);
    first.complete(); second.complete(); await flush(); expect(item.details.dataset.faqPhase).toBe('opening');
    third.complete(); await flush(); expect(item.details.open).toBe(true); expect(item.details.dataset.faqPhase).toBe('open'); expectNatural(item);
  });
  test('resize settles current intention and subsequent native state changes are preserved by cleanup', async () => {
    items[0].details.open = true; clean = setupFAQ(); click(items[0]);
    env.window.dispatchEvent(new Event('resize')); await flush(); expect(items[0].details.open).toBe(false); expectNatural(items[0]);
    items[0].details.open = true; clean(); expect(items[0].details.open).toBe(true); expectNatural(items[0]);
  });
  test('cleanup during animation settles intended state and removes click interception', async () => {
    clean = setupFAQ(); click(items[0]); clean(); await flush();
    expect(items[0].details.open).toBe(true); expectNatural(items[0]); expect(click(items[0]).defaultPrevented).toBe(false);
    env.window.dispatchEvent(new Event('resize')); expect(items[0].details.open).toBe(true);
  });
  test('animation API errors settle to intended native state; unsupported API leaves native clicks untouched', async () => {
    items[0].answer.failAnimation = true; clean = setupFAQ(); click(items[0]);
    expect(items[0].details.open).toBe(true); expectNatural(items[0]); click(items[0]); expect(items[0].details.open).toBe(false);
    clean(); const animate = Element.prototype.animate;
    try { delete Element.prototype.animate; clean = setupFAQ(); expect(click(items[1]).defaultPrevented).toBe(false); }
    finally { Element.prototype.animate = animate; }
    await flush(); expect(items[1].answer.animations).toHaveLength(0);
  });
});
