import { Composer, InlineKeyboard } from 'grammy'
import type { BotContext } from '../../app/types.js'
import { config } from '../../shared/config.js'
import {
  createAdminIdeaKeyboard,
  createIdeaCategoryKeyboard,
  createIdeaContextKeyboard,
  createIdeasListKeyboard,
} from '../../shared/keyboards.js'
import {
  getIdeaRepository,
  getIdeaVoteRepository,
  getSupportTicketRepository,
} from '../../shared/storage/index.js'
import { TEXTS } from '../../shared/texts.js'
import { logger } from '../../shared/logger.js'
import { initialIdeaSessionData, ideaReducer } from './machine.js'

export const ideasComposer = new Composer<BotContext>()

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

export const startIdeaFlow = async (ctx: BotContext): Promise<void> => {
  if (ctx.chat?.type !== 'private') return
  const userId = ctx.from?.id
  if (!userId) return

  const isLimited = await checkDailyLimit(userId)
  if (isLimited) {
    await ctx.reply(TEXTS.ideas.limit)
    return
  }

  ctx.session.idea = ideaReducer(ctx.session.idea, { type: 'START' }).nextState
  await ctx.reply(TEXTS.ideas.selectCategory, {
    reply_markup: createIdeaCategoryKeyboard(),
  })
}

ideasComposer.command('idea', async (ctx) => {
  await startIdeaFlow(ctx)
})

ideasComposer.callbackQuery('idea:start', async (ctx) => {
  await ctx.answerCallbackQuery()
  await startIdeaFlow(ctx)
})

ideasComposer.callbackQuery(/^idea:category:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery()
  if (ctx.chat?.type !== 'private') return

  const category = ctx.match[1]
  const transition = ideaReducer(ctx.session.idea, {
    type: 'SELECT_CATEGORY',
    payload: category,
  })
  ctx.session.idea = transition.nextState

  await ctx.reply(
    `${TEXTS.ideas.startPrompt}\n\n${TEXTS.ideas.describePrompt}`,
    {
      reply_markup: new InlineKeyboard().text(
        TEXTS.ideas.btnCancel,
        'idea:cancel'
      ),
    }
  )
})

ideasComposer.callbackQuery('idea:cancel', async (ctx) => {
  await ctx.answerCallbackQuery()
  ctx.session.idea = { ...initialIdeaSessionData }
  await ctx.reply(TEXTS.commands.operationCancelled, {
    reply_markup: new InlineKeyboard().text('← Главное меню', 'menu:main'),
  })
})

