import { describe, expect, it } from 'vitest'
import { isValidUrl, normalizeUrl } from '../useOnboarding.js'

describe('useOnboarding utilities', () => {
  it('normalizes URLs correctly', () => {
    expect(normalizeUrl('')).toBe('')
    expect(normalizeUrl('example.com')).toBe('https://example.com')
    expect(normalizeUrl('https://studio.ru/about')).toBe('https://studio.ru/about')
    expect(normalizeUrl('http://my-site.org')).toBe('http://my-site.org')
  })

  it('validates URLs correctly', () => {
    expect(isValidUrl('')).toBe(true)
    expect(isValidUrl('example.com')).toBe(true)
    expect(isValidUrl('https://example.com')).toBe(true)
    expect(isValidUrl('not-a-domain')).toBe(false)
    expect(isValidUrl('http:///')).toBe(false)
  })
})
