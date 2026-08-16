import { useMarketingLanguage } from './marketing-language'

export function Footer() {
  const { copy } = useMarketingLanguage()

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <a className="wordmark" href="/" aria-label={copy.header.homeLabel}><span aria-hidden="true" className="wordmark-mark">T</span>TutorPal</a>
        <p>{copy.footer.description}</p>
        <a href="/privacy">{copy.common.privacy}</a>
      </div>
    </footer>
  )
}
