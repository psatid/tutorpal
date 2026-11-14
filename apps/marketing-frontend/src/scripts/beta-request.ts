type Turnstile = {
  render: (container: Element, options: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
};

declare global {
  interface Window { turnstile?: Turnstile }
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

function isAcceptedResponse(value: unknown): value is { status: 'accepted' } {
  return value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
    && Object.keys(value).length === 1
    && (value as Record<string, unknown>).status === 'accepted';
}

function loadTurnstile(): Promise<Turnstile> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-turnstile-api]');
    if (existing) {
      existing.addEventListener('load', () => window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile did not load')), { once: true });
      existing.addEventListener('error', () => reject(new Error('Turnstile did not load')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.dataset.turnstileApi = 'true';
    script.addEventListener('load', () => window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile did not load')), { once: true });
    script.addEventListener('error', () => reject(new Error('Turnstile did not load')), { once: true });
    document.head.append(script);
  });
}

function value(form: HTMLFormElement, name: string): string {
  const field = form.elements.namedItem(name);
  return field instanceof HTMLInputElement || field instanceof HTMLSelectElement ? field.value : '';
}

function radioValue(form: HTMLFormElement, name: string): string {
  const field = form.elements.namedItem(name);
  return field instanceof RadioNodeList ? field.value : '';
}

export function setupBetaRequestForm() {
  const form = document.querySelector<HTMLFormElement>('form[data-beta-request-form]');
  if (!form) return;

  const unavailable = form.parentElement?.querySelector<HTMLElement>('[data-beta-unavailable]');
  const summary = form.querySelector<HTMLElement>('[data-beta-form-summary]');
  const verification = form.querySelector<HTMLElement>('[data-beta-verification-message]');
  const success = form.querySelector<HTMLElement>('[data-beta-form-success]');
  const body = form.querySelector<HTMLElement>('.beta-form-body');
  const container = form.querySelector<HTMLElement>('[data-turnstile-container]');
  const submit = form.querySelector<HTMLButtonElement>('[type="submit"]');
  const siteKey = form.dataset.turnstileSitekey ?? '';
  const apiUrl = form.dataset.apiUrl ?? '';
  const available = form.dataset.requestAvailable === 'true' && Boolean(siteKey) && Boolean(apiUrl);
  let token = '';
  let widgetId: string | undefined;
  let turnstile: Turnstile | undefined;
  let submitting = false;

  const setSubmitEnabled = (enabled: boolean) => {
    if (!submit) return;
    submit.disabled = !enabled;
    submit.setAttribute('aria-disabled', String(!enabled));
  };
  const showUnavailable = (message = form.dataset.unavailable ?? '') => {
    form.hidden = true;
    if (unavailable) { unavailable.hidden = false; unavailable.textContent = message; }
  };
  const verificationError = (message: string) => {
    token = '';
    setSubmitEnabled(false);
    if (verification) verification.textContent = message;
  };
  const clearError = (name: string) => {
    const field = form.elements.namedItem(name);
    const error = form.querySelector<HTMLElement>(`[data-beta-error-for="${name}"]`);
    if (field instanceof HTMLElement) field.removeAttribute('aria-invalid');
    if (error) error.textContent = '';
  };
  const setError = (name: string, message: string) => {
    const field = form.elements.namedItem(name);
    const error = form.querySelector<HTMLElement>(`[data-beta-error-for="${name}"]`);
    if (field instanceof HTMLElement) field.setAttribute('aria-invalid', 'true');
    if (error) error.textContent = message;
    return field instanceof HTMLElement ? field : undefined;
  };
  const resetVerification = () => {
    token = '';
    if (widgetId && turnstile) turnstile.reset(widgetId);
    setSubmitEnabled(false);
  };

  if (!available || !container || !submit) { showUnavailable(); return; }
  if (unavailable) unavailable.hidden = true;

  void loadTurnstile().then(loaded => {
    turnstile = loaded;
    widgetId = loaded.render(container, {
      sitekey: siteKey,
      action: 'beta_demo_request',
      callback: (receivedToken: string) => {
        token = receivedToken;
        if (verification) verification.textContent = '';
        setSubmitEnabled(!submitting);
      },
      'expired-callback': () => verificationError(form.dataset.verificationUnavailable ?? ''),
      'error-callback': () => verificationError(form.dataset.verificationUnavailable ?? ''),
    });
  }).catch(() => verificationError(form.dataset.verificationUnavailable ?? ''));

  form.addEventListener('input', event => {
    if (event.target instanceof HTMLInputElement && (event.target.name === 'name' || event.target.name === 'email')) clearError(event.target.name);
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submitting) return;
    clearError('name'); clearError('email');
    if (summary) summary.textContent = '';
    const name = value(form, 'name').trim();
    const email = value(form, 'email').trim().toLowerCase();
    const invalid = [
      !name || name.length > 120 ? setError('name', form.dataset.invalidName ?? '') : undefined,
      !email || email.length > 254 || !emailPattern.test(email) ? setError('email', form.dataset.invalidEmail ?? '') : undefined,
    ].filter((field): field is HTMLElement => Boolean(field));
    if (invalid.length) {
      if (summary) summary.textContent = form.dataset.validationSummary ?? '';
      invalid[0].focus();
      resetVerification();
      return;
    }
    if (!token || !turnstile || !widgetId) {
      verificationError(form.dataset.verificationUnavailable ?? '');
      resetVerification();
      return;
    }

    const subject = value(form, 'subject').trim();
    const studentCountRange = value(form, 'studentCountRange');
    const lineAccount = radioValue(form, 'hasLineOfficialAccount');
    const payload: Record<string, string | boolean> = { name, email, turnstileToken: token };
    if (subject) payload.subject = subject;
    if (studentCountRange) payload.studentCountRange = studentCountRange;
    if (lineAccount) payload.hasLineOfficialAccount = lineAccount === 'true';

    submitting = true;
    form.setAttribute('aria-busy', 'true');
    setSubmitEnabled(false);
    try {
      const response = await fetch(new URL('/v1/beta/requests', apiUrl), {
        method: 'POST', credentials: 'omit', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.status !== 200) {
        if (response.status === 404 || response.status === 503) showUnavailable(form.dataset.requestDisabled ?? '');
        else if (response.status === 400) verificationError(form.dataset.verificationUnavailable ?? '');
        else if (summary) summary.textContent = form.dataset.requestFailed ?? '';
        return;
      }
      let result: unknown;
      try { result = await response.json(); } catch {
        if (summary) summary.textContent = form.dataset.requestFailed ?? '';
        return;
      }
      if (!isAcceptedResponse(result)) {
        if (summary) summary.textContent = form.dataset.requestFailed ?? '';
        return;
      }
      body?.setAttribute('hidden', '');
      if (success) success.hidden = false;
    } catch {
      if (summary) summary.textContent = form.dataset.requestFailed ?? '';
    } finally {
      resetVerification();
      form.removeAttribute('aria-busy');
      submitting = false;
    }
  });
}
