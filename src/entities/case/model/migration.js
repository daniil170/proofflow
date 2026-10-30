export const migrateCaseDraft = (draft) => {
  if (!draft) return null

  const existingRows = Array.isArray(draft.summaryRows) ? draft.summaryRows : []
  let summaryRows = [...existingRows]

  if (summaryRows.length === 0) {
    if (draft.problem && typeof draft.problem === 'string' && draft.problem.trim()) {
      summaryRows.push({
        id: 'legacy-problem',
        label: 'Задача',
        text: draft.problem.trim(),
        evidenceId: null,
        origin: 'ai_paraphrase',
      })
    }
    if (draft.solution && typeof draft.solution === 'string' && draft.solution.trim()) {
      summaryRows.push({
        id: 'legacy-solution',
        label: 'Сделано',
        text: draft.solution.trim(),
        evidenceId: null,
        origin: 'ai_paraphrase',
      })
    }
    if (draft.result && typeof draft.result === 'string' && draft.result.trim()) {
      summaryRows.push({
        id: 'legacy-result',
        label: 'Результат',
        text: draft.result.trim(),
        evidenceId: null,
        origin: 'ai_paraphrase',
      })
    }
  }

  const headline = draft.headline && typeof draft.headline === 'object'
    ? {
        text: typeof draft.headline.text === 'string' ? draft.headline.text : '',
        evidenceId: draft.headline.evidenceId || null,
      }
    : {
        text: draft.metric?.value
          ? `${draft.metric.value} ${draft.metric.label || ''}`.trim()
          : '',
        evidenceId: draft.metric?.evidenceId || null,
      }

  const rawAuthor = draft.quote?.authorLabel
  const authorLabel = (!rawAuthor || rawAuthor === 'Анна К.') ? 'Клиент' : rawAuthor

  return {
    ...draft,
    headline,
    summaryRows,
    quote: {
      ...draft.quote,
      text: draft.quote?.text || '',
      authorLabel,
      evidenceId: draft.quote?.evidenceId || null,
      authorRole: draft.quote?.authorRole || '',
      authorCompany: draft.quote?.authorCompany || '',
    },
    metric: {
      value: draft.metric?.value || '',
      label: draft.metric?.label || '',
      evidenceId: draft.metric?.evidenceId || null,
    },
    missingFields: Array.isArray(draft.missingFields) ? draft.missingFields : [],
    needsReview: Array.isArray(draft.needsReview) ? draft.needsReview : [],
    tags: Array.isArray(draft.tags) ? draft.tags : [],
  }
}

export const migrateCase = (caseItem) => {
  if (!caseItem) return null

  const migratedDraft = caseItem.draft ? migrateCaseDraft(caseItem.draft) : null

  return {
    ...caseItem,
    draft: migratedDraft,
    chatMessages: Array.isArray(caseItem.chatMessages) ? caseItem.chatMessages : [],
    selectedChatMessages: Array.isArray(caseItem.selectedChatMessages)
      ? caseItem.selectedChatMessages
      : [],
    messenger: caseItem.messenger || 'unknown',
  }
}
