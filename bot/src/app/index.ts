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

  let isStopping = false
  const gracefulShutdown = async (signal: string) => {
    if (isStopping) return
    isStopping = true
    logger.info(`Received ${signal}, initiating graceful shutdown...`)

    try {
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

  if (config.mode === 'webhook') {
    if (config.webhookUrl) {
      await bot.api.setWebhook(config.webhookUrl, {
        secret_token: config.webhookSecretToken,
      })
      logger.info('Webhook registered', { webhookUrl: config.webhookUrl })
    }

    const handler = webhookCallback(bot, 'http', {
      secretToken: config.webhookSecretToken,
    })

    const server = createServer(async (req, res) => {
      if (req.method === 'POST' && req.url === '/webhook') {
        return handler(req, res)
      }
      if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ status: 'ok' }))
        return
      }
      res.writeHead(404)
      res.end('Not Found')
    })

    server.listen(config.port, () => {
      logger.info(`Webhook server running on port ${config.port}`, {
        mode: 'webhook',
      })
    })
  } else {
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
