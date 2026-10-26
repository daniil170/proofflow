import { Composer } from 'grammy'
import type { BotContext } from '../../app/types.js'
import {
  createAlreadySubmittedKeyboard,
  createDeleteConfirmKeyboard,
  createWelcomeKeyboard,
} from '../../shared/keyboards.js'
import { getRepository } from '../../shared/storage/index.js'
import { TEXTS } from '../../shared/texts.js'
import { initialSessionData } from '../signup/machine.js'

export const commandsComposer = new Composer<BotContext>()

commandsComposer.command('start', async (ctx) => {
  const userId = ctx.from?.id
  if (!userId) return

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

  const payload = ctx.match?.trim()
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
