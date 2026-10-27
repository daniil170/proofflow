import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Firestore } from 'firebase-admin/firestore'
import {
  executeConfirmTelegramLink,
  ConfirmTelegramLinkError,
} from '../confirmTelegramLink.js'

describe('confirmTelegramLink use-case', () => {
  const originalSecret = process.env.TELEGRAM_BOT_SECRET
  let tokensStore: Map<string, Record<string, unknown>>
  let usersStore: Map<string, Record<string, unknown>>
  let mockDb: unknown

  beforeEach(() => {
    process.env.TELEGRAM_BOT_SECRET = 'correct_bot_secret_xyz'
    tokensStore = new Map()
    usersStore = new Map()

    mockDb = {
      collection: (colName: string) => ({
        doc: (docId: string) => ({
          id: docId,
          get: async () => {
            const store = colName === 'telegram_link_tokens' ? tokensStore : usersStore
            const data = store.get(docId)
            return {
              exists: Boolean(data),
              data: () => data,
            }
          },
          set: async (payload: Record<string, unknown>, options?: { merge?: boolean }) => {
            const store = colName === 'telegram_link_tokens' ? tokensStore : usersStore
            if (options?.merge) {
              const prev = store.get(docId) || {}
              store.set(docId, { ...prev, ...payload })
            } else {
              store.set(docId, payload)
            }
          },
          update: async (payload: Record<string, unknown>) => {
            const store = colName === 'telegram_link_tokens' ? tokensStore : usersStore
            const prev = store.get(docId) || {}
            store.set(docId, { ...prev, ...payload })
          },
        }),
      }),
    }
  })

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.TELEGRAM_BOT_SECRET
    } else {
      process.env.TELEGRAM_BOT_SECRET = originalSecret
    }
  })

  it('rejects with invalid_secret error when secret does not match', async () => {
    tokensStore.set('tok-1', {
      token: 'tok-1',
      uid: 'u-1',
      expiresAt: Date.now() + 600000,
    })

    await expect(
      executeConfirmTelegramLink(
        {
          token: 'tok-1',
          telegramUserId: 123456,
          telegramUsername: 'tester',
          secret: 'wrong_secret',
        },
        mockDb as Firestore
      )
    ).rejects.toThrowError(ConfirmTelegramLinkError)

    try {
      await executeConfirmTelegramLink(
        {
          token: 'tok-1',
          telegramUserId: 123456,
          telegramUsername: 'tester',
          secret: 'wrong_secret',
        },
        mockDb as Firestore
      )
    } catch (err: unknown) {
      const typed = err as ConfirmTelegramLinkError
      expect(typed.code).toBe('invalid_secret')
      expect(typed.message).toContain('Неверный секрет')
    }
  })

  it('rejects with expired_token error when token is expired', async () => {
    tokensStore.set('tok-expired', {
      token: 'tok-expired',
      uid: 'u-2',
      expiresAt: Date.now() - 1000,
      used: false,
    })

    await expect(
      executeConfirmTelegramLink(
        {
          token: 'tok-expired',
          telegramUserId: 222333,
          telegramUsername: 'alex',
          secret: 'correct_bot_secret_xyz',
        },
        mockDb as Firestore
      )
    ).rejects.toThrowError(ConfirmTelegramLinkError)

    try {
      await executeConfirmTelegramLink(
        {
          token: 'tok-expired',
          telegramUserId: 222333,
          telegramUsername: 'alex',
          secret: 'correct_bot_secret_xyz',
        },
        mockDb as Firestore
      )
    } catch (err: unknown) {
      const typed = err as ConfirmTelegramLinkError
      expect(typed.code).toBe('expired_token')
      expect(typed.message).toContain('Срок действия')
    }
  })

  it('rejects with already_used error when token is used', async () => {
    tokensStore.set('tok-used', {
      token: 'tok-used',
      uid: 'u-3',
      expiresAt: Date.now() + 600000,
      used: true,
      usedAt: Date.now() - 5000,
    })

    await expect(
      executeConfirmTelegramLink(
        {
          token: 'tok-used',
          telegramUserId: 444555,
          telegramUsername: 'sergey',
          secret: 'correct_bot_secret_xyz',
        },
        mockDb as Firestore
      )
    ).rejects.toThrowError(ConfirmTelegramLinkError)

    try {
      await executeConfirmTelegramLink(
        {
          token: 'tok-used',
          telegramUserId: 444555,
          telegramUsername: 'sergey',
          secret: 'correct_bot_secret_xyz',
        },
        mockDb as Firestore
      )
    } catch (err: unknown) {
      const typed = err as ConfirmTelegramLinkError
      expect(typed.code).toBe('already_used')
      expect(typed.message).toContain('уже была использована')
    }
  })

  it('successfully links user profile and marks token as used', async () => {
    tokensStore.set('tok-valid', {
      token: 'tok-valid',
      uid: 'u-4',
      expiresAt: Date.now() + 600000,
      used: false,
    })
    usersStore.set('u-4', {
      id: 'u-4',
      email: 'user@example.com',
      displayName: 'User Four',
    })

    const result = await executeConfirmTelegramLink(
      {
        token: 'link_tok-valid',
        telegramUserId: 777888,
        telegramUsername: '@proofflow_dev',
        secret: 'correct_bot_secret_xyz',
      },
      mockDb as Firestore
    )

    expect(result.success).toBe(true)
    expect(result.uid).toBe('u-4')
    expect(result.telegramUserId).toBe(777888)
    expect(result.telegramUsername).toBe('proofflow_dev')

    const updatedUser = usersStore.get('u-4')
    expect(updatedUser?.telegramUserId).toBe(777888)
    expect(updatedUser?.telegramUsername).toBe('proofflow_dev')
    expect(updatedUser?.email).toBe('user@example.com')

    const updatedToken = tokensStore.get('tok-valid')
    expect(updatedToken?.used).toBe(true)
    expect(updatedToken?.usedByTelegramUserId).toBe(777888)
    expect(updatedToken?.usedByTelegramUsername).toBe('proofflow_dev')
  })
})
