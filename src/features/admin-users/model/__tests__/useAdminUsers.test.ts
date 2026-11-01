import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAdminUsers } from '../useAdminUsers'

describe('useAdminUsers', () => {
  const mockUsersList = [
    {
      id: 'u1',
      email: 'alex@example.com',
      displayName: 'Alex',
      companyName: 'Studio A',
      accessStatus: 'active',
      caseLimit: 5,
      casesCount: 2,
      downloadsCount: 3,
      sharesCount: 1,
    },
    {
      id: 'u2',
      email: 'bob@example.com',
      displayName: 'Bob',
      companyName: 'Agency B',
      accessStatus: 'waitlist',
      caseLimit: 3,
      casesCount: 0,
      downloadsCount: 0,
      sharesCount: 0,
    },
  ]

  const mockRepository = {
    getUsers: vi.fn().mockResolvedValue(mockUsersList),
    updateUserLimits: vi.fn().mockImplementation((userId, payload) =>
      Promise.resolve({
        success: true,
        user: { id: userId, ...payload },
      })
    ),
  }

  it('loads users on mount and computes metrics', async () => {
    const { result } = renderHook(() => useAdminUsers({ repository: mockRepository }))

    // Initially loading
    expect(result.current.isLoading).toBe(true)

    // Wait for resolution
    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.users.length).toBe(2)
    expect(result.current.metrics.total).toBe(2)
    expect(result.current.metrics.active).toBe(1)
    expect(result.current.metrics.totalCases).toBe(2)
    expect(result.current.metrics.totalDownloads).toBe(3)
    expect(result.current.metrics.totalShares).toBe(1)
  })

  it('filters users by search query and status', async () => {
    const { result } = renderHook(() => useAdminUsers({ repository: mockRepository }))

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.setSearchQuery('alex')
    })
    expect(result.current.users.length).toBe(1)
    expect(result.current.users[0].id).toBe('u1')

    act(() => {
      result.current.setSearchQuery('')
      result.current.setStatusFilter('waitlist')
    })
    expect(result.current.users.length).toBe(1)
    expect(result.current.users[0].id).toBe('u2')
  })

  it('updates user limits and updates state', async () => {
    const { result } = renderHook(() => useAdminUsers({ repository: mockRepository }))

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.updateUserLimits('u1', { caseLimit: 10 })
    })

    expect(mockRepository.updateUserLimits).toHaveBeenCalledWith('u1', { caseLimit: 10 })
    const updated = result.current.users.find((u) => u.id === 'u1')
    expect(updated?.caseLimit).toBe(10)
  })
})
