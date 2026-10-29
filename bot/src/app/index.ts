import { createServer } from 'node:http'
import { webhookCallback } from 'grammy'
import { config, validateBotConfig } from '../shared/config.js'
import { logger } from '../shared/logger.js'
import { createBot, registerBotCommands } from './bot.js'

const bootstrap = async (): Promise<void> => {
  try {
    validateBotConfig(config)
  } catch (error) {
    logger.error('Startup validation failed', error)
    process.exit(1)
  }

  const bot = createBot()

  try {
    await registerBotCommands(bot)
    logger.info('Bot commands registered successfully')
  } catch (error) {
    logger.warn('Failed to register bot commands via setMyCommands', {
      error: error instanceof Error ? error.message : String(error),
    })
  }

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

  server.listen(config.port, '0.0.0.0', () => {
    logger.info(`Server listening on 0.0.0.0:${config.port}`, {
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
