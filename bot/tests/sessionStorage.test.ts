import { describe, expect, it, vi } from 'vitest'
import { FirestoreSessionStorage } from '../src/shared/storage/FirestoreSessionStorage.js'
import type { Firestore } from 'firebase/firestore'

describe('FirestoreSessionStorage', () => {
  it('reads session data when document exists', async () => {
    const mockDb = {} as Firestore
    const storage = new FirestoreSessionStorage<{ count: number }>(mockDb)

    const readSpy = vi.spyOn(storage, 'read').mockResolvedValue({ count: 42 })
    const result = await storage.read('user_123')

    expect(readSpy).toHaveBeenCalledWith('user_123')
    expect(result).toEqual({ count: 42 })
  })

  it('writes session data into document', async () => {
    const mockDb = {} as Firestore
    const storage = new FirestoreSessionStorage<{ count: number }>(mockDb)

    const writeSpy = vi.spyOn(storage, 'write').mockResolvedValue()
    await storage.write('user_123', { count: 99 })

    expect(writeSpy).toHaveBeenCalledWith('user_123', { count: 99 })
  })

  it('deletes session data document', async () => {
    const mockDb = {} as Firestore
    const storage = new FirestoreSessionStorage<{ count: number }>(mockDb)

    const deleteSpy = vi.spyOn(storage, 'delete').mockResolvedValue()
    await storage.delete('user_123')

    expect(deleteSpy).toHaveBeenCalledWith('user_123')
  })
})
