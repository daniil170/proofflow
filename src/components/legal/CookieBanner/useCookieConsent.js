import { useCallback, useEffect, useState } from 'react'

export const COOKIE_CONSENT_KEY = 'proofflow_cookie_consent'
export const COOKIE_CONSENT_EVENT = 'proofflow_cookie_consent_change'
export const OPEN_COOKIE_SETTINGS_EVENT = 'proofflow_open_cookie_settings'

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000

export const DEFAULT_CONSENT = {
  essential: true,
  analytics: false,
  functional: false,
}

export const getStoredConsent = () => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      window.localStorage.removeItem(COOKIE_CONSENT_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export const openCookieSettings = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OPEN_COOKIE_SETTINGS_EVENT))
  }
}

export const useCookieConsent = () => {
  const [consentData, setConsentData] = useState(() => getStoredConsent())
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  useEffect(() => {
    const handleConsentChange = () => {
      setConsentData(getStoredConsent())
    }

    const handleOpenSettings = () => {
      setIsSettingsOpen(true)
    }

    window.addEventListener(COOKIE_CONSENT_EVENT, handleConsentChange)
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, handleOpenSettings)

    return () => {
      window.removeEventListener(COOKIE_CONSENT_EVENT, handleConsentChange)
      window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, handleOpenSettings)
    }
  }, [])

  const saveConsent = useCallback((type, categories) => {
    if (typeof window === 'undefined') return

    const now = Date.now()
    const record = {
      consent: type,
      categories: {
        essential: true,
        analytics: Boolean(categories?.analytics),
        functional: Boolean(categories?.functional),
      },
      timestamp: now,
      expiresAt: now + ONE_YEAR_MS,
    }

    try {
      window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(record))
    } catch {
      // storage unavailable / quota exceeded
    }

    setConsentData(record)
    setIsSettingsOpen(false)
    window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: record }))
  }, [])

  const acceptAll = useCallback(() => {
    saveConsent('all', { essential: true, analytics: true, functional: true })
  }, [saveConsent])

  const acceptNecessary = useCallback(() => {
    saveConsent('necessary', { essential: true, analytics: false, functional: false })
  }, [saveConsent])

  const saveCustom = useCallback(
    (categories) => {
      saveConsent('custom', categories)
    },
    [saveConsent],
  )

  const isBannerVisible = !consentData

  return {
    consentData,
    isBannerVisible,
    isSettingsOpen,
    setIsSettingsOpen,
    acceptAll,
    acceptNecessary,
    saveCustom,
    openSettings: () => setIsSettingsOpen(true),
  }
}
