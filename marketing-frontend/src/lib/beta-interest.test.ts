import { describe, expect, test } from 'bun:test'
import { hasReachedLimit, normalizeEmail, rateLimitKeys, validateBetaInterest } from './beta-interest'

function validForm() {
  const form = new FormData()
  form.set('name', '  Mali S. ')
  form.set('email', ' MALI@EXAMPLE.COM ')
  form.set('subject', 'IELTS writing')
  form.set('consent', 'true')
  form.set('turnstileToken', 'token')
  return form
}

describe('beta interest validation', () => {
  test('normalizes a valid interest', () => {
    const result = validateBetaInterest(validForm())
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toMatchObject({ name: 'Mali S.', email: 'mali@example.com', consent: true })
  })

  test('accepts only the explicit consent and Turnstile field names', () => {
    const form = validForm()
    form.set('consent', 'yes')
    form.delete('turnstileToken')
    form.set('cf-turnstile-response', 'legacy-token')
    const result = validateBetaInterest(form)
    expect(result.success).toBe(false)
    if (!result.success) expect(result.fieldErrors).toMatchObject({ consent: expect.any(String), turnstile: expect.any(String) })
  })

  test('uses normalized emails and windowed attempt keys', () => {
    expect(normalizeEmail(' Tutor@Example.COM ')).toBe('tutor@example.com')
    expect(rateLimitKeys('203.0.113.8', 'Tutor@Example.COM', new Date('2026-08-16T10:30:00Z')).attempts).toBe('beta:attempt:203.0.113.8:2026-08-16T10')
    expect(hasReachedLimit('5', 5)).toBe(true)
  })
})
