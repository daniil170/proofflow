import { Composer } from 'grammy'
import type { BotContext } from '../../app/types.js'
import {
  createAlreadySubmittedKeyboard,
  createDeleteConfirmKeyboard,
  createWelcomeKeyboard,
} from '../../shared/keyboards.js'
import { getRepository } from '../../shared/storage/index.js'
import { TEXTS } from '../../shared/texts.js'
import { config } from '../../shared/config.js'
import { getTelegramLinkGateway } from '../account-link/linkService.js'
import { initialSessionData, signupReducer } from '../signup/machine.js'

export const commandsComposer = new Composer<BotContext>()

commandsComposer.command('start', async (ctx) => {
  const userId = ctx.from?.id
  if (!userId) return

  const payload = ctx.match?.trim()

  if (payload && payload.startsWith('link_')) {
    if (ctx.chat?.type !== 'private') {
      await ctx.reply(TEXTS.link.groupChatForbidden)
      return
    }

    const token = payload.replace(/^link_/, '').trim()
    if (!token) {
      await ctx.reply(TEXTS.link.invalidFormat)
      return
    }

    const startLinkResult = signupReducer(ctx.session.signup, {
      type: 'START_LINK',
      token,
    })
    ctx.session.signup = startLinkResult.nextState

    const gateway = getTelegramLinkGateway()
    const result = await gateway.confirmLink({
      token,
      telegramUserId: userId,
      telegramUsername: ctx.from?.username,
      secret: config.botSecret,
    })

    if (result.success && result.uid) {
      const successTransition = signupReducer(ctx.session.signup, {
        type: 'LINK_SUCCESS',
        uid: result.uid,
      })
      ctx.session.signup = successTransition.nextState
      await ctx.reply(TEXTS.link.success)
      return
    }

    const failTransition = signupReducer(ctx.session.signup, {
      type: 'LINK_FAILED',
      error: result.error || 'server_error',
    })
    ctx.session.signup = failTransition.nextState

    let replyMessage = TEXTS.link.generalError
    if (result.error === 'expired_token') {
      replyMessage = TEXTS.link.expiredToken
    } else if (result.error === 'already_used') {
      replyMessage = TEXTS.link.alreadyUsedToken
    } else if (result.error === 'invalid_token' || result.error === 'not_found') {
      replyMessage = TEXTS.link.invalidToken
    } else if (result.error === 'invalid_secret') {
      replyMessage = TEXTS.link.invalidSecret
    } else if (result.message) {
      replyMessage = result.message
    }

    await ctx.reply(replyMessage)
    return
  }

  const repo = getRepository()
  const existing = await repo.findByTelegramUserId(userId)

  if (existing && existing.id) {
    ctx.session.signup = {
      ...initialSessionData,
      existingApplicationId: existing.id,
      businessType: existing.businessType,
      casesVolume: existing.casesVolume,
      deepLink: existing.deepLink,
    }
    await ctx.reply(TEXTS.results.alreadySubmitted, {
      reply_markup: createAlreadySubmittedKeyboard(),
    })
    return
  }

  ctx.session.signup = {
    ...initialSessionData,
    deepLink: payload || undefined,
  }

  await ctx.reply(TEXTS.welcome.greeting, {
    reply_markup: createWelcomeKeyboard(),
  })
})

commandsComposer.command('help', async (ctx) => {
  await ctx.reply(TEXTS.commands.help)
})

commandsComposer.command('stop', async (ctx) => {
  const userId = ctx.from?.id
  if (!userId) return

  const repo = getRepository()
  const updated = await repo.setUnsubscribed(userId, true)
  ctx.session.signup = { ...initialSessionData }

  if (updated) {
    await ctx.reply(TEXTS.commands.stopSuccess)
  } else {
    await ctx.reply(TEXTS.commands.stopNotFound)
  }
})

commandsComposer.command('delete', async (ctx) => {
  ctx.session.deleteConfirmation = true
  await ctx.reply(TEXTS.commands.deletePrompt, {
    reply_markup: createDeleteConfirmKeyboard(),
  })
})

commandsComposer.callbackQuery('delete:confirm', async (ctx) => {
  await ctx.answerCallbackQuery()
  const userId = ctx.from?.id
  if (!userId) return

  const repo = getRepository()
  const deleted = await repo.deleteByTelegramUserId(userId)
  ctx.session.deleteConfirmation = false
  ctx.session.signup = { ...initialSessionData }

  if (deleted) {
    await ctx.editMessageText(TEXTS.commands.deleteSuccess)
  } else {
    await ctx.editMessageText(TEXTS.commands.deleteNotFound)
  }
})

commandsComposer.callbackQuery('delete:cancel', async (ctx) => {
  await ctx.answerCallbackQuery()
  ctx.session.deleteConfirmation = false
  await ctx.editMessageText(TEXTS.commands.deleteCancelled)
})
