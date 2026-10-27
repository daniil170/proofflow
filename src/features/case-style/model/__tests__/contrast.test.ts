import { describe, expect, it } from 'vitest'
import {
  calculateContrastRatio,
  parseHexColor,
  ACCENT_COLOR_TOKENS,
} from '../contrast'

describe('contrast utility', () => {
  it('parses valid hex colors', () => {
    expect(parseHexColor('#ffffff')).toEqual({ r: 255, g: 255, b: 255 })
    expect(parseHexColor('000')).toEqual({ r: 0, g: 0, b: 0 })
    expect(parseHexColor('invalid')).toBeNull()
  })

  it('calculates contrast ratio for lime on dark background', () => {
    const res = calculateContrastRatio('#d6f94c', '#0d1714')
    expect(res.isValid).toBe(true)
    expect(res.isAccessible).toBe(true)
    expect(res.ratio).toBeGreaterThan(10)
  })

  it('detects low contrast for dark color on dark background', () => {
    const res = calculateContrastRatio('#1a2420', '#0d1714')
    expect(res.isValid).toBe(true)
    expect(res.isAccessible).toBe(false)
    expect(res.rating).toBe('Fail')
  })

  it('contains essential color tokens', () => {
    expect(ACCENT_COLOR_TOKENS.length).toBeGreaterThanOrEqual(5)
    expect(ACCENT_COLOR_TOKENS.some((t) => t.hex === '#d6f94c')).toBe(true)
  })
})
