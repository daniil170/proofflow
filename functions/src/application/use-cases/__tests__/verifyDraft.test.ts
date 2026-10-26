import { describe, expect, it } from 'vitest'
import {
  anonymizeAuthorLabel,
  normalizeText,
  verifyDraft,
} from '../verifyDraft.js'
import { CaseDraft, ChatExtraction, Transcript } from '../../../domain/types.js'

describe('verifyDraft anti-hallucination guard', () => {
  const sampleTranscript: Transcript = {
    sourceId: 'src-audio-1',
    segments: [
      {
        id: 'seg-1',
        start: 0,
        end: 5.2,
        text: 'Мы внедрили новую систему, и конверсия выросла на 35 процентов.',
      },
      {
        id: 'seg-2',
        start: 5.5,
        end: 11.0,
        text: 'Раньше заявки терялись в почте, а теперь всё автоматически попадает в CRM.',
      },
    ],
  }

  const sampleChat: ChatExtraction = {
    screenshotSourceId: 'src-screenshot-1',
    order: 0,
    confidence: 0.98,
    messages: [
      {
        side: 'me',
        text: 'Как вам первые результаты после запуска?',
        time: '14:20',
        order: 0,
      },
      {
        side: 'client',
        text: 'Команда в восторге, время обработки упало в 3 раза!',
        time: '14:25',
        order: 1,
      },
      {
        side: 'client',
        text: 'Спасибо огромное за оперативность, проект превзошёл ожидания.',
        time: '14:26',
        order: 2,
      },
    ],
  }

  it('normalizes text removing punctuation, case and whitespace differences', () => {
    expect(normalizeText('  Привет,   МИР! -- Это тест: 100%?  ')).toBe(
      'привет мир это тест 100'
    )
  })

  it('anonymizes author labels correctly', () => {
    expect(anonymizeAuthorLabel('Иван Иванов')).toBe('Иван И.')
    expect(anonymizeAuthorLabel('Анна К.')).toBe('Анна К.')
    expect(anonymizeAuthorLabel('Клиент')).toBe('Клиент')
    expect(anonymizeAuthorLabel('john@example.com')).toBe('Клиент')
    expect(anonymizeAuthorLabel('@ivan_ceo')).toBe('Клиент')
    expect(anonymizeAuthorLabel('+7 999 123-45-67')).toBe('Клиент')
    expect(anonymizeAuthorLabel('')).toBe('Анна К.')
  })

  it('verifies verbatim quote from chat and creates evidence', () => {
    const draft: CaseDraft = {
      metric: { value: '3x', label: 'Ускорение обработки' },
      problem: 'Заявки терялись в почте',
      solution: 'Автоматическая интеграция в CRM',
      result: 'Время обработки упало в 3 раза',
      quote: {
        text: 'Команда в восторге, время обработки упало в 3 раза!',
        authorLabel: 'Алексей Смирнов',
      },
      tags: ['crm'],
      missingFields: [],
      needsReview: [],
    }

    const { draft: verified, evidences, report } = verifyDraft({
      draft,
      transcripts: [sampleTranscript],
      chatExtractions: [sampleChat],
    })

    expect(report.isQuoteVerified).toBe(true)
    expect(verified.quote.text).toBe(
      'Команда в восторге, время обработки упало в 3 раза!'
    )
    expect(verified.quote.authorLabel).toBe('Алексей С.')
    expect(verified.quote.evidenceId).toBeDefined()
    expect(evidences.some((e) => e.kind === 'chatMessage')).toBe(true)
    expect(report.unverifiedQuotes).toHaveLength(0)
  })

  it('verifies quote from transcript segments', () => {
    const draft: CaseDraft = {
      metric: { value: '35%', label: 'Рост конверсии' },
      problem: 'Заявки терялись в почте',
      solution: 'Внедрение CRM',
      result: 'Конверсия выросла на 35 процентов',
      quote: {
        text: 'Раньше заявки терялись в почте, а теперь всё автоматически попадает в CRM.',
        authorLabel: 'Анна Кузнецова',
      },
      tags: ['crm'],
      missingFields: [],
      needsReview: [],
    }

    const { draft: verified, report } = verifyDraft({
      draft,
      transcripts: [sampleTranscript],
      chatExtractions: [sampleChat],
    })

    expect(report.isQuoteVerified).toBe(true)
    expect(verified.quote.evidenceId).toBeTruthy()
    expect(verified.quote.authorLabel).toBe('Анна К.')
  })

  it('discards fabricated quote not present in sources', () => {
    const draft: CaseDraft = {
      metric: { value: '35%', label: 'Рост конверсии' },
      problem: 'Проблема',
      solution: 'Решение',
      result: 'Результат',
      quote: {
        text: 'Мы заработали миллион долларов за один день!',
        authorLabel: 'Анна К.',
      },
      tags: [],
      missingFields: [],
      needsReview: [],
    }

    const { draft: verified, report } = verifyDraft({
      draft,
      transcripts: [sampleTranscript],
      chatExtractions: [sampleChat],
    })

    expect(report.isQuoteVerified).toBe(false)
    expect(verified.quote.text).toBe('')
    expect(verified.quote.evidenceId).toBeNull()
    expect(report.unverifiedQuotes).toContain(
      'Мы заработали миллион долларов за один день!'
    )
    expect(verified.missingFields).toContain('quote')
  })

  it('verifies metric numbers when present in sources', () => {
    const draft: CaseDraft = {
      metric: { value: '+35%', label: 'Рост конверсии' },
      problem: 'Заявки терялись',
      solution: 'Внедрение CRM',
      result: 'Конверсия выросла',
      quote: {
        text: 'Команда в восторге, время обработки упало в 3 раза!',
        authorLabel: 'Клиент',
      },
      tags: [],
      missingFields: [],
      needsReview: [],
    }

    const { draft: verified, report } = verifyDraft({
      draft,
      transcripts: [sampleTranscript],
      chatExtractions: [sampleChat],
    })

    expect(report.isMetricVerified).toBe(true)
    expect(verified.metric.value).toBe('+35%')
    expect(verified.metric.evidenceId).toBeTruthy()
  })

  it('flags fabricated metric numbers as unverified and adds to missingFields', () => {
    const draft: CaseDraft = {
      metric: { value: '+99%', label: 'Нереальный рост' },
      problem: 'Заявки терялись',
      solution: 'Внедрение CRM',
      result: 'Результат',
      quote: { text: '', authorLabel: 'Клиент' },
      tags: [],
      missingFields: [],
      needsReview: [],
    }

    const { draft: verified, report } = verifyDraft({
      draft,
      transcripts: [sampleTranscript],
      chatExtractions: [sampleChat],
    })

    expect(report.isMetricVerified).toBe(false)
    expect(verified.metric.value).toBe('')
    expect(verified.metric.evidenceId).toBeNull()
    expect(report.unverifiedMetrics).toContain('+99%')
    expect(verified.missingFields).toContain('metric')
  })

  it('keeps empty result without hallucinating and records in missingFields', () => {
    const draft: CaseDraft = {
      metric: { value: '3x', label: 'Ускорение' },
      problem: 'Заявки терялись в почте',
      solution: 'Интеграция CRM',
      result: '',
      quote: { text: '', authorLabel: 'Клиент' },
      tags: [],
      missingFields: [],
      needsReview: [],
    }

    const { draft: verified } = verifyDraft({
      draft,
      transcripts: [sampleTranscript],
      chatExtractions: [sampleChat],
    })

    expect(verified.result).toBe('')
    expect(verified.missingFields).toContain('result')
  })
})
