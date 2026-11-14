type BetaConfig = { betaEnabled: boolean; requestAvailable: boolean; turnstileSiteKey: string | null };

const unavailableConfig: BetaConfig = { betaEnabled: true, requestAvailable: false, turnstileSiteKey: null };
const configPath = '/v1/beta/config';
const configTimeoutMs = 2_000;

function isBetaConfig(value: unknown): value is BetaConfig {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const config = value as Record<string, unknown>;
  return Object.keys(config).length === 3
    && typeof config.betaEnabled === 'boolean'
    && typeof config.requestAvailable === 'boolean'
    && (typeof config.turnstileSiteKey === 'string' || config.turnstileSiteKey === null);
}

async function getBetaConfig(apiUrl: string): Promise<BetaConfig> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), configTimeoutMs);
  try {
    const response = await fetch(new URL(configPath, apiUrl), {
      headers: { Accept: 'application/json', 'Cache-Control': 'no-store' }, cache: 'no-store', signal: controller.signal,
    });
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) return unavailableConfig;
    const payload: unknown = await response.json();
    return isBetaConfig(payload) ? payload : unavailableConfig;
  } catch {
    return unavailableConfig;
  } finally {
    clearTimeout(timeout);
  }
}

function rewriteHomepage(response: Response, config: BetaConfig, apiUrl: string): Response {
  const betaEnabled = config.betaEnabled;
  const requestAvailable = betaEnabled && config.requestAvailable && Boolean(config.turnstileSiteKey);
  return new HTMLRewriter()
    .on('[data-beta-branch="on"]', { element(element) { if (!betaEnabled) element.remove(); } })
    .on('[data-beta-branch="off"]', { element(element) { if (betaEnabled) element.remove(); else element.removeAttribute('hidden'); } })
    .on('form[data-beta-request-form]', { element(element) {
      element.setAttribute('data-request-available', String(requestAvailable));
      element.setAttribute('data-turnstile-sitekey', requestAvailable ? config.turnstileSiteKey ?? '' : '');
      element.setAttribute('data-api-url', requestAvailable ? apiUrl : '');
    } })
    .transform(response);
}

function withoutValidators(request: Request) {
  const copy = new Request(request);
  copy.headers.delete('if-none-match');
  copy.headers.delete('if-modified-since');
  return copy;
}

function withoutHomepageCache(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('cache-control', 'no-store');
  headers.delete('age');
  headers.delete('content-length');
  headers.delete('etag');
  headers.delete('expires');
  headers.delete('last-modified');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function nonCacheableUnavailableResponse() {
  return new Response('Beta content is temporarily unavailable.', {
    status: 503,
    headers: { 'cache-control': 'no-store', 'content-type': 'text/plain; charset=utf-8' },
  });
}

async function fetchHomepageAsset(request: Request, env: Env): Promise<Response> {
  const unconditionalRequest = withoutValidators(request);
  let response = await env.ASSETS.fetch(unconditionalRequest);
  if (response.status !== 304) return response;
  response = await env.ASSETS.fetch(unconditionalRequest);
  return response.status === 304 ? nonCacheableUnavailableResponse() : response;
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    const homepage = ['/', '/th', '/th/'].includes(url.pathname);
    if (!homepage || !['GET', 'HEAD'].includes(request.method)) return env.ASSETS.fetch(request);
    const asset = await fetchHomepageAsset(request, env);
    if (asset.status === 503 || request.method === 'HEAD' || !asset.headers.get('content-type')?.includes('text/html')) return withoutHomepageCache(asset);
    const config = await getBetaConfig(env.API_URL);
    return withoutHomepageCache(rewriteHomepage(asset, config, env.API_URL));
  },
} satisfies ExportedHandler<Env>;
