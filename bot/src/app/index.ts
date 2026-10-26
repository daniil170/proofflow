import { createServer } from 'node:http'
import { webhookCallback } from 'grammy'
import { config } from '../shared/config.js'
import { logger } from '../shared/logger.js'
import { createBot } from './bot.js'

const bootstrap = async (): Promise<void> => {
  if (!config.botToken) {
    logger.error('BOT_TOKEN is not defined in environment variables')
    process.exit(1)
  }

  const bot = createBot()

  const isWebhook = config.mode === 'webhook'
  const webhookHandler = isWebhook
    ? webhookCallback(bot, 'http', {
        secretToken: config.webhookSecretToken,
      })
    : null

  if (isWebhook && config.webhookUrl) {
    await bot.api.setWebhook(config.webhookUrl, {
      secret_token: config.webhookSecretToken,
    })
    logger.info('Webhook registered', { webhookUrl: config.webhookUrl })
  }

  const server = createServer(async (req, res) => {
    if (isWebhook && req.method === 'POST' && req.url === '/webhook') {
      return webhookHandler!(req, res)
    }
    if (req.url === '/health' || req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ status: 'ok', mode: config.mode }))
      return
    }
    res.writeHead(404)
    res.end('Not Found')
  })

  server.listen(config.port, () => {
    logger.info(`Server listening on port ${config.port}`, {
      mode: config.mode,
    })
  })

  let isStopping = false
  const gracefulShutdown = async (signal: string) => {
    if (isStopping) return
    isStopping = true
    logger.info(`Received ${signal}, initiating graceful shutdown...`)

    try {
      server.close()
      if (bot.isInited()) {
        await bot.stop()
      }
      logger.info('Bot stopped gracefully')
      process.exit(0)
    } catch (error) {
      logger.error('Error during shutdown', error)
      process.exit(1)
    }
  }

  process.on('SIGINT', () => gracefulShutdown('SIGINT'))
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))

  if (!isWebhook) {
    logger.info('Starting bot in long polling mode...', {
      storageType: config.storageType,
    })
    await bot.start({
      onStart: (botInfo) => {
        logger.info(`Bot @${botInfo.username} started successfully`)
      },
    })
  }
}

bootstrap().catch((err) => {
  logger.error('Fatal bootstrap error', err)
  process.exit(1)
})
