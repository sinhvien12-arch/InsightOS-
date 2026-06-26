'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { translations, Lang, TranslationKey } from './i18n'

interface LangState {
  lang:    Lang
  toggle:  () => void
  setLang: (l: Lang) => void
  t:       (key: TranslationKey) => string
}

const LangCtx = createContext<LangState>({
  lang: 'en',
  toggle: () => {},
  setLang: () => {},
  t: (k) => k,
})

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en')

  useEffect(() => {
    const saved = localStorage.getItem('insightos-lang') as Lang | null
    if (saved === 'vi' || saved === 'en') setLang(saved)
  }, [])

  function toggle() {
    const next: Lang = lang === 'en' ? 'vi' : 'en'
    setLang(next)
    localStorage.setItem('insightos-lang', next)
  }

  function switchLang(l: Lang) {
    setLang(l)
    localStorage.setItem('insightos-lang', l)
  }

  function t(key: TranslationKey): string {
    return translations[lang][key] ?? translations.en[key] ?? key
  }

  return <LangCtx.Provider value={{ lang, toggle, setLang: switchLang, t }}>{children}</LangCtx.Provider>
}

export const useLang = () => useContext(LangCtx)
