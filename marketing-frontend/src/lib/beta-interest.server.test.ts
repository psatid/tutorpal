import { afterAll, beforeEach, describe, expect, mock, test } from 'bun:test'

type PutOptions = { expirationTtl: number }

class MemoryKv {
  values = new Map<string, string>()
  puts: Array<{ key: string; value: string; options: PutOptions }> = []
  failGet = false
  failPut = false

  async get(key: string) {
    if (this.failGet) throw new Error('KV get failed')
    return this.values.get(key) ?? null
  }

  async put(key: string, value: string, options: PutOptions) {
    if (this.failPut) throw new Error('KV put failed')
    this.values.set(key, value)
    this.puts.push({ key, value, options })
  }
}

const env: {
  DISCORD_WEBHOOK_URL?: string
  TURNSTILE_SECRET_KEY?: string
  BETA_RATE_LIMIT_KV?: MemoryKv
} = {}

mock.module('cloudflare:workers', () => ({ env }))
mock.module('@tanstack/react-start/server-only', () => ({}))

const { submitBetaInterest } = await import('./beta-interest.server')
const originalFetch = globalThis.fetch

function request(fields: Record<string, string> = {}, headers: HeadersInit = {}) {
  const body = new FormData()
  for (const [key, value] of Object.entries({
    name: 'Mali S.',
    email: 'mali@example.com',
    subject: 'IELTS writing',
    consent: 'true',
    turnstileToken: 'token',
    ...fields,
  })) body.set(key, value)
  return new Request('https://tutorpal.io/api/beta-interest', { method: 'POST', headers, body })
}

function configure() {
  const kv = new MemoryKv()
  env.DISCORD_WEBHOOK_URL = 'https://discord.example/webhook'
  env.TURNSTILE_SECRET_KEY = 'turnstile-secret'
  env.BETA_RATE_LIMIT_KV = kv
  return kv
}

beforeEach(() => {
  env.DISCORD_WEBHOOK_URL = undefined
  env.TURNSTILE_SECRET_KEY = undefined
  env.BETA_RATE_LIMIT_KV = undefined
  globalThis.fetch = mock(async () => new Response(JSON.stringify({ success: true }), { status: 200 })) as typeof fetch
})

afterAll(() => {
  globalThis.fetch = originalFetch
})

describe('beta interest delivery', () => {
  test('returns a safe configuration failure before trying delivery', async () => {
    const result = await submitBetaInterest(request())

    expect(result).toMatchObject({ status: 502, message: 'Beta sign-up is not configured in this environment yet.' })
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  test('returns validation and bot-origin failures without Discord delivery', async () => {
    configure()

    const invalid = await submitBetaInterest(request({ name: '', consent: '', turnstileToken: '' }))
    expect(invalid).toMatchObject({ status: 400, fieldErrors: { name: expect.any(String), consent: expect.any(String), turnstile: expect.any(String) } })

    const bot = await submitBetaInterest(request({}, { Origin: 'https://evil.example' }))
    expect(bot.status).toBe(403)
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  test('returns 403 only for a confirmed rejected Turnstile token before Discord delivery', async () => {
    configure()
    globalThis.fetch = mock(async () => new Response(JSON.stringify({ success: false }), { status: 200 })) as typeof fetch

    const result = await submitBetaInterest(request())

    expect(result.status).toBe(403)
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })

  test('returns 502 when Turnstile transport, status, or JSON parsing fails', async () => {
    configure()
    globalThis.fetch = mock(async () => { throw new Error('Turnstile unavailable') }) as typeof fetch
    expect((await submitBetaInterest(request())).status).toBe(502)

    configure()
    globalThis.fetch = mock(async () => new Response('unavailable', { status: 503 })) as typeof fetch
    expect((await submitBetaInterest(request())).status).toBe(502)

    configure()
    globalThis.fetch = mock(async () => new Response('not json', { status: 200 })) as typeof fetch
    expect((await submitBetaInterest(request())).status).toBe(502)
  })

  test('applies network and normalized-email limits before delivery', async () => {
    const kv = configure()
    const attempted = await submitBetaInterest(request())
    expect(attempted.status).toBe(200)

    const limitedByEmail = await submitBetaInterest(request({ email: ' MALI@EXAMPLE.COM ' }))
    expect(limitedByEmail.status).toBe(429)

    const attemptKey = [...kv.values.keys()].find((key) => key.startsWith('beta:attempt:'))!
    kv.values.set(attemptKey, '5')
    const limitedByNetwork = await submitBetaInterest(request({ email: 'other@example.com' }))
    expect(limitedByNetwork.status).toBe(429)
    expect(globalThis.fetch).toHaveBeenCalledTimes(3)
  })

  test('returns 502 when Discord fails or returns malformed JSON, and sends exactly one Discord request on success', async () => {
    configure()
    globalThis.fetch = mock(async (input: RequestInfo | URL) => {
      const url = input.toString()
      return new Response(JSON.stringify(url.includes('discord.example') ? { error: 'unavailable' } : { success: true }), {
        status: url.includes('discord.example') ? 500 : 200,
      })
    }) as typeof fetch

    const failed = await submitBetaInterest(request())
    expect(failed.status).toBe(502)
    expect(globalThis.fetch).toHaveBeenCalledTimes(2)

    configure()
    globalThis.fetch = mock(async (input: RequestInfo | URL) => {
      if (input.toString().includes('discord.example')) {
        return new Response('not json', { status: 200, headers: { 'content-type': 'application/json' } })
      }
      return new Response(JSON.stringify({ success: true }), { status: 200 })
    }) as typeof fetch
    expect((await submitBetaInterest(request())).status).toBe(502)

    configure()
    globalThis.fetch = mock(async (input: RequestInfo | URL) => {
      if (input.toString().includes('discord.example')) throw new Error('Discord unavailable')
      return new Response(JSON.stringify({ success: true }), { status: 200 })
    }) as typeof fetch
    expect((await submitBetaInterest(request())).status).toBe(502)

    configure()
    globalThis.fetch = mock(async () => new Response(JSON.stringify({ success: true }), { status: 200 })) as typeof fetch
    const succeeded = await submitBetaInterest(request())

    expect(succeeded.status).toBe(200)
    expect(globalThis.fetch).toHaveBeenCalledTimes(2)
    expect(globalThis.fetch).toHaveBeenLastCalledWith(
      'https://discord.example/webhook',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  test('returns 503 when KV reads or writes fail', async () => {
    const getFailure = configure()
    getFailure.failGet = true
    expect((await submitBetaInterest(request())).status).toBe(503)
    expect(globalThis.fetch).not.toHaveBeenCalled()

    const putFailure = configure()
    putFailure.failPut = true
    expect((await submitBetaInterest(request())).status).toBe(503)
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })
})
