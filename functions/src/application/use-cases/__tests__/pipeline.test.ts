import { describe, expect, it } from 'vitest'
import { Case, PipelineStage } from '../../../domain/types.js'
import {
  LocalStorageAdapter,
  MediaNormalizerImpl,
  MemoryCaseRepository,
  MockCaseAnalyzer,
  MockChatReader,
  MockEmailNotifier,
  MockTranscriber,
} from '../../../infrastructure/adapters/index.js'
import { runPipeline } from '../runPipeline.js'

describe('runPipeline end-to-end integration', () => {
  it('executes full pipeline stages from preparing to done', async () => {
    const caseId = 'case-test-101'
    const recordedStages: { stage: PipelineStage; percent: number }[] = []

    const initialCase: Case = {
      id: caseId,
      ownerId: 'user-abc',
      status: 'processing',
      clientLabel: 'ООО "Альфа"',
      consentConfirmed: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sources: [
        {
          id: 'src-1',
          kind: 'audio',
          storagePath: 'test-audio.mp3',
          mimeType: 'audio/mpeg',
          order: 0,
        },
        {
          id: 'src-2',
          kind: 'screenshot',
          storagePath: 'test-screenshot.png',
          mimeType: 'image/png',
          order: 1,
        },
      ],
      selectedVariant: 'dark',
      branding: { showLogo: true },
    }

    const repo = new MemoryCaseRepository(
      new Map([[caseId, initialCase]]),
      (_id, stage, percent) => {
        recordedStages.push({ stage, percent })
      }
    )

    const storage = new LocalStorageAdapter()
    const normalizer = new MediaNormalizerImpl()
    const transcriber = new MockTranscriber()
    const chatReader = new MockChatReader()
    const analyzer = new MockCaseAnalyzer()
    const emailNotifier = new MockEmailNotifier()

    const { report } = await runPipeline({
      caseId,
      caseRepository: repo,
      storage,
      normalizer,
      transcriber,
      chatReader,
      analyzer,
      emailNotifier,
      userEmail: 'owner@example.com',
    })

    const updatedCase = await repo.getCase(caseId)

    expect(recordedStages.map((s) => s.stage)).toEqual([
      'preparing',
      'transcribing',
      'reading',
      'analyzing',
      'verifying',
      'done',
    ])

    expect(updatedCase?.status).toBe('review')
    expect(updatedCase?.draft).toBeDefined()
    expect(updatedCase?.draft?.quote.text).toBeTruthy()
    expect(report.evidences.length).toBeGreaterThan(0)
    expect(emailNotifier.sentEmails).toHaveLength(1)
    expect(emailNotifier.sentEmails[0].toEmail).toBe('owner@example.com')
    expect(emailNotifier.sentEmails[0].caseId).toBe(caseId)
  })

  it('marks case as failed when error occurs in use case', async () => {
    const caseId = 'case-test-failed'
    const repo = new MemoryCaseRepository()

    const storage = new LocalStorageAdapter()
    const normalizer = new MediaNormalizerImpl()
    const transcriber = new MockTranscriber()
    const chatReader = new MockChatReader()
    const analyzer = new MockCaseAnalyzer()

    await expect(
      runPipeline({
        caseId,
        caseRepository: repo,
        storage,
        normalizer,
        transcriber,
        chatReader,
        analyzer,
      })
    ).rejects.toThrow(`Case ${caseId} not found`)
  })

  it('fails case when owner exceeds max cases per account limit', async () => {
    const caseId = 'case-overflow'
    const ownerId = 'user-limit'
    const casesMap = new Map<string, Case>()

    casesMap.set(caseId, {
      id: caseId,
      ownerId,
      status: 'processing',
      clientLabel: 'Overflow Case',
      consentConfirmed: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sources: [],
      selectedVariant: 'dark',
      branding: { showLogo: true },
    })

    const repo = new MemoryCaseRepository(casesMap)
    repo.countCasesByOwner = async () => 51

    const storage = new LocalStorageAdapter()
    const normalizer = new MediaNormalizerImpl()
    const transcriber = new MockTranscriber()
    const chatReader = new MockChatReader()
    const analyzer = new MockCaseAnalyzer()

    const result = await runPipeline({
      caseId,
      caseRepository: repo,
      storage,
      normalizer,
      transcriber,
      chatReader,
      analyzer,
    })

    expect(result.report.isQuoteVerified).toBe(false)
    expect(result.report.missingFields.length).toBeGreaterThan(0)
    const updated = await repo.getCase(caseId)
    expect(updated?.status).toBe('failed')
    expect(updated?.failReason).toContain('Превышен лимит кейсов')
  })
})
