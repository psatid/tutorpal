import { afterEach, describe, expect, test } from 'bun:test';
import worker from '../worker/index.ts';

const page = `<!doctype html><html><body>
  <span data-beta-branch="on">beta</span><span data-beta-branch="off" hidden>launch</span>
  <form data-beta-request-form data-request-available="false" data-turnstile-sitekey="" data-api-url=""></form>
</body></html>`;
const originalFetch = globalThis.fetch;

afterEach(() => { globalThis.fetch = originalFetch; });

function assets(body = page) {
  return { fetch: () => new Response(body, { headers: { 'content-type': 'text/html; charset=utf-8' } }) };
}

function config(betaEnabled, requestAvailable = false, turnstileSiteKey = null) {
  return new Response(JSON.stringify({ betaEnabled, requestAvailable, turnstileSiteKey }), { headers: { 'content-type': 'application/json' } });
}

function expectFreshHomepage(response) {
  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toBe('no-store');
  for (const header of ['etag', 'last-modified', 'expires', 'age']) expect(response.headers.get(header)).toBeNull();
}

async function homepage(configResponse) {
  const calls = [];
  globalThis.fetch = async request => {
    calls.push(new Request(request));
    return configResponse;
  };
  const response = await worker.fetch(new Request('https://marketing.example/'), { ASSETS: assets(), API_URL: 'https://api.example' });
  return { html: await response.text(), calls };
}

