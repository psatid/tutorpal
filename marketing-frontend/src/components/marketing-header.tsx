import { MarketingLanguageSwitch, useMarketingLanguage } from './marketing-language'

const portalUrl = import.meta.env.PUBLIC_PORTAL_URL

export function MarketingHeader() {
  const { copy } = useMarketingLanguage()

  return (
    <header className="site-header">
      <div className="header-inner">
        <a className="wordmark" href="/" aria-label={copy.header.homeLabel}>
          <span aria-hidden="true" className="wordmark-mark">T</span>
          TutorPal
        </a>
        <nav className="desktop-nav" aria-label={copy.header.primaryNavLabel}>
          <a href="#product">{copy.header.product}</a>
          <a href="#workflow">{copy.header.workflow}</a>
          <a href="#beta">{copy.header.beta}</a>
        </nav>
        <div className="header-actions">
          <MarketingLanguageSwitch />
          {portalUrl ? <a className="portal-link" href={portalUrl}>{copy.header.portalLogin}</a> : null}
          <a className="button button-compact" href="#beta">{copy.header.joinBeta}</a>
        </div>
        <details className="mobile-menu">
          <summary aria-label={copy.header.mobileMenuLabel}><span /><span /><span /></summary>
          <nav aria-label={copy.header.mobileNavLabel}>
            <a href="#product">{copy.header.product}</a>
            <a href="#workflow">{copy.header.workflow}</a>
            <a href="#beta">{copy.header.joinBeta}</a>
            {portalUrl ? <a href={portalUrl}>{copy.header.portalLogin}</a> : null}
            <MarketingLanguageSwitch mobile />
          </nav>
        </details>
      </div>
    </header>
  )
}
