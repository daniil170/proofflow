import { beforeEach, describe, expect, it } from 'vitest'
import type { Bot } from 'grammy'
import type { ApiResponse, Message } from 'grammy/types'
import { createBot } from '../src/app/bot.js'
import { InMemoryIdeaRepository } from '../src/shared/storage/InMemoryIdeaRepository.js'
import { InMemorySupportTicketRepository } from '../src/shared/storage/InMemorySupportTicketRepository.js'
import {
  setIdeaRepository,
  setSupportTicketRepository,
} from '../src/shared/storage/index.js'
import { TEXTS } from '../src/shared/texts.js'

describe('Daily rate limits for tickets and ideas', () => {
  let ticketRepo: InMemorySupportTicketRepository
  let ideaRepo: InMemoryIdeaRepository
  let bot: ReturnType<typeof createBot>
  let sentMessages: string[]

  beforeEach(() => {
    ticketRepo = new InMemorySupportTicketRepository()
    ideaRepo = new InMemoryIdeaRepository()
    setSupportTicketRepository(ticketRepo)
    setIdeaRepository(ideaRepo)

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
      if (method === 'sendMessage') {
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

  const sendCommand = async (text: string, userId = 999888) => {
    await bot.handleUpdate({
      update_id: Date.now(),
      message: {
        message_id: 10,
        date: Math.floor(Date.now() / 1000),
        chat: { id: userId, type: 'private' },
        from: { id: userId, is_bot: false, first_name: 'LimitedUser' },
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

  it('blocks creating new ticket or idea once 5 combined items reached in 24 hours', async () => {
    const userId = 999888

    for (let i = 1; i <= 3; i++) {
      await ticketRepo.create({
        telegramUserId: userId,
        topic: 'Другое',
        status: 'closed',
        messages: [],
      })
    }

    for (let i = 1; i <= 2; i++) {
      await ideaRepo.create({
        telegramUserId: userId,
        category: 'Новая функция',
        text: `Идея ${i}`,
        votesCount: 0,
        status: 'pending',
      })
    }

    await sendCommand('/support', userId)
    expect(sentMessages).toContain(TEXTS.support.limit)

    await sendCommand('/idea', userId)
    expect(sentMessages).toContain(TEXTS.ideas.limit)
  })
})
