import { useMarketingLanguage } from './marketing-language'

export function FaqSection() {
  const { copy } = useMarketingLanguage()

  return (
    <section className="faq-section" id="faq" aria-labelledby="faq-title">
      <div className="faq-layout">
        <div className="section-heading">
          <h2 id="faq-title">{copy.faq.title}</h2>
          <p>{copy.faq.description}</p>
        </div>
        <div className="faq-list">
          {copy.faq.items.map((faq) => (
            <details className="faq-item" key={faq.question}>
              <summary>{faq.question}<span aria-hidden="true">+</span></summary>
              <div className="faq-answer">
                <div className="faq-answer-content">
                  <p>{faq.answer}</p>
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
