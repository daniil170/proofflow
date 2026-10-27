import { describe, expect, it } from 'vitest'
import { GeminiClient } from '../geminiClient.js'
import { chatExtractionSchema, caseDraftSchema } from '../../../domain/schemas.js'

describe('gemini response parsing & schema validation', () => {
  const client = new GeminiClient({
    mode: 'api',
    model: 'gemini-1.5-flash',
    apiKey: 'dummy-key',
  })

  it('correctly parses raw valid JSON from candidate text', () => {
    const rawPayload = {
      metric: { value: '+45%', label: 'Рост заявок', evidenceId: null },
      problem: 'Мало лидов',
      solution: 'Новый сайт',
      result: 'Конверсия выросла',
      quote: { text: 'Все супер', authorLabel: 'Иван И.' },
      tags: ['b2b'],
      missingFields: [],
      needsReview: [],
    }

    const res = client.parseGeminiResponse({
      candidates: [
        {
          content: {
            parts: [{ text: JSON.stringify(rawPayload) }],
          },
          finishReason: 'STOP',
        },
      ],
      usageMetadata: {
        promptTokenCount: 150,
        candidatesTokenCount: 80,
        totalTokenCount: 230,
      },
    })

    expect(res.parsed).toEqual(rawPayload)
    expect(res.usageMetadata?.totalTokenCount).toBe(230)
    expect(() => caseDraftSchema.parse(res.parsed)).not.toThrow()
  })

  it('correctly cleans markdown code fences from response', () => {
    const rawExtraction = {
      confidence: 0.98,
      messages: [
        {
          side: 'client',
          text: 'Спасибо за работу!',
          time: '12:45',
          order: 0,
        },
      ],
    }

    const fenced = `\`\`\`json\n${JSON.stringify(rawExtraction, null, 2)}\n\`\`\``

    const res = client.parseGeminiResponse({
      candidates: [
        {
          content: {
            parts: [{ text: fenced }],
          },
          finishReason: 'STOP',
        },
      ],
    })

    expect(res.parsed).toEqual(rawExtraction)
    const parsedRecord = res.parsed as {
      messages: Array<{
        side: 'client' | 'me'
        text: string
        time: string
        order: number
      }>
      confidence: number
    }

    const validated = chatExtractionSchema.parse({
      screenshotSourceId: 'test-src',
      order: 0,
      messages: parsedRecord.messages,
      confidence: parsedRecord.confidence,
    })
    expect(validated.messages[0].text).toBe('Спасибо за работу!')
  })

  it('throws descriptive error when response was truncated by MAX_TOKENS', () => {
    expect(() =>
      client.parseGeminiResponse({
        candidates: [
          {
            content: {
              parts: [{ text: '{"metric": {"value": "+100%' }],
            },
            finishReason: 'MAX_TOKENS',
          },
        ],
      })
    ).toThrow(/Ответ Gemini был обрезан по лимиту токенов \(MAX_TOKENS\)/)
  })

  it('throws descriptive error on malformed or invalid JSON', () => {
    expect(() =>
      client.parseGeminiResponse({
        candidates: [
          {
            content: {
              parts: [{ text: 'Not valid JSON at all' }],
            },
            finishReason: 'STOP',
          },
        ],
      })
    ).toThrow(/Не удалось разобрать JSON ответа Gemini/)
  })

  it('throws descriptive error when JSON is cut off mid-stream', () => {
    expect(() =>
      client.parseGeminiResponse({
        candidates: [
          {
            content: {
              parts: [{ text: '{"metric": {"value": "+100%", "label": "Рост' }],
            },
            finishReason: 'STOP',
          },
        ],
      })
    ).toThrow(/Не удалось разобрать JSON ответа Gemini/)
  })

  it('throws descriptive error when response has no candidates or parts', () => {
    expect(() =>
      client.parseGeminiResponse({
        candidates: [],
      })
    ).toThrow(/Ответ Gemini не содержит кандидатов/)

    expect(() =>
      client.parseGeminiResponse({
        candidates: [
          {
            content: { parts: [] },
          },
        ],
      })
    ).toThrow(/отсутствует текстовый блок/)
  })

  it('fails Zod schema validation when required fields are missing in parsed payload', () => {
    const invalidDraft = {
      problem: 'Только проблема, нет решения и метрики',
    }

    expect(() => caseDraftSchema.parse(invalidDraft)).toThrow()
  })
})
