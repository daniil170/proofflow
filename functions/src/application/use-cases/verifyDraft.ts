import {
  CaseDraft,
  ChatExtraction,
  Evidence,
  Transcript,
  VerificationReport,
} from '../../domain/types.js'

export const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015-]/g, '-')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export const anonymizeAuthorLabel = (label?: string): string => {
  if (!label || !label.trim()) {
    return 'Анна К.'
  }
  const trimmed = label.trim()
  if (
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
        if (
          normMsg.includes(normalizedQuote) ||
          normalizedQuote.includes(normMsg)
        ) {
          matchedEvidence = {
            id: `ev-quote-${extraction.screenshotSourceId}-${Date.now()}`,
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

  const metricValue = verifiedDraft.metric?.value?.trim() || ''

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

  const problemText = verifiedDraft.problem?.trim() || ''
  if (!problemText) {
    missingFields.push('problem')
  } else {
    const norm = normalizeText(problemText)
    const keywords = norm.split(' ').filter((w) => w.length > 4)
    const matchCount = keywords.filter((k) => combinedSourceText.includes(k)).length
    if (keywords.length > 0 && matchCount / keywords.length < 0.25) {
      needsReview.push('problem')
    }
  }

  const solutionText = verifiedDraft.solution?.trim() || ''
  if (!solutionText) {
    missingFields.push('solution')
  } else {
    const norm = normalizeText(solutionText)
    const keywords = norm.split(' ').filter((w) => w.length > 4)
    const matchCount = keywords.filter((k) => combinedSourceText.includes(k)).length
    if (keywords.length > 0 && matchCount / keywords.length < 0.25) {
      needsReview.push('solution')
    }
  }

  const resultText = verifiedDraft.result?.trim() || ''
  if (!resultText) {
    missingFields.push('result')
  } else {
    const norm = normalizeText(resultText)
    const keywords = norm.split(' ').filter((w) => w.length > 4)
    const matchCount = keywords.filter((k) => combinedSourceText.includes(k)).length
    if (keywords.length > 0 && matchCount / keywords.length < 0.25) {
      needsReview.push('result')
    }
  }

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
