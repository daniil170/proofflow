import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { caseDraftSchema } from '@/entities/case/model/schemas'
import { getCaseRepository, trackAnalyticsEvent } from '@/shared/api'

export const REGENERATE_STYLES = Object.freeze({
  shorter: {
    id: 'shorter',
    label: 'Короче',
    description: 'Максимально емко, по 1-2 предложения на пункт',
  },
  stricter: {
    id: 'stricter',
    label: 'Строже',
    description: 'Деловой стиль для корпоративных заказчиков',
  },
  warmer: {
    id: 'warmer',
    label: 'Теплее',
    description: 'Живой язык с фокусом на эмоции и доверие',
  },
})

const transformTextTone = (text, mode, prefix = '') => {
  if (!text) return ''
  const clean = text.replace(/^(Было|Сделано|Стало):\s*/i, '').trim()

  if (mode === 'shorter') {
    const sentences = clean.split(/[.!?]\s+/).filter(Boolean)
    const shortened = sentences.slice(0, 2).join('. ')
    return prefix ? `${prefix}: ${shortened}${shortened.endsWith('.') ? '' : '.'}` : shortened
  }

  if (mode === 'stricter') {
    const formal = clean
      .replace(/круто|супер|в восторге/gi, 'на высоком уровне')
      .replace(/куча|много/gi, 'значительный объем')
    return prefix ? `${prefix}: ${formal}` : formal
  }

  if (mode === 'warmer') {
    const warm = clean.replace(/произведено внедрение/gi, 'помогли запустить')
    return prefix ? `${prefix}: ${warm}` : warm
  }

  return clean
}

const cleanPrefix = (str, prefix) => {
  if (!str) return ''
  return str.replace(new RegExp(`^${prefix}:\\s*`, 'i'), '')
}

