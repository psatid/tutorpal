import { describe, expect, mock, test } from 'bun:test'

mock.module('cloudflare:workers', () => ({ env: {} }))
mock.module('@tanstack/react-start/server-only', () => ({}))

const { createBetaInterestResponse, handleBetaInterestPost } = await import('./beta-interest')

function formData() {
  const form = new FormData()
  form.set('name', 'Mali S.')
  form.set('email', 'mali@example.com')
  form.set('subject', 'IELTS writing')
  form.set('note', 'Please keep me posted.')
  return form
}

describe('beta interest responses', () => {
  test('uses a custom native failure redirect with location, no-store, and a secure restoration cookie', () => {
    const response = createBetaInterestResponse(
      new Request('https://tutorpal.io/api/beta-interest', { method: 'POST' }),
      { status: 400, message: 'Check your form.' },
      formData(),
    )

    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe('https://tutorpal.io/?beta=error')
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(response.headers.get('set-cookie')).toContain('tutorpal-beta-form=')
    expect(response.headers.get('set-cookie')).toContain('Max-Age=300')
    expect(response.headers.get('set-cookie')).toContain('SameSite=Lax')
    expect(response.headers.get('set-cookie')).toContain('Secure')
  })

  test('keeps native HTTP development cookies usable and clears a restoration cookie after success', () => {
    const success = createBetaInterestResponse(
      new Request('http://localhost:5180/api/beta-interest', { method: 'POST' }),
      { status: 200, message: 'Thanks.' },
      formData(),
    )

    expect(success.status).toBe(303)
    expect(success.headers.get('location')).toBe('http://localhost:5180/?beta=success')
    expect(success.headers.get('cache-control')).toBe('no-store')
    expect(success.headers.get('set-cookie')).toContain('Max-Age=0')
    expect(success.headers.get('set-cookie')).not.toContain('Secure')
  })

  test('does not send a restoration cookie to JSON failures', () => {
    const response = createBetaInterestResponse(
      new Request('https://tutorpal.io/api/beta-interest', { method: 'POST', headers: { Accept: 'application/json' } }),
      { status: 400, message: 'Check your form.' },
      null,
    )

    expect(response.status).toBe(400)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(response.headers.get('set-cookie')).toBeNull()
  })

  test('returns a structured 400 without a cookie for a malformed JSON POST body', async () => {
    const response = await handleBetaInterestPost(
      new Request('https://tutorpal.io/api/beta-interest', {
        method: 'POST',
        headers: { Accept: 'application/json', 'content-type': 'application/json' },
        body: '{"name":',
      }),
    )

    expect(response.status).toBe(400)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(response.headers.get('set-cookie')).toBeNull()
    await expect(response.json()).resolves.toEqual({
      status: 400,
      message: 'We could not read that submission. Please check the form and try again.',
    })
  })

  test('redirects malformed native bodies without creating a restoration cookie', async () => {
    const response = await handleBetaInterestPost(
      new Request('https://tutorpal.io/api/beta-interest', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{"name":',
      }),
    )

    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe('https://tutorpal.io/?beta=error')
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(response.headers.get('set-cookie')).toBeNull()
  })
})
