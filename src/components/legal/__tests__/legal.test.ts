import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cookiesData } from '../content/cookiesData.js'
import { privacyData } from '../content/privacyData.js'
import { termsData } from '../content/termsData.js'
import {
  COOKIE_CONSENT_KEY,
  getStoredConsent,
} from '../CookieBanner/useCookieConsent.js'

describe('Legal Documents Content & Integrity', () => {
  it('termsData contains all required sections with non-empty content', () => {
    expect(termsData.id).toBe('terms')
    expect(termsData.updatedAt).toContain('2026')
    expect(termsData.sections.length).toBeGreaterThanOrEqual(6)

    const sectionIds = termsData.sections.map((s) => s.id)
    expect(sectionIds).toContain('scope')
    expect(sectionIds).toContain('ip-rights')
    expect(sectionIds).toContain('user-warranties')
    expect(sectionIds).toContain('ai-disclaimer')
    expect(sectionIds).toContain('aup')
    expect(sectionIds).toContain('billing-refunds')

    termsData.sections.forEach((section) => {
      expect(section.title.length).toBeGreaterThan(0)
      expect(section.content.length).toBeGreaterThan(0)
      section.content.forEach((p) => {
        expect(p.trim().length).toBeGreaterThan(0)
        expect(p.toLowerCase()).not.toContain('lorem ipsum')
      })
    })
  })

  it('privacyData guarantees that user data is not used to train public AI models', () => {
    expect(privacyData.id).toBe('privacy')
    expect(privacyData.updatedAt).toContain('2026')
    expect(privacyData.sections.length).toBeGreaterThanOrEqual(6)

    const aiSection = privacyData.sections.find((s) => s.id === 'ai-processing')
    expect(aiSection).toBeDefined()
    const allAiText = (aiSection?.content.join(' ') || '').toLowerCase()
    expect(allAiText).toContain('не используются')
    expect(allAiText).toContain('обучения')

    const ndaSection = privacyData.sections.find((s) => s.id === 'nda-redaction')
    expect(ndaSection).toBeDefined()
    const allNdaText = ndaSection?.content.join(' ') || ''
    expect(allNdaText).toContain('NDA')

    const deletionSection = privacyData.sections.find((s) => s.id === 'storage-deletion')
    expect(deletionSection).toBeDefined()
  })

  it('cookiesData covers Essential, Analytics, and Functional cookies', () => {
    expect(cookiesData.id).toBe('cookies')
    expect(cookiesData.updatedAt).toContain('2026')
    expect(cookiesData.sections.length).toBeGreaterThanOrEqual(4)

    const categoriesSection = cookiesData.sections.find((s) => s.id === 'cookie-categories')
    expect(categoriesSection).toBeDefined()
    const allText = categoriesSection?.content.join(' ') || ''
    expect(allText).toContain('необходимые')
    expect(allText).toContain('Аналитические')
    expect(allText).toContain('Функциональные')
  })
})

describe('Cookie Consent Storage Logic', () => {
  let mockStore: Record<string, string> = {}
  const originalWindow = globalThis.window

  beforeEach(() => {
    mockStore = {}
    const mockLocalStorage = {
      getItem: (key: string) => mockStore[key] ?? null,
      setItem: (key: string, value: string) => {
        mockStore[key] = String(value)
      },
      removeItem: (key: string) => {
        delete mockStore[key]
      },
      clear: () => {
        mockStore = {}
      },
    }

    const mockWindow = {
      localStorage: mockLocalStorage,
      dispatchEvent: () => true,
      addEventListener: () => {},
      removeEventListener: () => {},
    }
    Object.defineProperty(globalThis, 'window', {
      value: mockWindow,
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    globalThis.window = originalWindow
  })

  it('returns null when no consent has been stored', () => {
    expect(getStoredConsent()).toBeNull()
  })

  it('retrieves valid stored consent', () => {
    const record = {
      consent: 'all',
      categories: { essential: true, analytics: true, functional: true },
      timestamp: Date.now(),
      expiresAt: Date.now() + 100000,
    }
    window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(record))

    const loaded = getStoredConsent()
    expect(loaded).toEqual(record)
  })

  it('clears expired consent records automatically', () => {
    const expiredRecord = {
      consent: 'all',
      categories: { essential: true, analytics: true, functional: true },
      timestamp: Date.now() - 200000,
      expiresAt: Date.now() - 1000,
    }
    window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(expiredRecord))

    const loaded = getStoredConsent()
    expect(loaded).toBeNull()
    expect(window.localStorage.getItem(COOKIE_CONSENT_KEY)).toBeNull()
  })
})
