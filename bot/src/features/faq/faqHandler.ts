import { Composer } from 'grammy'
import type { BotContext } from '../../app/types.js'
import { config } from '../../shared/config.js'
import { createFaqItemKeyboard, createFaqListKeyboard } from '../../shared/keyboards.js'
import { FAQ_ITEMS, TEXTS } from '../../shared/texts.js'

export const faqComposer = new Composer<BotContext>()

faqComposer.command('faq', async (ctx) => {
  if (ctx.chat?.type !== 'private') return

  await ctx.reply(TEXTS.faq.title, {
    reply_markup: createFaqListKeyboard(),
  })
})

faqComposer.callbackQuery('faq:list', async (ctx) => {
  await ctx.answerCallbackQuery()
  if (ctx.chat?.type !== 'private') return

  if (ctx.callbackQuery.message) {
    await ctx.editMessageText(TEXTS.faq.title, {
      reply_markup: createFaqListKeyboard(),
    })
  } else {
    await ctx.reply(TEXTS.faq.title, {
      reply_markup: createFaqListKeyboard(),
    })
  }
})

faqComposer.callbackQuery(/^faq:item:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery()
  if (ctx.chat?.type !== 'private') return

  const itemId = ctx.match[1]
  const item = FAQ_ITEMS.find((i) => i.id === itemId)
  if (!item) return

  const text = `❓ *${item.question}*\n\n${item.answer(config.privacyUrl)}`

  if (ctx.callbackQuery.message) {
    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: createFaqItemKeyboard(),
    })
  } else {
    await ctx.reply(text, {
      parse_mode: 'Markdown',
      reply_markup: createFaqItemKeyboard(),
    })
  }
})
