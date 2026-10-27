import { describe, expect, it, vi } from 'vitest'
import { executeCleanupExpiredSources } from '../cleanupExpiredSources.js'

describe('cleanupExpiredSources use-case', () => {
  it('cleans files for cases ready longer than retentionDays', async () => {
    const now = Date.now()
    const dayMs = 24 * 60 * 60 * 1000
    const fifteenDaysAgo = now - 15 * dayMs
    const twoDaysAgo = now - 2 * dayMs

    const updateMock1 = vi.fn().mockResolvedValue({})
    const updateMock2 = vi.fn().mockResolvedValue({})

    const doc1 = {
      id: 'expired-case',
      data: () => ({
        status: 'ready',
        readyAt: fifteenDaysAgo,
        sourcesCleaned: false,
        sources: [
          { id: 's1', storagePath: 'cases/expired-case/audio.mp3' },
          { id: 's2', storagePath: 'cases/expired-case/chat.png' },
        ],
      }),
      ref: { update: updateMock1 },
    }

    const doc2 = {
      id: 'fresh-case',
      data: () => ({
        status: 'ready',
        readyAt: twoDaysAgo,
        sourcesCleaned: false,
        sources: [{ id: 's3', storagePath: 'cases/fresh-case/chat.png' }],
      }),
      ref: { update: updateMock2 },
    }

    const docAlreadyCleaned = {
      id: 'already-cleaned',
      data: () => ({
        status: 'ready',
        readyAt: fifteenDaysAgo,
        sourcesCleaned: true,
      }),
      ref: { update: vi.fn() },
    }

    const dbMock = {
      collection: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            size: 3,
            docs: [doc1, doc2, docAlreadyCleaned],
          }),
        }),
      }),
    } as unknown as Parameters<typeof executeCleanupExpiredSources>[0]['db']

    const fileDeleteMock = vi.fn().mockResolvedValue({})
    const deleteFilesMock = vi.fn().mockResolvedValue({})

    const bucketMock = {
      file: vi.fn().mockReturnValue({
        delete: fileDeleteMock,
      }),
      deleteFiles: deleteFilesMock,
    }

    const result = await executeCleanupExpiredSources({
      db: dbMock,
      bucket: bucketMock,
      retentionDays: 14,
      now,
    })

    expect(result.cleanedCount).toBe(1)
    expect(result.totalChecked).toBe(3)
    expect(fileDeleteMock).toHaveBeenCalledTimes(2)
    expect(deleteFilesMock).toHaveBeenCalledWith({
      prefix: 'cases/expired-case/',
      force: true,
    })
    expect(updateMock1).toHaveBeenCalledWith({
      sourcesCleaned: true,
      sourcesCleanedAt: now,
    })
    expect(updateMock2).not.toHaveBeenCalled()
  })
})
