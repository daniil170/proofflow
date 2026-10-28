import { Composer, InlineKeyboard } from 'grammy'
import type { BotContext } from '../../app/types.js'
import { config } from '../../shared/config.js'
import {
  createAdminTicketKeyboard,
  createOpenTicketKeyboard,
  createSupportConfirmKeyboard,
  createSupportTopicKeyboard,
} from '../../shared/keyboards.js'
import {
  getIdeaRepository,
  getSupportTicketRepository,
} from '../../shared/storage/index.js'
import { TEXTS } from '../../shared/texts.js'
import { logger } from '../../shared/logger.js'
import { initialSupportSessionData, supportReducer } from './machine.js'
import type { SupportAttachment } from './types.js'

export const supportComposer = new Composer<BotContext>()

const formatUserMention = (
  userId: number,
  username?: string,
  firstName?: string
): string => {
  if (username) return `@${username}`
  if (firstName) return `[${firstName}](tg://user?id=${userId})`
  return `ID: ${userId}`
}

const checkDailyLimit = async (userId: number): Promise<boolean> => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const ticketRepo = getSupportTicketRepository()
  const ideaRepo = getIdeaRepository()
  const [ticketCount, ideaCount] = await Promise.all([
    ticketRepo.countDailyByUser(userId, since),
    ideaRepo.countDailyByUser(userId, since),
  ])
  return ticketCount + ideaCount >= config.maxDailyTicketsAndIdeas
}

export const startSupportFlow = async (ctx: BotContext): Promise<void> => {
  if (ctx.chat?.type !== 'private') return
  const userId = ctx.from?.id
  if (!userId) return

  const ticketRepo = getSupportTicketRepository()
  const openTicket = await ticketRepo.findOpenByTelegramUserId(userId)
  if (openTicket) {
    await ctx.reply(
      `У вас уже есть открытое обращение #${openTicket.id} (тема: ${openTicket.topic}).\n\nВы можете отправить сообщение прямо сюда — оно добавится к обращению.`,
      { reply_markup: createOpenTicketKeyboard(openTicket.id) }
    )
    return
  }

  const isLimited = await checkDailyLimit(userId)
  if (isLimited) {
    await ctx.reply(TEXTS.support.limit)
    return
  }

  ctx.session.support = supportReducer(ctx.session.support, {
    type: 'START',
  }).nextState

  await ctx.reply(TEXTS.support.selectTopic, {
    reply_markup: createSupportTopicKeyboard(),
  })
}

supportComposer.command('support', async (ctx) => {
  await startSupportFlow(ctx)
})

supportComposer.callbackQuery('support:start', async (ctx) => {
  await ctx.answerCallbackQuery()
  await startSupportFlow(ctx)
})

supportComposer.callbackQuery(/^support:topic:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery()
  if (ctx.chat?.type !== 'private') return

  const topic = ctx.match[1]
  const transition = supportReducer(ctx.session.support, {
    type: 'SELECT_TOPIC',
    payload: topic,
  })
  ctx.session.support = transition.nextState

  await ctx.reply(TEXTS.support.describePrompt, {
    reply_markup: new InlineKeyboard().text(
      TEXTS.support.btnCancel,
      'support:cancel'
    ),
  })
})

supportComposer.callbackQuery('support:cancel', async (ctx) => {
  await ctx.answerCallbackQuery()
  ctx.session.support = { ...initialSupportSessionData }
  await ctx.reply(TEXTS.commands.operationCancelled, {
    reply_markup: new InlineKeyboard().text('← Главное меню', 'menu:main'),
  })
})

