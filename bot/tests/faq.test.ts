import { beforeEach, describe, expect, it } from 'vitest'
import type { Bot } from 'grammy'
import type { ApiResponse, Message } from 'grammy/types'
import { createBot } from '../src/app/bot.js'
import { FAQ_ITEMS, TEXTS } from '../src/shared/texts.js'

describe('FAQ feature', () => {
  let bot: ReturnType<typeof createBot>
  let sentMessages: Array<{ text?: string; parse_mode?: string }>

  beforeEach(() => {
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
        const parseMode = (payload as { parse_mode?: string }).parse_mode
        sentMessages.push({ text, parse_mode: parseMode })
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

  const sendCommand = async (text: string, userId = 1001) => {
    await bot.handleUpdate({
      update_id: Date.now(),
      message: {
        message_id: 10,
        date: Math.floor(Date.now() / 1000),
        chat: { id: userId, type: 'private' },
        from: { id: userId, is_bot: false, first_name: 'Tester' },
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

  const sendCallback = async (data: string, userId = 1001) => {
    await bot.handleUpdate({
      update_id: Date.now(),
      callback_query: {
        id: 'cb_faq',
        from: { id: userId, is_bot: false, first_name: 'Tester' },
        message: {
          message_id: 11,
          date: Math.floor(Date.now() / 1000),
          chat: { id: userId, type: 'private' },
        },
        chat_instance: 'inst_faq',
        data,
      },
    } as unknown as Parameters<Bot['handleUpdate']>[0])
  }

  it('renders FAQ list on /faq command', async () => {
    await sendCommand('/faq')
    expect(sentMessages.length).toBe(1)
    expect(sentMessages[0].text).toBe(TEXTS.faq.title)
  })

  it('shows answer for specific FAQ item and allows navigating back', async () => {
    const item = FAQ_ITEMS[0]
    await sendCallback(`faq:item:${item.id}`)

    expect(sentMessages.length).toBe(1)
    expect(sentMessages[0].text).toContain(item.question)

    await sendCallback('faq:list')
    expect(sentMessages.length).toBe(2)
    expect(sentMessages[1].text).toBe(TEXTS.faq.title)
  })
})