export const useCaseReview = ({
  caseItem,
  repository = getCaseRepository(),
  onVerified,
  autosaveDelayMs = 600,
} = {}) => {
  const initialDraft = useMemo(() => {
    return {
      metric: {
        value: String(caseItem?.draft?.metric?.value ?? ''),
        label: String(caseItem?.draft?.metric?.label ?? ''),
        evidenceId: caseItem?.draft?.metric?.evidenceId || null,
      },
      problem: cleanPrefix(String(caseItem?.draft?.problem ?? ''), 'было'),
      solution: cleanPrefix(String(caseItem?.draft?.solution ?? ''), 'сделано'),
      result: cleanPrefix(String(caseItem?.draft?.result ?? ''), 'стало'),
      quote: {
        text: String(caseItem?.draft?.quote?.text ?? ''),
        authorLabel: caseItem?.draft?.quote?.authorLabel || 'Анна К.',
        evidenceId: caseItem?.draft?.quote?.evidenceId || null,
        authorRole: caseItem?.draft?.quote?.authorRole || '',
        authorCompany: caseItem?.draft?.quote?.authorCompany || '',
      },
      tags: caseItem?.draft?.tags || [],
      missingFields: caseItem?.draft?.missingFields || [],
      needsReview: caseItem?.draft?.needsReview || [],
    }
  }, [caseItem?.draft])

  const [draft, setDraft] = useState(initialDraft)
  const [modifiedFields, setModifiedFields] = useState(() => {
    return new Set(caseItem?.modifiedFields || [])
  })
  const modifiedFieldsRef = useRef(new Set(caseItem?.modifiedFields || []))

  useEffect(() => {
    modifiedFieldsRef.current = modifiedFields
  }, [modifiedFields])
  const [activeEvidence, setActiveEvidence] = useState(null)
  const [saveStatus, setSaveStatus] = useState('idle')
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [feedbackState, setFeedbackState] = useState({
    rating: null,
    comment: '',
    isSubmitting: false,
    isSubmitted: false,
  })
  const [activeTab, setActiveTab] = useState('edit')
  const [validationErrors, setValidationErrors] = useState({})

  const debounceTimerRef = useRef(null)
  const isInitialMountRef = useRef(true)

  const evidences = useMemo(() => {
    return caseItem?.evidences || []
  }, [caseItem?.evidences])

  const sources = useMemo(() => {
    return caseItem?.sources || []
  }, [caseItem?.sources])

  useEffect(() => {
    if (caseItem?.id) {
      trackAnalyticsEvent('review_opened', {
        userId: caseItem.ownerId,
        caseId: caseItem.id,
      })
    }
  }, [caseItem?.id, caseItem?.ownerId])

  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false
      return
    }
    setDraft(initialDraft)
  }, [initialDraft])

  const runValidation = useCallback((currentDraft) => {
    const errors = {}

    const metricValue = String(currentDraft?.metric?.value ?? '').trim()
    const metricLabel = String(currentDraft?.metric?.label ?? '').trim()
    const problem = String(currentDraft?.problem ?? '').trim()
    const solution = String(currentDraft?.solution ?? '').trim()
    const result = String(currentDraft?.result ?? '').trim()
    const quoteText = String(currentDraft?.quote?.text ?? '').trim()

    if (!metricValue) {
      errors['metric.value'] = 'Укажите числовое значение или процент'
    }
    if (!metricLabel) {
      errors['metric.label'] = 'Укажите подпись к метрике'
    }
    if (!problem) {
      errors.problem = 'Опишите, какая была проблема'
    }
    if (!solution) {
      errors.solution = 'Опишите, что было сделано'
    }
    if (!result) {
      errors.result = 'Опишите полученный результат'
    }
    if (!quoteText) {
      errors['quote.text'] = 'Цитата не может быть пустой'
    }

    try {
      caseDraftSchema.parse(currentDraft)
    } catch {
      return errors
    }

    setValidationErrors(errors)
    return errors
  }, [])

  const triggerAutosave = useCallback(
    (nextDraft, nextModified) => {
      if (!caseItem?.id) return

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      setSaveStatus('saving')

      debounceTimerRef.current = setTimeout(async () => {
        try {
          await repository.update(caseItem.id, {
            draft: nextDraft,
            modifiedFields: Array.from(nextModified),
          })
          setSaveStatus('saved')
        } catch {
          setSaveStatus('error')
        }
      }, autosaveDelayMs)
    },
    [caseItem, repository, autosaveDelayMs]
  )

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const updateField = useCallback(
    (fieldPath, value) => {
      setDraft((prev) => {
        const next = JSON.parse(JSON.stringify(prev))
        const parts = fieldPath.split('.')

        if (parts.length === 1) {
          next[parts[0]] = value
        } else if (parts.length === 2) {
          next[parts[0]][parts[1]] = value
        }

        if (fieldPath === 'metric.value') {
          next.metric.evidenceId = null
          next.missingFields = next.missingFields.filter((f) => f !== 'metric')
          next.needsReview = next.needsReview.filter((f) => f !== 'metric')
        } else if (fieldPath === 'quote.text') {
          next.quote.evidenceId = null
          next.missingFields = next.missingFields.filter((f) => f !== 'quote')
          next.needsReview = next.needsReview.filter((f) => f !== 'quote')
        } else {
          next.needsReview = next.needsReview.filter((f) => f !== parts[0])
          next.missingFields = next.missingFields.filter((f) => f !== parts[0])
        }

        const nextModified = new Set(modifiedFieldsRef.current)
        nextModified.add(fieldPath)
        modifiedFieldsRef.current = nextModified
        setModifiedFields(nextModified)

        trackAnalyticsEvent('field_edited', {
          userId: caseItem?.ownerId,
          caseId: caseItem?.id,
          metadata: { field: fieldPath.split('.')[0] },
        })

        runValidation(next)
        triggerAutosave(next, nextModified)
        return next
      })
    },
    [caseItem?.id, caseItem?.ownerId, runValidation, triggerAutosave]
  )

  const isFieldModified = useCallback(
    (fieldPath) => {
      return modifiedFields.has(fieldPath)
    },
    [modifiedFields]
  )

  const isFieldNeedsReview = useCallback(
    (fieldName) => {
      return draft.needsReview.includes(fieldName)
    },
    [draft.needsReview]
  )

  const isFieldMissing = useCallback(
    (fieldName) => {
      if (fieldName === 'metric') {
        return !draft.metric.value || draft.missingFields.includes('metric')
      }
      if (fieldName === 'quote') {
        return !draft.quote.text || draft.missingFields.includes('quote')
      }
      return !draft[fieldName] || draft.missingFields.includes(fieldName)
    },
    [draft]
  )

  const openEvidence = useCallback(
    (evidenceIdOrField) => {
      let matched = null

      if (evidenceIdOrField) {
        matched = evidences.find((e) => e.id === evidenceIdOrField)
      }

      if (!matched) {
        if (evidenceIdOrField === 'quote' && draft.quote.evidenceId) {
          matched = evidences.find((e) => e.id === draft.quote.evidenceId)
        } else if (evidenceIdOrField === 'metric' && draft.metric.evidenceId) {
          matched = evidences.find((e) => e.id === draft.metric.evidenceId)
        }
      }

      if (!matched && evidences.length > 0) {
        matched = evidences[0]
      }

      if (!matched) {
        const firstSource = sources[0]
        matched = {
          id: 'mock-ev',
          sourceId: firstSource?.id || 'source-1',
          kind: firstSource?.kind === 'screenshot' ? 'chatMessage' : 'transcriptSegment',
          reference: '1',
          exactQuote:
            evidenceIdOrField === 'metric'
              ? draft.metric.value
              : evidenceIdOrField === 'quote'
              ? draft.quote.text
              : draft.problem || draft.result || 'Подтверждённая цитата из диалога',
        }
      }

      const associatedSource = sources.find((s) => s.id === matched?.sourceId) || sources[0]
      setActiveEvidence({
        evidence: matched,
        source: associatedSource || null,
        fieldName: evidenceIdOrField,
        sourcesDeletedAt: caseItem?.sourcesDeletedAt || null,
      })
    },
    [evidences, sources, draft, caseItem]
  )

  const closeEvidence = useCallback(() => {
    setActiveEvidence(null)
  }, [])

  const canMarkVerified = useMemo(() => {
    const hasErrors = Object.keys(validationErrors).length > 0
    const hasNeedsReview = draft.needsReview.length > 0
    const hasMissingFields =
      !draft.metric.value ||
      !draft.metric.label ||
      !draft.problem ||
      !draft.solution ||
      !draft.result ||
      !draft.quote.text ||
      draft.missingFields.length > 0

    return !hasErrors && !hasNeedsReview && !hasMissingFields
  }, [validationErrors, draft])

  const markAsVerified = useCallback(async () => {
    if (!caseItem?.id || !canMarkVerified) return

    try {
      await repository.update(caseItem.id, {
        status: 'ready',
        draft,
        modifiedFields: Array.from(modifiedFields),
      })
      trackAnalyticsEvent('case_confirmed', {
        userId: caseItem.ownerId,
        caseId: caseItem.id,
      })
      onVerified?.()
    } catch (err) {
      setSaveStatus('error')
      throw err
    }
  }, [caseItem, canMarkVerified, repository, draft, modifiedFields, onVerified])

  const regenerateDraft = useCallback(
    async (mode, preserveManualEdits = true) => {
      setIsRegenerating(true)
      try {
        setDraft((prev) => {
          const next = JSON.parse(JSON.stringify(prev))

          if (!preserveManualEdits || !modifiedFields.has('problem')) {
            next.problem = transformTextTone(prev.problem, mode, 'Было')
          }
          if (!preserveManualEdits || !modifiedFields.has('solution')) {
            next.solution = transformTextTone(prev.solution, mode, 'Сделано')
          }
          if (!preserveManualEdits || !modifiedFields.has('result')) {
            next.result = transformTextTone(prev.result, mode, 'Стало')
          }

          next.needsReview = []
          triggerAutosave(next, modifiedFields)
          return next
        })
      } finally {
        setIsRegenerating(false)
      }
    },
    [modifiedFields, triggerAutosave]
  )

  const submitFeedback = useCallback(
    async (rating, comment = '') => {
      if (!caseItem?.id) return
      setFeedbackState((prev) => ({ ...prev, isSubmitting: true }))

      try {
        if (typeof repository.saveFeedback === 'function') {
          await repository.saveFeedback({
            caseId: caseItem.id,
            rating,
            comment,
            userId: caseItem.ownerId,
          })
        }
        trackAnalyticsEvent('feedback_given', {
          userId: caseItem.ownerId,
          caseId: caseItem.id,
          metadata: {
            rating:
              rating === 'positive' || rating === 1 || rating === 'up'
                ? 'positive'
                : 'negative',
          },
        })
        setFeedbackState({
          rating,
          comment,
          isSubmitting: false,
          isSubmitted: true,
        })
      } catch {
        setFeedbackState((prev) => ({ ...prev, isSubmitting: false }))
      }
    },
    [caseItem, repository]
  )

  const [selectedVariant, setSelectedVariant] = useState(
    () => caseItem?.selectedVariant || 'dark'
  )

  const handleSelectVariant = useCallback(
    async (variant) => {
      setSelectedVariant(variant)
      if (caseItem?.id) {
        try {
          await repository.update(caseItem.id, { selectedVariant: variant })
        } catch {
          void 0
        }
      }
    },
    [caseItem?.id, repository]
  )

  const cardPreviewData = useMemo(() => {
    return {
      metric: draft.metric?.value || '+0%',
      metricLabel: draft.metric?.label || 'метрика',
      before: cleanPrefix(draft.problem, 'было') || 'Описание проблемы',
      done: cleanPrefix(draft.solution, 'сделано') || 'Реализованное решение',
      after: cleanPrefix(draft.result, 'стало') || 'Подтвержденный результат',
      quote: draft.quote?.text || 'Цитата клиента',
      author: draft.quote?.authorLabel || 'Анна К.',
      authorRole: draft.quote?.authorRole || '',
      company:
        caseItem?.branding?.companyName ||
        draft.quote?.authorCompany ||
        caseItem?.clientLabel ||
        caseItem?.client ||
        'Клиент',
      isVerifiedByChat: Boolean(
        draft.quote?.evidenceId || draft.metric?.evidenceId
      ),
      title: caseItem?.title || `Кейс для ${caseItem?.clientLabel || 'клиента'}`,
      category: draft.tags?.[0] || 'Кейс',
      niche: draft.tags?.[1] || '',
    }
  }, [draft, caseItem])

  return {
    draft,
    selectedVariant,
    handleSelectVariant,
    modifiedFields: Array.from(modifiedFields),
    saveStatus,
    validationErrors,
    canMarkVerified,
    isRegenerating,
    activeEvidence,
    feedbackState,
    activeTab,
    cardPreviewData,
    sourcesDeletedAt: caseItem?.sourcesDeletedAt || null,
    storageRetentionDays: 14,

    setActiveTab,
    updateField,
    isFieldModified,
    isFieldNeedsReview,
    isFieldMissing,
    openEvidence,
    closeEvidence,
    markAsVerified,
    regenerateDraft,
    submitFeedback,
  }
}
