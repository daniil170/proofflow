import admin from 'firebase-admin'
import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { runPipeline } from '../application/use-cases/runPipeline.js'
import {
  ClaudeCaseAnalyzer,
  ClaudeChatReader,
  FirebaseStorageAdapter,
  FirestoreCaseRepository,
  MediaNormalizerImpl,
  MockCaseAnalyzer,
  MockChatReader,
  MockTranscriber,
  WhisperTranscriber,
} from '../infrastructure/adapters/index.js'

if (!admin.apps.length) {
  admin.initializeApp()
}

export const onCaseProcessTrigger = onDocumentWritten(
  {
    document: 'cases/{caseId}',
    timeoutSeconds: 540,
    memory: '1GiB',
  },
  async (event) => {
    const afterData = event.data?.after.data()
    const beforeData = event.data?.before?.data()

    if (!afterData) return

    if (afterData.status !== 'processing') return
    if (beforeData?.status === 'processing' && afterData.stage !== undefined) {
      return
    }

    const caseId = event.params.caseId
    const useMocks =
      process.env.USE_MOCK_ADAPTERS === 'true' ||
      (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY)

    const storage = new FirebaseStorageAdapter()
    const caseRepository = new FirestoreCaseRepository()
    const normalizer = new MediaNormalizerImpl()

    const transcriber =
      useMocks || !process.env.OPENAI_API_KEY
        ? new MockTranscriber()
        : new WhisperTranscriber(process.env.OPENAI_API_KEY)

    const chatReader =
      useMocks || !process.env.ANTHROPIC_API_KEY
        ? new MockChatReader()
        : new ClaudeChatReader(process.env.ANTHROPIC_API_KEY)

    const analyzer =
      useMocks || !process.env.ANTHROPIC_API_KEY
        ? new MockCaseAnalyzer()
        : new ClaudeCaseAnalyzer(process.env.ANTHROPIC_API_KEY)

    await runPipeline({
      caseId,
      caseRepository,
      storage,
      normalizer,
      transcriber,
      chatReader,
      analyzer,
    })
  }
)
