import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getCaseRepository } from '@/shared/api'
import { calculateStageStatuses, formatRussianFailReason } from './stages.js'

export const useCaseProgress = ({
  caseId,
  repository = getCaseRepository(),
  onReviewReady,
  longWaitThresholdMs = 20000,
} = {}) => {
  const [caseItem, setCaseItem] = useState(null)
  const [isLoading, setIsLoading] = useState(() => Boolean(caseId))
  const [error, setError] = useState(() =>
    caseId ? null : 'Идентификатор кейса не указан'
  )
  const [isProcessingTimedOut, setIsProcessingTimedOut] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

  const onReviewReadyRef = useRef(onReviewReady)
  useEffect(() => {
    onReviewReadyRef.current = onReviewReady
  }, [onReviewReady])

  const hasTriggeredReviewRef = useRef(false)

  useEffect(() => {
    if (!caseId) {
      return undefined
    }

    let isCancelled = false
    hasTriggeredReviewRef.current = false

    const unsubscribe = repository.subscribeById(
      caseId,
      (item) => {
        if (isCancelled) return
        setIsLoading(false)
        if (!item) {
          setError('Кейс не найден')
          setCaseItem(null)
          return
        }

        setError(null)
        setCaseItem(item)

        if (
          (item.status === 'review' || item.status === 'published') &&
          !hasTriggeredReviewRef.current
        ) {
          hasTriggeredReviewRef.current = true
          onReviewReadyRef.current?.(item)
        }
      },
      (err) => {
        if (isCancelled) return
        setIsLoading(false)
        setError(err?.message || 'Ошибка получения данных процесса')
      }
    )

    return () => {
      isCancelled = true
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [caseId, repository])

  const isCaseProcessing = caseItem?.status === 'processing'

  useEffect(() => {
    if (!isCaseProcessing) {
      return undefined
    }

    const timer = setTimeout(() => {
      setIsProcessingTimedOut(true)
    }, longWaitThresholdMs)

    return () => {
      clearTimeout(timer)
      setIsProcessingTimedOut(false)
    }
  }, [isCaseProcessing, longWaitThresholdMs])

  const retryProcessing = useCallback(async () => {
    if (!caseId) return
    setIsRetrying(true)
    setError(null)
    setIsProcessingTimedOut(false)
    hasTriggeredReviewRef.current = false

    try {
      await repository.update(caseId, {
        status: 'processing',
        stage: 'preparing',
        stageProgress: 15,
        stageMessage: 'Подготовка и нормализация источников',
        failReason: null,
      })

      const isMockApi =
        import.meta.env.VITE_USE_MOCK_API === 'true' ||
        !import.meta.env.VITE_FIREBASE_PROJECT_ID

      if (isMockApi) {
        const steps = [
          { stage: 'transcribing', progress: 35, msg: 'Расшифровка аудио и видео' },
          { stage: 'reading', progress: 55, msg: 'Извлечение сообщений из скриншотов' },
          { stage: 'analyzing', progress: 75, msg: 'Сборка структуры кейса' },
          { stage: 'verifying', progress: 90, msg: 'Проверка фактов и цитат' },
          { stage: 'done', progress: 100, msg: 'Готово к проверке', status: 'review' },
        ]

        let delay = 300
        for (const step of steps) {
          setTimeout(async () => {
            await repository.update(caseId, {
              status: step.status || 'processing',
              stage: step.stage,
              stageProgress: step.progress,
              stageMessage: step.msg,
            })
          }, delay)
          delay += 400
        }
      }
    } catch (err) {
      setError(err?.message || 'Не удалось перезапустить обработку')
    } finally {
      setIsRetrying(false)
    }
  }, [caseId, repository])

  const status = caseItem?.status || (isLoading ? 'loading' : 'unknown')
  const currentStage = caseItem?.stage || 'preparing'
  const stageProgress = typeof caseItem?.stageProgress === 'number' ? caseItem.stageProgress : 15
  const stageMessage = caseItem?.stageMessage || ''
  const rawFailReason = caseItem?.failReason || null
  const failReason = rawFailReason ? formatRussianFailReason(rawFailReason) : null

  const stages = useMemo(() => {
    return calculateStageStatuses(currentStage, status)
  }, [currentStage, status])

  const isLongWait = isProcessingTimedOut && status === 'processing'

  return {
    caseItem,
    isLoading,
    error,
    status,
    currentStage,
    stageProgress,
    stageMessage,
    failReason,
    stages,
    isLongWait,
    isRetrying,
    retryProcessing,
  }
}
