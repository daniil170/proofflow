import type { Auth } from 'firebase-admin/auth'
import type { Firestore } from 'firebase-admin/firestore'
import { describe, expect, it, vi } from 'vitest'
import {
  executeGetAdminUsers,
  executeUpdateUserLimits,
  UpdateUserLimitsError,
} from '../adminUsers.js'

describe('adminUsers use cases', () => {
  describe('executeGetAdminUsers', () => {
    it('aggregates cases, downloads, shares, and lastActiveAt correctly', async () => {
      const now = Date.now()
      const mockUsers = [
        {
          id: 'user_1',
          data: () => ({
            email: 'founder@example.com',
            accessStatus: 'active',
            caseLimit: 5,
            accessExpiresAt: now + 86400000,
            profile: {
              displayName: 'Алексей С.',
              companyName: 'Nova Marketing',
              businessType: 'marketing_agency',
            },
            telegramUserId: 123456,
            createdAt: now - 100000,
            updatedAt: now - 50000,
          }),
        },
        {
          id: 'user_2',
          data: () => ({
            email: 'simple@example.com',
            accessStatus: 'waitlist',
            createdAt: now - 200000,
            updatedAt: now - 150000,
          }),
        },
      ]

      const mockCases = [
        {
          id: 'case_1',
          data: () => ({
            ownerId: 'user_1',
            createdAt: now - 40000,
            updatedAt: now - 10000,
          }),
        },
        {
          id: 'case_2',
          data: () => ({
            ownerId: 'user_1',
            createdAt: now - 30000,
            updatedAt: now - 5000,
          }),
        },
        {
          id: 'case_3',
          data: () => ({
            ownerId: 'user_3', // other user
            createdAt: now - 20000,
          }),
        },
      ]

      const mockEvents = [
        {
          id: 'event_1',
          data: () => ({
            userId: 'user_1',
            eventName: 'png_downloaded',
            timestamp: now - 2000,
          }),
        },
        {
          id: 'event_2',
          data: () => ({
            userId: 'user_1',
            eventName: 'png_downloaded',
            timestamp: now - 1500,
          }),
        },
        {
          id: 'event_3',
          data: () => ({
            userId: 'user_1',
            eventName: 'link_copied',
            timestamp: now - 1000,
          }),
        },
        {
          id: 'event_4',
          data: () => ({
            userId: 'user_1',
            eventName: 'embed_copied',
            timestamp: now - 500,
          }),
        },
        {
          id: 'event_5',
          data: () => ({
            userId: 'user_1',
            eventName: 'case_started',
            timestamp: now - 300,
          }),
        },
      ]

      const db = {
        collection: (name: string) => ({
          get: vi.fn().mockImplementation(() => {
            if (name === 'users') return Promise.resolve({ docs: mockUsers })
            if (name === 'cases') return Promise.resolve({ docs: mockCases })
            if (name === 'events') return Promise.resolve({ docs: mockEvents })
            return Promise.resolve({ docs: [] })
          }),
        }),
      } as unknown as Firestore

      const result = await executeGetAdminUsers(db)

      expect(result).toHaveLength(2)

      const user1 = result.find((u) => u.id === 'user_1')!
      expect(user1).toBeDefined()
      expect(user1.email).toBe('founder@example.com')
      expect(user1.displayName).toBe('Алексей С.')
      expect(user1.companyName).toBe('Nova Marketing')
      expect(user1.businessType).toBe('marketing_agency')
      expect(user1.telegramUserId).toBe(123456)
      expect(user1.accessStatus).toBe('active')
      expect(user1.caseLimit).toBe(5)
      expect(user1.accessExpiresAt).toBe(now + 86400000)
      expect(user1.casesCount).toBe(2)
      expect(user1.downloadsCount).toBe(2)
      expect(user1.sharesCount).toBe(2)
      expect(user1.lastActiveAt).toBe(now - 300) // latest event timestamp

      const user2 = result.find((u) => u.id === 'user_2')!
      expect(user2).toBeDefined()
      expect(user2.caseLimit).toBe(3) // default
      expect(user2.accessExpiresAt).toBeNull()
      expect(user2.casesCount).toBe(0)
      expect(user2.downloadsCount).toBe(0)
      expect(user2.sharesCount).toBe(0)
      expect(user2.lastActiveAt).toBe(now - 150000) // user.updatedAt
    })

    it('gracefully handles missing events collection', async () => {
      const db = {
        collection: (name: string) => ({
          get: vi.fn().mockImplementation(() => {
            if (name === 'users') return Promise.resolve({ docs: [] })
            if (name === 'cases') return Promise.resolve({ docs: [] })
            return Promise.reject(new Error('Collection not found'))
          }),
        }),
      } as unknown as Firestore

      const result = await executeGetAdminUsers(db)
      expect(result).toEqual([])
    })
  })

  describe('executeUpdateUserLimits', () => {
    it('updates user limits and syncs custom claims when accessStatus changes', async () => {
      const now = Date.now()
      let userDocData: Record<string, unknown> = {
        id: 'user-to-update',
        email: 'user@test.com',
        accessStatus: 'waitlist',
        caseLimit: 3,
        accessExpiresAt: null,
      }

      const userRef = {
        get: vi.fn().mockImplementation(() =>
          Promise.resolve({
            exists: true,
            id: 'user-to-update',
            data: () => userDocData,
          })
        ),
        update: vi.fn().mockImplementation((updates: Record<string, unknown>) => {
          userDocData = { ...userDocData, ...updates }
          return Promise.resolve()
        }),
      }

      const db = {
        collection: () => ({
          doc: () => userRef,
        }),
      } as unknown as Firestore

      const getUser = vi.fn().mockResolvedValue({
        customClaims: { existingClaim: true },
      })
      const setCustomUserClaims = vi.fn().mockResolvedValue(undefined)
      const auth = { getUser, setCustomUserClaims } as unknown as Auth

      const targetExpiry = now + 14 * 86400000
      const result = await executeUpdateUserLimits(db, auth, {
        userId: 'user-to-update',
        caseLimit: 10,
        accessExpiresAt: targetExpiry,
        accessStatus: 'active',
      })

      expect(result.id).toBe('user-to-update')
      expect(result.caseLimit).toBe(10)
      expect(result.accessExpiresAt).toBe(targetExpiry)
      expect(result.accessStatus).toBe('active')
      expect(userRef.update).toHaveBeenCalled()
      expect(setCustomUserClaims).toHaveBeenCalledWith('user-to-update', {
        existingClaim: true,
        access: 'active',
      })
    })

    it('throws invalid-argument on empty userId', async () => {
      const db = {} as unknown as Firestore
      await expect(
        executeUpdateUserLimits(db, null, {
          userId: '   ',
        })
      ).rejects.toThrow(UpdateUserLimitsError)
    })

    it('throws not-found when user does not exist', async () => {
      const db = {
        collection: () => ({
          doc: () => ({
            get: vi.fn().mockResolvedValue({ exists: false }),
          }),
        }),
      } as unknown as Firestore

      await expect(
        executeUpdateUserLimits(db, null, {
          userId: 'non-existent',
        })
      ).rejects.toThrow('Пользователь не найден')
    })

    it('validates caseLimit to be non-negative integer', async () => {
      const db = {} as unknown as Firestore
      await expect(
        executeUpdateUserLimits(db, null, {
          userId: 'valid-user',
          caseLimit: -2,
        })
      ).rejects.toThrow('caseLimit должен быть неотрицательным целым числом')

      await expect(
        executeUpdateUserLimits(db, null, {
          userId: 'valid-user',
          caseLimit: 3.5,
        })
      ).rejects.toThrow('caseLimit должен быть неотрицательным целым числом')
    })

    it('validates accessStatus to be one of allowed values', async () => {
      const db = {} as unknown as Firestore
      await expect(
        executeUpdateUserLimits(db, null, {
          userId: 'valid-user',
          accessStatus: 'invalid_status' as 'active',
        })
      ).rejects.toThrow('Недопустимый accessStatus')
    })

    it('allows clearing accessExpiresAt with null', async () => {
      let userDocData: Record<string, unknown> = {
        id: 'user-clear',
        accessExpiresAt: Date.now() + 100000,
      }

      const userRef = {
        get: vi.fn().mockImplementation(() =>
          Promise.resolve({
            exists: true,
            id: 'user-clear',
            data: () => userDocData,
          })
        ),
        update: vi.fn().mockImplementation((updates: Record<string, unknown>) => {
          userDocData = { ...userDocData, ...updates }
          return Promise.resolve()
        }),
      }

      const db = {
        collection: () => ({
          doc: () => userRef,
        }),
      } as unknown as Firestore

      const result = await executeUpdateUserLimits(db, null, {
        userId: 'user-clear',
        accessExpiresAt: null,
      })

      expect(result.accessExpiresAt).toBeNull()
    })
  })
})
