import { useEffect, useRef } from 'react'
import { useMarketingLanguage } from './marketing-language'

export function WhatYouGetSection() {
  const { copy } = useMarketingLanguage()
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const items = Array.from(sectionRef.current?.querySelectorAll<HTMLElement>('.benefit-item') ?? [])
    if (!items.length) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      items.forEach((item) => item.classList.add('is-revealed'))
      return
    }

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('is-revealed')
        observer.unobserve(entry.target)
      }
    }, { threshold: 0.18 })

    items.forEach((item) => observer.observe(item))
    return () => observer.disconnect()
  }, [])

  return (
    <section className="benefits-section" id="benefits" ref={sectionRef} aria-labelledby="benefits-title">
      <div className="benefits-layout">
        <div className="section-heading benefits-heading">
          <h2 id="benefits-title">{copy.benefits.title}</h2>
          <p>{copy.benefits.description}</p>
        </div>
        <div className="benefit-grid">
          {copy.benefits.items.map((benefit) => (
            <article className="benefit-item" key={benefit.title}>
              <h3>{benefit.title}</h3>
              <p>{benefit.copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
