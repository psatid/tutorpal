import { useEffect, useRef, useState } from 'react'
import type { TourId } from '../lib/marketing-copy'
import { useMarketingLanguage } from './marketing-language'

export function WorkflowSection() {
  const { copy } = useMarketingLanguage()
  const listRef = useRef<HTMLOListElement>(null)
  const [activeId, setActiveId] = useState<TourId>('classes')
  const tourItems = copy.workflow.items

  useEffect(() => {
    const items = Array.from(listRef.current?.querySelectorAll<HTMLElement>('.tour-list-item') ?? [])
    if (!items.length) return

    const workflowSection = listRef.current?.closest<HTMLElement>('.workflow-section')
    workflowSection?.classList.add('has-pinned-stage')
    const supportsObserver = 'IntersectionObserver' in window
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduceMotion || !supportsObserver) {
      items.forEach((item) => item.classList.add('is-revealed'))
    }

    let revealObserver: IntersectionObserver | undefined
    let activeObserver: IntersectionObserver | undefined

    if (!reduceMotion && supportsObserver) {
      revealObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('is-revealed')
          revealObserver?.unobserve(entry.target)
        }
      }, { threshold: 0.2 })

      items.forEach((item) => revealObserver?.observe(item))
    }

    if (supportsObserver) {
      activeObserver = new IntersectionObserver((entries) => {
        const activeEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        const nextId = activeEntry?.target.getAttribute('data-tour-id') as TourId | null
        if (nextId) setActiveId(nextId)
      }, { rootMargin: '-32% 0px -32% 0px', threshold: [0.05, 0.2, 0.5] })

      items.forEach((item) => activeObserver?.observe(item))
    }

    return () => {
      revealObserver?.disconnect()
      activeObserver?.disconnect()
      workflowSection?.classList.remove('has-pinned-stage')
    }
  }, [])

  const activeItem = tourItems.find((item) => item.id === activeId) ?? tourItems[0]

  return (
    <section className="workflow-section" id="workflow" aria-labelledby="workflow-title">
      <div className="section-heading workflow-heading">
        <h2 id="workflow-title">{copy.workflow.title}</h2>
        <p>{copy.workflow.description}</p>
      </div>

      <div className="tour-layout">
        <div className="tour-preview-column">
          <div className="tour-preview" id="tour-preview">
            <div className="tour-preview-bar">
              <span className="tour-preview-brand">TutorPal</span>
              <span className="tour-preview-state">{activeItem.label}</span>
            </div>
            <div className="tour-preview-stage">
              {tourItems.filter((item) => item.image).map((item) => (
                <img
                  className={`tour-shot${activeId === item.id ? ' is-active' : ''}`}
                  key={item.id}
                  src={item.image}
                  alt={item.alt}
                  aria-hidden={activeId !== item.id}
                  width={822}
                  height={781}
                />
              ))}
              <ConnectedPreview active={activeId === 'connected'} captions={copy.workflow.connectedCaptions} />
            </div>
          </div>
          <p className="tour-caption">{copy.workflow.caption}</p>
        </div>

        <ol className="tour-list" ref={listRef}>
          {tourItems.map((item) => (
            <li
              className={`tour-list-item${activeId === item.id ? ' is-active' : ''}`}
              data-tour-id={item.id}
              key={item.id}
            >
              <button
                aria-controls="tour-preview"
                aria-pressed={activeId === item.id}
                className="tour-row"
                onClick={() => setActiveId(item.id)}
                type="button"
              >
                <span className="tour-row-copy">
                  <span className="tour-row-label">{item.label}</span>
                  <strong className="tour-row-title">{item.title}</strong>
                  <span className="tour-row-summary">{item.copy}</span>
                </span>
                <span className="tour-row-mark" aria-hidden="true">+</span>
              </button>
              {item.image ? (
                <div className="tour-mobile-preview" aria-hidden="true">
                  <img src={item.image} alt="" width={822} height={781} />
                </div>
              ) : null}
              {item.id === 'connected' ? <ConnectedPreview active captions={copy.workflow.connectedCaptions} mobile /> : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function ConnectedPreview({
  active,
  captions,
  mobile = false,
}: {
  active: boolean
  captions: { day: string; week: string; setup: string; class: string }
  mobile?: boolean
}) {
  return (
    <div className={`connected-preview${mobile ? ' mobile-connected-preview' : ''}${active ? ' is-active' : ''}`} aria-hidden={mobile || !active}>
      <div className="connected-preview-grid">
        <figure>
          <img src="/product-previews/home.jpg" alt="" width={822} height={781} />
          <figcaption>{captions.day}</figcaption>
        </figure>
        <figure>
          <img src="/product-previews/schedules.jpg" alt="" width={822} height={781} />
          <figcaption>{captions.week}</figcaption>
        </figure>
        <figure>
          <img src="/product-previews/courses.jpg" alt="" width={822} height={781} />
          <figcaption>{captions.setup}</figcaption>
        </figure>
        <figure>
          <img src="/product-previews/classes.jpg" alt="" width={822} height={781} />
          <figcaption>{captions.class}</figcaption>
        </figure>
      </div>
    </div>
  )
}
