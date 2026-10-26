import os from 'os'
import path from 'path'
import { promises as fs } from 'fs'
import { PipelineStage, VerificationReport } from '../../domain/types.js'
import { CaseAnalyzer } from '../../infrastructure/ports/CaseAnalyzer.js'
import { CaseRepositoryPort } from '../../infrastructure/ports/CaseRepositoryPort.js'
import { ChatReader } from '../../infrastructure/ports/ChatReader.js'
import { EmailNotifier } from '../../infrastructure/ports/EmailNotifier.js'
import { MediaNormalizer } from '../../infrastructure/ports/MediaNormalizer.js'
import { StoragePort } from '../../infrastructure/ports/StoragePort.js'
import { Transcriber } from '../../infrastructure/ports/Transcriber.js'
import { analyzeCase } from './analyzeCase.js'
import { finalizeCase } from './finalizeCase.js'
import { normalizeSources } from './normalizeSources.js'
import { readScreenshots } from './readScreenshots.js'
import { transcribeAudio } from './transcribeAudio.js'
import { verifyDraft } from './verifyDraft.js'

export interface RunPipelineInput {
  caseId: string
  caseRepository: CaseRepositoryPort
  storage: StoragePort
  normalizer: MediaNormalizer
  transcriber: Transcriber
  chatReader: ChatReader
  analyzer: CaseAnalyzer
  emailNotifier?: EmailNotifier
  userEmail?: string
  workDir?: string
}

export interface RunPipelineResult {
  report: VerificationReport
}

export const runPipeline = async ({
  caseId,
  caseRepository,
  storage,
  normalizer,
  transcriber,
  chatReader,
  analyzer,
  emailNotifier,
  userEmail,
  workDir,
}: RunPipelineInput): Promise<RunPipelineResult> => {
  const targetDir =
    workDir || path.join(os.tmpdir(), `proofflow-pipeline-${caseId}-${Date.now()}`)
  let currentStage: PipelineStage = 'preparing'

  try {
    const currentCase = await caseRepository.getCase(caseId)
    if (!currentCase) {
      throw new Error(`Case ${caseId} not found`)
    }

    currentStage = 'preparing'
    await caseRepository.updateStage(
      caseId,
      'preparing',
      15,
      'Подготовка и нормализация источников'
    )
    const { screenshots, audios } = await normalizeSources({
      sources: currentCase.sources,
      storage,
      normalizer,
      workDir: targetDir,
    })

    currentStage = 'transcribing'
    await caseRepository.updateStage(
      caseId,
      'transcribing',
      35,
      'Расшифровка аудио и видео'
    )
    const transcripts = await transcribeAudio({
      audios,
      transcriber,
      normalizer,
    })

    currentStage = 'reading'
    await caseRepository.updateStage(
      caseId,
      'reading',
      55,
      'Извлечение сообщений из скриншотов'
    )
    const chatExtractions = await readScreenshots({
      screenshots,
      chatReader,
    })

    currentStage = 'analyzing'
    await caseRepository.updateStage(
      caseId,
      'analyzing',
      75,
      'Сборка структуры кейса'
    )
    const rawDraft = await analyzeCase({
      analyzer,
      clientLabel: currentCase.clientLabel,
      transcripts,
      chatExtractions,
    })

    currentStage = 'verifying'
    await caseRepository.updateStage(
      caseId,
      'verifying',
      90,
      'Проверка фактов и цитат'
    )
    const { draft: verifiedDraft, evidences, report } = verifyDraft({
      draft: rawDraft,
      transcripts,
      chatExtractions,
    })

    await finalizeCase({
      caseRepository,
      caseId,
      draft: verifiedDraft,
      evidences,
      finalStatus: 'review',
    })

    if (emailNotifier) {
      const recipientEmail =
        userEmail ||
        (currentCase as { ownerEmail?: string }).ownerEmail ||
        process.env.DEFAULT_NOTIFICATION_EMAIL

      if (recipientEmail) {
        const appBaseUrl =
          process.env.APP_BASE_URL || 'https://proofflow.web.app'
        await emailNotifier
          .sendReviewReadyEmail({
            toEmail: recipientEmail,
            caseId,
            clientLabel: currentCase.clientLabel,
            caseUrl: `${appBaseUrl}/app/cases/${caseId}`,
          })
          .catch(() => {})
      }
    }

    await caseRepository.updateStage(caseId, 'done', 100, 'Готово к проверке')

    return { report }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await caseRepository.failCase(caseId, currentStage, message)
    throw error
  } finally {
    if (!workDir) {
      await fs.rm(targetDir, { recursive: true, force: true }).catch(() => {})
    }
  }
}
