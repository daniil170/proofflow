import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Bot } from 'grammy'
import type { ApiResponse, Message } from 'grammy/types'
import { createBot } from '../src/app/bot.js'
import {
  setTelegramLinkGateway,
  type TelegramLinkGateway,
  type ConfirmLinkResult,
} from '../src/features/account-link/linkService.js'
import { setRepository } from '../src/shared/storage/index.js'
import { InMemoryBetaApplicationRepository } from '../src/shared/storage/InMemoryBetaApplicationRepository.js'
import { TEXTS } from '../src/shared/texts.js'

describe('bot account linking (/start link_<token>)', () => {
  let mockGateway: TelegramLinkGateway
  let confirmSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    confirmSpy = vi.fn()
    mockGateway = {
      confirmLink: confirmSpy,
    }
    setTelegramLinkGateway(mockGateway)
    setRepository(new InMemoryBetaApplicationRepository())
  })

  afterEach(() => {
    setTelegramLinkGateway(null)
  })

  const createMockUpdate = (options: {
    text: string
    chatType?: 'private' | 'group' | 'supergroup'
    userId?: number
    username?: string
  }) => {
    const chatType = options.chatType || 'private'
    const userId = options.userId || 12345
    const replies: string[] = []

    const bot = createBot('dummy_token_123', {
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
        if (text) replies.push(String(text))
        return {
          ok: true,
          result: {
            message_id: 1,
            date: Math.floor(Date.now() / 1000),
            chat: { id: userId, type: chatType },
            text,
          },
        } as unknown as ApiResponse<Message.TextMessage>
      }
      return { ok: true, result: true } as unknown as ApiResponse<true>
    })

    const handleUpdate = async () => {
      await bot.handleUpdate({
        update_id: 1,
        message: {
          message_id: 1,
          date: Math.floor(Date.now() / 1000),
          chat: {
            id: userId,
            type: chatType,
          },
          from: {
            id: userId,
            is_bot: false,
            first_name: 'Tester',
            username: options.username || 'testuser',
          },
          text: options.text,
          entities: options.text.startsWith('/')
            ? [
                {
                  type: 'bot_command',
                  offset: 0,
                  length: options.text.split(' ')[0].length,
                },
              ]
            : undefined,
        },
      } as unknown as Parameters<Bot['handleUpdate']>[0])
    }

    return {
      bot,
      handleUpdate,
      replies,
    }
  }

  it('rejects link token if command is executed in a group chat', async () => {
    const { handleUpdate, replies } = createMockUpdate({
      text: '/start link_token123',
      chatType: 'group',
    })

    await handleUpdate()

    expect(confirmSpy).not.toHaveBeenCalled()
    expect(replies[0]).toBe(TEXTS.link.groupChatForbidden)
  })

  it('successfully links account when server confirms token', async () => {
    confirmSpy.mockResolvedValueOnce({
      success: true,
      uid: 'user_xyz',
    } as ConfirmLinkResult)

    const { handleUpdate, replies } = createMockUpdate({
      text: '/start link_valid_token_abc',
      chatType: 'private',
      userId: 777,
      username: 'proofflow_dev',
    })

    await handleUpdate()

    expect(confirmSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        token: 'valid_token_abc',
        telegramUserId: 777,
        telegramUsername: 'proofflow_dev',
      })
    )
    expect(replies[0]).toBe(TEXTS.link.success)
    expect(replies[0]).toBe('Telegram подключён к вашему аккаунту ProofFlow')
  })

  it('replies with expired token message when link is expired', async () => {
    confirmSpy.mockResolvedValueOnce({
      success: false,
      error: 'expired_token',
    } as ConfirmLinkResult)

    const { handleUpdate, replies } = createMockUpdate({
      text: '/start link_expired_123',
      chatType: 'private',
    })

    await handleUpdate()

    expect(replies[0]).toBe(TEXTS.link.expiredToken)
    expect(replies[0]).toContain('Срок действия')
  })

  it('replies with already used message when token was previously redeemed', async () => {
    confirmSpy.mockResolvedValueOnce({
      success: false,
      error: 'already_used',
    } as ConfirmLinkResult)

    const { handleUpdate, replies } = createMockUpdate({
      text: '/start link_used_123',
      chatType: 'private',
    })

    await handleUpdate()

    expect(replies[0]).toBe(TEXTS.link.alreadyUsedToken)
    expect(replies[0]).toContain('уже была использована')
  })

  it('replies with invalid token message on bad token', async () => {
    confirmSpy.mockResolvedValueOnce({
      success: false,
      error: 'invalid_token',
    } as ConfirmLinkResult)

    const { handleUpdate, replies } = createMockUpdate({
      text: '/start link_bad_123',
      chatType: 'private',
    })

    await handleUpdate()

    expect(replies[0]).toBe(TEXTS.link.invalidToken)
    expect(replies[0]).toContain('Неверная или недействительная')
  })

  it('replies with invalid secret message when backend rejects secret', async () => {
    confirmSpy.mockResolvedValueOnce({
      success: false,
      error: 'invalid_secret',
    } as ConfirmLinkResult)

    const { handleUpdate, replies } = createMockUpdate({
      text: '/start link_secret_fail',
      chatType: 'private',
    })

    await handleUpdate()

    expect(replies[0]).toBe(TEXTS.link.invalidSecret)
  })
})
