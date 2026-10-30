import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCaseReview } from '../useCaseReview.js'

describe('useCaseReview hook', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const createMockRepo = () => {
    return {
      update: vi.fn(async (_id, data) => data),
      saveFeedback: vi.fn(async (payload) => ({ id: 'fb-1', ...payload })),
    }
  }

  const sampleCase = {
    id: 'case-review-1',
    ownerId: 'user-1',
    status: 'review',
    clientLabel: 'ООО Ромашка',
    draft: {
      metric: {
        value: '+140%',
        label: 'рост конверсии',
        evidenceId: 'ev-metric-1',
      },
      problem: 'Было: Клиенты терялись из-за долгого ответа.',
      solution: 'Сделано: Настроили автоворонку.',
      result: 'Стало: Время ответа сократилось в 3 раза.',
      quote: {
        text: 'Команда в восторге от новой системы.',
        authorLabel: 'Анна К.',
        evidenceId: 'ev-quote-1',
      },
      tags: ['b2b', 'crm'],
      missingFields: [],
      needsReview: [],
    },
    evidences: [
      {
        id: 'ev-metric-1',
        sourceId: 'src-1',
        kind: 'chatMessage',
        reference: '1',
        exactQuote: 'Конверсия выросла на 140%',
      },
      {
        id: 'ev-quote-1',
        sourceId: 'src-2',
        kind: 'transcriptSegment',
        reference: '0-10',
        exactQuote: 'Команда в восторге от новой системы.',
      },
    ],
    sources: [
      {
        id: 'src-1',
        kind: 'screenshot',
        storagePath: 'screen.png',
        order: 0,
        mimeType: 'image/png',
      },
    ],
  }

  it('initializes draft from caseItem and allows verifying when complete', () => {
    const repo = createMockRepo()
    const { result } = renderHook(() =>
      useCaseReview({ caseItem: sampleCase, repository: repo })
    )

    expect(result.current.draft.metric.value).toBe('+140%')
    expect(result.current.draft.problem).toContain('Клиенты терялись')
    expect(result.current.canMarkVerified).toBe(true)
  })

  it('clears evidenceId and marks field as modified on user edit', () => {
    const repo = createMockRepo()
    const { result } = renderHook(() =>
      useCaseReview({ caseItem: sampleCase, repository: repo, autosaveDelayMs: 200 })
    )

    expect(result.current.isFieldModified('problem')).toBe(false)
    expect(result.current.draft.quote.evidenceId).toBe('ev-quote-1')

    act(() => {
      result.current.updateField('problem', 'Было: Клиенты уходили к конкурентам.')
      result.current.updateField('quote.text', 'Новая отредактированная цитата.')
    })

    expect(result.current.isFieldModified('problem')).toBe(true)
    expect(result.current.isFieldModified('quote.text')).toBe(true)
    expect(result.current.draft.quote.evidenceId).toBeNull()
  })

  it('disables canMarkVerified when needsReview has pending items', () => {
    const caseWithNeedsReview = {
      ...sampleCase,
      draft: {
        ...sampleCase.draft,
        needsReview: ['problem'],
      },
    }

    const repo = createMockRepo()
    const { result } = renderHook(() =>
      useCaseReview({ caseItem: caseWithNeedsReview, repository: repo })
    )

    expect(result.current.isFieldNeedsReview('problem')).toBe(true)
    expect(result.current.canMarkVerified).toBe(false)

    act(() => {
      result.current.updateField('problem', 'Отредактированная проблема')
    })

    expect(result.current.isFieldNeedsReview('problem')).toBe(false)
    expect(result.current.canMarkVerified).toBe(true)
  })

  it('handles unconfirmed metric field with missing prompt', () => {
    const caseUnconfirmedMetric = {
      ...sampleCase,
      draft: {
        ...sampleCase.draft,
        metric: { value: '', label: 'рост', evidenceId: null },
        missingFields: ['metric'],
      },
    }

    const repo = createMockRepo()
    const { result } = renderHook(() =>
      useCaseReview({ caseItem: caseUnconfirmedMetric, repository: repo })
    )

    expect(result.current.isFieldMissing('metric')).toBe(true)
    expect(result.current.canMarkVerified).toBe(false)

    act(() => {
      result.current.updateField('metric.value', '+45%')
    })

    expect(result.current.isFieldMissing('metric')).toBe(false)
    expect(result.current.draft.metric.value).toBe('+45%')
    expect(result.current.canMarkVerified).toBe(true)
  })

  it('calls repository.update and onVerified on markAsVerified', async () => {
    const repo = createMockRepo()
    const onVerified = vi.fn()

    const { result } = renderHook(() =>
      useCaseReview({
        caseItem: sampleCase,
        repository: repo,
        onVerified,
      })
    )

    await act(async () => {
      await result.current.markAsVerified()
    })

    expect(repo.update).toHaveBeenCalledWith(
      'case-review-1',
      expect.objectContaining({
        status: 'ready',
        draft: expect.any(Object),
      })
    )
    expect(onVerified).toHaveBeenCalledTimes(1)
  })

  it('regenerates draft tone while preserving user modified fields', async () => {
    const repo = createMockRepo()
    const { result } = renderHook(() =>
      useCaseReview({ caseItem: sampleCase, repository: repo })
    )

    act(() => {
      result.current.updateField('problem', 'Моя уникальная формулировка проблемы')
    })

    expect(result.current.isFieldModified('problem')).toBe(true)

    await act(async () => {
      await result.current.regenerateDraft('shorter', true)
    })

    expect(result.current.draft.problem).toBe('Моя уникальная формулировка проблемы')
    expect(result.current.draft.solution).toContain('Сделано:')
  })

  it('submits user rating and feedback to repository', async () => {
    const repo = createMockRepo()
    const { result } = renderHook(() =>
      useCaseReview({ caseItem: sampleCase, repository: repo })
    )

    await act(async () => {
      await result.current.submitFeedback('positive', 'Отличная точность цитат')
    })

    expect(repo.saveFeedback).toHaveBeenCalledWith({
      caseId: 'case-review-1',
      rating: 'positive',
      comment: 'Отличная точность цитат',
      userId: 'user-1',
    })
    expect(result.current.feedbackState.isSubmitted).toBe(true)
  })

  it('debounces autosave on field edits', async () => {
    const repo = createMockRepo()
    const { result } = renderHook(() =>
      useCaseReview({ caseItem: sampleCase, repository: repo, autosaveDelayMs: 300 })
    )

    act(() => {
      result.current.updateField('result', 'Обновленный результат 1')
      result.current.updateField('result', 'Обновленный результат 2')
    })

    expect(repo.update).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(350)
    })

    expect(repo.update).toHaveBeenCalledTimes(1)
    expect(repo.update).toHaveBeenCalledWith(
      'case-review-1',
      expect.objectContaining({
        draft: expect.objectContaining({
          result: 'Обновленный результат 2',
        }),
      })
    )
  })

  it('updates draft and selected messages when caseItem transitions from processing to review with populated draft', () => {
    const repo = createMockRepo()
    const processingCase = {
      id: 'case-processing-1',
      ownerId: 'user-1',
      status: 'processing',
      draft: null,
      chatMessages: [],
      selectedChatMessages: [],
    }

    const { result, rerender } = renderHook(
      ({ item }) => useCaseReview({ caseItem: item, repository: repo }),
      { initialProps: { item: processingCase } }
    )

    expect(result.current.draft.headline.text).toBe('')
    expect(result.current.selectedChatMessages).toHaveLength(0)

    const completedCase = {
      id: 'case-processing-1',
      ownerId: 'user-1',
      status: 'review',
      messenger: 'telegram',
      draft: {
        headline: { text: 'Было очень круто', evidenceId: 'ev-1' },
        metric: { value: '', label: '', evidenceId: null },
        problem: '',
        solution: '',
        result: 'Делаются успехи',
        summaryRows: [
          { id: 'row-1', label: 'Впечатление', text: 'Было очень круто', origin: 'client_words' },
        ],
        quote: { text: 'Было очень круто! Спасибо', authorLabel: 'Клиент', evidenceId: 'ev-1' },
        tags: [],
        missingFields: [],
        needsReview: [],
      },
      chatMessages: [
        { id: 'm-1', text: 'Супер!', time: '19:30' },
        { id: 'm-2', text: 'Было очень круто! Спасибо', time: '19:31' },
      ],
      selectedChatMessages: [
        { id: 'm-2', text: 'Было очень круто! Спасибо', time: '19:31' },
      ],
    }

    rerender({ item: completedCase })

    expect(result.current.draft.headline.text).toBe('Было очень круто')
    expect(result.current.draft.summaryRows).toHaveLength(1)
    expect(result.current.selectedChatMessages).toHaveLength(1)
    expect(result.current.messenger).toBe('telegram')
  })
})
