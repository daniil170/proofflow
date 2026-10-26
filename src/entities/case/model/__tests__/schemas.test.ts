import { describe, expect, it } from 'vitest'
import {
  caseBrandingSchema,
  caseCardVariantSchema,
  caseDraftMetricSchema,
  caseDraftQuoteSchema,
  caseDraftSchema,
  caseSchema,
  caseStatusSchema,
  chatExtractionSchema,
  chatMessageSchema,
  chatMessageSideSchema,
  DEFAULT_ANONYMIZED_AUTHOR_LABEL,
  evidenceKindSchema,
  evidenceSchema,
  sourceKindSchema,
  sourceSchema,
  transcriptSchema,
  transcriptSegmentSchema,
} from '../schemas.ts'

describe('caseStatusSchema', () => {
  it('accepts valid statuses', () => {
    const statuses = [
      'draft',
      'uploading',
      'processing',
      'review',
      'ready',
      'published',
      'failed',
    ] as const

    statuses.forEach((status) => {
      expect(caseStatusSchema.parse(status)).toBe(status)
    })
  })

  it('rejects unknown status', () => {
    expect(() => caseStatusSchema.parse('completed')).toThrow()
    expect(() => caseStatusSchema.parse('archived')).toThrow()
  })
})

describe('sourceSchema', () => {
  it('accepts valid source kinds', () => {
    const kinds = ['screenshot', 'audio', 'video', 'voice'] as const
    kinds.forEach((kind) => {
      expect(sourceKindSchema.parse(kind)).toBe(kind)
    })
  })

  it('validates a complete source', () => {
    const valid = {
      id: 'src-1',
      kind: 'audio',
      storagePath: 'cases/123/call.mp3',
      durationSec: 180,
      mimeType: 'audio/mpeg',
      order: 0,
    }
    const result = sourceSchema.parse(valid)
    expect(result.id).toBe('src-1')
    expect(result.kind).toBe('audio')
  })

  it('allows null duration for screenshots', () => {
    const screenshot = {
      id: 'src-2',
      kind: 'screenshot',
      storagePath: 'cases/123/chat.png',
      durationSec: null,
      mimeType: 'image/png',
      order: 1,
    }
    const result = sourceSchema.parse(screenshot)
    expect(result.durationSec).toBeNull()
  })

  it('rejects negative order or negative duration', () => {
    expect(() =>
      sourceSchema.parse({
        id: 'src-3',
        kind: 'audio',
        storagePath: 'path',
        durationSec: -10,
        mimeType: 'audio/mp3',
        order: 0,
      })
    ).toThrow()

    expect(() =>
      sourceSchema.parse({
        id: 'src-3',
        kind: 'audio',
        storagePath: 'path',
        durationSec: 10,
        mimeType: 'audio/mp3',
        order: -1,
      })
    ).toThrow()
  })
})

describe('transcriptSchema', () => {
  it('validates segments with start, end, and text', () => {
    const payload = {
      sourceId: 'src-1',
      segments: [
        {
          start: 0,
          end: 12.5,
          text: 'Здравствуйте! Расскажите, как прошло внедрение системы?',
        },
        {
          id: 'seg-2',
          start: 13,
          end: 25,
          text: 'Конверсия выросла на 140% уже на второй неделе запуска.',
        },
      ],
    }

    const parsed = transcriptSchema.parse(payload)
    expect(parsed.segments).toHaveLength(2)
    expect(parsed.segments[0].start).toBe(0)
    expect(parsed.segments[1].end).toBe(25)
  })

  it('rejects empty text in segment', () => {
    expect(() =>
      transcriptSegmentSchema.parse({
        start: 0,
        end: 10,
        text: '',
      })
    ).toThrow()
  })
})

describe('chatExtractionSchema', () => {
  it('validates message sides client and me', () => {
    expect(chatMessageSideSchema.parse('client')).toBe('client')
    expect(chatMessageSideSchema.parse('me')).toBe('me')
    expect(() => chatMessageSideSchema.parse('admin')).toThrow()
  })

  it('validates chat extraction with confidence and ordered messages', () => {
    const extraction = {
      screenshotSourceId: 'scr-1',
      order: 0,
      confidence: 0.95,
      messages: [
        {
          side: 'client',
          text: 'Подтверждаю оплату, спасибо за скорость!',
          time: '14:20',
          order: 0,
        },
        {
          id: 'msg-2',
          side: 'me',
          text: 'Рады сотрудничеству! Данные обновлены в личном кабинете.',
          time: '14:22',
          order: 1,
        },
      ],
    }

    const parsed = chatExtractionSchema.parse(extraction)
    expect(parsed.confidence).toBe(0.95)
    expect(parsed.messages).toHaveLength(2)
    expect(parsed.messages[0].side).toBe('client')
  })

  it('rejects confidence outside 0..1', () => {
    expect(() =>
      chatExtractionSchema.parse({
        screenshotSourceId: 'scr-1',
        order: 0,
        confidence: 1.5,
        messages: [],
      })
    ).toThrow()
  })
})

