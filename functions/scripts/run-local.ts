import path from 'path'
import { promises as fs } from 'fs'
import dotenv from 'dotenv'
import { Case, PipelineStage, Source, SourceKind } from '../src/domain/types.js'
import {
  ClaudeCaseAnalyzer,
  ClaudeChatReader,
  LocalStorageAdapter,
  MediaNormalizerImpl,
  MemoryCaseRepository,
  MockCaseAnalyzer,
  MockChatReader,
  MockTranscriber,
  WhisperTranscriber,
} from '../src/infrastructure/adapters/index.js'
import { runPipeline } from '../src/application/use-cases/runPipeline.js'

dotenv.config()

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp'])
const VIDEO_EXTS = new Set(['.mp4', '.mov', '.webm', '.mkv'])
const AUDIO_EXTS = new Set(['.mp3', '.wav', '.m4a', '.aac', '.ogg'])

const detectKind = (ext: string): SourceKind | null => {
  if (IMAGE_EXTS.has(ext)) return 'screenshot'
  if (VIDEO_EXTS.has(ext)) return 'video'
  if (AUDIO_EXTS.has(ext)) return 'audio'
  return null
}

const main = async () => {
  const targetFolder = process.argv[2]
  const clientLabel = process.argv[3] || 'ООО "Вектор"'

  if (!targetFolder) {
    console.error('Использование: ./scripts/run-local <путь_к_папке> [имя_клиента]')
    process.exit(1)
  }

  const resolvedDir = path.resolve(process.cwd(), targetFolder)
  const dirEntries = await fs.readdir(resolvedDir, { withFileTypes: true })
  const files = dirEntries.filter((e) => e.isFile()).map((e) => e.name)

  if (files.length === 0) {
    console.error(`Папка ${resolvedDir} пуста или не содержит файлов.`)
    process.exit(1)
  }

  const sources: Source[] = []
  let orderIndex = 0

  for (const fileName of files) {
    const ext = path.extname(fileName).toLowerCase()
    const kind = detectKind(ext)
    if (!kind) continue

    const filePath = path.join(resolvedDir, fileName)
    const stats = await fs.stat(filePath)

    sources.push({
      id: `src-${orderIndex + 1}`,
      kind,
      storagePath: filePath,
      mimeType:
        kind === 'screenshot'
          ? 'image/png'
          : kind === 'video'
          ? 'video/mp4'
          : 'audio/mpeg',
      durationSec: kind === 'screenshot' ? undefined : 60,
      order: orderIndex++,
    })
  }

  if (sources.length === 0) {
    console.error(
      `В папке ${resolvedDir} не найдено поддерживаемых медиафайлов (изображения, аудио, видео).`
    )
    process.exit(1)
  }

  const caseId = `local-case-${Date.now()}`
  const initialCase: Case = {
    id: caseId,
    ownerId: 'local-tester',
    status: 'processing',
    clientLabel,
    consentConfirmed: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    sources,
    selectedVariant: 'dark',
    branding: { showLogo: true },
  }

  const repo = new MemoryCaseRepository(
    new Map([[caseId, initialCase]]),
    (id, stage, percent, msg) => {
      console.log(`[${percent}%] [${stage}] ${msg || ''}`)
    }
  )

  const storage = new LocalStorageAdapter()
  const normalizer = new MediaNormalizerImpl()

  const useMocks =
    process.env.USE_MOCK_ADAPTERS === 'true' ||
    (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY)

  console.log('--- ProofFlow Pipeline Local Runner ---')
  console.log(`Кейс: ${caseId}`)
  console.log(`Клиент: ${clientLabel}`)
  console.log(`Источников: ${sources.length}`)
  console.log(`Режим: ${useMocks ? 'MOCK (фикстуры)' : 'LIVE (AI API)'}`)
  console.log('---------------------------------------')

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

  const startTime = Date.now()
  const { report } = await runPipeline({
    caseId,
    caseRepository: repo,
    storage,
    normalizer,
    transcriber,
    chatReader,
    analyzer,
  })

  const updatedCase = await repo.getCase(caseId)
  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1)

  console.log('\n================ РЕЗУЛЬТАТ ОБРАБОТКИ ================')
  console.log(`Статус: ${updatedCase?.status} (${durationSec} сек)`)
  console.log('\n--- ЧЕРНОВИК КЕЙСА ---')
  if (updatedCase?.draft) {
    const d = updatedCase.draft
    console.log(`Метрика:    ${d.metric.value || '[Не подтверждено]'} (${d.metric.label})`)
    console.log(`Проблема:   ${d.problem}`)
    console.log(`Решение:    ${d.solution}`)
    console.log(`Результат:  ${d.result || '[Нет в материалах]'}`)
    console.log(`Цитата:     ${d.quote.text ? `"${d.quote.text}" — ${d.quote.authorLabel}` : '[Отброшена: нет дословного совпадения]'}`)
    console.log(`Теги:       ${d.tags.join(', ')}`)
    console.log(`Пропущено:  ${d.missingFields.join(', ') || 'нет'}`)
    console.log(`На проверку:${d.needsReview.join(', ') || 'нет'}`)
  }

  console.log('\n--- ОТЧЁТ ПРОВЕРКИ (ANTI-HALLUCINATION) ---')
  console.log(`Цитата подтверждена дословно: ${report.isQuoteVerified ? 'ДА' : 'НЕТ'}`)
  console.log(`Цифры метрики найдены:        ${report.isMetricVerified ? 'ДА' : 'НЕТ'}`)
  console.log(`Неподтверждённые цитаты:      ${report.unverifiedQuotes.length ? report.unverifiedQuotes.join(' | ') : 'нет'}`)
  console.log(`Неподтверждённые метрики:     ${report.unverifiedMetrics.length ? report.unverifiedMetrics.join(' | ') : 'нет'}`)
  console.log(`Привязанные источники/пруфы:  ${report.evidences.length} шт.`)
  console.log('=====================================================\n')
}

main().catch((err) => {
  console.error('Ошибка выполнения пайплайна:', err)
  process.exit(1)
})