describe('marketing beta edge worker', () => {
  test('keeps only the available beta branch and injects no secret', async () => {
    const { html, calls } = await homepage(new Response(JSON.stringify({ betaEnabled: true, requestAvailable: true, turnstileSiteKey: '1x00000000000000000000AA' }), { headers: { 'content-type': 'application/json' } }));
    expect(html).toContain('>beta</span>');
    expect(html).not.toContain('>launch</span>');
    expect(html).toContain('data-request-available="true"');
    expect(html).toContain('data-turnstile-sitekey="1x00000000000000000000AA"');
    expect(html).toContain('data-api-url="https://api.example"');
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://api.example/v1/beta/config');
  });

  test('keeps only the launch branch when beta is disabled', async () => {
    const { html } = await homepage(new Response(JSON.stringify({ betaEnabled: false, requestAvailable: false, turnstileSiteKey: null }), { headers: { 'content-type': 'application/json' } }));
    expect(html).not.toContain('>beta</span>');
    expect(html).toContain('>launch</span>');
    expect(html).not.toContain(' hidden');
    expect(html).toContain('data-request-available="false"');
    expect(html).toContain('data-turnstile-sitekey=""');
    expect(html).toContain('data-api-url=""');
  });

  test('fails closed to an unavailable beta form for invalid or failing config responses', async () => {
    for (const response of [
      new Response(JSON.stringify({ betaEnabled: true, requestAvailable: true, turnstileSiteKey: 'site-key', extra: true }), { headers: { 'content-type': 'application/json' } }),
      new Response('upstream unavailable', { status: 503, headers: { 'content-type': 'text/plain' } }),
    ]) {
      const { html } = await homepage(response);
      expect(html).toContain('>beta</span>');
      expect(html).not.toContain('>launch</span>');
      expect(html).toContain('data-request-available="false"');
      expect(html).toContain('data-turnstile-sitekey=""');
      expect(html).toContain('data-api-url=""');
    }
  });

  test('bypasses the beta API and rewriter for static assets', async () => {
    let apiCalls = 0;
    globalThis.fetch = async () => { apiCalls++; return new Response('{}'); };
    const asset = new Response('asset bytes', { headers: { 'content-type': 'application/javascript' } });
    const response = await worker.fetch(new Request('https://marketing.example/_astro/app.js'), { ASSETS: { fetch: () => asset }, API_URL: 'https://api.example' });
    expect(await response.text()).toBe('asset bytes');
    expect(apiCalls).toBe(0);
  });

  test('strips conditional validators for every homepage alias and returns uncached mode-specific HTML', async () => {
    for (const path of ['/', '/th', '/th/']) {
      const assetRequests = [];
      let apiCalls = 0;
      globalThis.fetch = async () => { apiCalls++; return config(true, true, 'site-key'); };
      const response = await worker.fetch(new Request(`https://marketing.example${path}`, { headers: { 'if-none-match': '"stale"', 'if-modified-since': 'Wed, 01 Jan 2025 00:00:00 GMT' } }), {
        ASSETS: { fetch: request => { assetRequests.push(new Request(request)); return new Response(page, { headers: { 'content-type': 'text/html', etag: '"asset"', 'last-modified': 'Wed, 01 Jan 2025 00:00:00 GMT' } }); } },
        API_URL: 'https://api.example',
      });
      expect(assetRequests).toHaveLength(1);
      expect(apiCalls).toBe(1);
      expect(assetRequests[0].headers.get('if-none-match')).toBeNull();
      expect(assetRequests[0].headers.get('if-modified-since')).toBeNull();
      expectFreshHomepage(response);
      const html = await response.text();
      expect(html).toContain('>beta</span>'); expect(html).not.toContain('>launch</span>');
    }
  });

  test('serves opposite beta modes from the same conditional asset without a 304 reuse', async () => {
    const assetRequests = [];
    const configs = [config(true, true, 'site-key'), config(false)];
    globalThis.fetch = async () => configs.shift();
    const assets = { fetch: request => { assetRequests.push(new Request(request)); return new Response(page, { headers: { 'content-type': 'text/html', etag: '"unchanged-asset"' } }); } };
    const first = await worker.fetch(new Request('https://marketing.example/', { headers: { 'if-none-match': '"unchanged-asset"' } }), { ASSETS: assets, API_URL: 'https://api.example' });
    const second = await worker.fetch(new Request('https://marketing.example/', { headers: { 'if-none-match': '"unchanged-asset"' } }), { ASSETS: assets, API_URL: 'https://api.example' });
    expectFreshHomepage(first); expectFreshHomepage(second);
    expect(await first.text()).toContain('>beta</span>');
    expect(await second.text()).toContain('>launch</span>');
    expect(assetRequests).toHaveLength(2);
    expect(configs).toHaveLength(0);
    for (const request of assetRequests) expect(request.headers.get('if-none-match')).toBeNull();
  });

  test('strips homepage validators for HEAD without consulting beta configuration', async () => {
    let apiCalls = 0; let assetRequest;
    globalThis.fetch = async () => { apiCalls++; return config(true); };
    const response = await worker.fetch(new Request('https://marketing.example/th', { method: 'HEAD', headers: { 'if-none-match': '"asset"', 'if-modified-since': 'Wed, 01 Jan 2025 00:00:00 GMT' } }), {
      ASSETS: { fetch: request => { assetRequest = new Request(request); return new Response(null, { headers: { 'content-type': 'text/html', etag: '"asset"' } }); } },
      API_URL: 'https://api.example',
    });
    expect(assetRequest.method).toBe('HEAD');
    expect(assetRequest.headers.get('if-none-match')).toBeNull();
    expect(assetRequest.headers.get('if-modified-since')).toBeNull();
    expect(apiCalls).toBe(0); expectFreshHomepage(response);
  });

  test('uses the same fresh cache policy for fail-closed beta HTML and retries an unexpected asset 304', async () => {
    const assetRequests = [];
    let attempts = 0;
    let apiCalls = 0;
    globalThis.fetch = async () => { apiCalls++; return new Response('config unavailable', { status: 503 }); };
    const response = await worker.fetch(new Request('https://marketing.example/th/', { headers: { 'if-none-match': '"asset"' } }), {
      ASSETS: { fetch: request => {
        assetRequests.push(new Request(request)); attempts++;
        return attempts === 1
          ? new Response(null, { status: 304, headers: { etag: '"asset"' } })
          : new Response(page, { headers: { 'content-type': 'text/html', etag: '"asset"' } });
      } },
      API_URL: 'https://api.example',
    });
    expect(assetRequests).toHaveLength(2);
    expect(apiCalls).toBe(1);
    for (const request of assetRequests) expect(request.headers.get('if-none-match')).toBeNull();
    expectFreshHomepage(response);
    const html = await response.text();
    expect(html).toContain('>beta</span>'); expect(html).toContain('data-request-available="false"');
  });

  test('leaves conditional non-home assets untouched and does not call the beta API', async () => {
    let apiCalls = 0; let assetRequest;
    globalThis.fetch = async () => { apiCalls++; return config(true); };
    const asset = new Response('asset bytes', { headers: { 'content-type': 'application/javascript', etag: '"asset"', 'cache-control': 'public, max-age=31536000' } });
    const response = await worker.fetch(new Request('https://marketing.example/_astro/app.js', { headers: { 'if-none-match': '"asset"', 'if-modified-since': 'Wed, 01 Jan 2025 00:00:00 GMT' } }), { ASSETS: { fetch: request => { assetRequest = new Request(request); return asset; } }, API_URL: 'https://api.example' });
    expect(await response.text()).toBe('asset bytes'); expect(response.headers.get('etag')).toBe('"asset"');
    expect(assetRequest.headers.get('if-none-match')).toBe('"asset"');
    expect(assetRequest.headers.get('if-modified-since')).toBe('Wed, 01 Jan 2025 00:00:00 GMT');
    expect(apiCalls).toBe(0);
  });
});