const submitIdea = async (
  ctx: BotContext,
  contextText?: string
): Promise<void> => {
  const userId = ctx.from?.id
  if (!userId) return

  const transition = ideaReducer(ctx.session.idea, {
    type: 'SET_CONTEXT',
    payload: contextText,
  })
  const completedState = transition.nextState
  ctx.session.idea = { ...initialIdeaSessionData }

  const ideaRepo = getIdeaRepository()
  const idea = await ideaRepo.create({
    telegramUserId: userId,
    category: completedState.category || 'Другое',
    text: completedState.text,
    voiceFileId: completedState.voiceFileId,
    context: completedState.context,
    moderationStatus: 'pending',
  })

  if (config.adminChatId) {
    try {
      const userMention = formatUserMention(
        userId,
        ctx.from?.username,
        ctx.from?.first_name
      )
      const adminLines = [
        `${TEXTS.admin.ideaTitle(idea.id)}`,
        `От: ${userMention} (ID: \`${userId}\`)`,
        `${TEXTS.admin.ideaCategory} *${idea.category}*`,
      ]
      if (idea.text) {
        adminLines.push(`\n${TEXTS.admin.ideaText}\n${idea.text}`)
      }
      if (idea.context) {
        adminLines.push(`\n${TEXTS.admin.ideaContext}\n${idea.context}`)
      }

      const adminMsg = await ctx.api.sendMessage(
        config.adminChatId,
        adminLines.join('\n'),
        {
          parse_mode: 'Markdown',
          reply_markup: createAdminIdeaKeyboard(idea.id),
        }
      )

      await ideaRepo.update(idea.id, {
        adminMessageId: adminMsg.message_id,
      })

      if (idea.voiceFileId) {
        await ctx.api.sendVoice(config.adminChatId, idea.voiceFileId)
      }
    } catch (err) {
      logger.warn('Failed to notify admin about new idea', {
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  await ctx.reply(TEXTS.ideas.accepted, {
    reply_markup: new InlineKeyboard()
      .text('Посмотреть идеи других', 'ideas:list:1')
      .row()
      .text('← Главное меню', 'menu:main'),
  })
}

ideasComposer.callbackQuery('idea:skip_context', async (ctx) => {
  await ctx.answerCallbackQuery()
  if (ctx.chat?.type !== 'private') return
  await submitIdea(ctx, undefined)
})

ideasComposer.callbackQuery(/^admin:idea_approve:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery('Идея одобрена')
  const ideaId = ctx.match[1]
  const ideaRepo = getIdeaRepository()
  await ideaRepo.update(ideaId, { moderationStatus: 'public' })

  try {
    await ctx.editMessageReplyMarkup({ reply_markup: undefined })
  } catch (err) {
    logger.warn('Failed to edit markup after idea approval', {
      error: err instanceof Error ? err.message : String(err),
    })
  }

  try {
    await ctx.reply(TEXTS.admin.ideaApproved(ideaId))
  } catch (err) {
    logger.warn('Failed to reply idea approved notification', {
      error: err instanceof Error ? err.message : String(err),
    })
  }
})

ideasComposer.callbackQuery(/^admin:idea_reject:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery('Идея скрыта')
  const ideaId = ctx.match[1]
  const ideaRepo = getIdeaRepository()
  await ideaRepo.update(ideaId, { moderationStatus: 'hidden' })

  try {
    await ctx.editMessageReplyMarkup({ reply_markup: undefined })
  } catch (err) {
    logger.warn('Failed to edit markup after idea rejection', {
      error: err instanceof Error ? err.message : String(err),
    })
  }

  try {
    await ctx.reply(TEXTS.admin.ideaRejected(ideaId))
  } catch (err) {
    logger.warn('Failed to reply idea rejected notification', {
      error: err instanceof Error ? err.message : String(err),
    })
  }
})

export const renderIdeasList = async (
  ctx: BotContext,
  page = 1,
  edit = false
): Promise<void> => {
  if (ctx.chat?.type !== 'private') return
  const userId = ctx.from?.id
  const ideaRepo = getIdeaRepository()
  const voteRepo = getIdeaVoteRepository()

  const limit = 5
  const offset = (page - 1) * limit
  const { items, total } = await ideaRepo.findPublicTextIdeas(limit, offset)
  const totalPages = Math.max(1, Math.ceil(total / limit))

  if (total === 0) {
    const text = TEXTS.ideas.emptyList
    const keyboard = new InlineKeyboard()
      .text(TEXTS.ideas.btnSuggestIdea, 'idea:start')
      .row()
      .text('← Главное меню', 'menu:main')

    if (edit && ctx.callbackQuery?.message) {
      await ctx.editMessageText(text, { reply_markup: keyboard })
    } else {
      await ctx.reply(text, { reply_markup: keyboard })
    }
    return
  }

  const userVotes = userId ? await voteRepo.findVotesByUser(userId) : []
  const userVotedIdeaIds = new Set(userVotes.map((v) => v.ideaId))

  const lines = [TEXTS.ideas.publicListHeader(page, totalPages), '']
  items.forEach((idea, index) => {
    const num = offset + index + 1
    lines.push(`*${num}. [${idea.category}]*`)
    lines.push(idea.text || '')
    if (idea.context) {
      lines.push(`_Контекст: ${idea.context}_`)
    }
    lines.push(`👍 Нужно участникам: *${idea.votesCount}*`)
    lines.push('')
  })

  const keyboard = createIdeasListKeyboard(
    items,
    page,
    totalPages,
    userVotedIdeaIds
  )

  if (edit && ctx.callbackQuery?.message) {
    await ctx.editMessageText(lines.join('\n'), {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    })
  } else {
    await ctx.reply(lines.join('\n'), {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    })
  }
}

ideasComposer.command('ideas', async (ctx) => {
  await renderIdeasList(ctx, 1, false)
})

ideasComposer.callbackQuery(/^ideas:list:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery()
  const page = parseInt(ctx.match[1], 10) || 1
  await renderIdeasList(ctx, page, true)
})

ideasComposer.callbackQuery(/^idea:vote:([^:]+):(\d+)$/, async (ctx) => {
  const ideaId = ctx.match[1]
  const page = parseInt(ctx.match[2], 10) || 1
  const userId = ctx.from?.id
  if (!userId) {
    await ctx.answerCallbackQuery()
    return
  }

  const ideaRepo = getIdeaRepository()
  const voteRepo = getIdeaVoteRepository()
  const idea = await ideaRepo.findById(ideaId)

  if (!idea) {
    await ctx.answerCallbackQuery('Идея не найдена')
    return
  }

  if (idea.telegramUserId === userId) {
    await ctx.answerCallbackQuery({
      text: TEXTS.ideas.voteSelfForbidden,
      show_alert: true,
    })
    return
  }

  const hasVoted = await voteRepo.hasVoted(ideaId, userId)
  if (hasVoted) {
    await voteRepo.removeVote(ideaId, userId)
    await ideaRepo.incrementVote(ideaId, -1)
    await ctx.answerCallbackQuery(TEXTS.ideas.voteRemoved)
  } else {
    await voteRepo.addVote(ideaId, userId)
    await ideaRepo.incrementVote(ideaId, 1)
    await ctx.answerCallbackQuery(TEXTS.ideas.voted)
  }

  await renderIdeasList(ctx, page, true)
})

ideasComposer.on('message', async (ctx, next) => {
  if (ctx.chat?.type !== 'private') {
    return next()
  }

  if (ctx.message.text?.startsWith('/')) {
    return next()
  }

  const ideaStep = ctx.session.idea?.step
  if (!ideaStep || ideaStep === 'idle') {
    return next()
  }

  if (ideaStep === 'awaiting_description') {
    const rawText = ctx.message.text
    const voiceFileId = ctx.message.voice?.file_id

    const transition = ideaReducer(ctx.session.idea, {
      type: 'SET_DESCRIPTION',
      text: rawText,
      voiceFileId,
    })

    if (transition.errorKey) {
      await ctx.reply(TEXTS.ideas[transition.errorKey])
      return
    }

    ctx.session.idea = transition.nextState
    await ctx.reply(TEXTS.ideas.contextPrompt, {
      reply_markup: createIdeaContextKeyboard(),
    })
    return
  }

  if (ideaStep === 'awaiting_context') {
    const contextText = ctx.message.text
    await submitIdea(ctx, contextText)
    return
  }

  return next()
})
