import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  calculateStageStatuses,
  formatRussianFailReason,
} from '../stages.js'
import { useCaseProgress } from '../useCaseProgress.js'

describe('calculateStageStatuses', () => {
  it('marks all stages completed when review or published', () => {
    const stagesReview = calculateStageStatuses('done', 'review')
    expect(stagesReview.every((s) => s.status === 'completed')).toBe(true)

    const stagesPublished = calculateStageStatuses('done', 'published')
    expect(stagesPublished.every((s) => s.status === 'completed')).toBe(true)
  })

  it('marks prior stages completed, current active, and future pending', () => {
    const stages = calculateStageStatuses('reading', 'processing')
    expect(stages[0].status).toBe('completed')
    expect(stages[1].status).toBe('completed')
    expect(stages[2].status).toBe('active')
    expect(stages[3].status).toBe('pending')
    expect(stages[4].status).toBe('pending')
  })

  it('marks current stage failed and future pending on failure', () => {
    const stages = calculateStageStatuses('transcribing', 'failed')
    expect(stages[0].status).toBe('completed')
    expect(stages[1].status).toBe('failed')
    expect(stages[2].status).toBe('pending')
    expect(stages[3].status).toBe('pending')
    expect(stages[4].status).toBe('pending')
  })
})

describe('formatRussianFailReason', () => {
  it('translates audio/whisper errors to user-friendly Russian', () => {
    const translated = formatRussianFailReason('Whisper transcription failed with error')
    expect(translated).toContain('Не удалось распознать речь')
  })

  it('translates image vision errors to user-friendly Russian', () => {
    const translated = formatRussianFailReason('Vision model failed to read screenshot')
    expect(translated).toContain('Не удалось прочитать текст на скриншотах')
  })

  it('translates timeout errors to Russian', () => {
    const translated = formatRussianFailReason('Network timed out 504')
    expect(translated).toContain('Время обработки истекло')
  })

  it('provides default fallback on empty reason', () => {
    const translated = formatRussianFailReason('')
    expect(translated).toContain('Произошла непредвиденная ошибка')
  })
})

describe('useCaseProgress hook', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const createMockRepo = (initialCase) => {
    let current = initialCase ? { ...initialCase } : null
    const listeners = new Set()

    return {
      subscribeById: vi.fn((id, onUpdate) => {
        listeners.add(onUpdate)
        onUpdate(current)
        return () => listeners.delete(onUpdate)
      }),
      update: vi.fn(async (id, data) => {
        current = { ...current, ...data, id }
        listeners.forEach((fn) => fn(current))
        return current
      }),
      emit: (updated) => {
        current = { ...current, ...updated }
        listeners.forEach((fn) => fn(current))
      },
    }
  }

  it('loads case and provides stages for processing state', () => {
    const repo = createMockRepo({
      id: 'case-1',
      status: 'processing',
      stage: 'transcribing',
      clientLabel: 'ООО Ромашка',
    })

    const { result } = renderHook(() =>
      useCaseProgress({ caseId: 'case-1', repository: repo })
    )

    expect(result.current.isLoading).toBe(false)
    expect(result.current.status).toBe('processing')
    expect(result.current.currentStage).toBe('transcribing')
    expect(result.current.stages[0].status).toBe('completed')
    expect(result.current.stages[1].status).toBe('active')
    expect(result.current.stages[2].status).toBe('pending')
  })

  it('triggers onReviewReady when status updates to review', () => {
    const repo = createMockRepo({
      id: 'case-2',
      status: 'processing',
      stage: 'verifying',
    })

    const onReviewReady = vi.fn()

    renderHook(() =>
      useCaseProgress({
        caseId: 'case-2',
        repository: repo,
        onReviewReady,
      })
    )

    expect(onReviewReady).not.toHaveBeenCalled()

    act(() => {
      repo.emit({ status: 'review', stage: 'done' })
    })

    expect(onReviewReady).toHaveBeenCalledTimes(1)
    expect(onReviewReady).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'review' })
    )
  })

  it('triggers long wait message when threshold elapsed during processing', () => {
    const repo = createMockRepo({
      id: 'case-3',
      status: 'processing',
      stage: 'transcribing',
    })

    const { result } = renderHook(() =>
      useCaseProgress({
        caseId: 'case-3',
        repository: repo,
        longWaitThresholdMs: 5000,
      })
    )

    expect(result.current.isLongWait).toBe(false)

    act(() => {
      vi.advanceTimersByTime(5100)
    })

    expect(result.current.isLongWait).toBe(true)

    act(() => {
      repo.emit({ status: 'review' })
    })

    expect(result.current.isLongWait).toBe(false)
  })

  it('allows retrying when processing failed', async () => {
    const repo = createMockRepo({
      id: 'case-4',
      status: 'failed',
      stage: 'transcribing',
      failReason: 'Whisper failed',
    })

    const { result } = renderHook(() =>
      useCaseProgress({
        caseId: 'case-4',
        repository: repo,
      })
    )

    expect(result.current.status).toBe('failed')
    expect(result.current.failReason).toContain('Не удалось распознать речь')

    await act(async () => {
      await result.current.retryProcessing()
    })

    expect(repo.update).toHaveBeenCalledWith(
      'case-4',
      expect.objectContaining({
        status: 'processing',
        stage: 'preparing',
        failReason: null,
      })
    )
  })
})
