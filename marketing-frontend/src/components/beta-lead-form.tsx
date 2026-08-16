import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useMarketingLanguage } from './marketing-language'

type NativeStatus = 'success' | 'error' | undefined

type FormStatus = {
  tone: 'error' | 'success'
  message: string
} | null

const turnstileSiteKey = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY
const RESTORE_COOKIE = 'tutorpal-beta-form'
const FIELD_ORDER = ['name', 'email', 'subject', 'note', 'consent', 'turnstile'] as const

type FieldName = (typeof FIELD_ORDER)[number]
type FieldErrors = Partial<Record<FieldName, string>>

type RestorableFields = Record<'name' | 'email' | 'subject' | 'note', string>

function hasFieldErrors(fieldErrors: FieldErrors) {
  return FIELD_ORDER.some((field) => fieldErrors[field])
}

function readRestorableFields(): RestorableFields | null {
  const encoded = document.cookie.split('; ').find((entry) => entry.startsWith(`${RESTORE_COOKIE}=`))?.split('=')[1]
  if (!encoded) return null
  try {
    const json = new TextDecoder().decode(Uint8Array.from(atob(encoded.replace(/-/g, '+').replace(/_/g, '/')), (character) => character.charCodeAt(0)))
    const parsed = JSON.parse(json) as Partial<RestorableFields>
    return {
      name: parsed.name ?? '',
      email: parsed.email ?? '',
      subject: parsed.subject ?? '',
      note: parsed.note ?? '',
    }
  } catch {
    return null
  }
}

export function BetaLeadForm({ nativeStatus }: { nativeStatus: NativeStatus }) {
  const { copy } = useMarketingLanguage()
  const formCopy = copy.beta.form
  const formRef = useRef<HTMLFormElement>(null)
  const errorSummaryRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<FormStatus>(
    nativeStatus === 'success'
      ? { tone: 'success', message: formCopy.nativeSuccess }
      : nativeStatus === 'error'
        ? { tone: 'error', message: formCopy.nativeError }
        : null,
  )
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (nativeStatus === 'success') {
      setStatus({ tone: 'success', message: formCopy.nativeSuccess })
    } else if (nativeStatus === 'error') {
      setStatus({ tone: 'error', message: formCopy.nativeError })
    }
  }, [formCopy.nativeError, formCopy.nativeSuccess, nativeStatus])

  useEffect(() => {
    if (nativeStatus !== 'error' || !formRef.current) return
    const fields = readRestorableFields()
    if (fields) {
      for (const [name, value] of Object.entries(fields)) {
        const field = formRef.current.elements.namedItem(name)
        if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) field.value = value
      }
    }
    errorSummaryRef.current?.focus()
  }, [nativeStatus])

  useEffect(() => {
    if (!hasFieldErrors(fieldErrors) || !formRef.current) return
    const frame = requestAnimationFrame(() => {
      const firstInvalidField = FIELD_ORDER.find((field) => fieldErrors[field])
      const field = firstInvalidField ? formRef.current?.elements.namedItem(firstInvalidField) : null
      if (field instanceof HTMLElement) {
        field.focus()
        return
      }
      errorSummaryRef.current?.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [fieldErrors])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    setStatus(null)
    setFieldErrors({})
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/beta-interest', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      })
      const result = await response.json() as { message?: string; fieldErrors?: FieldErrors }
      if (!response.ok) {
        if (response.status === 400 && result.fieldErrors) setFieldErrors(result.fieldErrors)
        setStatus({ tone: 'error', message: result.message ?? formCopy.fallbackError })
        return
      }
      form.reset()
      setFieldErrors({})
      setStatus({ tone: 'success', message: result.message ?? formCopy.nativeSuccess })
    } catch {
      setStatus({ tone: 'error', message: formCopy.networkError })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form ref={formRef} className="beta-form" action="/api/beta-interest" method="post" onSubmit={handleSubmit} noValidate>
      <div ref={errorSummaryRef} tabIndex={-1} role={status?.tone === 'error' ? 'alert' : undefined} aria-live={status?.tone === 'error' ? 'assertive' : 'polite'} className={status ? `form-status ${status.tone}` : 'form-status'}>{status?.message}</div>
      <div className="form-field"><label htmlFor="beta-name">{formCopy.name} <span aria-hidden="true">*</span></label><input id="beta-name" name="name" autoComplete="name" required aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? 'beta-name-error' : undefined} />{fieldErrors.name ? <p className="field-error" id="beta-name-error">{fieldErrors.name}</p> : null}</div>
      <div className="form-field"><label htmlFor="beta-email">{formCopy.email} <span aria-hidden="true">*</span></label><input id="beta-email" name="email" type="email" autoComplete="email" inputMode="email" required aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? 'beta-email-error' : undefined} />{fieldErrors.email ? <p className="field-error" id="beta-email-error">{fieldErrors.email}</p> : null}</div>
      <div className="form-field"><label htmlFor="beta-subject">{formCopy.subject} <span aria-hidden="true">*</span></label><input id="beta-subject" name="subject" autoComplete="organization-title" required aria-invalid={Boolean(fieldErrors.subject)} aria-describedby={fieldErrors.subject ? 'beta-subject-error' : undefined} />{fieldErrors.subject ? <p className="field-error" id="beta-subject-error">{fieldErrors.subject}</p> : null}</div>
      <div className="form-field"><label htmlFor="beta-note">{formCopy.note} <span className="optional">{formCopy.optional}</span></label><textarea id="beta-note" name="note" rows={3} aria-invalid={Boolean(fieldErrors.note)} aria-describedby={fieldErrors.note ? 'beta-note-error' : undefined} />{fieldErrors.note ? <p className="field-error" id="beta-note-error">{fieldErrors.note}</p> : null}</div>
      <label className="consent"><input id="beta-consent" name="consent" type="checkbox" value="true" required aria-invalid={Boolean(fieldErrors.consent)} aria-describedby={fieldErrors.consent ? 'beta-consent-error' : undefined} /><span>{formCopy.consentBefore} <a href="/privacy">{copy.common.privacy}</a>{formCopy.consentAfter}</span></label>
      {fieldErrors.consent ? <p className="field-error consent-error" id="beta-consent-error">{fieldErrors.consent}</p> : null}
      {turnstileSiteKey ? <div className="turnstile-wrap" aria-describedby={fieldErrors.turnstile ? 'beta-turnstile-error' : undefined}><div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-response-field-name="turnstileToken" /></div> : <p className="configuration-message" role="status">{formCopy.configuration}</p>}
      {fieldErrors.turnstile ? <p className="field-error" id="beta-turnstile-error">{fieldErrors.turnstile}</p> : null}
      <button className="button form-submit" type="submit" disabled={isSubmitting || !turnstileSiteKey}>{isSubmitting ? formCopy.sending : formCopy.joinBeta}</button>
    </form>
  )
}
