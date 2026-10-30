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

describe('Mock Telegram pipeline contract test (mocked adapters)', () => {
  it('verifies that cardMessages are selected verbatim as whole messages and headline links to message 3', async () => {
    const rawSampleMessages = [
      {
        id: 'msg-1',
        side: 'client' as const,
        text: 'Супер! Мозги кипят, но мне понравилось !',
        time: '19:30',
        order: 0,
      },
      {
        id: 'msg-2',
        side: 'client' as const,
        text: 'До субботы, всё было хорошо 😊',
        time: '19:30',
        order: 1,
      },
      {
        id: 'msg-3',
        side: 'client' as const,
        text: 'но делаются успехи реально мозги кипят',
        time: '19:30',
        order: 2,
      },
      {
        id: 'msg-4',
        side: 'client' as const,
        text: 'Было очень круто, и всё понятно! Спасибо большое за занятие 🥰',
        time: '19:31',
        order: 3,
      },
    ]

    const telegramExtraction: ChatExtraction = {
      screenshotSourceId: 'src-telegram-1',
      messenger: 'telegram',
      confidence: 0.98,
      order: 0,
      messages: rawSampleMessages,
    }

    const mockAnalyzer: CaseAnalyzer = {
      async analyze() {
        const draft: CaseDraft = {
          headline: {
            text: 'Реально мозги кипят',
            evidenceId: null,
          },
          summaryRows: [],
          quote: {
            text: 'Было очень круто, и всё понятно! Спасибо большое за занятие 🥰',
            authorLabel: 'Клиент',
            authorRole: '',
            authorCompany: '',
            evidenceId: null,
          },
          tags: ['Отзыв'],
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
      id: 'case-mock-telegram-contract',
      ownerId: 'user-tester',
      status: 'processing',
      clientLabel: 'Клиент',
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
    expect(finalCase.messenger).toBe('telegram')
    expect(finalCase.draft?.headline?.text).toBe('Реально мозги кипят')
    expect(finalCase.draft?.quote?.authorLabel).toBe('Клиент')
    expect(finalCase.draft?.quote?.authorRole).toBe('')
    expect(finalCase.draft?.quote?.authorCompany).toBe('')

    const headlineEvidence = result.report.evidences.find(
      (e) => e.id === finalCase.draft?.headline?.evidenceId
    )
    expect(headlineEvidence).toBeDefined()
    expect(headlineEvidence?.exactQuote).toBe(rawSampleMessages[2].text)
    expect(headlineEvidence?.exactQuote).toContain('реально мозги кипят')

    const selected = finalCase.selectedChatMessages || []
    expect(selected.length).toBe(2)

    expect(selected[0].text).toBe(rawSampleMessages[2].text)
    expect(selected[1].text).toBe(rawSampleMessages[3].text)

    selected.forEach((selMsg) => {
      const original = rawSampleMessages.find((orig) => orig.text === selMsg.text)
      expect(original).toBeDefined()
      expect(selMsg.text).toBe(original!.text)
      expect(selMsg.side).toBe(original!.side)
      expect(selMsg.time).toBe(original!.time)
    })

    expect(finalCase.draft?.summaryRows).toHaveLength(0)

    const cardMessages = selected.slice(0, 3)
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
    expect(published.cardMessages.length).toBe(2)

    const serialized = JSON.stringify(published)
    expect(serialized).not.toContain('кондитерск')
    expect(serialized).not.toContain('Это было невероятно вкусно')
    expect(serialized).not.toContain('Описание проблемы')
    expect(serialized).not.toContain('Кейс для')
    expect(serialized).not.toContain('WhatsApp')
  })
})