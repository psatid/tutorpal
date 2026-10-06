// Local-only fault injection and DOM/CSS animation observations. Never shipped.
// Build first, then: bun tests/browser-fixture.js
import { resolve, sep } from 'node:path';
import { existsSync } from 'node:fs';
import { scaleViewportQueries } from './support/viewport-scale.js';

const root = resolve(import.meta.dir, '../dist');
const modes = new Set(['nojs', 'reduced', 'reducedToggle', 'performance', 'diagnostic', 'zoom200', 'delayedMotion', 'failedMotion', 'missingBoot', 'blockedBoot', 'unsupportedObserver', 'unsupportedAnimation', 'unsupportedFrame']);
// Runs before the site's bundled module. Instrumentation remains fixture-only.
function browserBootstrap(mode, scaleQuery) {
  const state = window.__qa = {mode, lcp: 0, cls: 0, errors: [], motionRequest: null, preEntry: [], animationCalls: []};
  const targetSelector = '[data-hero-card],[data-reveal],[data-calendar-frame],[data-calendar-event],[data-balance-fill]';
  const targetId = element => element.dataset.heroCard !== undefined ? 'hero-' + element.dataset.heroCard : element.id || element.dataset.lessonId || (element.hasAttribute('data-balance-fill') ? 'balance-' + [...document.querySelectorAll('[data-balance-fill]')].indexOf(element) : element.classList.contains('faq-answer') ? 'faq-' + [...document.querySelectorAll('.faq-answer')].indexOf(element) : (element.className || element.tagName) + '-' + [...document.querySelectorAll('[data-reveal], [data-calendar-frame]')].indexOf(element));
  // Observe parser additions before the head guard/main entry. Also sample while
  // a real delayed/failed entry is pending, including the two-second expiry.
  let preEntryTimer, parserObserver;
  const stopPreEntry = () => {clearInterval(preEntryTimer); parserObserver?.disconnect();};
  const samplePreEntry = () => {
    const hero = document.querySelector('.hero');
    if (hero?.dataset.motionRunning !== undefined || state.preEntry.length >= 100) {stopPreEntry(); return;}
    const targets = [...document.querySelectorAll(targetSelector)];
    if (!targets.length) return;
    const boot = window.tutorpalRevealBoot;
    state.preEntry.push({ms: Math.round(performance.now()), boot: boot?.phase || 'missing', reason: boot?.reason || '', root: document.documentElement.dataset.revealBoot || 'missing', targets: targets.map(element => {
      const style = getComputedStyle(element);
      return {id: targetId(element), phase: element.dataset.motionPhase || 'static', done: element.dataset.motionDone === 'true', opacity: Number(style.opacity), filter: style.filter, transform: style.transform, animation: style.animationName};
    })});
  };
  parserObserver = new MutationObserver(samplePreEntry); parserObserver.observe(document.documentElement, {childList:true, subtree:true});
  preEntryTimer = setInterval(samplePreEntry, 50);
  if (mode === 'unsupportedObserver') delete window.IntersectionObserver;
  if (mode === 'unsupportedAnimation') HTMLElement.prototype.animate = undefined;
  if (mode === 'unsupportedFrame') {window.requestAnimationFrame = undefined; window.cancelAnimationFrame = undefined;}
  const nativeAnimate = HTMLElement.prototype.animate;
  if (typeof nativeAnimate === 'function') HTMLElement.prototype.animate = function(frames, options) {
    const animation = nativeAnimate.call(this, frames, options);
    const call = {id: targetId(this), ms: Math.round(performance.now()), frames, options, finish: null};
    state.animationCalls.push(call);
    if (state.animationCalls.length > 120) state.animationCalls.shift();
    void animation.finished.then(() => { call.finish = 'completed'; call.endMs = Math.round(performance.now()); }).catch(() => { call.finish = 'cancelled'; call.endMs = Math.round(performance.now()); });
    return animation;
  };
  const transitions = [];
  const lastPhase = new Map();
  let reduced = mode === 'reduced';
  const nativeMatchMedia = window.matchMedia.bind(window);
  const simulatedQueries = [];
  function syncReducedCSS() {
    let style = document.getElementById('qa-reduced-css');
    if (!style) { style = document.createElement('style'); style.id = 'qa-reduced-css'; document.head.append(style); }
    style.textContent = reduced ? 'html{scroll-behavior:auto!important}*,*::before,*::after{animation:none!important;transition:none!important}.product-card,.closing-tile{transform:none!important}.hero-card-slot{transform:none!important;opacity:1!important;filter:none!important}' : '';
    state.simulatedReduced = reduced;
  }
  if (mode === 'reduced' || mode === 'reducedToggle') {
    window.matchMedia = query => {
      if (!query.includes('prefers-reduced-motion')) return nativeMatchMedia(query);
      const listeners = new Set();
      const wrapper = {
        media: query, get matches() { return query.includes('no-preference') ? !reduced : reduced; }, onchange: null,
        addEventListener(type, listener) { if (type === 'change') listeners.add(listener); },
        removeEventListener(type, listener) { if (type === 'change') listeners.delete(listener); },
        addListener(listener) { listeners.add(listener); }, removeListener(listener) { listeners.delete(listener); },
      };
      simulatedQueries.push({wrapper, listeners, previous: wrapper.matches});
      return wrapper;
    };
    syncReducedCSS();
  }
  if (mode === 'zoom200') {
    state.zoom = 'CSS scale 2 + adjusted pixel queries; NOT native browser zoom';
    window.matchMedia = query => nativeMatchMedia(scaleQuery(query));
  }
  window.addEventListener('error', event => { state.errors.push(event.message || 'Resource failed: ' + (event.target?.src || 'unknown')); }, true);
  window.addEventListener('unhandledrejection', event => { state.errors.push(String(event.reason)); });
  try { new PerformanceObserver(list => { for (const entry of list.getEntries()) state.lcp = entry.startTime; }).observe({type: 'largest-contentful-paint', buffered: true}); } catch {}
  try { new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) state.cls += entry.value; }).observe({type: 'layout-shift', buffered: true}); } catch {}
  try { new PerformanceObserver(list => {
    for (const entry of list.getEntries()) if (entry.initiatorType === 'script' && (entry.name.includes('/_astro/') || entry.name.includes('/_qa/entry.js'))) state.motionRequest = {duration: Math.round(entry.duration), start: Math.round(entry.startTime), status: entry.responseStatus};
  }).observe({type: 'resource', buffered: true}); } catch {}

  document.addEventListener('DOMContentLoaded', () => {
    // Reduced/unsupported setup has no hero running marker; DOMContentLoaded
    // still bounds its parser samples. Failed entry keeps sampling to expiry.
    if (mode !== 'delayedMotion' && mode !== 'failedMotion') stopPreEntry();
    const output = document.querySelector('#qa-status');
    const history = document.querySelector('#qa-transitions');
    const toggle = document.querySelector('#qa-reduced-toggle');
    toggle?.addEventListener('click', () => {
      reduced = !reduced; syncReducedCSS();
      for (const item of simulatedQueries) {
        const matches = item.wrapper.matches;
        if (matches === item.previous) continue;
        item.previous = matches;
        const event = new MediaQueryListEvent('change', {matches, media: item.wrapper.media});
        for (const listener of [...item.listeners]) {
          if (typeof listener === 'function') listener.call(item.wrapper, event);
          else listener?.handleEvent(event);
        }
        item.wrapper.onchange?.(event);
      }
      toggle.textContent = reduced ? 'Disable simulated reduced motion' : 'Enable simulated reduced motion';
    });
    const sample = () => {
      const now = performance.now();
      const hero = document.querySelector('.hero');
      const rect = hero?.getBoundingClientRect();
      const targets = [...document.querySelectorAll('[data-hero-card]')].map(element => {
        const computed = getComputedStyle(element);
        const float = getComputedStyle(element.querySelector('.hero-card-float'));
        const id = element.dataset.heroCard;
        const phase = element.classList.contains('hero-motion-enter') ? 'entering' : element.classList.contains('hero-motion-ready') ? 'ready' : 'static';
        if (lastPhase.get(id) !== phase) {
          lastPhase.set(id, phase);
          transitions.push({ms: Math.round(now), id, phase, opacity: Number(computed.opacity), transform: computed.transform, filter: computed.filter});
          if (transitions.length > 100) transitions.shift();
          history.textContent = JSON.stringify(transitions);
        }
        return {id, phase, done: element.dataset.motionDone === 'true', opacity: Number(computed.opacity), filter: computed.filter,
          entrance: {name: computed.animationName, duration: computed.animationDuration, delay: computed.animationDelay},
          float: {name: float.animationName, duration: float.animationDuration, playState: float.animationPlayState, transform: float.transform}};
      });
      const reveals = [...document.querySelectorAll('[data-reveal], [data-calendar-frame], [data-calendar-event], [data-balance-fill]')].map(element => {
        const computed = getComputedStyle(element), id = targetId(element), phase = element.dataset.motionPhase || 'static';
        if (lastPhase.get(id) !== phase) {
          lastPhase.set(id, phase); transitions.push({ms: Math.round(now), id, phase, opacity: Number(computed.opacity), filter: computed.filter});
          if (transitions.length > 160) transitions.shift(); history.textContent = JSON.stringify(transitions);
        }
        return {id, phase, done: element.dataset.motionDone === 'true', opacity: Number(computed.opacity), filter: computed.filter, transform: computed.transform,
          animations: element.getAnimations().map(animation => ({playState: animation.playState, currentTime: animation.currentTime, timing: animation.effect.getTiming()}))};
      });
      const faqs = [...document.querySelectorAll('.faq-list details')].map((element,index) => {
        const answer = element.querySelector('.faq-answer'), style = getComputedStyle(answer);
        return {index, open: element.open, phase: element.dataset.faqPhase || 'native', height: answer.getBoundingClientRect().height, opacity: Number(style.opacity), inlineHeight: answer.style.height, overflow: answer.style.overflow, animations: answer.getAnimations().length};
      });
      const closing = document.querySelector('.closing');
      const tiles = [...document.querySelectorAll('.closing-slot')].map(element => {
        const float = getComputedStyle(element.querySelector('.closing-float'));
        return {id: element.className, display: getComputedStyle(element).display, name: float.animationName, duration: float.animationDuration, playState: float.animationPlayState, transform: float.transform};
      });
      const viewportWidth = document.documentElement.clientWidth;
      output.textContent = JSON.stringify({...state, ms: Math.round(now), lcp: Math.round(state.lcp), cls: Number(state.cls.toFixed(4)),
        hidden: document.hidden, offscreen: !rect || rect.bottom <= 0 || rect.top >= innerHeight,
        focusWithinHero: hero?.contains(document.activeElement) || false, running: hero?.dataset.motionRunning ?? null,
        overflow: document.documentElement.scrollWidth > viewportWidth, canvas: document.querySelectorAll('canvas').length,
        hiddenContent: [...document.querySelectorAll('[data-reveal], [data-calendar-event]')].filter(element => Number(getComputedStyle(element).opacity) < 1).length,
        boot: {phase: window.tutorpalRevealBoot?.phase || 'missing', root: document.documentElement.dataset.revealBoot || 'missing', reason: window.tutorpalRevealBoot?.reason || '', deadline: window.tutorpalRevealBoot?.deadline},
        agenda: {open: document.querySelector('[data-agenda-remainder]')?.open, phase: document.querySelector('[data-agenda-remainder]')?.dataset.agendaPhase, compactExpanded: document.querySelector('[data-agenda-remainder]')?.dataset.compactExpanded},
        targets, reveals, faqs, closing: {ready: closing?.dataset.motionReady, running: closing?.dataset.motionRunning, tiles}});
    };
    sample(); setInterval(sample, 50);
  });
}
const qaScript = mode => `<script>(${browserBootstrap.toString()})(${JSON.stringify(mode)}, ${scaleViewportQueries.toString()});</script>`;
const panel = mode => `<aside id="qa-panel" aria-label="Local test controls" style="position:fixed;z-index:10000;bottom:0;left:0;width:100%;max-height:180px;overflow:auto;padding:5px 8px;background:#fff;color:#111;font:10px/1.4 monospace;overflow-wrap:anywhere"><strong>LOCAL QA: ${mode}</strong> <output id="qa-status">${mode === 'nojs' ? 'All scripts blocked by response CSP.' : 'Collecting runtime evidence…'}</output>${mode === 'reducedToggle' ? '<button id="qa-reduced-toggle" style="min-height:44px">Enable simulated reduced motion</button>' : ''}<details><summary>Motion transition history</summary><pre id="qa-transitions" style="white-space:pre-wrap"></pre></details></aside>`;

