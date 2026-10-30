import {
  CaseDraft,
  ChatExtraction,
  Evidence,
  SummaryRow,
  Transcript,
  VerificationReport,
} from '../../domain/types.js'

export const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015-]/g, '-')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export const anonymizeAuthorLabel = (label?: string): string => {
  if (!label || !label.trim()) {
    return 'Клиент'
  }
  const trimmed = label.trim()
  if (
    trimmed === 'Клиент' ||
    trimmed.startsWith('@') ||
    trimmed.includes('@') ||
    /^\+?\d[\d\s-]{6,}$/.test(trimmed)
  ) {
    return 'Клиент'
  }
  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (parts.length === 1) {
    return parts[0]
  }
  const first = parts[0]
  const last = parts[1]
  if (last.length <= 2 && last.endsWith('.')) {
    return `${first} ${last}`
  }
  return `${first} ${last.charAt(0).toUpperCase()}.`
}

export interface VerifyDraftInput {
  draft: CaseDraft
  transcripts: Transcript[]
  chatExtractions: ChatExtraction[]
}

export interface VerifyDraftOutput {
  draft: CaseDraft
  evidences: Evidence[]
  report: VerificationReport
}

export const verifyDraft = ({
  draft,
  transcripts,
  chatExtractions,
}: VerifyDraftInput): VerifyDraftOutput => {
  const verifiedDraft: CaseDraft = JSON.parse(JSON.stringify(draft))
  const evidences: Evidence[] = []
  const missingFields: string[] = [...(verifiedDraft.missingFields || [])]
  const needsReview: string[] = [...(verifiedDraft.needsReview || [])]
  const unverifiedQuotes: string[] = []
  const unverifiedMetrics: string[] = []

  let isQuoteVerified = false
  let isMetricVerified = false

  const quoteText = verifiedDraft.quote?.text?.trim() || ''
  const normalizedQuote = normalizeText(quoteText)

  if (!quoteText || normalizedQuote.length === 0) {
    verifiedDraft.quote.text = ''
    verifiedDraft.quote.evidenceId = null
    missingFields.push('quote')
  } else {
    let matchedEvidence: Evidence | null = null

    for (const extraction of chatExtractions) {
      for (const msg of extraction.messages) {
        if (msg.side !== 'client') continue
        const normMsg = normalizeText(msg.text)
        if (normMsg.includes(normalizedQuote)) {
          matchedEvidence = {
            id: `ev-quote-${extraction.screenshotSourceId}-${msg.id || msg.order || Date.now()}`,
            sourceId: extraction.screenshotSourceId,
            kind: 'chatMessage',
            reference: `message:${msg.time || msg.order}`,
            exactQuote: msg.text,
          }
          break
        }
      }
      if (matchedEvidence) break
    }

    if (!matchedEvidence) {
      for (const tr of transcripts) {
        const fullTranscriptText = normalizeText(
          tr.segments.map((s) => s.text).join(' ')
        )
        if (fullTranscriptText.includes(normalizedQuote)) {
          const matchingSegment =
            tr.segments.find((seg) =>
              normalizeText(seg.text).includes(normalizedQuote)
            ) || tr.segments[0]

          matchedEvidence = {
            id: `ev-quote-${tr.sourceId || 'transcript'}-${Date.now()}`,
            sourceId: tr.sourceId || 'transcript',
            kind: 'transcriptSegment',
            reference: matchingSegment
              ? `segment:${matchingSegment.start}-${matchingSegment.end}`
              : 'segment:0',
            exactQuote: matchingSegment?.text || tr.segments[0]?.text || quoteText,
          }
          break
        }
      }
    }

    if (matchedEvidence) {
      isQuoteVerified = true
      verifiedDraft.quote.evidenceId = matchedEvidence.id
      verifiedDraft.quote.authorLabel = anonymizeAuthorLabel(
        verifiedDraft.quote.authorLabel
      )
      evidences.push(matchedEvidence)
    } else {
      unverifiedQuotes.push(quoteText)
      verifiedDraft.quote.text = ''
      verifiedDraft.quote.evidenceId = null
      missingFields.push('quote')
    }
  }

  const allSourceTextsRaw = [
    ...transcripts.flatMap((t) => t.segments.map((s) => s.text)),
    ...chatExtractions.flatMap((c) => c.messages.map((m) => m.text)),
  ]
  const combinedSourceText = normalizeText(allSourceTextsRaw.join(' '))
  const combinedCompactSourceText = combinedSourceText.replace(/\s+/g, '')

  if (!verifiedDraft.metric) {
    verifiedDraft.metric = { value: '', label: '', evidenceId: null }
  }

  const metricValue = verifiedDraft.metric.value?.trim() || ''

  if (!metricValue) {
    verifiedDraft.metric.value = ''
    verifiedDraft.metric.evidenceId = null
    missingFields.push('metric')
  } else {
    const rawNumberMatches = metricValue.match(/\d+(?:[.,]\d+)?/g) || []

    if (rawNumberMatches.length === 0) {
      const normalizedMetric = normalizeText(metricValue)
      if (combinedSourceText.includes(normalizedMetric)) {
        isMetricVerified = true
        const evidence: Evidence = {
          id: `ev-metric-${Date.now()}`,
          sourceId:
            transcripts[0]?.sourceId ||
            chatExtractions[0]?.screenshotSourceId ||
            'source',
          kind: transcripts.length > 0 ? 'transcriptSegment' : 'chatMessage',
          reference: 'metric:text',
          exactQuote: metricValue,
        }
        verifiedDraft.metric.evidenceId = evidence.id
        evidences.push(evidence)
      } else {
        unverifiedMetrics.push(metricValue)
        verifiedDraft.metric.value = ''
        verifiedDraft.metric.evidenceId = null
        missingFields.push('metric')
      }
    } else {
      let allNumbersFound = true

      for (const num of rawNumberMatches) {
        const standardNum = num.replace(',', '.')
        const commaNum = num.replace('.', ',')
        const plainDigits = num.replace(/[.,]/g, '')

        const found =
          combinedSourceText.includes(num) ||
          combinedSourceText.includes(standardNum) ||
          combinedSourceText.includes(commaNum) ||
          combinedCompactSourceText.includes(plainDigits)

        if (!found) {
          allNumbersFound = false
          break
        }
      }

      if (allNumbersFound) {
        isMetricVerified = true
        let matchedEvidence: Evidence | null = null

        for (const extraction of chatExtractions) {
          for (const msg of extraction.messages) {
            if (rawNumberMatches.some((n) => msg.text.includes(n))) {
              matchedEvidence = {
                id: `ev-metric-${extraction.screenshotSourceId}-${Date.now()}`,
                sourceId: extraction.screenshotSourceId,
                kind: 'chatMessage',
                reference: `message:${msg.time || msg.order}`,
                exactQuote: msg.text,
              }
              break
            }
          }
          if (matchedEvidence) break
        }

        if (!matchedEvidence) {
          for (const tr of transcripts) {
            for (const seg of tr.segments) {
              if (rawNumberMatches.some((n) => seg.text.includes(n))) {
                matchedEvidence = {
                  id: `ev-metric-${tr.sourceId || 'tr'}-${Date.now()}`,
                  sourceId: tr.sourceId || 'tr',
                  kind: 'transcriptSegment',
                  reference: `segment:${seg.start}-${seg.end}`,
                  exactQuote: seg.text,
                }
                break
              }
            }
            if (matchedEvidence) break
          }
        }

        if (matchedEvidence) {
          verifiedDraft.metric.evidenceId = matchedEvidence.id
          evidences.push(matchedEvidence)
        } else {
          verifiedDraft.metric.evidenceId = null
        }
      } else {
        unverifiedMetrics.push(metricValue)
        verifiedDraft.metric.value = ''
        verifiedDraft.metric.evidenceId = null
        missingFields.push('metric')
      }
    }
  }

  if (isMetricVerified && verifiedDraft.metric.value) {
    const metricHeadline = `${verifiedDraft.metric.value} ${verifiedDraft.metric.label || ''}`.trim()
    verifiedDraft.headline = {
      text: metricHeadline,
      evidenceId: verifiedDraft.metric.evidenceId || null,
    }
  } else {
    const rawHeadlineCandidate = verifiedDraft.headline?.text?.trim() || ''
    if (rawHeadlineCandidate) {
      const words = rawHeadlineCandidate.split(/\s+/).filter(Boolean)
      const normalizedCandidate = normalizeText(rawHeadlineCandidate)
      const isVerbatimInSource =
        normalizedCandidate.length > 0 &&
        combinedSourceText.includes(normalizedCandidate)

      if (words.length >= 2 && words.length <= 6 && isVerbatimInSource) {
        let matchedHeadlineEvidence: Evidence | null = null

        for (const extraction of chatExtractions) {
          for (const msg of extraction.messages) {
            if (normalizeText(msg.text).includes(normalizedCandidate)) {
              matchedHeadlineEvidence = {
                id: `ev-headline-${extraction.screenshotSourceId}-${Date.now()}`,
                sourceId: extraction.screenshotSourceId,
                kind: 'chatMessage',
                reference: `message:${msg.time || msg.order}`,
                exactQuote: msg.text,
              }
              break
            }
          }
          if (matchedHeadlineEvidence) break
        }

        if (!matchedHeadlineEvidence) {
          for (const tr of transcripts) {
            for (const seg of tr.segments) {
              if (normalizeText(seg.text).includes(normalizedCandidate)) {
                matchedHeadlineEvidence = {
                  id: `ev-headline-${tr.sourceId || 'transcript'}-${Date.now()}`,
                  sourceId: tr.sourceId || 'transcript',
                  kind: 'transcriptSegment',
                  reference: `segment:${seg.start}-${seg.end}`,
                  exactQuote: seg.text,
                }
                break
              }
            }
            if (matchedHeadlineEvidence) break
          }
        }

        if (matchedHeadlineEvidence) {
          evidences.push(matchedHeadlineEvidence)
          verifiedDraft.headline = {
            text: rawHeadlineCandidate,
            evidenceId: matchedHeadlineEvidence.id,
          }
        } else {
          verifiedDraft.headline = {
            text: rawHeadlineCandidate,
            evidenceId: null,
          }
        }
      } else {
        verifiedDraft.headline = {
          text: '',
          evidenceId: null,
        }
      }
    } else {
      verifiedDraft.headline = {
        text: '',
        evidenceId: null,
      }
    }
  }

  const rawSummaryRows: SummaryRow[] = Array.isArray(verifiedDraft.summaryRows)
    ? verifiedDraft.summaryRows
    : []

  if (rawSummaryRows.length === 0) {
    if (verifiedDraft.problem?.trim()) {
      rawSummaryRows.push({
        id: 'row-legacy-problem',
        label: 'Задача',
        text: verifiedDraft.problem.trim().replace(/^было:\s*/i, ''),
        origin: 'ai_paraphrase',
        evidenceId: null,
      })
    }
    if (verifiedDraft.solution?.trim()) {
      rawSummaryRows.push({
        id: 'row-legacy-solution',
        label: 'Сделано',
        text: verifiedDraft.solution.trim().replace(/^сделано:\s*/i, ''),
        origin: 'ai_paraphrase',
        evidenceId: null,
      })
    }
    if (verifiedDraft.result?.trim()) {
      rawSummaryRows.push({
        id: 'row-legacy-result',
        label: 'Результат',
        text: verifiedDraft.result.trim().replace(/^стало:\s*/i, ''),
        origin: 'ai_paraphrase',
        evidenceId: null,
      })
    }
  }

  const verifiedSummaryRows: SummaryRow[] = []

  for (let i = 0; i < rawSummaryRows.length; i++) {
    const row = rawSummaryRows[i]
    const rowText = row.text?.trim() || ''
    if (!rowText) continue

    const rowId = row.id || `summary-row-${i + 1}`

    if (row.origin === 'user_written') {
      verifiedSummaryRows.push({
        ...row,
        id: rowId,
        origin: 'user_written',
      })
      continue
    }

    const normRowText = normalizeText(rowText)
    const rowWords = normRowText.split(' ').filter((w) => w.length > 3)

    let isGrounded = false
    if (row.origin === 'client_words') {
      isGrounded = combinedSourceText.includes(normRowText)
    } else {
      if (rowWords.length === 0) {
        isGrounded = combinedSourceText.includes(normRowText)
      } else {
        const matchCount = rowWords.filter((w) => combinedSourceText.includes(w)).length
        isGrounded = matchCount / rowWords.length >= 0.6
      }
    }

    if (!isGrounded) {
      continue
    }

    let rowEvidence: Evidence | null = null
    for (const extraction of chatExtractions) {
      for (const msg of extraction.messages) {
        const normMsg = normalizeText(msg.text)
        if (normMsg.includes(normRowText) || normRowText.includes(normMsg)) {
          rowEvidence = {
            id: `ev-row-${extraction.screenshotSourceId}-${i}-${Date.now()}`,
            sourceId: extraction.screenshotSourceId,
            kind: 'chatMessage',
            reference: `message:${msg.time || msg.order}`,
            exactQuote: msg.text,
          }
          break
        }
      }
      if (rowEvidence) break
    }

    if (!rowEvidence) {
      for (const tr of transcripts) {
        for (const seg of tr.segments) {
          const normSeg = normalizeText(seg.text)
          if (normSeg.includes(normRowText) || normRowText.includes(normSeg)) {
            rowEvidence = {
              id: `ev-row-${tr.sourceId || 'tr'}-${i}-${Date.now()}`,
              sourceId: tr.sourceId || 'tr',
              kind: 'transcriptSegment',
              reference: `segment:${seg.start}-${seg.end}`,
              exactQuote: seg.text,
            }
            break
          }
        }
        if (rowEvidence) break
      }
    }

    if (rowEvidence) {
      evidences.push(rowEvidence)
    }

    if (row.origin === 'ai_paraphrase') {
      needsReview.push(`summaryRow:${rowId}`)
    }

    verifiedSummaryRows.push({
      ...row,
      id: rowId,
      evidenceId: rowEvidence ? rowEvidence.id : row.evidenceId || null,
      origin: row.origin || 'ai_paraphrase',
    })
  }

  verifiedDraft.summaryRows = verifiedSummaryRows

  const taskRow = verifiedSummaryRows.find(
    (r) => r.label.toLowerCase() === 'задача' || r.label.toLowerCase() === 'было'
  )
  const doneRow = verifiedSummaryRows.find(
    (r) => r.label.toLowerCase() === 'сделано' || r.label.toLowerCase() === 'решение'
  )
  const resRow = verifiedSummaryRows.find(
    (r) => r.label.toLowerCase() === 'результат' || r.label.toLowerCase() === 'стало'
  )

  verifiedDraft.problem = taskRow ? taskRow.text : verifiedDraft.problem || ''
  verifiedDraft.solution = doneRow ? doneRow.text : verifiedDraft.solution || ''
  verifiedDraft.result = resRow ? resRow.text : verifiedDraft.result || ''

  if (!verifiedDraft.problem) missingFields.push('problem')
  if (!verifiedDraft.solution) missingFields.push('solution')
  if (!verifiedDraft.result) missingFields.push('result')

  const deduplicatedMissing = Array.from(new Set(missingFields))
  const deduplicatedNeedsReview = Array.from(new Set(needsReview))

  verifiedDraft.missingFields = deduplicatedMissing
  verifiedDraft.needsReview = deduplicatedNeedsReview

  const report: VerificationReport = {
    isQuoteVerified,
    isMetricVerified,
    missingFields: deduplicatedMissing,
    needsReview: deduplicatedNeedsReview,
    unverifiedQuotes,
    unverifiedMetrics,
    evidences,
  }

  return {
    draft: verifiedDraft,
    evidences,
    report,
  }
}