supportComposer.callbackQuery('support:confirm_send', async (ctx) => {
  await ctx.answerCallbackQuery()
  if (ctx.chat?.type !== 'private') return
  const userId = ctx.from?.id
  if (!userId) return

  const supportSession = ctx.session.support
  if (
    !supportSession ||
    (!supportSession.text && supportSession.attachments.length === 0)
  ) {
    await ctx.reply(TEXTS.support.emptyMessage)
    return
  }

  const ticketRepo = getSupportTicketRepository()
  const ticket = await ticketRepo.create({
    telegramUserId: userId,
    username: ctx.from?.username,
    topic: supportSession.topic || 'Другое',
    source: ctx.session.signup?.deepLink,
    status: 'open',
    messages: [
      ...(supportSession.text
        ? [
            {
              direction: 'user' as const,
              type: 'text' as const,
              text: supportSession.text,
              createdAt: new Date().toISOString(),
            },
          ]
        : []),
      ...supportSession.attachments.map((att) => ({
        direction: 'user' as const,
        type: att.type,
        fileId: att.fileId,
        createdAt: new Date().toISOString(),
      })),
    ],
  })

  if (config.adminChatId) {
    try {
      const userMention = formatUserMention(
        userId,
        ctx.from?.username,
        ctx.from?.first_name
      )
      const adminLines = [
        `📩 *Новое обращение #${ticket.id}*`,
        `От: ${userMention} (ID: \`${userId}\`)`,
        `Тема: *${ticket.topic}*`,
      ]
      if (ticket.source) {
        adminLines.push(`Источник: ${ticket.source}`)
      }
      if (supportSession.text) {
        adminLines.push(`\nТекст:\n${supportSession.text}`)
      }
      if (supportSession.attachments.length > 0) {
        adminLines.push(`\nВложений: ${supportSession.attachments.length}`)
      }

      const adminMsg = await ctx.api.sendMessage(
        config.adminChatId,
        adminLines.join('\n'),
        {
          parse_mode: 'Markdown',
          reply_markup: createAdminTicketKeyboard(ticket.id),
        }
      )

      await ticketRepo.update(ticket.id, {
        adminMessageId: adminMsg.message_id,
      })

      for (const att of supportSession.attachments) {
        if (att.messageId && ctx.chat?.id) {
          try {
            await ctx.api.copyMessage(
              config.adminChatId,
              ctx.chat.id,
              att.messageId
            )
          } catch {
            if (att.type === 'photo') {
              await ctx.api.sendPhoto(config.adminChatId, att.fileId)
            } else if (att.type === 'voice') {
              await ctx.api.sendVoice(config.adminChatId, att.fileId)
            } else if (att.type === 'document') {
              await ctx.api.sendDocument(config.adminChatId, att.fileId)
            }
          }
        }
      }
    } catch (err) {
      logger.warn('Failed to notify admin about support ticket', {
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  ctx.session.support = { ...initialSupportSessionData }
  await ctx.reply(TEXTS.support.accepted(ticket.id), {
    reply_markup: createOpenTicketKeyboard(ticket.id),
  })
})

supportComposer.callbackQuery(/^support:user_close:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery()
  const ticketId = ctx.match[1]
  const ticketRepo = getSupportTicketRepository()
  const ticket = await ticketRepo.findById(ticketId)
  if (!ticket || ticket.status === 'closed') {
    await ctx.reply('Обращение уже закрыто.')
    return
  }

  await ticketRepo.update(ticketId, { status: 'closed' })
  await ctx.reply(TEXTS.support.closedByUser(ticketId))

  if (config.adminChatId) {
    try {
      await ctx.api.sendMessage(
        config.adminChatId,
        `ℹ️ Обращение #${ticketId} закрыто пользователем.`
      )
    } catch (err) {
      logger.warn('Failed to notify admin about ticket closure', {
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }
})

supportComposer.callbackQuery(/^admin:ticket_close:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery('Обращение закрыто')
  const ticketId = ctx.match[1]
  const ticketRepo = getSupportTicketRepository()
  const ticket = await ticketRepo.findById(ticketId)
  if (!ticket) return

  await ticketRepo.update(ticketId, { status: 'closed' })

  try {
    await ctx.editMessageReplyMarkup({ reply_markup: undefined })
  } catch (err) {
    logger.warn('Failed to edit markup on ticket close', {
      error: err instanceof Error ? err.message : String(err),
    })
  }

  try {
    await ctx.api.sendMessage(
      ticket.telegramUserId,
      TEXTS.support.closedByAdmin
    )
  } catch (err) {
    logger.warn('Failed to send ticket close notice to user', {
      error: err instanceof Error ? err.message : String(err),
    })
  }
})

supportComposer.on('message', async (ctx, next) => {
  const adminChatId = config.adminChatId
  if (adminChatId && ctx.chat?.id === adminChatId && ctx.message.reply_to_message) {
    const repliedMsgId = ctx.message.reply_to_message.message_id
    const ticketRepo = getSupportTicketRepository()

    let ticket = await ticketRepo.findByAdminMessageId(repliedMsgId)
    if (!ticket) {
      const repliedText =
        ctx.message.reply_to_message.text ||
        ctx.message.reply_to_message.caption ||
        ''
      const match = repliedText.match(/#(\w+)/)
      if (match) {
        ticket = await ticketRepo.findById(match[1])
      }
    }

    if (ticket && ticket.status === 'open') {
      const text = ctx.message.text || ctx.message.caption || ''
      const photo = ctx.message.photo?.[ctx.message.photo.length - 1]?.file_id
      const voice = ctx.message.voice?.file_id
      const document = ctx.message.document?.file_id

      try {
        if (photo) {
          await ctx.api.sendPhoto(ticket.telegramUserId, photo, {
            caption: `${TEXTS.support.teamReplyHeader}${text}`,
          })
          await ticketRepo.appendMessage(ticket.id, {
            direction: 'team',
            type: 'photo',
            text,
            fileId: photo,
            createdAt: new Date().toISOString(),
          })
        } else if (voice) {
          await ctx.api.sendVoice(ticket.telegramUserId, voice, {
            caption: text ? `${TEXTS.support.teamReplyHeader}${text}` : undefined,
          })
          await ticketRepo.appendMessage(ticket.id, {
            direction: 'team',
            type: 'voice',
            fileId: voice,
            createdAt: new Date().toISOString(),
          })
        } else if (document) {
          await ctx.api.sendDocument(ticket.telegramUserId, document, {
            caption: text ? `${TEXTS.support.teamReplyHeader}${text}` : undefined,
          })
          await ticketRepo.appendMessage(ticket.id, {
            direction: 'team',
            type: 'document',
            fileId: document,
            createdAt: new Date().toISOString(),
          })
        } else if (text) {
          await ctx.api.sendMessage(
            ticket.telegramUserId,
            `${TEXTS.support.teamReplyHeader}${text}`
          )
          await ticketRepo.appendMessage(ticket.id, {
            direction: 'team',
            type: 'text',
            text,
            createdAt: new Date().toISOString(),
          })
        }
        await ctx.reply(`✓ Ответ отправлен в обращение #${ticket.id}`)
      } catch (err: unknown) {
        const errMsg = String(err)
        if (
          errMsg.includes('blocked') ||
          errMsg.includes('bot was blocked') ||
          errMsg.includes('403')
        ) {
          await ctx.reply(TEXTS.support.userBlocked, {
            reply_to_message_id: ctx.message.message_id,
          })
        } else {
          await ctx.reply(`Ошибка доставки: ${errMsg}`)
        }
      }
      return
    }
  }

  if (ctx.chat?.type !== 'private') {
    return next()
  }

  if (ctx.message.text?.startsWith('/')) {
    return next()
  }

  const supportStep = ctx.session.support?.step
  if (
    supportStep === 'awaiting_description' ||
    supportStep === 'awaiting_confirmation'
  ) {
    const rawText = ctx.message.text || ctx.message.caption
    const photo = ctx.message.photo?.[ctx.message.photo.length - 1]?.file_id
    const voice = ctx.message.voice?.file_id
    const document = ctx.message.document?.file_id

    let attachment: SupportAttachment | undefined
    if (photo) {
      attachment = {
        fileId: photo,
        type: 'photo',
        messageId: ctx.message.message_id,
      }
    } else if (voice) {
      attachment = {
        fileId: voice,
        type: 'voice',
        messageId: ctx.message.message_id,
      }
    } else if (document) {
      attachment = {
        fileId: document,
        type: 'document',
        messageId: ctx.message.message_id,
      }
    }

    const transition = supportReducer(ctx.session.support, {
      type: 'ADD_CONTENT',
      payload: {
        text: rawText,
        attachment,
      },
    })

    if (transition.errorKey) {
      await ctx.reply(TEXTS.support[transition.errorKey])
      return
    }

    ctx.session.support = transition.nextState
    const current = ctx.session.support
    await ctx.reply(
      TEXTS.support.confirmPrompt(
        current.topic || 'Другое',
        current.text || '',
        current.attachments.length
      ),
      { reply_markup: createSupportConfirmKeyboard() }
    )
    return
  }

  const isSignupActive =
    ctx.session.signup?.step &&
    ctx.session.signup.step !== 'idle' &&
    ctx.session.signup.step !== 'completed'
  const isIdeaActive =
    ctx.session.idea?.step && ctx.session.idea.step !== 'idle'

  if (!isSignupActive && !isIdeaActive) {
    const userId = ctx.from?.id
    if (userId) {
      const ticketRepo = getSupportTicketRepository()
      const openTicket = await ticketRepo.findOpenByTelegramUserId(userId)
      if (openTicket) {
        const text = ctx.message.text || ctx.message.caption || ''
        const photo = ctx.message.photo?.[ctx.message.photo.length - 1]?.file_id
        const voice = ctx.message.voice?.file_id
        const document = ctx.message.document?.file_id

        const msgType = photo
          ? 'photo'
          : voice
          ? 'voice'
          : document
          ? 'document'
          : 'text'
        const fileId = photo || voice || document

        await ticketRepo.appendMessage(openTicket.id, {
          direction: 'user',
          type: msgType,
          text,
          fileId,
          createdAt: new Date().toISOString(),
        })

        if (config.adminChatId) {
          try {
            const userMention = formatUserMention(
              userId,
              ctx.from?.username,
              ctx.from?.first_name
            )
            await ctx.api.sendMessage(
              config.adminChatId,
              `${TEXTS.admin.ticketContinuation(openTicket.id)}\nОт: ${userMention} (ID: \`${userId}\`)\n\n${text || `[${msgType}]`}`
            )
            if (fileId) {
              await ctx.api.copyMessage(
                config.adminChatId,
                ctx.chat.id,
                ctx.message.message_id
              )
            }
          } catch (err) {
            logger.warn('Failed to forward continuation to admin', {
              error: err instanceof Error ? err.message : String(err),
            })
          }
        }

        await ctx.reply(TEXTS.support.appended(openTicket.id), {
          reply_markup: createOpenTicketKeyboard(openTicket.id),
        })
        return
      }
    }
  }

  return next()
})