describe('evidenceSchema', () => {
  it('accepts evidence kinds transcriptSegment and chatMessage', () => {
    expect(evidenceKindSchema.parse('transcriptSegment')).toBe('transcriptSegment')
    expect(evidenceKindSchema.parse('chatMessage')).toBe('chatMessage')
    expect(() => evidenceKindSchema.parse('videoFrame')).toThrow()
  })

  it('validates evidence with link to source and verbatim quote', () => {
    const evidence = {
      id: 'ev-1',
      sourceId: 'src-1',
      kind: 'transcriptSegment',
      reference: 'seg-2',
      exactQuote: 'Конверсия выросла на 140% уже на второй неделе запуска.',
    }

    const parsed = evidenceSchema.parse(evidence)
    expect(parsed.id).toBe('ev-1')
    expect(parsed.exactQuote).toContain('140%')
  })
})

describe('caseDraftSchema and authorLabel anonymization', () => {
  it('uses default anonymized author label if omitted', () => {
    const quote = caseDraftQuoteSchema.parse({
      text: 'Отличный результат работы команды.',
    })
    expect(quote.authorLabel).toBe(DEFAULT_ANONYMIZED_AUTHOR_LABEL)
    expect(quote.authorRole).toBeUndefined()
    expect(quote.authorCompany).toBeUndefined()
  })

  it('accepts custom anonymized author label', () => {
    const quote = caseDraftQuoteSchema.parse({
      text: 'Внедрение прошло гладко.',
      authorLabel: 'Иван П.',
      authorRole: 'CEO',
      authorCompany: 'FinTech Group',
    })
    expect(quote.authorLabel).toBe('Иван П.')
    expect(quote.authorRole).toBe('CEO')
  })

  it('validates complete case draft with metrics, tags, and missing fields', () => {
    const draft = {
      metric: {
        value: '+140%',
        label: 'рост конверсии',
        evidenceId: 'ev-1',
      },
      problem: 'Клиенты уходили на этапе заполнения анкеты.',
      solution: 'Сократили шаги онбординга и добавили подсказки.',
      result: 'Выручка за месяц увеличилась в 1.8 раза.',
      quote: {
        text: 'Сервис окупился в первый же месяц использования.',
        authorLabel: 'Сергей К.',
      },
      tags: ['B2B', 'FinTech', 'Конверсия'],
      missingFields: [],
    }

    const parsed = caseDraftSchema.parse(draft)
    expect(parsed.metric.value).toBe('+140%')
    expect(parsed.tags).toHaveLength(3)
    expect(parsed.missingFields).toEqual([])
  })
})

describe('caseSchema', () => {
  it('validates a complete Case object with safe defaults', () => {
    const payload = {
      id: 'case-100',
      ownerId: 'usr-42',
      status: 'review',
      clientLabel: 'Nordic Tech',
      consentConfirmed: true,
      createdAt: 1700000000000,
      updatedAt: 1700000010000,
      sources: [
        {
          id: 'src-1',
          kind: 'audio',
          storagePath: 'cases/case-100/recording.m4a',
          mimeType: 'audio/m4a',
          durationSec: 120,
          order: 0,
        },
      ],
      draft: {
        metric: {
          value: '3x',
          label: 'быстрее подготовка отчетов',
        },
        problem: 'Рутина занимала 4 часа в день.',
        solution: 'Внедрили автоматизированные шаблоны.',
        result: 'Освободили 20 часов рабочего времени в неделю.',
        quote: {
          text: 'Лучшее решение для нашего отдела.',
        },
      },
      selectedVariant: 'newspaper',
      branding: {
        showLogo: true,
        primaryColor: '#000000',
      },
      publishedAt: null,
    }

    const result = caseSchema.parse(payload)
    expect(result.id).toBe('case-100')
    expect(result.status).toBe('review')
    expect(result.consentConfirmed).toBe(true)
    expect(result.selectedVariant).toBe('newspaper')
    expect(result.branding.showLogo).toBe(true)
    expect(result.draft?.quote.authorLabel).toBe(DEFAULT_ANONYMIZED_AUTHOR_LABEL)
  })

  it('applies defaults for sources, selectedVariant, and branding when minimal', () => {
    const minimal = {
      id: 'case-min',
      ownerId: 'usr-1',
      status: 'draft',
      clientLabel: 'EdTech App',
      consentConfirmed: false,
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
    }

    const parsed = caseSchema.parse(minimal)
    expect(parsed.sources).toEqual([])
    expect(parsed.selectedVariant).toBe('dark')
    expect(parsed.branding.showLogo).toBe(true)
    expect(parsed.draft).toBeUndefined()
  })

  it('rejects case when consentConfirmed is missing or invalid', () => {
    expect(() =>
      caseSchema.parse({
        id: 'case-err',
        ownerId: 'usr-1',
        status: 'draft',
        clientLabel: 'Studio',
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      })
    ).toThrow()
  })

  it('rejects invalid variant', () => {
    expect(() => caseCardVariantSchema.parse('futuristic')).toThrow()
  })
})