const server = Bun.serve({
  hostname: '127.0.0.1', port: Number(Bun.env.TUTORPAL_QA_PORT ?? 4323),
  async fetch(request) {
    const url = new URL(request.url);
    const mode = modes.has(url.searchParams.get('qa')) ? url.searchParams.get('qa') : 'performance';
    // Astro inlines this small production module. For fault modes only, serve
    // its exact built bytes at a fixture-only URL so network delay/failure is real.
    if (url.pathname === '/_qa/entry.js') {
      if (mode === 'failedMotion') return new Response('Intentional QA site entry failure', {status: 503, headers: {'Content-Type': 'application/javascript', 'Cache-Control': 'no-store'}});
      if (mode === 'delayedMotion') await Bun.sleep(2800);
      const page = resolve(root, url.searchParams.get('locale') === 'th' ? 'th/index.html' : 'index.html');
      const source = (await Bun.file(page).text()).match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
      if (!source) return new Response('No inline production module found', {status: 500});
      return new Response(source, {headers: {'Content-Type': 'application/javascript', 'Cache-Control': 'no-store'}});
    }
    const candidate = resolve(root, '.' + decodeURIComponent(url.pathname), url.pathname.endsWith('/') ? 'index.html' : '');
    if (!candidate.startsWith(root + sep)) return new Response('Forbidden', {status: 403});
    const path = existsSync(candidate) ? candidate : resolve(root, '404.html');
    const status = candidate === path ? 200 : 404;
    const file = Bun.file(path);
    if (path.endsWith('.css') && mode === 'zoom200') return new Response(scaleViewportQueries(await file.text(), true), {status, headers: {'Content-Type': 'text/css', 'Cache-Control': 'no-store'}});
    // Also support an external bundled entry if Astro's inline threshold changes.
    if (path.endsWith('.js') && ['delayedMotion', 'failedMotion'].includes(mode)) {
      if (mode === 'failedMotion') return new Response('Intentional QA site entry failure', {status: 503, headers: {'Content-Type': 'application/javascript', 'Cache-Control': 'no-store'}});
      await Bun.sleep(2800);
    }
    if (!path.endsWith('.html')) return new Response(file, {status, headers: {'Cache-Control': 'no-store'}});
    let html = await file.text();
    if (mode === 'missingBoot' || mode === 'blockedBoot') html = html.replace(/<script>([\s\S]*?tutorpalRevealBoot[\s\S]*?)<\/script>/, (_, source) => mode === 'missingBoot' ? '' : `<script type="application/x-qa-blocked">${source}</script>`);
    if (mode !== 'nojs') html = html.replace('<head>', '<head>' + qaScript(mode));
    if (['delayedMotion', 'failedMotion'].includes(mode)) {
      const locale = url.pathname.startsWith('/th/') ? 'th' : 'en';
      html = html.replace(/<script type="module">[\s\S]*?<\/script>/g, `<script type="module" src="/_qa/entry.js?qa=${mode}&amp;locale=${locale}"></script>`);
      html = html.replace(/src="([^"\s]+\.js)"/g, `src="$1?qa=${mode}"`);
    }
    if (mode === 'zoom200') {
      html = html.replace(/href="([^"\s]+\.css)"/g, 'href="$1?qa=zoom200"');
      html = html.replace('</head>', '<style>html{zoom:2}#qa-panel{zoom:.5}</style></head>');
    }
    html = html.replace('</body>', panel(mode) + '</body>');
    return new Response(html, {status, headers: {
      'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store',
      ...(mode === 'nojs' ? {'Content-Security-Policy': "script-src 'none'; object-src 'none'"} : {}),
    }});
  },
});
console.log(`Local QA fixture: ${server.url}?qa=diagnostic; modes: ${[...modes].join(', ')}`);
