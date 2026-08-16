import '@tanstack/react-start/server-only'

import { env } from 'cloudflare:workers'
import { hasReachedLimit, rateLimitKeys, secondsUntilNextHour, validateBetaInterest } from './beta-interest'

const ATTEMPT_LIMIT = 5
const SUCCESS_EMAIL_TTL_SECONDS = 24 * 60 * 60

export type BetaResponse = { status: number; message: string; fieldErrors?: Record<string, string> }

type TurnstileResult = 'verified' | 'rejected' | 'unavailable'

const INTEGRATION_FAILURE_MESSAGE = 'Beta sign-up is temporarily unavailable. Please try again shortly.'
const STORAGE_FAILURE_MESSAGE = 'Beta sign-up is temporarily unavailable. Please try again shortly.'
const FORM_DATA_FAILURE: BetaResponse = {
  status: 400,
  message: 'We could not read that submission. Please check the form and try again.',
}

function getClientIp(request: Request) {
  return request.headers.get('CF-Connecting-IP') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

function integrationConfig() {
  return {
    webhookUrl: env.DISCORD_WEBHOOK_URL,
    turnstileSecret: env.TURNSTILE_SECRET_KEY,
    rateLimitKv: env.BETA_RATE_LIMIT_KV,
  }
}

async function verifyTurnstile(token: string, ip: string, secret: string): Promise<TurnstileResult> {
  try {
    const body = new URLSearchParams({ secret, response: token, remoteip: ip })
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body })
    if (!response.ok) return 'unavailable'

    const result = await response.json() as { success?: unknown }
    if (result.success === true) return 'verified'
    if (result.success === false) return 'rejected'
    return 'unavailable'
  } catch {
    return 'unavailable'
  }
}

async function deliverToDiscord(webhookUrl: string, interest: { name: string; email: string; subject: string; note: string }) {
  const content = [
    '**TutorPal beta interest**',
    `Name: ${interest.name}`,
    `Email: ${interest.email}`,
    `Subject: ${interest.subject}`,
    interest.note ? `Note: ${interest.note}` : null,
  ].filter(Boolean).join('\n')
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ content, allowed_mentions: { parse: [] } }),
    })
    if (!response.ok) return false
    if (response.headers.get('content-type')?.includes('application/json')) await response.json()
    return true
  } catch {
    return false
  }
}

export async function submitBetaInterest(request: Request): Promise<BetaResponse> {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return FORM_DATA_FAILURE
  }

  const validation = validateBetaInterest(formData)
  if (!validation.success) {
    return { status: 400, message: validation.message, fieldErrors: validation.fieldErrors }
  }

  const config = integrationConfig()
  if (!config.webhookUrl || !config.turnstileSecret || !config.rateLimitKv) {
    return { status: 502, message: 'Beta sign-up is not configured in this environment yet.' }
  }

  const origin = request.headers.get('Origin')
  if (origin && origin !== new URL(request.url).origin) {
    return { status: 403, message: 'Verification failed. Please try again from the TutorPal website.' }
  }

  const ip = getClientIp(request)
  const keys = rateLimitKeys(ip, validation.data.email)
  let attempts: string | null
  try {
    attempts = await config.rateLimitKv.get(keys.attempts)
  } catch {
    return { status: 503, message: STORAGE_FAILURE_MESSAGE }
  }
  if (hasReachedLimit(attempts, ATTEMPT_LIMIT)) {
    return { status: 429, message: 'Too many attempts from this network. Please try again in an hour.' }
  }
  try {
    await config.rateLimitKv.put(keys.attempts, String(Number.parseInt(attempts ?? '0', 10) + 1), { expirationTtl: secondsUntilNextHour() })
  } catch {
    return { status: 503, message: STORAGE_FAILURE_MESSAGE }
  }

  const turnstileResult = await verifyTurnstile(validation.data.turnstileToken, ip, config.turnstileSecret)
  if (turnstileResult === 'unavailable') {
    return { status: 502, message: INTEGRATION_FAILURE_MESSAGE }
  }
  if (turnstileResult === 'rejected') {
    return { status: 403, message: 'Verification failed. Please try again.' }
  }

  let successfulEmail: string | null
  try {
    successfulEmail = await config.rateLimitKv.get(keys.successfulEmail)
  } catch {
    return { status: 503, message: STORAGE_FAILURE_MESSAGE }
  }
  if (successfulEmail) {
    return { status: 429, message: 'This email has already requested beta access. Please check your inbox.' }
  }

  const delivered = await deliverToDiscord(config.webhookUrl, validation.data)
  if (!delivered) {
    return { status: 502, message: 'We could not send your interest right now. Please try again shortly.' }
  }
  try {
    await config.rateLimitKv.put(keys.successfulEmail, '1', { expirationTtl: SUCCESS_EMAIL_TTL_SECONDS })
  } catch {
    return { status: 503, message: STORAGE_FAILURE_MESSAGE }
  }

  return { status: 200, message: 'Thanks. Your beta interest is on its way to the TutorPal team.' }
}
