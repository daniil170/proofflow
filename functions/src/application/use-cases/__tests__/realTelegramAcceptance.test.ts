import { describe, it, expect } from 'vitest'
import { runPipeline } from '../runPipeline.js'
import {
  Case,
  CaseDraft,
  ChatExtraction,
  Source,
} from '../../../domain/types.js'
import {
  LocalStorageAdapter,
  MediaNormalizerImpl,
  MemoryCaseRepository,
  MockChatReader,
  MockTranscriber,
} from '../../../infrastructure/adapters/index.js'
import { CaseAnalyzer } from '../../../infrastructure/ports/CaseAnalyzer.js'

describe('Real Telegram screenshot acceptance test', () => {
  it('extracts, verifies, and projects real telegram feedback with zero demo strings', async () => {
    const telegramExtraction: ChatExtraction = {
      screenshotSourceId: 'src-telegram-1',
      messenger: 'telegram',
      confidence: 0.98,
      order: 0,
      messages: [
        {
          id: 'msg-1',
          side: 'client',
          text: 'Супер! Мозги кипят, но мне понравилось !',
          time: '19:30',
          order: 0,
        },
        {
          id: 'msg-2',
          side: 'client',
          text: 'До субботы, всё было хорошо 😊',
          time: '19:30',
          order: 1,
        },
        {
          id: 'msg-3',
          side: 'client',
          text: 'но делаются успехи реально мозги кипят',
          time: '19:30',
          order: 2,
        },
        {
          id: 'msg-4',
          side: 'client',
          text: 'Было очень круто, и всё понятно! Спасибо большое за занятие 🥰',
          time: '19:31',
          order: 3,
        },
      ],
    }

    const mockAnalyzer: CaseAnalyzer = {
      async analyze() {
        const draft: CaseDraft = {
          headline: {
            text: 'Реально мозги кипят',
            evidenceId: null,
          },
          summaryRows: [
            {
              label: 'Задача',
              text: 'Интенсивное обучение и сложная тема',
              origin: 'ai_paraphrase',
              evidenceId: null,
            },
            {
              label: 'Результат',
              text: 'Было очень круто, и всё понятно',
              origin: 'client_words',
              evidenceId: null,
            },
          ],
          quote: {
            text: 'Было очень круто, и всё понятно! Спасибо большое за занятие 🥰',
            authorLabel: 'Клиент',
            authorRole: '',
            authorCompany: '',
            evidenceId: null,
          },
          tags: ['Обучение'],
          missingFields: [],
          needsReview: [],
        }
        return draft
      },
    }

    const sources: Source[] = [
      {
        id: 'src-telegram-1',
        kind: 'screenshot',
        storagePath: 'screenshot.jpg',
        mimeType: 'image/jpeg',
        order: 0,
      },
    ]

    const initialCase: Case = {
      id: 'case-real-telegram',
      ownerId: 'user-tutor',
      status: 'processing',
      clientLabel: 'Студент',
      consentConfirmed: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sources,
      selectedVariant: 'whatsapp',
      branding: { showLogo: true },
    }

    const repository = new MemoryCaseRepository([initialCase])
    const storage = new LocalStorageAdapter()
    const normalizer = new MediaNormalizerImpl()
    const transcriber = new MockTranscriber()
    const chatReader = new MockChatReader(telegramExtraction)

    const result = await runPipeline({
      caseId: initialCase.id,
      caseRepository: repository,
      storage,
      normalizer,
      transcriber,
      chatReader,
      analyzer: mockAnalyzer,
    })

    const finalCase = (await repository.getCase(initialCase.id))!

    expect(result.report).toBeDefined()
    expect(finalCase.status).toBe('review')
    expect(finalCase.stage).toBe('done')
    expect(finalCase.messenger).toBe('telegram')
    expect(finalCase.draft?.headline?.text).toBe('Реально мозги кипят')
    expect(finalCase.draft?.quote?.authorLabel).toBe('Клиент')
    expect(finalCase.draft?.quote?.authorRole).toBe('')
    expect(finalCase.draft?.quote?.authorCompany).toBe('')

    expect(finalCase.selectedChatMessages).toBeDefined()
    expect(finalCase.selectedChatMessages!.length).toBeGreaterThanOrEqual(2)
    const quoteMsg = finalCase.selectedChatMessages!.find((m) =>
      m.text.includes('Спасибо большое за занятие 🥰')
    )
    expect(quoteMsg).toBeDefined()
    expect(quoteMsg?.time).toBe('19:31')

    const summaryLabels = (finalCase.draft?.summaryRows || []).map((r) => r.label.toLowerCase())
    expect(summaryLabels).not.toContain('сомнение')

    const cardMessages = Array.isArray(finalCase.selectedChatMessages) &&
      finalCase.selectedChatMessages.length > 0
      ? finalCase.selectedChatMessages.slice(0, 3)
      : Array.isArray(finalCase.chatMessages)
      ? finalCase.chatMessages.slice(0, 3)
      : []

    const published = {
      id: finalCase.id,
      headline: finalCase.draft?.headline?.text || '',
      summaryRows: finalCase.draft?.summaryRows || [],
      quote: finalCase.draft?.quote?.text || '',
      authorLabel: finalCase.draft?.quote?.authorLabel || 'Клиент',
      authorRole: finalCase.draft?.quote?.authorRole || '',
      authorCompany: finalCase.draft?.quote?.authorCompany || '',
      messenger: finalCase.messenger || 'unknown',
      cardMessages,
    }

    expect(published.messenger).toBe('telegram')
    expect(published.headline).toBe('Реально мозги кипят')
    expect(published.authorLabel).toBe('Клиент')
    expect(published.authorRole).toBe('')
    expect(published.authorCompany).toBe('')
    expect(published.cardMessages.length).toBeGreaterThanOrEqual(2)

    const serialized = JSON.stringify(published)
    expect(serialized).not.toContain('кондитерск')
    expect(serialized).not.toContain('Это было невероятно вкусно')
    expect(serialized).not.toContain('Описание проблемы')
    expect(serialized).not.toContain('Кейс для')
    expect(serialized).not.toContain('WhatsApp')
  })
})