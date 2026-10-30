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
    messenger: 'telegram',
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
    expect(anonymizeAuthorLabel('')).toBe('Клиент')
  })

  it('verifies verbatim quote from chat and creates evidence', () => {
    const draft: CaseDraft = {
      headline: { text: '', evidenceId: null },
      metric: { value: '3x', label: 'Ускорение обработки' },
      problem: 'Заявки терялись в почте',
      solution: 'Автоматическая интеграция в CRM',
      result: 'Время обработки упало в 3 раза',
      summaryRows: [],
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
      headline: { text: '', evidenceId: null },
      metric: { value: '35%', label: 'Рост конверсии' },
      problem: 'Заявки терялись в почте',
      solution: 'Внедрение CRM',
      result: 'Конверсия выросла на 35 процентов',
      summaryRows: [],
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
      headline: { text: '', evidenceId: null },
      metric: { value: '35%', label: 'Рост конверсии' },
      problem: 'Проблема',
      solution: 'Решение',
      result: 'Результат',
      summaryRows: [],
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
      headline: { text: '', evidenceId: null },
      metric: { value: '+35%', label: 'Рост конверсии' },
      problem: 'Заявки терялись',
      solution: 'Внедрение CRM',
      result: 'Конверсия выросла',
      summaryRows: [],
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
      headline: { text: '', evidenceId: null },
      metric: { value: '+99%', label: 'Нереальный рост' },
      problem: 'Заявки терялись',
      solution: 'Внедрение CRM',
      result: 'Результат',
      summaryRows: [],
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

  it('verifies verbatim headline (2-6 words) from chat and creates evidence', () => {
    const draft: CaseDraft = {
      headline: { text: 'Команда в восторге', evidenceId: null },
      metric: { value: '', label: '' },
      summaryRows: [],
      quote: { text: '', authorLabel: 'Клиент' },
      tags: [],
      missingFields: [],
      needsReview: [],
    }

    const { draft: verified, evidences } = verifyDraft({
      draft,
      transcripts: [sampleTranscript],
      chatExtractions: [sampleChat],
    })

    expect(verified.headline.text).toBe('Команда в восторге')
    expect(verified.headline.evidenceId).toBeTruthy()
    expect(evidences.some((e) => e.id === verified.headline.evidenceId)).toBe(true)
  })

  it('resets modified headline not found verbatim in sources to empty string', () => {
    const draft: CaseDraft = {
      headline: { text: 'Команда безумно в восторге сейчас', evidenceId: null },
      metric: { value: '', label: '' },
      summaryRows: [],
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

    expect(verified.headline.text).toBe('')
    expect(verified.headline.evidenceId).toBeNull()
  })

  it('resets headline with out-of-range word counts to empty string', () => {
    const draftOneWord: CaseDraft = {
      headline: { text: 'Восторге', evidenceId: null },
      metric: { value: '', label: '' },
      summaryRows: [],
      quote: { text: '', authorLabel: 'Клиент' },
      tags: [],
      missingFields: [],
      needsReview: [],
    }

    const { draft: verifiedOneWord } = verifyDraft({
      draft: draftOneWord,
      transcripts: [sampleTranscript],
      chatExtractions: [sampleChat],
    })
    expect(verifiedOneWord.headline.text).toBe('')

    const draftTooLong: CaseDraft = {
      headline: {
        text: 'Команда в восторге время обработки упало в три',
        evidenceId: null,
      },
      metric: { value: '', label: '' },
      summaryRows: [],
      quote: { text: '', authorLabel: 'Клиент' },
      tags: [],
      missingFields: [],
      needsReview: [],
    }

    const { draft: verifiedTooLong } = verifyDraft({
      draft: draftTooLong,
      transcripts: [sampleTranscript],
      chatExtractions: [sampleChat],
    })
    expect(verifiedTooLong.headline.text).toBe('')
  })

  it('forms headline from verified metric when metric is present', () => {
    const draft: CaseDraft = {
      headline: { text: 'Какое-то название', evidenceId: null },
      metric: { value: '+35%', label: 'рост конверсии' },
      summaryRows: [],
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

    expect(verified.headline.text).toBe('+35% рост конверсии')
    expect(verified.headline.evidenceId).toBe(verified.metric.evidenceId)
  })

  it('discards summary row without grounding in source materials', () => {
    const draft: CaseDraft = {
      headline: { text: '', evidenceId: null },
      metric: { value: '', label: '' },
      summaryRows: [
        {
          id: 'row-fake',
          label: 'Задача',
          text: 'Клиент боялся что его похитят инопланетяне и заберут деньги',
          origin: 'ai_paraphrase',
        },
      ],
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

    expect(verified.summaryRows).toHaveLength(0)
  })

  it('keeps grounded summary row and flags ai_paraphrase in needsReview', () => {
    const draft: CaseDraft = {
      headline: { text: '', evidenceId: null },
      metric: { value: '', label: '' },
      summaryRows: [
        {
          id: 'row-grounded',
          label: 'Задача',
          text: 'Раньше заявки терялись в почте и долго висели',
          origin: 'ai_paraphrase',
        },
      ],
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

    expect(verified.summaryRows).toHaveLength(1)
    expect(verified.summaryRows[0].label).toBe('Задача')
    expect(verified.needsReview).toContain('summaryRow:row-grounded')
  })

  it('keeps user_written summary row unconditionally without grounding check', () => {
    const draft: CaseDraft = {
      headline: { text: '', evidenceId: null },
      metric: { value: '', label: '' },
      summaryRows: [
        {
          id: 'row-user',
          label: 'Контекст',
          text: 'Ручное добавление пользователем для важного акцента',
          origin: 'user_written',
        },
      ],
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

    expect(verified.summaryRows).toHaveLength(1)
    expect(verified.summaryRows[0].origin).toBe('user_written')
  })

  it('migrates legacy problem, solution, result to summaryRows if summaryRows is empty', () => {
    const draft: CaseDraft = {
      headline: { text: '', evidenceId: null },
      metric: { value: '', label: '' },
      problem: 'Заявки терялись в почте',
      solution: 'Внедрение системы',
      result: 'Конверсия выросла на 35 процентов',
      summaryRows: [],
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

    expect(verified.summaryRows.length).toBeGreaterThanOrEqual(2)
    expect(verified.summaryRows.some((r) => r.label === 'Задача')).toBe(true)
  })

  it('keeps empty result without hallucinating and records in missingFields', () => {
    const draft: CaseDraft = {
      headline: { text: '', evidenceId: null },
      metric: { value: '3x', label: 'Ускорение' },
      problem: 'Заявки терялись в почте',
      solution: 'Интеграция CRM',
      result: '',
      summaryRows: [],
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
