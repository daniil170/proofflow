export const normalizeMigrationText = (text) => {
  if (!text) return ''
  return text
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015-]/g, '-')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export const migrateCaseDraft = (draft, sourcesText = '') => {
  if (!draft) return null

  const normSources = normalizeMigrationText(sourcesText)
  const existingRows = Array.isArray(draft.summaryRows) ? draft.summaryRows : []
  let summaryRows = [...existingRows]
  const needsReview = Array.isArray(draft.needsReview) ? [...draft.needsReview] : []

  if (summaryRows.length === 0) {
    if (draft.problem && typeof draft.problem === 'string' && draft.problem.trim()) {
      const clean = draft.problem.trim().replace(/^было:\s*/i, '')
      const isVerbatim = normSources.length > 0 && normSources.includes(normalizeMigrationText(clean))
      const origin = isVerbatim ? 'client_words' : 'ai_paraphrase'
      const id = 'legacy-problem'
      summaryRows.push({
        id,
        label: 'Задача',
        text: clean,
        evidenceId: null,
        origin,
        needsReview: !isVerbatim,
      })
    }

    if (draft.solution && typeof draft.solution === 'string' && draft.solution.trim()) {
      const clean = draft.solution.trim().replace(/^сделано:\s*/i, '')
      const isVerbatim = normSources.length > 0 && normSources.includes(normalizeMigrationText(clean))
      const origin = isVerbatim ? 'client_words' : 'ai_paraphrase'
      const id = 'legacy-solution'
      summaryRows.push({
        id,
        label: 'Сделано',
        text: clean,
        evidenceId: null,
        origin,
        needsReview: !isVerbatim,
      })
    }

    if (draft.result && typeof draft.result === 'string' && draft.result.trim()) {
      const clean = draft.result.trim().replace(/^стало:\s*/i, '')
      const isVerbatim = normSources.length > 0 && normSources.includes(normalizeMigrationText(clean))
      const origin = isVerbatim ? 'client_words' : 'ai_paraphrase'
      const id = 'legacy-result'
      summaryRows.push({
        id,
        label: 'Результат',
        text: clean,
        evidenceId: null,
        origin,
        needsReview: !isVerbatim,
      })
    }
  }

  const headline = draft.headline && typeof draft.headline === 'object'
    ? {
        text: typeof draft.headline.text === 'string' ? draft.headline.text : '',
        evidenceId: draft.headline.evidenceId || null,
      }
    : {
        text: '',
        evidenceId: null,
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
    needsReview: Array.from(new Set(needsReview)),
    tags: Array.isArray(draft.tags) ? draft.tags : [],
  }
}

export const migrateCase = (caseItem) => {
  if (!caseItem) return null

  const sourcesTextParts = []
  if (Array.isArray(caseItem.chatMessages)) {
    caseItem.chatMessages.forEach((m) => {
      if (m && m.text) sourcesTextParts.push(m.text)
    })
  }
  if (Array.isArray(caseItem.evidences)) {
    caseItem.evidences.forEach((e) => {
      if (e && e.exactQuote) sourcesTextParts.push(e.exactQuote)
    })
  }

  const sourcesText = sourcesTextParts.join(' ')
  const migratedDraft = caseItem.draft ? migrateCaseDraft(caseItem.draft, sourcesText) : null

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