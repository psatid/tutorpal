import { MarketingLanguageSwitch, useMarketingLanguage } from './marketing-language'
import { useRef, type KeyboardEvent } from 'react'

const portalUrl = import.meta.env.PUBLIC_PORTAL_URL

export function MarketingHeader({ floating = false }: { floating?: boolean }) {
  const { copy, language } = useMarketingLanguage()
  const explore = language === 'th' ? 'สำรวจ' : 'Explore'
  const mobileMenuRef = useRef<HTMLDetailsElement>(null)

  function closeMobileMenu() {
    mobileMenuRef.current?.removeAttribute('open')
  }

  function handleMobileMenuKeyDown(event: KeyboardEvent<HTMLDetailsElement>) {
    if (event.key !== 'Escape' || !mobileMenuRef.current?.open) return
    event.preventDefault()
    closeMobileMenu()
    mobileMenuRef.current.querySelector<HTMLElement>('summary')?.focus()
  }

  return (
    <header className={`site-header${floating ? ' is-floating' : ''}`}>
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
          <a className="button button-compact" href="#workflow">{explore}</a>
        </div>
        <details ref={mobileMenuRef} className="mobile-menu" onKeyDown={handleMobileMenuKeyDown}>
          <summary aria-label={copy.header.mobileMenuLabel}><span /><span /><span /></summary>
          <nav aria-label={copy.header.mobileNavLabel}>
            <a href="#product" onClick={closeMobileMenu}>{copy.header.product}</a>
            <a href="#workflow" onClick={closeMobileMenu}>{copy.header.workflow}</a>
            <a href="#beta" onClick={closeMobileMenu}>{copy.header.joinBeta}</a>
            {portalUrl ? <a href={portalUrl} onClick={closeMobileMenu}>{copy.header.portalLogin}</a> : null}
            <div onClick={closeMobileMenu}><MarketingLanguageSwitch mobile /></div>
          </nav>
        </details>
      </div>
    </header>
  )
}
