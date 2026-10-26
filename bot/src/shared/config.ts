import 'dotenv/config'

export interface BotConfig {
  readonly botToken: string
  readonly adminChatId?: number
  readonly mode: 'polling' | 'webhook'
  readonly port: number
  readonly webhookUrl?: string
  readonly webhookSecretToken?: string
  readonly storageType: 'memory' | 'firestore'
  readonly rateLimitPerSecond: number
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
