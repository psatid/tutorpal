import { createFileRoute } from '@tanstack/react-router'
import { submitBetaInterest, type BetaResponse } from '../../lib/beta-interest.server'

const RESTORE_COOKIE = 'tutorpal-beta-form'
const RESTORABLE_FIELDS = ['name', 'email', 'subject', 'note'] as const
const FORM_DATA_FAILURE: BetaResponse = {
  status: 400,
  message: 'We could not read that submission. Please check the form and try again.',
}

function cookieAttributes(request: Request, maxAge: number) {
  return `Max-Age=${maxAge}; Path=/; SameSite=Lax${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`
}

function cookieValue(request: Request, formData: FormData) {
  const fields = Object.fromEntries(RESTORABLE_FIELDS.map((field) => {
    const value = formData.get(field)
    return [field, typeof value === 'string' ? value.slice(0, field === 'note' ? 1_000 : 320) : '']
  }))
  const bytes = new TextEncoder().encode(JSON.stringify(fields))
  const encoded = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${RESTORE_COOKIE}=${encoded}; ${cookieAttributes(request, 300)}`
}

function clearCookie(request: Request) {
  return `${RESTORE_COOKIE}=; ${cookieAttributes(request, 0)}`
}

function acceptsJson(request: Request) {
  return request.headers.get('Accept')?.includes('application/json') ?? false
}

export function createBetaInterestResponse(request: Request, result: BetaResponse, formData: FormData | null) {
  const headers = new Headers({ 'cache-control': 'no-store' })
  if (result.status === 200) headers.set('set-cookie', clearCookie(request))

  if (acceptsJson(request)) return Response.json(result, { status: result.status, headers })

  if (result.status !== 200 && formData) headers.set('set-cookie', cookieValue(request, formData))
  const next = new URL('/', request.url)
  next.searchParams.set('beta', result.status === 200 ? 'success' : 'error')
  headers.set('location', next.toString())
  return new Response(null, { status: 303, headers })
}

export async function handleBetaInterestPost(request: Request) {
  let formData: FormData | null = null
  if (!acceptsJson(request)) {
    try {
      formData = await request.clone().formData()
    } catch {
      return createBetaInterestResponse(request, FORM_DATA_FAILURE, null)
    }
  }

  return createBetaInterestResponse(request, await submitBetaInterest(request), formData)
}

export const Route = createFileRoute('/api/beta-interest')({
  server: {
    handlers: {
      POST: async ({ request }) => handleBetaInterestPost(request),
    },
  },
})
