import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { assertGeminiTier } from '../providerFactory.js'
import { GeminiClient } from '../geminiClient.js'

describe('gemini tier protection', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('throws descriptive security error in production when GEMINI_TIER is free', () => {
    expect(() => assertGeminiTier(true, true, 'free')).toThrow(
      /Критическая ошибка безопасности: в продакшен-окружении запрещено использовать GEMINI_TIER=free/
    )
  })

  it('allows paid or pay-as-you-go tiers in production without error', () => {
    expect(() => assertGeminiTier(true, true, 'pay-as-you-go')).not.toThrow()
    expect(() => assertGeminiTier(true, true, 'paid')).not.toThrow()
    expect(() => assertGeminiTier(true, true, 'enterprise')).not.toThrow()
  })

  it('does not throw when google provider is not active even if tier is free', () => {
    expect(() => assertGeminiTier(true, false, 'free')).not.toThrow()
  })

  it('does not throw in non-production environments when tier is free', () => {
    expect(() => assertGeminiTier(false, true, 'free')).not.toThrow()
  })

  it('enforces tier protection inside GeminiClient constructor in production', () => {
    process.env.NODE_ENV = 'production'
    process.env.GEMINI_TIER = 'free'
    process.env.GEMINI_MODEL = 'gemini-1.5-flash'
    process.env.GEMINI_REGION = 'us-central1'

    expect(() => new GeminiClient()).toThrow(
      /Критическая ошибка безопасности: в продакшен-окружении запрещено использовать GEMINI_TIER=free/
    )
  })
})
