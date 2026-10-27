import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Bot } from 'grammy'
import type { ApiResponse, Message } from 'grammy/types'
import { createBot } from '../src/app/bot.js'
import { InMemoryBetaApplicationRepository } from '../src/shared/storage/InMemoryBetaApplicationRepository.js'
import { setRepository } from '../src/shared/storage/index.js'
import { TEXTS } from '../src/shared/texts.js'

describe('bot duplicate application prevention', () => {
  let inMemoryRepo: InMemoryBetaApplicationRepository
  let bot: ReturnType<typeof createBot>
  let sentMessages: string[]

  beforeEach(() => {
    inMemoryRepo = new InMemoryBetaApplicationRepository()
    setRepository(inMemoryRepo)
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
        if (text) sentMessages.push(String(text))
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

  const sendCommand = async (text: string, userId: number, username = 'client_alex') => {
    await bot.handleUpdate({
      update_id: Date.now(),
      message: {
        message_id: 10,
        date: Math.floor(Date.now() / 1000),
        chat: { id: userId, type: 'private' },
        from: { id: userId, is_bot: false, first_name: 'Alex', username },
        text,
        entities: text.startsWith('/')
          ? [
              {
                type: 'bot_command',
                offset: 0,
                length: text.split(' ')[0].length,
              },
            ]
          : undefined,
      },
    } as unknown as Parameters<Bot['handleUpdate']>[0])
  }

  const sendCallback = async (data: string, userId: number, username = 'client_alex') => {
    await bot.handleUpdate({
      update_id: Date.now(),
      callback_query: {
        id: 'cb_1',
        from: { id: userId, is_bot: false, first_name: 'Alex', username },
        message: {
          message_id: 11,
          date: Math.floor(Date.now() / 1000),
          chat: { id: userId, type: 'private' },
        },
        chat_instance: 'inst_1',
        data,
      },
    } as unknown as Parameters<Bot['handleUpdate']>[0])
  }

  it('does not duplicate application on repeated /start from the same user', async () => {
    await inMemoryRepo.create({
      source: 'telegram',
      channel: 'telegram',
      status: 'new',
      telegramUserId: 999111,
      telegramUsername: 'client_alex',
      businessType: 'Веб-студия',
      casesVolume: '4-10',
      consent: true,
      currentProcess: 'Делаем вручную',
    })

    const initialCount = (await inMemoryRepo.findByTelegramUserId(999111)) ? 1 : 0
    expect(initialCount).toBe(1)

    const createSpy = vi.spyOn(inMemoryRepo, 'create')

    await sendCommand('/start', 999111, 'client_alex')

    expect(createSpy).not.toHaveBeenCalled()
    expect(sentMessages.length).toBeGreaterThan(0)
    expect(sentMessages[0]).toContain('Вы уже подали заявку в бету')
  })

  it('creates single application with telegram channel and without email, preventing duplicate on repeated consent', async () => {
    vi.useFakeTimers()
    const createSpy = vi.spyOn(inMemoryRepo, 'create')

    await sendCommand('/start', 555666, 'anna_lead')
    expect(sentMessages[0]).toBe(TEXTS.welcome.greeting)

    vi.advanceTimersByTime(1500)
    await sendCallback('signup:start', 555666, 'anna_lead')
    vi.advanceTimersByTime(1500)
    await sendCallback('business:Маркетинговое агентство', 555666, 'anna_lead')
    vi.advanceTimersByTime(1500)
    await sendCallback('volume:1-3', 555666, 'anna_lead')
    vi.advanceTimersByTime(1500)
    await sendCallback('signup:skip_feedback', 555666, 'anna_lead')
    vi.advanceTimersByTime(1500)
    await sendCallback('signup:consent_yes', 555666, 'anna_lead')

    expect(createSpy).toHaveBeenCalledTimes(1)
    const app = await inMemoryRepo.findByTelegramUserId(555666)
    expect(app).not.toBeNull()
    expect(app?.channel).toBe('telegram')
    expect(app?.source).toBe('telegram')
    expect(app?.telegramUserId).toBe(555666)
    expect(app?.telegramUsername).toBe('anna_lead')
    expect(app?.email).toBeNull()
    expect(app?.status).toBe('new')

    vi.advanceTimersByTime(1500)
    await sendCommand('/start', 555666, 'anna_lead')
    expect(createSpy).toHaveBeenCalledTimes(1)
    expect(sentMessages[sentMessages.length - 1]).toContain('Вы уже подали заявку в бету')
    vi.useRealTimers()
  })
})
