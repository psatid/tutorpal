export type BetaInterest = {
  name: string
  email: string
  subject: string
  note: string
  consent: true
  turnstileToken: string
}

export type ValidationResult =
  | { success: true; data: BetaInterest }
  | { success: false; message: string; fieldErrors: Record<string, string> }

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_NAME_LENGTH = 160
const MAX_EMAIL_LENGTH = 320
const MAX_SUBJECT_LENGTH = 160
const MAX_NOTE_LENGTH = 1_000
const MAX_TURNSTILE_TOKEN_LENGTH = 4_096

function textValue(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

export function normalizeEmail(email: string) {
  return email.trim().toLocaleLowerCase('en-US')
}

export function validateBetaInterest(formData: FormData): ValidationResult {
  const name = textValue(formData, 'name')
  const email = normalizeEmail(textValue(formData, 'email'))
  const subject = textValue(formData, 'subject')
  const note = textValue(formData, 'note')
  const consent = formData.get('consent') === 'true'
  const turnstileToken = textValue(formData, 'turnstileToken')
  const fieldErrors: Record<string, string> = {}

  if (!name) fieldErrors.name = 'Enter your name.'
  else if (name.length > MAX_NAME_LENGTH) fieldErrors.name = 'Keep your name under 160 characters.'
  if (!email || !EMAIL_PATTERN.test(email)) fieldErrors.email = 'Enter a valid email address.'
  else if (email.length > MAX_EMAIL_LENGTH) fieldErrors.email = 'Keep your email under 320 characters.'
  if (!subject) fieldErrors.subject = 'Tell us what you teach.'
  else if (subject.length > MAX_SUBJECT_LENGTH) fieldErrors.subject = 'Keep your teaching area under 160 characters.'
  if (note.length > MAX_NOTE_LENGTH) fieldErrors.note = 'Keep your note under 1,000 characters.'
  if (!consent) fieldErrors.consent = 'Consent is required to join the beta.'
  if (!turnstileToken) fieldErrors.turnstile = 'Please complete the verification check.'
  else if (turnstileToken.length > MAX_TURNSTILE_TOKEN_LENGTH) fieldErrors.turnstile = 'Verification could not be completed. Please try again.'

  if (Object.keys(fieldErrors).length) {
    return { success: false, message: 'Please complete the required fields and try again.', fieldErrors }
  }

  return { success: true, data: { name, email, subject, note, consent: true, turnstileToken } }
}

export function rateLimitKeys(ip: string, email: string, now = new Date()) {
  const hour = now.toISOString().slice(0, 13)
  return {
    attempts: `beta:attempt:${ip}:${hour}`,
    successfulEmail: `beta:email:${normalizeEmail(email)}`,
  }
}

export function secondsUntilNextHour(now = new Date()) {
  return Math.max(1, Math.ceil((60 * 60 * 1000 - (now.getMinutes() * 60_000 + now.getSeconds() * 1_000 + now.getMilliseconds())) / 1_000))
}

export function hasReachedLimit(currentValue: string | null, limit: number) {
  return Number.parseInt(currentValue ?? '0', 10) >= limit
}
