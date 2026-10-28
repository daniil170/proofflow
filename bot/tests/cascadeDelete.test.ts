import { beforeEach, describe, expect, it } from 'vitest'
import type { Bot } from 'grammy'
import type { ApiResponse, Message } from 'grammy/types'
import { createBot } from '../src/app/bot.js'
import { InMemoryBetaApplicationRepository } from '../src/shared/storage/InMemoryBetaApplicationRepository.js'
import { InMemoryIdeaRepository } from '../src/shared/storage/InMemoryIdeaRepository.js'
import { InMemoryIdeaVoteRepository } from '../src/shared/storage/InMemoryIdeaVoteRepository.js'
import { InMemorySupportTicketRepository } from '../src/shared/storage/InMemorySupportTicketRepository.js'
import {
  setIdeaRepository,
  setIdeaVoteRepository,
  setRepository,
  setSupportTicketRepository,
} from '../src/shared/storage/index.js'
import { TEXTS } from '../src/shared/texts.js'

describe('Cascade /delete and /stop commands', () => {
  let appRepo: InMemoryBetaApplicationRepository
  let ticketRepo: InMemorySupportTicketRepository
  let ideaRepo: InMemoryIdeaRepository
  let voteRepo: InMemoryIdeaVoteRepository
  let bot: ReturnType<typeof createBot>
  let sentMessages: string[]

  beforeEach(() => {
    appRepo = new InMemoryBetaApplicationRepository()
    ticketRepo = new InMemorySupportTicketRepository()
    ideaRepo = new InMemoryIdeaRepository()
    voteRepo = new InMemoryIdeaVoteRepository()

    setRepository(appRepo)
    setSupportTicketRepository(ticketRepo)
    setIdeaRepository(ideaRepo)
    setIdeaVoteRepository(voteRepo)

    sentMessages = []

    bot = createBot('dummy_token_bot', {
      botInfo: {
        id: 999999,
        is_bot: true,
        first_name: 'ProofFlowBot',
        username: 'proofflow_bot',
        can_join_groups: true,
        can_read_all_group_messages: false,
        supports_inline_queries: false,
        can_connect_to_business: false,
        has_main_web_app: false,
      },
    })

    bot.api.config.use(async (_prev, method, payload) => {
      if (method === 'sendMessage' || method === 'editMessageText') {
        const text = (payload as { text?: string }).text
        if (text) sentMessages.push(text)
        return {
          ok: true,
          result: {
            message_id: 1,
            date: Math.floor(Date.now() / 1000),
            chat: { id: 1, type: 'private' },
            text,
          },
        } as unknown as ApiResponse<Message.TextMessage>
      }
      return { ok: true, result: true } as unknown as ApiResponse<true>
    })
  })

  const sendCommand = async (text: string, userId = 112233) => {
    await bot.handleUpdate({
      update_id: Date.now(),
      message: {
        message_id: 10,
        date: Math.floor(Date.now() / 1000),
        chat: { id: userId, type: 'private' },
        from: { id: userId, is_bot: false, first_name: 'Cascader' },
        text,
        entities: [
          {
            type: 'bot_command',
            offset: 0,
            length: text.split(' ')[0].length,
          },
        ],
      },
    } as unknown as Parameters<Bot['handleUpdate']>[0])
  }

  const sendCallback = async (data: string, userId = 112233) => {
    await bot.handleUpdate({
      update_id: Date.now(),
      callback_query: {
        id: 'cb_del',
        from: { id: userId, is_bot: false, first_name: 'Cascader' },
        message: {
          message_id: 11,
          date: Math.floor(Date.now() / 1000),
          chat: { id: userId, type: 'private' },
        },
        chat_instance: 'inst_del',
        data,
      },
    } as unknown as Parameters<Bot['handleUpdate']>[0])
  }

  it('informs user about continuing support replies on /stop', async () => {
    const userId = 112233
    await appRepo.create({
      source: 'telegram',
      channel: 'telegram',
      telegramUserId: userId,
      businessType: 'Агентство',
      casesVolume: '1-3',
      consent: true,
    })

    await sendCommand('/stop', userId)
    expect(sentMessages[0]).toBe(TEXTS.commands.stopSuccess)
    expect(sentMessages[0]).toContain('если у вас есть открытое обращение в поддержку, ответы команды продолжат приходить')
  })

  it('cascades deletion across applications, tickets, ideas, and vote decrements', async () => {
    const userId = 112233
    const otherUserId = 999000

    await appRepo.create({
      source: 'telegram',
      channel: 'telegram',
      telegramUserId: userId,
      businessType: 'Агентство',
      casesVolume: '1-3',
      consent: true,
    })

    const ticket = await ticketRepo.create({
      telegramUserId: userId,
      topic: 'Проблема в продукте',
      status: 'open',
      messages: [],
    })

    const ownIdea = await ideaRepo.create({
      telegramUserId: userId,
      category: 'Новая функция',
      text: 'Моя идея',
      votesCount: 0,
      status: 'approved',
    })

    const otherIdea = await ideaRepo.create({
      telegramUserId: otherUserId,
      category: 'Интеграция',
      text: 'Чужая идея',
      votesCount: 1,
      status: 'approved',
    })

    await voteRepo.addVote(otherIdea.id, userId)

    await sendCommand('/delete', userId)
    expect(sentMessages).toContain(TEXTS.commands.deletePrompt)

    await sendCallback('delete:confirm', userId)
    expect(sentMessages).toContain(TEXTS.commands.deleteSuccess)

    const checkApp = await appRepo.findByTelegramUserId(userId)
    expect(checkApp).toBeNull()

    const checkTicket = await ticketRepo.findById(ticket.id)
    expect(checkTicket).toBeNull()

    const checkOwnIdea = await ideaRepo.findById(ownIdea.id)
    expect(checkOwnIdea).toBeNull()

    const hasVote = await voteRepo.hasVoted(otherIdea.id, userId)
    expect(hasVote).toBe(false)

    const checkOtherIdea = await ideaRepo.findById(otherIdea.id)
    expect(checkOtherIdea?.votesCount).toBe(0)
  })
})
