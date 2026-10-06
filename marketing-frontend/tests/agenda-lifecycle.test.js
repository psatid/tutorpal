import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { setupAgenda } from '../src/scripts/agenda.ts';
import { Element, installBoundary } from './support/dom-boundary.js';
let env, details, summary, agenda;
beforeEach(() => {details=new Element('DETAILS'); details.open=true; summary=new Element('SUMMARY'); details.children.set('summary',summary); env=installBoundary({wide:false,queries:new Map([['[data-agenda-remainder]',details]])});});
afterEach(() => {agenda?.cleanup(); agenda=undefined; env.restore();});
const nativeToggle = () => {summary.dispatchEvent(new Event('click')); details.open=!details.open; details.dispatchEvent(new Event('toggle'));};
const resize = wide => {env.media.matches=wide; env.media.dispatchEvent(new Event('change'));};
describe('native week agenda enhancement', () => {
  test('SSR full week shortens only when activated by successful early claim', () => {
    agenda=setupAgenda(); expect(details.open).toBe(true); agenda.activate(true);
    expect(details.open).toBe(false); expect(details.dataset).toMatchObject({compactExpanded:'false',agendaPhase:'three-days'});
  });
  test('missing/expired guard activation preserves readable full week', () => {
    agenda=setupAgenda(); agenda.activate(false); expect(details.open).toBe(true); expect(details.dataset.agendaPhase).toBe('full-week');
  });
  test('native activation and compact intent survive desktop round trips', () => {
    agenda=setupAgenda(); agenda.activate(true); nativeToggle(); expect(details.open).toBe(true); expect(details.dataset.compactExpanded).toBe('true');
    resize(true); expect(details.dataset.agendaPhase).toBe('desktop'); resize(false); expect(details.open).toBe(true);
    nativeToggle(); expect(details.open).toBe(false); resize(true); expect(details.open).toBe(true); resize(false); expect(details.open).toBe(false);
  });
  test('cleanup preserves native state; reinitialization honors prior intent', () => {
    agenda=setupAgenda(); agenda.activate(true); nativeToggle(); agenda.cleanup(); resize(true); nativeToggle(); expect(details.open).toBe(false);
    agenda=setupAgenda(); agenda.activate(false); expect(details.open).toBe(true); expect(details.dataset.compactExpanded).toBe('true');
  });
  test('desktop-first setup opens week but stores compact default; closed desktop can recover natively', () => {
    env.media.matches=true; agenda=setupAgenda(); agenda.activate(true); expect(details.open).toBe(true); expect(details.dataset.compactExpanded).toBe('false');
    nativeToggle(); expect(details.open).toBe(false); nativeToggle(); expect(details.open).toBe(true);
    resize(false); expect(details.open).toBe(false);
  });
  test('partial registration failure removes listeners and leaves SSR disclosure open', () => {
    env.media.addEventListener=() => {throw new Error('Listener registration failure');}; expect(() => setupAgenda()).toThrow();
    nativeToggle(); expect(details.open).toBe(false); expect(details.dataset.compactExpanded).toBeUndefined();
  });
});
