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
    const supportsObserver = 'IntersectionObserver' in window
    if (!supportsObserver) return

    workflowSection?.classList.add('has-pinned-stage')
    const activeObserver = new IntersectionObserver((entries) => {
      const activeEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      const nextId = activeEntry?.target.getAttribute('data-tour-id') as TourId | null
      if (nextId) setActiveId(nextId)
    }, { rootMargin: '-32% 0px -32% 0px', threshold: [0.05, 0.2, 0.5] })

    items.forEach((item) => activeObserver.observe(item))

    return () => {
      activeObserver.disconnect()
      workflowSection?.classList.remove('has-pinned-stage')
    }
  }, [])

  return (
    <section className="workflow-section" id="workflow" aria-labelledby="workflow-title">
      <div className="section-heading workflow-heading">
        <h2 id="workflow-title">{copy.workflow.title}</h2>
        <p>{copy.workflow.description}</p>
      </div>

      <div className="tour-layout">
        <div className="tour-preview-column">
          <div className="tour-preview" id="tour-preview">
            <div className="tour-preview-stage">
              {tourItems.map((item, index) => (
                <img
                  className={`tour-shot${activeId === item.id ? ' is-active' : ''}`}
                  key={item.id}
                  src={item.image}
                  alt={item.alt}
                  aria-hidden={activeId !== item.id}
                  decoding="async"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  width={822}
                  height={781}
                />
              ))}
            </div>
          </div>
          <p className="tour-caption">{copy.workflow.caption}</p>
        </div>

        <ol className="tour-list" ref={listRef}>
          {tourItems.map((item, index) => (
            <li
              className={`tour-list-item${activeId === item.id ? ' is-active' : ''}`}
              data-tour-id={item.id}
              key={item.id}
            >
              <button
                aria-controls="tour-preview"
                aria-current={activeId === item.id ? 'step' : undefined}
                aria-pressed={activeId === item.id}
                className="tour-row"
                onClick={() => setActiveId(item.id)}
                type="button"
              >
                <span className="tour-row-copy">
                  <span className="tour-row-label">{item.progress}</span>
                  <strong className="tour-row-title">{item.title}</strong>
                  <span className="tour-row-summary">{item.copy}</span>
                </span>
              </button>
              <div className="tour-mobile-preview">
                <img
                  src={item.image}
                  alt={item.alt}
                  decoding="async"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  width={822}
                  height={781}
                />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
