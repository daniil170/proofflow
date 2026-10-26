import { Bot, session } from 'grammy'
import { config } from '../shared/config.js'
import { logger } from '../shared/logger.js'
import { TEXTS } from '../shared/texts.js'
import { commandsComposer } from '../features/user-commands/commandsHandler.js'
import { signupComposer } from '../features/signup/signupHandler.js'
import { initialSessionData } from '../features/signup/machine.js'
import { createRateLimiter } from './middleware/rateLimiter.js'
import type { BotContext, SessionData } from './types.js'

export const createBot = (token = config.botToken): Bot<BotContext> => {
  const bot = new Bot<BotContext>(token)

  bot.use(
    session({
      initial: (): SessionData => ({
        signup: { ...initialSessionData },
      }),
    })
  )

  bot.use(createRateLimiter())

  bot.use(commandsComposer)
  bot.use(signupComposer)

  bot.catch(async (err) => {
    logger.error('Unhandled bot error', err.error, {
      updateId: err.ctx.update.update_id,
      userId: err.ctx.from?.id,
    })

    try {
      await err.ctx.reply(TEXTS.validation.generalError)
    } catch (replyError) {
      logger.error('Failed to send error notification to user', replyError)
    }
  })

  return bot
}
