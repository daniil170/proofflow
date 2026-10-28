import { describe, expect, it } from 'vitest'
import { validateBotConfig, type BotConfig } from '../src/shared/config.js'

describe('validateBotConfig production guards', () => {
  const baseValidConfig: BotConfig = {
    botToken: '123456:valid_token',
    botSecret: 'valid_secret',
    adminChatId: 7517071405,
    mode: 'polling',
    port: 3000,
    storageType: 'firestore',
    rateLimitPerSecond: 3,
    maxDailyTicketsAndIdeas: 5,
    privacyUrl: 'https://proofflow.ru/privacy',
    firebase: {
      projectId: 'proofflow-prod',
    },
  }

  it('passes in development with in-memory storage', () => {
    const devConfig: BotConfig = {
      ...baseValidConfig,
      storageType: 'memory',
      adminChatId: undefined,
      botSecret: '',
    }
    expect(() => validateBotConfig(devConfig, 'development')).not.toThrow()
  })

  it('throws in production when storage is memory', () => {
    const invalidConfig: BotConfig = {
      ...baseValidConfig,
      storageType: 'memory',
    }
    expect(() => validateBotConfig(invalidConfig, 'production')).toThrow(
      /запрещено использовать in-memory хранилище/
    )
  })

  it('throws in production when adminChatId is missing', () => {
    const invalidConfig: BotConfig = {
      ...baseValidConfig,
      adminChatId: undefined,
    }
    expect(() => validateBotConfig(invalidConfig, 'production')).toThrow(
      /ADMIN_CHAT_ID обязательна/
    )
  })

  it('throws in production when botSecret is missing', () => {
    const invalidConfig: BotConfig = {
      ...baseValidConfig,
      botSecret: '',
    }
    expect(() => validateBotConfig(invalidConfig, 'production')).toThrow(
      /TELEGRAM_BOT_SECRET обязательна/
    )
  })

  it('throws when botToken is missing in any environment', () => {
    const invalidConfig: BotConfig = {
      ...baseValidConfig,
      botToken: '',
    }
    expect(() => validateBotConfig(invalidConfig, 'development')).toThrow(
      /BOT_TOKEN is not defined/
    )
  })
})
