import { afterEach, expect, test } from 'bun:test';
import { setupBetaRequestForm } from '../src/scripts/beta-request.ts';

class FakeElement extends EventTarget {
  constructor() { super(); this.dataset = {}; this.attributes = new Map(); this.hidden = false; this.textContent = ''; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); if (name === 'hidden') this.hidden = true; }
  removeAttribute(name) { this.attributes.delete(name); if (name === 'hidden') this.hidden = false; }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  focus() { this.focused = true; }
}
class FakeInput extends FakeElement { constructor(name, value = '') { super(); this.name = name; this.value = value; } }
class FakeSelect extends FakeInput {}
class FakeRadioList { constructor(value = '') { this.value = value; } }

const saved = new Map();
function save(key, value) { saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { configurable: true, writable: true, value }); }
function restore() { for (const [key, descriptor] of saved) descriptor ? Object.defineProperty(globalThis, key, descriptor) : delete globalThis[key]; saved.clear(); }
afterEach(restore);
const tick = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };

function setup(response) {
  const name = new FakeInput('name', '  Demo Tutor  ');
  const email = new FakeInput('email', 'DEMO@EXAMPLE.TEST ');
  const subject = new FakeSelect('subject', 'math');
  const range = new FakeSelect('studentCountRange', '6-15');
  const radios = new FakeRadioList('true');
  const body = new FakeElement(), success = new FakeElement(), container = new FakeElement(), submit = new FakeElement();
  success.hidden = true; submit.disabled = true;
  const summary = new FakeElement(), verification = new FakeElement(), unavailable = new FakeElement(); unavailable.hidden = true;
  const errors = { name: new FakeElement(), email: new FakeElement() };
  const form = new FakeElement();
  form.dataset = {
    requestAvailable: 'true', turnstileSitekey: 'site-key', apiUrl: 'https://api.example', unavailable: 'Unavailable', success: 'Accepted',
    validationSummary: 'Fix fields', invalidName: 'Invalid name', invalidEmail: 'Invalid email', verificationUnavailable: 'Verify first', requestFailed: 'Request failed', requestDisabled: 'Requests disabled',
  };
  form.elements = { namedItem: field => ({ name, email, subject, studentCountRange: range, hasLineOfficialAccount: radios }[field] ?? null) };
  form.parentElement = { querySelector: () => unavailable };
  form.querySelector = selector => ({
    '[data-beta-form-summary]': summary, '[data-beta-verification-message]': verification, '[data-beta-form-success]': success,
    '.beta-form-body': body, '[data-turnstile-container]': container, '[type="submit"]': submit,
    '[data-beta-error-for="name"]': errors.name, '[data-beta-error-for="email"]': errors.email,
  }[selector] ?? null);
  let options, resets = 0, payload, fetchCalls = 0, requestOptions;
  save('HTMLElement', FakeElement); save('HTMLInputElement', FakeInput); save('HTMLSelectElement', FakeSelect); save('RadioNodeList', FakeRadioList);
  save('document', { querySelector: () => form });
  save('window', { turnstile: { render: (_, next) => { options = next; return 'widget'; }, reset: () => { resets++; } } });
  save('fetch', async (_, request) => { fetchCalls++; requestOptions = request; payload = JSON.parse(request.body); return response; });
  setupBetaRequestForm();
  return { form, name, email, body, success, submit, summary, verification, unavailable, get options() { return options; }, get resets() { return resets; }, get payload() { return payload; }, get fetchCalls() { return fetchCalls; }, get requestOptions() { return requestOptions; } };
}

test('posts only the selected optional fields and succeeds only for the accepted response', async () => {
  const page = setup(new Response(JSON.stringify({ status: 'accepted' }), { status: 200 }));
  await tick();
  expect(page.options.action).toBe('beta_demo_request');
  page.options.callback('token'); expect(page.submit.disabled).toBe(false);
  page.form.dispatchEvent(new Event('submit', { cancelable: true })); await tick();
  expect(page.payload).toEqual({ name: 'Demo Tutor', email: 'demo@example.test', subject: 'math', studentCountRange: '6-15', hasLineOfficialAccount: true, turnstileToken: 'token' });
  expect(page.requestOptions.credentials).toBe('omit');
  expect(page.body.hidden).toBe(true); expect(page.success.hidden).toBe(false);
  expect(page.resets).toBe(1); expect(page.submit.disabled).toBe(true);
});

test('keeps entered values and shows a recoverable failure for malformed 200 responses', async () => {
  const page = setup(new Response(JSON.stringify({ status: 'other' }), { status: 200 }));
  await tick(); page.options.callback('token'); page.form.dispatchEvent(new Event('submit', { cancelable: true })); await tick();
  expect(page.summary.textContent).toBe('Request failed');
  expect(page.name.value).toBe('  Demo Tutor  '); expect(page.email.value).toBe('DEMO@EXAMPLE.TEST ');
  expect(page.body.hidden).toBe(false); expect(page.success.hidden).toBe(true);
  expect(page.resets).toBe(1); expect(page.submit.disabled).toBe(true);
});

test('expired verification gates submission and reports the localized verification error', async () => {
  const page = setup(new Response(JSON.stringify({ status: 'accepted' }), { status: 200 }));
  await tick(); page.options.callback('token'); page.options['expired-callback']();
  expect(page.submit.disabled).toBe(true); expect(page.verification.textContent).toBe('Verify first');
  page.form.dispatchEvent(new Event('submit', { cancelable: true })); await tick();
  expect(page.verification.textContent).toBe('Verify first'); expect(page.payload).toBeUndefined();
});

test('invalid local fields reset an already solved widget, retain values, and focus the first invalid field', async () => {
  const page = setup(new Response(JSON.stringify({ status: 'accepted' }), { status: 200 }));
  await tick(); page.options.callback('token'); page.name.value = '';
  page.form.dispatchEvent(new Event('submit', { cancelable: true })); await tick();
  expect(page.fetchCalls).toBe(0); expect(page.resets).toBe(1); expect(page.submit.disabled).toBe(true);
  expect(page.summary.textContent).toBe('Fix fields'); expect(page.name.focused).toBe(true);
  expect(page.name.value).toBe(''); expect(page.email.value).toBe('DEMO@EXAMPLE.TEST ');
});

test('a missing token resets the widget guard without making a request or clearing form fields', async () => {
  const page = setup(new Response(JSON.stringify({ status: 'accepted' }), { status: 200 }));
  await tick(); page.form.dispatchEvent(new Event('submit', { cancelable: true })); await tick();
  expect(page.fetchCalls).toBe(0); expect(page.resets).toBe(1); expect(page.submit.disabled).toBe(true);
  expect(page.verification.textContent).toBe('Verify first');
  expect(page.name.value).toBe('  Demo Tutor  '); expect(page.email.value).toBe('DEMO@EXAMPLE.TEST ');
});
