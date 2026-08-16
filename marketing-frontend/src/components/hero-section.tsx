import { useMarketingLanguage } from './marketing-language'

export function HeroSection() {
  const { copy } = useMarketingLanguage()

  return (
    <section className="hero" id="product" aria-labelledby="hero-title">
      <div className="hero-grid">
        <div className="hero-copy">
          <p className="hero-kicker">{copy.hero.kicker}</p>
          <h1 id="hero-title">
            <span>{copy.hero.titleFirst}</span>
            <span>{copy.hero.titleSecond}</span>
          </h1>
          <p className="hero-summary">{copy.hero.summary}</p>
          <div className="hero-actions">
            <a className="button" href="#beta">{copy.hero.joinBeta}</a>
            <a className="text-link" href="#workflow">{copy.hero.seeApp}</a>
          </div>
        </div>
        <div className="hero-visual" aria-label={copy.hero.previewLabel}>
          <img
            src="/product-previews/home.jpg"
            alt={copy.hero.previewAlt}
            width={822}
            height={781}
            fetchPriority="high"
          />
        </div>
      </div>
    </section>
  )
}
