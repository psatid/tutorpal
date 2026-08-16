import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { marketingCopy, type MarketingLanguage } from '../lib/marketing-copy'

type MarketingLanguageContextValue = {
  language: MarketingLanguage
  copy: (typeof marketingCopy)[MarketingLanguage]
  toggleLanguage: () => void
}

const MarketingLanguageContext = createContext<MarketingLanguageContextValue | null>(null)

export function MarketingLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<MarketingLanguage>('en')

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  function toggleLanguage() {
    setLanguage((current) => current === 'en' ? 'th' : 'en')
  }

  return (
    <MarketingLanguageContext.Provider value={{ language, copy: marketingCopy[language], toggleLanguage }}>
      {children}
    </MarketingLanguageContext.Provider>
  )
}

export function useMarketingLanguage() {
  const context = useContext(MarketingLanguageContext)
  if (!context) throw new Error('useMarketingLanguage must be used within MarketingLanguageProvider')
  return context
}

export function MarketingLanguageSwitch({ mobile = false }: { mobile?: boolean }) {
  const { language, copy, toggleLanguage } = useMarketingLanguage()

  return (
    <button
      className={`language-switch${mobile ? ' mobile-language-switch' : ''}`}
      type="button"
      onClick={toggleLanguage}
      aria-label={`${copy.header.languageLabel}: ${copy.header.switchLanguage}`}
    >
      {language === 'en' ? 'ไทย' : 'English'}
    </button>
  )
}
