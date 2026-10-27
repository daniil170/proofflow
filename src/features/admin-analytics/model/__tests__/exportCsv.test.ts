import { describe, expect, it, vi } from 'vitest'
import { exportApplicationsToCsv } from '../exportCsv'

describe('exportApplicationsToCsv', () => {
  it('creates blob and triggers download with correct content', () => {
    let capturedBlob = null
    const createObjectURL = vi.fn((blob) => {
      capturedBlob = blob
      return 'blob:mock-url'
    })
    const revokeObjectURL = vi.fn()

    window.URL.createObjectURL = createObjectURL
    window.URL.revokeObjectURL = revokeObjectURL

    const appendChildSpy = vi.spyOn(document.body, 'appendChild')
    const removeChildSpy = vi.spyOn(document.body, 'removeChild')

    const applications = [
      {
        id: 'app-1',
        createdAt: 1730000000000,
        channel: 'web',
        source: 'web',
        email: 'test@example.com',
        telegramUsername: 'tester',
        businessType: 'marketing_agency',
        casesVolume: '1-3',
        currentProcess: 'В Figma',
        status: 'new',
        inviteCode: null,
        invitedAt: null,
        activatedAt: null,
        ownerNote: 'Перспективный лид',
      },
    ]

    exportApplicationsToCsv(applications)

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
    expect(appendChildSpy).toHaveBeenCalled()
    expect(removeChildSpy).toHaveBeenCalled()
    expect(capturedBlob).not.toBeNull()
    expect(capturedBlob.type).toBe('text/csv;charset=utf-8;')
  })
})
