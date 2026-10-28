import 'dotenv/config'

export interface BotConfig {
  readonly botToken: string
  readonly botSecret: string
  readonly functionsBaseUrl?: string
  readonly adminChatId?: number
  readonly mode: 'polling' | 'webhook'
  readonly port: number
  readonly webhookUrl?: string
  readonly webhookSecretToken?: string
  readonly storageType: 'memory' | 'firestore'
  readonly rateLimitPerSecond: number
  readonly maxDailyTicketsAndIdeas: number
  readonly privacyUrl: string
  readonly firebase: {
    readonly apiKey?: string
    readonly authDomain?: string
    readonly projectId?: string
    readonly storageBucket?: string
    readonly messagingSenderId?: string
    readonly appId?: string
  }
}

const getEnvNumber = (key: string, defaultValue: number): number => {
  const val = process.env[key]
  if (!val) return defaultValue
  const parsed = parseInt(val, 10)
  return isNaN(parsed) ? defaultValue : parsed
}

export const config: BotConfig = Object.freeze({
  botToken: process.env.BOT_TOKEN || '',
  botSecret: process.env.TELEGRAM_BOT_SECRET || process.env.BOT_SECRET || '',
  functionsBaseUrl: process.env.FUNCTIONS_BASE_URL,
  adminChatId: process.env.ADMIN_CHAT_ID ? parseInt(process.env.ADMIN_CHAT_ID, 10) : undefined,
  mode: (process.env.BOT_MODE === 'webhook' ? 'webhook' : 'polling') as 'polling' | 'webhook',
  port: getEnvNumber('PORT', 3000),
  webhookUrl: process.env.WEBHOOK_URL,
  webhookSecretToken: process.env.WEBHOOK_SECRET_TOKEN,
  storageType:
    process.env.BOT_STORAGE === 'firestore' || process.env.USE_MOCK_STORAGE === 'false'
      ? 'firestore'
      : 'memory',
  rateLimitPerSecond: getEnvNumber('RATE_LIMIT_PER_SECOND', 3),
  maxDailyTicketsAndIdeas: getEnvNumber('MAX_DAILY_TICKETS_AND_IDEAS', 5),
  privacyUrl: process.env.PRIVACY_URL || 'https://proofflow.ru/privacy',
  firebase: Object.freeze({
    apiKey: process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId:
      process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID,
  }),
})

export const validateBotConfig = (
  cfg: BotConfig = config,
  nodeEnv = process.env.NODE_ENV
): void => {
  if (!cfg.botToken) {
    throw new Error('BOT_TOKEN is not defined in environment variables')
  }

  const isProd = nodeEnv === 'production'
  if (isProd) {
    if (cfg.storageType === 'memory') {
      throw new Error(
        'Критическая ошибка конфигурации: в продакшен-окружении запрещено использовать in-memory хранилище (BOT_STORAGE=memory). Установите BOT_STORAGE=firestore.'
      )
    }
    if (!cfg.adminChatId) {
      throw new Error(
        'Критическая ошибка конфигурации: в продакшен-окружении переменная ADMIN_CHAT_ID обязательна для получения заявок и обращений.'
      )
    }
    if (!cfg.botSecret) {
      throw new Error(
        'Критическая ошибка конфигурации: в продакшен-окружении переменная TELEGRAM_BOT_SECRET обязательна для безопасной привязки аккаунтов.'
      )
    }
    if (!cfg.firebase.projectId) {
      throw new Error(
        'Критическая ошибка конфигурации: в продакшен-окружении переменная FIREBASE_PROJECT_ID обязательна.'
      )
    }
  }
}
