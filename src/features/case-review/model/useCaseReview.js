import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { caseDraftSchema } from '@/entities/case/model/schemas'
import { migrateCaseDraft } from '@/entities/case/model/migration.js'
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
    const migrated = migrateCaseDraft(caseItem?.draft) || {}
    return {
      headline: {
        text: String(migrated.headline?.text ?? ''),
        evidenceId: migrated.headline?.evidenceId || null,
      },
      metric: {
        value: String(migrated.metric?.value ?? ''),
        label: String(migrated.metric?.label ?? ''),
        evidenceId: migrated.metric?.evidenceId || null,
      },
      problem: cleanPrefix(String(migrated.problem ?? ''), 'было'),
      solution: cleanPrefix(String(migrated.solution ?? ''), 'сделано'),
      result: cleanPrefix(String(migrated.result ?? ''), 'стало'),
      summaryRows: Array.isArray(migrated.summaryRows) ? migrated.summaryRows : [],
      quote: {
        text: String(migrated.quote?.text ?? ''),
        authorLabel: migrated.quote?.authorLabel || 'Клиент',
        evidenceId: migrated.quote?.evidenceId || null,
        authorRole: migrated.quote?.authorRole || '',
        authorCompany: migrated.quote?.authorCompany || '',
      },
      tags: migrated.tags || [],
      missingFields: migrated.missingFields || [],
      needsReview: migrated.needsReview || [],
    }
  }, [caseItem?.draft])

  const [draft, setDraft] = useState(initialDraft)
  const [messenger, setMessengerState] = useState(() => caseItem?.messenger || 'unknown')
  const [selectedChatMessages, setSelectedChatMessages] = useState(() => {
    if (Array.isArray(caseItem?.selectedChatMessages) && caseItem.selectedChatMessages.length > 0) {
      return caseItem.selectedChatMessages
    }
    if (Array.isArray(caseItem?.chatMessages) && caseItem.chatMessages.length > 0) {
      return caseItem.chatMessages.slice(0, Math.min(3, caseItem.chatMessages.length))
    }
    return []
  })

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
  const [lastSyncedCaseId, setLastSyncedCaseId] = useState(caseItem?.id)
  const [lastSyncedStatus, setLastSyncedStatus] = useState(caseItem?.status)
  const [lastSyncedDraftText, setLastSyncedDraftText] = useState(() => JSON.stringify(caseItem?.draft || null))

  const currentDraftText = JSON.stringify(caseItem?.draft || null)

  if (
    caseItem?.id !== lastSyncedCaseId ||
    (caseItem?.status === 'review' && lastSyncedStatus !== 'review') ||
    (modifiedFields.size === 0 && currentDraftText !== lastSyncedDraftText && caseItem?.draft)
  ) {
    setLastSyncedCaseId(caseItem?.id)
    setLastSyncedStatus(caseItem?.status)
    setLastSyncedDraftText(currentDraftText)
    setDraft(initialDraft)
    setMessengerState(caseItem?.messenger || 'unknown')
    setSelectedChatMessages(
      Array.isArray(caseItem?.selectedChatMessages) && caseItem.selectedChatMessages.length > 0
        ? caseItem.selectedChatMessages
        : Array.isArray(caseItem?.chatMessages)
        ? caseItem.chatMessages.slice(0, Math.min(3, caseItem.chatMessages.length))
        : []
    )
    if (caseItem?.id !== lastSyncedCaseId) {
      setModifiedFields(new Set(caseItem?.modifiedFields || []))
    }
  }

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

  const runValidation = useCallback((currentDraft) => {
    const errors = {}

    const quoteText = String(currentDraft?.quote?.text ?? '').trim()
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
    (nextDraft, nextModified, extraUpdates = {}) => {
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
            ...extraUpdates,
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
        } else if (fieldPath === 'headline.text') {
          next.headline.evidenceId = null
          next.needsReview = next.needsReview.filter((f) => f !== 'headline')
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

  const updateSummaryRow = useCallback(
    (index, patch) => {
      setDraft((prev) => {
        const next = JSON.parse(JSON.stringify(prev))
        const rows = [...(next.summaryRows || [])]
        if (!rows[index]) return prev

        const targetId = rows[index].id || `row-${index}`
        rows[index] = {
          ...rows[index],
          ...patch,
          id: targetId,
          origin: patch.text !== undefined ? 'user_written' : rows[index].origin,
        }

        if (patch.text !== undefined) {
          next.needsReview = (next.needsReview || []).filter(
            (item) => item !== `summaryRow:${targetId}` && item !== targetId && item !== `summaryRow:${rows[index].label}`
          )
        }

        next.summaryRows = rows
        const nextModified = new Set(modifiedFieldsRef.current)
        nextModified.add(`summaryRows.${index}`)
        modifiedFieldsRef.current = nextModified
        setModifiedFields(nextModified)

        triggerAutosave(next, nextModified)
        return next
      })
    },
    [triggerAutosave]
  )

  const confirmSummaryRow = useCallback(
    (rowId) => {
      setDraft((prev) => {
        const next = JSON.parse(JSON.stringify(prev))
        next.needsReview = (next.needsReview || []).filter(
          (item) => item !== `summaryRow:${rowId}` && item !== rowId
        )
        triggerAutosave(next, modifiedFieldsRef.current)
        return next
      })
    },
    [triggerAutosave]
  )

  const addSummaryRow = useCallback(
    (newRow = { label: 'Детали', text: '' }) => {
      setDraft((prev) => {
        const next = JSON.parse(JSON.stringify(prev))
        const rows = [...(next.summaryRows || [])]
        rows.push({
          id: `user-row-${Date.now()}`,
          label: newRow.label || 'Детали',
          text: newRow.text || '',
          evidenceId: null,
          origin: 'user_written',
        })
        next.summaryRows = rows

        const nextModified = new Set(modifiedFieldsRef.current)
        nextModified.add('summaryRows')
        modifiedFieldsRef.current = nextModified
        setModifiedFields(nextModified)

        triggerAutosave(next, nextModified)
        return next
      })
    },
    [triggerAutosave]
  )

  const removeSummaryRow = useCallback(
    (index) => {
      setDraft((prev) => {
        const next = JSON.parse(JSON.stringify(prev))
        const rows = [...(next.summaryRows || [])]
        const removed = rows[index]
        if (!removed) return prev

        const targetId = removed.id || `row-${index}`
        next.needsReview = (next.needsReview || []).filter(
          (item) => item !== `summaryRow:${targetId}` && item !== targetId && item !== `summaryRow:${removed.label}`
        )
        rows.splice(index, 1)
        next.summaryRows = rows

        const nextModified = new Set(modifiedFieldsRef.current)
        nextModified.add('summaryRows')
        modifiedFieldsRef.current = nextModified
        setModifiedFields(nextModified)

        triggerAutosave(next, nextModified)
        return next
      })
    },
    [triggerAutosave]
  )

  const toggleChatMessage = useCallback(
    (message) => {
      setSelectedChatMessages((prev) => {
        const exists = prev.some((m) => m.text === message.text && m.time === message.time)
        let updated
        if (exists) {
          updated = prev.filter((m) => !(m.text === message.text && m.time === message.time))
        } else {
          if (prev.length >= 3) return prev
          updated = [...prev, message]
        }
        triggerAutosave(draft, modifiedFieldsRef.current, { selectedChatMessages: updated })
        return updated
      })
    },
    [draft, triggerAutosave]
  )

  const handleSetMessenger = useCallback(
    (newMessenger) => {
      setMessengerState(newMessenger)
      triggerAutosave(draft, modifiedFieldsRef.current, { messenger: newMessenger })
    },
    [draft, triggerAutosave]
  )

  const isFieldModified = useCallback(
    (fieldPath) => {
      return modifiedFields.has(fieldPath)
    },
    [modifiedFields]
  )

  const isFieldNeedsReview = useCallback(
    (fieldName) => {
      return (draft.needsReview || []).includes(fieldName)
    },
    [draft.needsReview]
  )

  const isRowNeedsReview = useCallback(
    (row, index) => {
      const rowId = row?.id || `row-${index}`
      const reviewList = draft.needsReview || []
      return (
        reviewList.includes(`summaryRow:${rowId}`) ||
        reviewList.includes(rowId) ||
        reviewList.includes(`summaryRow:${row?.label}`)
      )
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
        } else if (evidenceIdOrField === 'headline' && draft.headline.evidenceId) {
          matched = evidences.find((e) => e.id === draft.headline.evidenceId)
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
              : draft.headline?.text || 'Подтверждённая цитата из диалога',
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
    const hasNeedsReview = (draft.needsReview || []).length > 0
    const hasMissingFields =
      (draft.missingFields || []).includes('metric') ||
      (draft.missingFields || []).includes('quote') ||
      !draft.quote?.text?.trim()

    return !hasErrors && !hasNeedsReview && !hasMissingFields
  }, [validationErrors, draft])

  const markAsVerified = useCallback(async () => {
    if (!caseItem?.id || !canMarkVerified) return

    try {
      await repository.update(caseItem.id, {
        status: 'ready',
        draft,
        messenger,
        selectedChatMessages,
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
  }, [caseItem, canMarkVerified, repository, draft, messenger, selectedChatMessages, modifiedFields, onVerified])

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
    [caseItem, repository]
  )

  const cardPreviewData = useMemo(() => {
    return {
      headline: draft.headline?.text || '',
      metric: draft.metric?.value || '',
      metricLabel: draft.metric?.label || '',
      before: cleanPrefix(draft.problem, 'было') || '',
      done: cleanPrefix(draft.solution, 'сделано') || '',
      after: cleanPrefix(draft.result, 'стало') || '',
      summaryRows: draft.summaryRows || [],
      quote: draft.quote?.text || '',
      author: draft.quote?.authorLabel || 'Клиент',
      authorRole: draft.quote?.authorRole || '',
      authorCompany: draft.quote?.authorCompany || '',
      company: draft.quote?.authorCompany || '',
      isVerifiedByChat: Boolean(
        draft.quote?.evidenceId || draft.metric?.evidenceId
      ),
      title: draft.headline?.text || '',
      category: draft.tags?.[0] || 'Отзыв клиента',
      niche: draft.tags?.[1] || '',
      messenger,
      cardMessages: selectedChatMessages,
      chatMessages: selectedChatMessages,
    }
  }, [draft, messenger, selectedChatMessages])

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
    messenger,
    selectedChatMessages,
    allChatMessages: caseItem?.chatMessages || [],

    setActiveTab,
    updateField,
    updateSummaryRow,
    confirmSummaryRow,
    addSummaryRow,
    removeSummaryRow,
    toggleChatMessage,
    handleSetMessenger,
    isFieldModified,
    isFieldNeedsReview,
    isRowNeedsReview,
    isFieldMissing,
    openEvidence,
    closeEvidence,
    markAsVerified,
    regenerateDraft,
    submitFeedback,
  }
}