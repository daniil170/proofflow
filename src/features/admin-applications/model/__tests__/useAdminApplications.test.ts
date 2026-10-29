import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useAdminApplications } from '../useAdminApplications'

describe('useAdminApplications', () => {
  const sampleApps = [
    {
      id: 'app-1',
      status: 'new',
      channel: 'web',
      email: 'anna@agency.io',
      telegramUsername: 'annadesign',
      createdAt: 1730000000000,
      ownerNote: '',
    },
    {
      id: 'app-2',
      status: 'approved',
      channel: 'telegram',
      email: null,
      telegramUsername: 'boris_it',
      createdAt: 1730000100000,
      ownerNote: 'Заметка о Борисе',
    },
    {
      id: 'app-3',
      status: 'new',
      channel: 'web',
      email: 'clara@studio.com',
      telegramUsername: null,
      createdAt: 1730000200000,
      ownerNote: '',
    },
  ]

  const createMockRepo = () => {
    let currentApps = [...sampleApps]
    let listener = null

    return {
      subscribeApplications: vi.fn((onNext) => {
        listener = onNext
        onNext(currentApps)
        return () => {
          listener = null
        }
      }),
      updateStatus: vi.fn(async (id, status) => {
        currentApps = currentApps.map((a) => (a.id === id ? { ...a, status } : a))
        if (listener) listener(currentApps)
      }),
      updateNote: vi.fn(async (id, note) => {
        currentApps = currentApps.map((a) => (a.id === id ? { ...a, ownerNote: note } : a))
        if (listener) listener(currentApps)
      }),
      deleteApplication: vi.fn(async (id) => {
        currentApps = currentApps.filter((a) => a.id !== id)
        if (listener) listener(currentApps)
      }),
    }
  }

  it('calculates newCount and subscribes to applications', () => {
    const mockRepo = createMockRepo()
    const { result } = renderHook(() => useAdminApplications({ repository: mockRepo }))

    expect(result.current.isLoading).toBe(false)
    expect(result.current.allApplications.length).toBe(3)
    expect(result.current.newCount).toBe(2)
  })

  it('filters applications by status', () => {
    const mockRepo = createMockRepo()
    const { result } = renderHook(() => useAdminApplications({ repository: mockRepo }))

    act(() => {
      result.current.setStatusFilter('approved')
    })

    expect(result.current.filteredApplications.length).toBe(1)
    expect(result.current.filteredApplications[0].id).toBe('app-2')
  })

  it('filters applications by channel', () => {
    const mockRepo = createMockRepo()
    const { result } = renderHook(() => useAdminApplications({ repository: mockRepo }))

    act(() => {
      result.current.setChannelFilter('telegram')
    })

    expect(result.current.filteredApplications.length).toBe(1)
    expect(result.current.filteredApplications[0].id).toBe('app-2')
  })

  it('filters applications by search query', () => {
    const mockRepo = createMockRepo()
    const { result } = renderHook(() => useAdminApplications({ repository: mockRepo }))

    act(() => {
      result.current.setSearchQuery('anna')
    })

    expect(result.current.filteredApplications.length).toBe(1)
    expect(result.current.filteredApplications[0].id).toBe('app-1')
  })

  it('updates owner note', async () => {
    const mockRepo = createMockRepo()
    const { result } = renderHook(() => useAdminApplications({ repository: mockRepo }))

    await act(async () => {
      await result.current.updateOwnerNote('app-1', 'Новая заметка для Анны')
    })

    expect(mockRepo.updateNote).toHaveBeenCalledWith('app-1', 'Новая заметка для Анны')
  })

  it('updates application status and reject reason', async () => {
    const mockRepo = createMockRepo()
    const { result } = renderHook(() => useAdminApplications({ repository: mockRepo }))

    await act(async () => {
      await result.current.updateStatus('app-1', 'rejected', 'Не подходит формат')
    })

    expect(mockRepo.updateStatus).toHaveBeenCalledWith('app-1', 'rejected', 'Не подходит формат')
  })

  it('deletes application and clears selection if selected', async () => {
    const mockRepo = createMockRepo()
    const { result } = renderHook(() => useAdminApplications({ repository: mockRepo }))

    act(() => {
      result.current.setSelectedAppId('app-1')
    })
    expect(result.current.selectedApplication?.id).toBe('app-1')

    await act(async () => {
      await result.current.deleteApplication('app-1')
    })

    expect(mockRepo.deleteApplication).toHaveBeenCalledWith('app-1')
    expect(result.current.selectedApplication).toBeNull()
  })
})
