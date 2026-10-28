import admin from 'firebase-admin'
import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { runPipeline } from '../application/use-cases/runPipeline.js'
import {
  createPipelineAdapters,
  FirebaseStorageAdapter,
  FirebaseTriggerEmailNotifier,
  FirestoreCaseRepository,
  MediaNormalizerImpl,
  MockEmailNotifier,
} from '../infrastructure/adapters/index.js'
import { anthropicApiKey, geminiApiKey, openAiApiKey } from './secrets.js'

if (!admin.apps.length) {
  admin.initializeApp()
}

export const isProductionEnvironment = (): boolean => {
  if (process.env.NODE_ENV === 'production') return true
  if (process.env.K_SERVICE) return true
  if (process.env.FUNCTION_TARGET && process.env.FUNCTIONS_EMULATOR !== 'true') {
    return true
  }
  return false
}

export const onCaseProcessTrigger = onDocumentWritten(
  {
    document: 'cases/{caseId}',
    region: 'us-central1',
    timeoutSeconds: 540,
    memory: '2GiB',
    maxInstances: 5,
    secrets: [openAiApiKey, anthropicApiKey, geminiApiKey],
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
    const isProd = isProductionEnvironment()

    let openaiKey = ''
    try {
      openaiKey = openAiApiKey.value() || process.env.OPENAI_API_KEY || ''
    } catch {
      openaiKey = process.env.OPENAI_API_KEY || ''
    }

    let anthropicKey = ''
    try {
      anthropicKey = anthropicApiKey.value() || process.env.ANTHROPIC_API_KEY || ''
    } catch {
      anthropicKey = process.env.ANTHROPIC_API_KEY || ''
    }

    let geminiKey = ''
    try {
      geminiKey = geminiApiKey.value() || process.env.GEMINI_API_KEY || ''
    } catch {
      geminiKey = process.env.GEMINI_API_KEY || ''
    }

    if (isProd && process.env.USE_MOCK_ADAPTERS === 'true') {
      throw new Error(
        'Критическая ошибка конфигурации: в продакшен-окружении запрещено использовать USE_MOCK_ADAPTERS=true. Отключите моки для реальной обработки.'
      )
    }

    const useMocks =
      !isProd &&
      (process.env.USE_MOCK_ADAPTERS === 'true' || (!openaiKey && !anthropicKey && !geminiKey))

    const storage = new FirebaseStorageAdapter()
    const caseRepository = new FirestoreCaseRepository()
    const normalizer = new MediaNormalizerImpl()

    const { transcriber, chatReader, analyzer } = createPipelineAdapters({
      isProd,
      useMocks,
      openaiKey,
      anthropicKey,
      geminiApiKey: geminiKey,
    })

    const emailNotifier =
      useMocks || process.env.NODE_ENV !== 'production'
        ? new MockEmailNotifier()
        : new FirebaseTriggerEmailNotifier()

    await runPipeline({
      caseId,
      caseRepository,
      storage,
      normalizer,
      transcriber,
      chatReader,
      analyzer,
      emailNotifier,
    })
  }
)
