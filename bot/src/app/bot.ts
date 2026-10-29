import { Bot, session, type StorageAdapter } from 'grammy'
import { config } from '../shared/config.js'
import { logger } from '../shared/logger.js'
import { TEXTS } from '../shared/texts.js'
import { commandsComposer } from '../features/user-commands/commandsHandler.js'
import { faqComposer } from '../features/faq/faqHandler.js'
import { supportComposer } from '../features/support/supportHandler.js'
import { ideasComposer } from '../features/ideas/ideasHandler.js'
import { signupComposer } from '../features/signup/signupHandler.js'
import { initialSessionData } from '../features/signup/machine.js'
import { initialSupportSessionData } from '../features/support/machine.js'
import { initialIdeaSessionData } from '../features/ideas/machine.js'
import { FirestoreSessionStorage } from '../shared/storage/FirestoreSessionStorage.js'
import { createRateLimiter } from './middleware/rateLimiter.js'
import type { BotContext, SessionData } from './types.js'

export const registerBotCommands = async (bot: Bot<BotContext>): Promise<void> => {
  await bot.api.setMyCommands([
    { command: 'menu', description: 'Главное меню' },
    { command: 'support', description: 'Служба поддержки' },
    { command: 'idea', description: 'Предложить идею' },
    { command: 'ideas', description: 'Идеи других участников' },
    { command: 'faq', description: 'Частые вопросы' },
    { command: 'stop', description: 'Отписаться от сообщений' },
    { command: 'delete', description: 'Удалить свои данные' },
    { command: 'help', description: 'Справка по боту' },
  ])
}

export const createBot = (
  token = config.botToken,
  botConfig?: ConstructorParameters<typeof Bot<BotContext>>[1],
  sessionStorage?: StorageAdapter<SessionData>
): Bot<BotContext> => {
  const bot = new Bot<BotContext>(token, botConfig)

  const effectiveStorage =
    sessionStorage ||
    (config.storageType === 'firestore'
      ? new FirestoreSessionStorage<SessionData>()
      : undefined)

  bot.use(
    session({
      initial: (): SessionData => ({
        signup: { ...initialSessionData },
        support: { ...initialSupportSessionData },
        idea: { ...initialIdeaSessionData },
      }),
      storage: effectiveStorage,
    })
  )

  bot.use(createRateLimiter())

  bot.use(async (ctx, next) => {
    const originalAnswer = ctx.answerCallbackQuery.bind(ctx)
    ctx.answerCallbackQuery = async (...args) => {
      try {
        return await originalAnswer(...args)
      } catch {
        return true
      }
    }
    await next()
  })

  bot.use(commandsComposer)
  bot.use(faqComposer)
  bot.use(supportComposer)
  bot.use(ideasComposer)
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
