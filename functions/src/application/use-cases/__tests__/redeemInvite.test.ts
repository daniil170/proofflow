import type { Auth } from 'firebase-admin/auth'
import type { Firestore } from 'firebase-admin/firestore'
import { describe, expect, it, vi } from 'vitest'
import {
  executeRedeemInvite,
  RedeemInviteError,
} from '../redeemInvite.js'

describe('executeRedeemInvite', () => {
  it('throws when unauthenticated', async () => {
    const db = {} as unknown as Firestore
    const auth = {} as unknown as Auth

    await expect(
      executeRedeemInvite({
        code: 'TEST123',
        uid: '',
        db,
        auth,
      })
    ).rejects.toThrow(RedeemInviteError)
  })

  it('throws when code is empty', async () => {
    const db = {} as unknown as Firestore
    const auth = {} as unknown as Auth

    await expect(
      executeRedeemInvite({
        code: '   ',
        uid: 'user-1',
        db,
        auth,
      })
    ).rejects.toThrow(RedeemInviteError)
  })

  it('successfully redeems valid invite and sets active status', async () => {
    const inviteDoc = {
      code: 'VALID2026',
      status: 'issued',
      expiresAt: Date.now() + 100000,
      createdBy: 'admin',
      channel: 'web',
      telegramUserId: 998877,
    }

    const setCustomUserClaims = vi.fn().mockResolvedValue(undefined)
    const auth = { setCustomUserClaims } as unknown as Auth

    let updatedInvite: Record<string, unknown> | null = null
    let updatedUser: Record<string, unknown> | null = null

    const transaction = {
      get: vi.fn().mockImplementation((ref: { id: string }) => {
        if (ref.id === 'VALID2026') {
          return Promise.resolve({
            exists: true,
            data: () => inviteDoc,
          })
        }
        return Promise.resolve({
          exists: true,
          data: () => ({ accessStatus: 'waitlist', email: 'user@test.com' }),
        })
      }),
      update: vi.fn().mockImplementation((_ref: unknown, data: Record<string, unknown>) => {
        updatedInvite = data
      }),
      set: vi.fn().mockImplementation((_ref: unknown, data: Record<string, unknown>) => {
        updatedUser = data
      }),
    }

    const db = {
      collection: (name: string) => ({
        doc: (id: string) => ({ id, collection: name }),
      }),
      runTransaction: (fn: (tx: unknown) => Promise<unknown>) => fn(transaction),
    } as unknown as Firestore

    const result = await executeRedeemInvite({
      code: 'VALID2026',
      uid: 'user-123',
      userEmail: 'user@test.com',
      db,
      auth,
    })

    expect(result.success).toBe(true)
    expect(result.accessStatus).toBe('active')
    expect(updatedInvite?.status).toBe('used')
    expect(updatedInvite?.usedBy).toBe('user-123')
    expect(updatedUser?.accessStatus).toBe('active')
    expect(updatedUser?.telegramUserId).toBe(998877)
    expect(setCustomUserClaims).toHaveBeenCalledWith('user-123', { access: 'active' })
  })

  it('rejects expired invite', async () => {
    const expiredInvite = {
      code: 'EXPIRED',
      status: 'issued',
      expiresAt: Date.now() - 10000,
      createdBy: 'admin',
      channel: 'web',
    }

    const auth = { setCustomUserClaims: vi.fn() } as unknown as Auth
    const transaction = {
      get: vi.fn().mockResolvedValue({
        exists: true,
        data: () => expiredInvite,
      }),
    }

    const db = {
      collection: () => ({ doc: (id: string) => ({ id }) }),
      runTransaction: (fn: (tx: unknown) => Promise<unknown>) => fn(transaction),
    } as unknown as Firestore

    await expect(
      executeRedeemInvite({
        code: 'EXPIRED',
        uid: 'user-123',
        db,
        auth,
      })
    ).rejects.toThrow('Срок действия приглашения истёк')
  })

  it('is idempotent for the same user if already redeemed', async () => {
    const alreadyUsedInvite = {
      code: 'USED_BY_ME',
      status: 'used',
      usedBy: 'user-123',
      expiresAt: Date.now() + 10000,
    }

    const auth = { setCustomUserClaims: vi.fn().mockResolvedValue(undefined) } as unknown as Auth
    const transaction = {
      get: vi.fn().mockImplementation((ref: { id: string }) => {
        if (ref.id === 'USED_BY_ME') {
          return Promise.resolve({
            exists: true,
            data: () => alreadyUsedInvite,
          })
        }
        return Promise.resolve({
          exists: true,
          data: () => ({ accessStatus: 'active' }),
        })
      }),
    }

    const db = {
      collection: () => ({ doc: (id: string) => ({ id }) }),
      runTransaction: (fn: (tx: unknown) => Promise<unknown>) => fn(transaction),
    } as unknown as Firestore

    const result = await executeRedeemInvite({
      code: 'USED_BY_ME',
      uid: 'user-123',
      db,
      auth,
    })

    expect(result.success).toBe(true)
    expect(result.alreadyRedeemed).toBe(true)
  })
})
