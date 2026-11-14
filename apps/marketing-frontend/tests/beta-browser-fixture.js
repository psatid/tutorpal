// Local-only beta workflow fixture. Build first, then: bun tests/beta-browser-fixture.js
// It runs the generated page through the real Worker, with local mock config,
// request, and Turnstile boundaries. Nothing here is shipped.
import { existsSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import worker from '../worker/index.ts';

const root = resolve(import.meta.dir, '../dist');
const port = Number(Bun.env.TUTORPAL_BETA_QA_PORT ?? 4324);
const modes = new Set(['betaOn', 'betaUnavailable', 'betaOff', 'betaConfigFailure']);
const requests = [];

function contentType(path) {
  if (path.endsWith('.html')) return 'text/html; charset=utf-8';
  if (path.endsWith('.js')) return 'application/javascript';
  if (path.endsWith('.css')) return 'text/css';
  return 'application/octet-stream';
}

function assetResponse(request) {
  const url = new URL(request.url);
  const candidate = resolve(root, `.${decodeURIComponent(url.pathname)}`, url.pathname.endsWith('/') ? 'index.html' : '');
  if (!candidate.startsWith(root + sep)) return new Response('Forbidden', { status: 403 });
  const path = existsSync(candidate) ? candidate : resolve(root, '404.html');
  return new Response(Bun.file(path), { status: path === candidate ? 200 : 404, headers: { 'content-type': contentType(path), 'cache-control': 'no-store' } });
}

function modeForHost(hostname) {
  if (hostname.startsWith('beta-unavailable.')) return 'betaUnavailable';
  if (hostname.startsWith('beta-off.')) return 'betaOff';
  if (hostname.startsWith('beta-config-failure.')) return 'betaConfigFailure';
  return 'betaOn';
}

function configResponse(mode) {
  if (mode === 'betaConfigFailure') return new Response('Intentional local config failure', { status: 503, headers: { 'content-type': 'text/plain' } });
  const config = mode === 'betaOff'
    ? { betaEnabled: false, requestAvailable: false, turnstileSiteKey: null }
    : mode === 'betaUnavailable'
      ? { betaEnabled: true, requestAvailable: false, turnstileSiteKey: null }
      : { betaEnabled: true, requestAvailable: true, turnstileSiteKey: '1x00000000000000000000AA' };
  return Response.json(config, { headers: { 'cache-control': 'no-store' } });
}

const turnstileMock = `<script>
window.__betaQa={renders:0,resets:0,lastPayload:null};
window.turnstile={render(container,options){window.__betaQa.renders++;window.__betaQa.options=options;container.textContent='Local mock verification — use the QA controls below.';return 'local-widget';},reset(){window.__betaQa.resets++;}};
</script>`;
const panel = mode => `<aside aria-label="Local beta test controls" style="position:fixed;z-index:10000;bottom:0;left:0;width:100%;padding:8px;background:#fff;color:#111;font:12px/1.4 sans-serif;border-top:1px solid #aaa"><strong>LOCAL BETA QA: ${mode}</strong> <button type="button" data-beta-qa="pass">Pass verification</button> <button type="button" data-beta-qa="server-error">Pass verification / make POST fail</button> <button type="button" data-beta-qa="expire">Expire verification</button><output id="beta-qa-status"></output><script>document.addEventListener('click',event=>{const mode=event.target.dataset.betaQa;if(!mode)return;const options=window.__betaQa.options;if(!options)return;if(mode==='pass')options.callback('local-success-token');if(mode==='server-error')options.callback('local-error-token');if(mode==='expire')options['expired-callback']();document.querySelector('#beta-qa-status').textContent=' '+mode+'; renders='+window.__betaQa.renders+' resets='+window.__betaQa.resets;});</script></aside>`;

const server = Bun.serve({
  hostname: '127.0.0.1', port,
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === '/v1/beta/config') return configResponse(modeForHost(url.hostname));
    if (url.pathname === '/v1/beta/requests') {
      if (request.method === 'OPTIONS') return new Response(null, { headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type', 'access-control-allow-methods': 'POST, OPTIONS' } });
      const payload = await request.json();
      requests.push(payload);
      const failed = payload.turnstileToken === 'local-error-token';
      return Response.json(failed ? { error: 'intentional local failure' } : { status: 'accepted' }, { status: failed ? 502 : 200, headers: { 'access-control-allow-origin': '*' } });
    }
    if (url.pathname === '/_qa/beta-requests') return Response.json(requests);
    const mode = modes.has(url.searchParams.get('qa')) ? url.searchParams.get('qa') : 'betaOn';
    const controls = url.searchParams.get('controls') !== '0';
    const homepage = ['/', '/th', '/th/'].includes(url.pathname);
    if (!homepage) return assetResponse(request);
    const apiHost = mode === 'betaUnavailable' ? 'beta-unavailable.localhost' : mode === 'betaOff' ? 'beta-off.localhost' : mode === 'betaConfigFailure' ? 'beta-config-failure.localhost' : 'beta-on.localhost';
    const response = await worker.fetch(request, { ASSETS: { fetch: assetResponse }, API_URL: `http://${apiHost}:${port}` });
    let html = await response.text();
    // `controls=0` is for screenshotting the exact Worker-rewritten unavailable UI.
    if (controls) html = html.replace('</head>', `${turnstileMock}</head>`).replace('</body>', `${panel(mode)}</body>`);
    return new Response(html, { status: response.status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
  },
});

console.log(`Local beta QA: ${server.url}?qa=betaOn`);
console.log(`Modes: ${[...modes].join(', ')}; append /th/ for Thai. POST log: ${server.url}_qa/beta-requests`);
