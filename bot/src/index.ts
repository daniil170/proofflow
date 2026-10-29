import { onRequest } from 'firebase-functions/v2/https'
import { setGlobalOptions } from 'firebase-functions/v2'
import { webhookCallback } from 'grammy'
import { config, validateBotConfig } from './shared/config.js'
import { createBot, registerBotCommands } from './app/bot.js'
import { logger } from './shared/logger.js'

setGlobalOptions({
  region: 'us-central1',
  maxInstances: 20,
})

let botInstance: ReturnType<typeof createBot> | null = null
let webhookHandler: ((req: unknown, res: unknown) => Promise<unknown>) | null = null
let commandsRegistered = false

const getBot = () => {
  if (!botInstance) {
    validateBotConfig(config)
    botInstance = createBot()
  }
  return botInstance
}

const getWebhookHandler = () => {
  if (!webhookHandler) {
    const bot = getBot()
    const callback = webhookCallback(bot, 'express', {
      secretToken: config.webhookSecretToken || undefined,
    })
    webhookHandler = (req, res) => callback(req as never, res as never)
  }
  return webhookHandler
}

export const telegramBotWebhook = onRequest(
  {
    cors: false,
    timeoutSeconds: 30,
    minInstances: 0,
  },
  async (req, res) => {
    if (req.method === 'GET') {
      res.status(200).json({ status: 'ok', service: 'telegramBotWebhook' })
      return
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed' })
      return
    }

    if (!commandsRegistered) {
      commandsRegistered = true
      registerBotCommands(getBot()).catch((err) => {
        logger.warn('Failed to register bot commands on webhook init', {
          error: err instanceof Error ? err.message : String(err),
        })
      })
    }

    const handler = getWebhookHandler()
    await handler(req, res)
  }
)
