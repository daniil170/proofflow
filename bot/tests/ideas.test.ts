import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Bot } from 'grammy'
import type { ApiResponse, Message } from 'grammy/types'
import { createBot } from '../src/app/bot.js'
import { config } from '../src/shared/config.js'
import { InMemoryIdeaRepository } from '../src/shared/storage/InMemoryIdeaRepository.js'
import { InMemoryIdeaVoteRepository } from '../src/shared/storage/InMemoryIdeaVoteRepository.js'
import { InMemorySupportTicketRepository } from '../src/shared/storage/InMemorySupportTicketRepository.js'
import {
  setIdeaRepository,
  setIdeaVoteRepository,
  setSupportTicketRepository,
} from '../src/shared/storage/index.js'
import { TEXTS } from '../src/shared/texts.js'

describe('Ideas feature', () => {
  let ideaRepo: InMemoryIdeaRepository
  let voteRepo: InMemoryIdeaVoteRepository
  let ticketRepo: InMemorySupportTicketRepository
  let bot: ReturnType<typeof createBot>
  let sentMessages: Array<{ chatId?: number | string; text?: string; parse_mode?: string }>
  let callbackAnswers: Array<{ text?: string; showAlert?: boolean }>

  beforeEach(() => {
    vi.useFakeTimers()
    ideaRepo = new InMemoryIdeaRepository()
    voteRepo = new InMemoryIdeaVoteRepository()
    ticketRepo = new InMemorySupportTicketRepository()
    setIdeaRepository(ideaRepo)
    setIdeaVoteRepository(voteRepo)
    setSupportTicketRepository(ticketRepo)

    sentMessages = []
    callbackAnswers = []

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
        const body = payload as { chat_id?: number | string; text?: string; parse_mode?: string }
        sentMessages.push({
          chatId: body.chat_id,
          text: body.text,
          parse_mode: body.parse_mode,
        })
        return {
          ok: true,
          result: {
            message_id: 300,
            date: Math.floor(Date.now() / 1000),
            chat: { id: body.chat_id || 1, type: 'private' },
            text: body.text,
          },
        } as unknown as ApiResponse<Message.TextMessage>
      }

      if (method === 'answerCallbackQuery') {
        const body = payload as { text?: string; show_alert?: boolean }
        callbackAnswers.push({ text: body.text, showAlert: body.show_alert })
        return { ok: true, result: true } as unknown as ApiResponse<true>
      }

      return { ok: true, result: true } as unknown as ApiResponse<true>
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const sendCommand = async (text: string, userId = 54321) => {
    await bot.handleUpdate({
      update_id: Date.now(),
      message: {
        message_id: 10,
        date: Math.floor(Date.now() / 1000),
        chat: { id: userId, type: 'private' },
        from: { id: userId, is_bot: false, first_name: 'IdeaCreator', username: 'ideator' },
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

  const sendCallback = async (data: string, userId = 54321, chatId: number | string = userId) => {
    await bot.handleUpdate({
      update_id: Date.now(),
      callback_query: {
        id: 'cb_idea',
        from: { id: userId, is_bot: false, first_name: 'IdeaCreator', username: 'ideator' },
        message: {
          message_id: 11,
          date: Math.floor(Date.now() / 1000),
          chat: { id: chatId, type: typeof chatId === 'number' && chatId > 0 && chatId !== config.adminChatId ? 'private' : 'supergroup' },
        },
        chat_instance: 'inst_idea',
        data,
      },
    } as unknown as Parameters<Bot['handleUpdate']>[0])
  }

  const sendUserMessage = async (text?: string, voiceFileId?: string, userId = 54321) => {
    const messageObj: Record<string, unknown> = {
      message_id: 16,
      date: Math.floor(Date.now() / 1000),
      chat: { id: userId, type: 'private' },
      from: { id: userId, is_bot: false, first_name: 'IdeaCreator', username: 'ideator' },
      text,
    }
    if (voiceFileId) {
      messageObj.voice = { file_id: voiceFileId, duration: 15 }
    }

    await bot.handleUpdate({
      update_id: Date.now(),
      message: messageObj,
    } as unknown as Parameters<Bot['handleUpdate']>[0])
  }

  it('submits idea through full conversation flow with sanitized text', async () => {
    await sendCommand('/idea')
    expect(sentMessages.some((m) => m.text === TEXTS.ideas.selectCategory)).toBe(true)

    vi.advanceTimersByTime(1100)
    await sendCallback('idea:category:Новая функция')
    expect(sentMessages.some((m) => m.text?.includes(TEXTS.ideas.describePrompt))).toBe(true)

    vi.advanceTimersByTime(1100)
    await sendUserMessage('Добавьте экспорт в https://figma.com')
    expect(sentMessages.some((m) => m.text === TEXTS.ideas.contextPrompt)).toBe(true)

    vi.advanceTimersByTime(1100)
    await sendCallback('idea:skip_context')

    expect(sentMessages.some((m) => m.text === TEXTS.ideas.accepted)).toBe(true)

    const adminNotify = sentMessages.find(
      (m) => m.chatId === config.adminChatId && m.text?.includes('Новая идея')
    )
    expect(adminNotify).toBeDefined()
    expect(adminNotify?.text).toContain('figma[.]com')
  })

  it('allows admin moderation: approve and reject', async () => {
    const idea = await ideaRepo.create({
      telegramUserId: 54321,
      category: 'Улучшение того, что есть',
      text: 'Быстрый предпросмотр кейса',
      moderationStatus: 'pending',
    })

    await sendCallback(`admin:idea_approve:${idea.id}`, 777, config.adminChatId!)
    const approved = await ideaRepo.findById(idea.id)
    expect(approved?.moderationStatus).toBe('public')

    vi.advanceTimersByTime(1100)
    await sendCallback(`admin:idea_reject:${idea.id}`, 777, config.adminChatId!)
    const rejected = await ideaRepo.findById(idea.id)
    expect(rejected?.moderationStatus).toBe('hidden')
  })

  it('displays public text-only ideas in /ideas and excludes pending or voice-only ideas', async () => {
    await ideaRepo.create({
      telegramUserId: 111,
      category: 'Новая функция',
      text: 'Одобренная текстовая идея',
      moderationStatus: 'public',
    })

    await ideaRepo.create({
      telegramUserId: 222,
      category: 'Новая функция',
      text: 'Идея на модерации',
      moderationStatus: 'pending',
    })

    await ideaRepo.create({
      telegramUserId: 333,
      category: 'Новая функция',
      voiceFileId: 'voice_only',
      moderationStatus: 'public',
    })

    await sendCommand('/ideas', 9999)

    const ideasView = sentMessages.find((m) => m.text?.includes('Идеи других участников'))
    expect(ideasView).toBeDefined()
    expect(ideasView?.text).toContain('Одобренная текстовая идея')
    expect(ideasView?.text).not.toContain('Идея на модерации')
    expect(ideasView?.text).not.toContain('voice_only')
  })

  it('supports voting toggle on public ideas and forbids self-voting', async () => {
    const idea = await ideaRepo.create({
      telegramUserId: 54321,
      category: 'Интеграция',
      text: 'Экспорт в PDF',
      moderationStatus: 'public',
    })

    await sendCallback(`idea:vote:${idea.id}:1`, 54321)
    expect(callbackAnswers.some((a) => a.text === TEXTS.ideas.voteSelfForbidden)).toBe(true)
    let checked = await ideaRepo.findById(idea.id)
    expect(checked?.votesCount).toBe(0)

    vi.advanceTimersByTime(1100)
    await sendCallback(`idea:vote:${idea.id}:1`, 88888)
    expect(callbackAnswers.some((a) => a.text === TEXTS.ideas.voted)).toBe(true)
    checked = await ideaRepo.findById(idea.id)
    expect(checked?.votesCount).toBe(1)

    vi.advanceTimersByTime(1100)
    await sendCallback(`idea:vote:${idea.id}:1`, 88888)
    expect(callbackAnswers.some((a) => a.text === TEXTS.ideas.voteRemoved)).toBe(true)
    checked = await ideaRepo.findById(idea.id)
    expect(checked?.votesCount).toBe(0)
  })

  it('paginates ideas when there are more than 5', async () => {
    for (let i = 1; i <= 7; i++) {
      const created = await ideaRepo.create({
        telegramUserId: 1000 + i,
        category: 'Новая функция',
        text: `Идея номер ${i}`,
        moderationStatus: 'public',
      })
      await ideaRepo.incrementVote(created.id, i)
    }

    await sendCommand('/ideas', 9999)
    const page1 = sentMessages[sentMessages.length - 1]
    expect(page1.text).toContain('страница 1 из 2')
    expect(page1.text).toContain('Идея номер 7')

    vi.advanceTimersByTime(1100)
    await sendCallback('ideas:list:2', 9999)
    const page2 = sentMessages[sentMessages.length - 1]
    expect(page2.text).toContain('страница 2 из 2')
  })
})
