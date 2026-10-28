import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Bot } from 'grammy'
import type { ApiResponse, Message } from 'grammy/types'
import { createBot } from '../src/app/bot.js'
import { config } from '../src/shared/config.js'
import { InMemorySupportTicketRepository } from '../src/shared/storage/InMemorySupportTicketRepository.js'
import { InMemoryIdeaRepository } from '../src/shared/storage/InMemoryIdeaRepository.js'
import {
  setIdeaRepository,
  setSupportTicketRepository,
} from '../src/shared/storage/index.js'
import { TEXTS } from '../src/shared/texts.js'

describe('Support ticket flow', () => {
  let ticketRepo: InMemorySupportTicketRepository
  let ideaRepo: InMemoryIdeaRepository
  let bot: ReturnType<typeof createBot>
  let sentMessages: Array<{ chatId?: number | string; text?: string }>
  let copiedMessages: Array<{ fromChatId?: number | string; messageId?: number }>
  let shouldBlockUser: boolean

  beforeEach(() => {
    vi.useFakeTimers()
    ticketRepo = new InMemorySupportTicketRepository()
    ideaRepo = new InMemoryIdeaRepository()
    setSupportTicketRepository(ticketRepo)
    setIdeaRepository(ideaRepo)

    sentMessages = []
    copiedMessages = []
    shouldBlockUser = false

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
        const body = payload as { chat_id?: number | string; text?: string }
        if (shouldBlockUser && body.chat_id === 99999) {
          throw new Error('Forbidden: bot was blocked by the user (403)')
        }
        sentMessages.push({ chatId: body.chat_id, text: body.text })
        return {
          ok: true,
          result: {
            message_id: 200,
            date: Math.floor(Date.now() / 1000),
            chat: { id: body.chat_id || 1, type: 'private' },
            text: body.text,
          },
        } as unknown as ApiResponse<Message.TextMessage>
      }

      if (method === 'copyMessage') {
        const body = payload as { from_chat_id?: number | string; message_id?: number }
        copiedMessages.push({ fromChatId: body.from_chat_id, messageId: body.message_id })
        return {
          ok: true,
          result: { message_id: 201 },
        } as unknown as ApiResponse<{ message_id: number }>
      }

      if (method === 'answerCallbackQuery') {
        return { ok: true, result: true } as unknown as ApiResponse<true>
      }

      return { ok: true, result: true } as unknown as ApiResponse<true>
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const sendCommand = async (text: string, userId = 12345) => {
    await bot.handleUpdate({
      update_id: Date.now(),
      message: {
        message_id: 10,
        date: Math.floor(Date.now() / 1000),
        chat: { id: userId, type: 'private' },
        from: { id: userId, is_bot: false, first_name: 'SupportUser', username: 'supp_user' },
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

  const sendCallback = async (data: string, userId = 12345, chatId: number | string = userId) => {
    await bot.handleUpdate({
      update_id: Date.now(),
      callback_query: {
        id: 'cb_sup',
        from: { id: userId, is_bot: false, first_name: 'SupportUser', username: 'supp_user' },
        message: {
          message_id: 11,
          date: Math.floor(Date.now() / 1000),
          chat: { id: chatId, type: typeof chatId === 'number' && chatId > 0 && chatId !== config.adminChatId ? 'private' : 'supergroup' },
        },
        chat_instance: 'inst_sup',
        data,
      },
    } as unknown as Parameters<Bot['handleUpdate']>[0])
  }

  const sendUserMessage = async (
    text?: string,
    attachment?: { type: 'photo' | 'voice' | 'document'; fileId: string },
    userId = 12345
  ) => {
    const messageObj: Record<string, unknown> = {
      message_id: 15,
      date: Math.floor(Date.now() / 1000),
      chat: { id: userId, type: 'private' },
      from: { id: userId, is_bot: false, first_name: 'SupportUser', username: 'supp_user' },
      text,
    }

    if (attachment?.type === 'photo') {
      messageObj.photo = [{ file_id: attachment.fileId, width: 100, height: 100 }]
    } else if (attachment?.type === 'voice') {
      messageObj.voice = { file_id: attachment.fileId, duration: 10 }
    } else if (attachment?.type === 'document') {
      messageObj.document = { file_id: attachment.fileId, file_name: 'log.txt' }
    }

    await bot.handleUpdate({
      update_id: Date.now(),
      message: messageObj,
    } as unknown as Parameters<Bot['handleUpdate']>[0])
  }

  it('creates support ticket and notifies admin with attachments and buttons', async () => {
    await sendCommand('/support')
    expect(sentMessages.some((m) => m.text === TEXTS.support.selectTopic)).toBe(true)

    vi.advanceTimersByTime(1100)
    await sendCallback('support:topic:Проблема в продукте')
    expect(sentMessages.some((m) => m.text === TEXTS.support.describePrompt)).toBe(true)

    vi.advanceTimersByTime(1100)
    await sendUserMessage('Кнопка экспорта выдает ошибку')
    expect(sentMessages.some((m) => m.text?.includes('Отправить обращение в команду?'))).toBe(true)

    vi.advanceTimersByTime(1100)
    await sendCallback('support:confirm_send')

    const openTicket = await ticketRepo.findOpenByTelegramUserId(12345)
    expect(openTicket).not.toBeNull()
    expect(openTicket?.topic).toBe('Проблема в продукте')
    expect(openTicket?.messages.length).toBe(1)
    expect(openTicket?.messages[0].text).toBe('Кнопка экспорта выдает ошибку')

    const adminNotify = sentMessages.find(
      (m) => m.chatId === config.adminChatId && m.text?.includes('Новое обращение')
    )
    expect(adminNotify).toBeDefined()
  })

  it('appends messages within 24h as continuation to existing open ticket', async () => {
    const ticket = await ticketRepo.create({
      telegramUserId: 12345,
      username: 'supp_user',
      topic: 'Проблема в продукте',
      status: 'open',
      messages: [
        {
          direction: 'user',
          type: 'text',
          text: 'Первое сообщение',
          createdAt: new Date().toISOString(),
        },
      ],
    })

    await sendUserMessage('Дополнительное сообщение к открытому тикету')

    const updated = await ticketRepo.findById(ticket.id)
    expect(updated?.messages.length).toBe(2)
    expect(updated?.messages[1].text).toBe('Дополнительное сообщение к открытому тикету')

    const continuationNotify = sentMessages.find(
      (m) =>
        m.chatId === config.adminChatId &&
        m.text?.includes(TEXTS.admin.ticketContinuation(ticket.id))
    )
    expect(continuationNotify).toBeDefined()
  })

  it('allows user to close ticket via inline button', async () => {
    const ticket = await ticketRepo.create({
      telegramUserId: 12345,
      username: 'supp_user',
      topic: 'Другое',
      status: 'open',
      messages: [],
    })

    await sendCallback(`support:user_close:${ticket.id}`)

    const updated = await ticketRepo.findById(ticket.id)
    expect(updated?.status).toBe('closed')
    expect(sentMessages.some((m) => m.text === TEXTS.support.closedByUser(ticket.id))).toBe(true)
  })

  it('handles admin reply via reply_to_message in ADMIN_CHAT_ID and delivers to user', async () => {
    const ticket = await ticketRepo.create({
      telegramUserId: 12345,
      username: 'supp_user',
      topic: 'Проблема в продукте',
      status: 'open',
      adminMessageId: 500,
      messages: [],
    })

    await bot.handleUpdate({
      update_id: Date.now(),
      message: {
        message_id: 501,
        date: Math.floor(Date.now() / 1000),
        chat: { id: config.adminChatId!, type: 'supergroup' },
        from: { id: 777, is_bot: false, first_name: 'Admin' },
        text: 'Мы поправили эту ошибку, обновите страницу',
        reply_to_message: {
          message_id: 500,
          date: Math.floor(Date.now() / 1000),
          chat: { id: config.adminChatId!, type: 'supergroup' },
          text: `📩 Новое обращение #${ticket.id}\nОт: @supp_user`,
        },
      },
    } as unknown as Parameters<Bot['handleUpdate']>[0])

    const deliveredMessage = sentMessages.find(
      (m) =>
        m.chatId === 12345 &&
        m.text?.includes('Мы поправили эту ошибку') &&
        m.text?.includes(TEXTS.support.teamReplyHeader)
    )
    expect(deliveredMessage).toBeDefined()

    const updated = await ticketRepo.findById(ticket.id)
    expect(updated?.messages.some((msg) => msg.direction === 'team')).toBe(true)
  })

  it('allows admin to close ticket and notifies user', async () => {
    const ticket = await ticketRepo.create({
      telegramUserId: 12345,
      username: 'supp_user',
      topic: 'Проблема в продукте',
      status: 'open',
      adminMessageId: 600,
      messages: [],
    })

    await sendCallback(`admin:ticket_close:${ticket.id}`, 777, config.adminChatId!)

    const updated = await ticketRepo.findById(ticket.id)
    expect(updated?.status).toBe('closed')
    expect(sentMessages.some((m) => m.chatId === 12345 && m.text === TEXTS.support.closedByAdmin)).toBe(true)
  })

  it('notifies admin if user blocked the bot during team reply', async () => {
    const ticket = await ticketRepo.create({
      telegramUserId: 99999,
      username: 'blocked_user',
      topic: 'Проблема в продукте',
      status: 'open',
      adminMessageId: 700,
      messages: [],
    })

    shouldBlockUser = true

    await bot.handleUpdate({
      update_id: Date.now(),
      message: {
        message_id: 701,
        date: Math.floor(Date.now() / 1000),
        chat: { id: config.adminChatId!, type: 'supergroup' },
        from: { id: 777, is_bot: false, first_name: 'Admin' },
        text: 'Тестовый ответ заблокировавшему',
        reply_to_message: {
          message_id: 700,
          date: Math.floor(Date.now() / 1000),
          chat: { id: config.adminChatId!, type: 'supergroup' },
          text: `📩 Новое обращение #${ticket.id}`,
        },
      },
    } as unknown as Parameters<Bot['handleUpdate']>[0])

    const blockWarning = sentMessages.find(
      (m) => m.text?.includes(TEXTS.support.userBlocked)
    )
    expect(blockWarning).toBeDefined()
  })
})
