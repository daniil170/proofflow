import { describe, expect, it } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAdminAnalytics } from '../useAdminAnalytics.js'

describe('useAdminAnalytics', () => {
  it('loads analytics including productAnalytics from repository', async () => {
    const mockRepo = {
      getAnalytics: async () => ({
        totalApplications: 10,
        weekApplications: 5,
        todayApplications: 2,
        conversionRate: 40,
        channelBreakdown: { web: 7, telegram: 3 },
        businessTypeBreakdown: { agency_or_studio: 8, other: 2 },
        dailyTrend: [],
        funnel: [],
        productAnalytics: {
          casesStarted: 15,
          reachedReview: 10,
          casesPublished: 8,
          positiveFeedback: 7,
          negativeFeedback: 1,
          satisfactionRate: 88,
          fieldEdits: [{ field: 'metric', label: 'Метрика', count: 5 }],
        },
        hasEvents: true,
      }),
    }

    const { result } = renderHook(() => useAdminAnalytics({ repository: mockRepo }))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data?.productAnalytics?.casesStarted).toBe(15)
    expect(result.current.data?.productAnalytics?.satisfactionRate).toBe(88)
    expect(result.current.data?.productAnalytics?.fieldEdits[0].field).toBe('metric')
  })
})
