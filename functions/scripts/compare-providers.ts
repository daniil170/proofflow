import { promises as fs } from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { CaseDraft, ChatExtraction, Transcript } from '../src/domain/types.js'
import {
  createCaseAnalyzer,
  createChatReader,
  createTranscriber,
  ProviderResolutionOptions,
  resolveAnalyzerProvider,
  resolveChatReaderProvider,
  resolveTranscriberProvider,
  TranscriberProvider,
  ChatReaderProvider,
  AnalyzerProvider,
} from '../src/infrastructure/adapters/providerFactory.js'
import { WhisperTranscriber } from '../src/infrastructure/adapters/WhisperTranscriber.js'
import { MockTranscriber } from '../src/infrastructure/adapters/MockTranscriber.js'
import { verifyDraft } from '../src/application/use-cases/verifyDraft.js'

dotenv.config()

interface ProviderConfigPreset {
  name: string
  transcriber: TranscriberProvider
  chatReader: ChatReaderProvider
  analyzer: AnalyzerProvider
}

interface RunMetrics {
  configName: string
  material: string
  durationSec: number
  promptTokens: number
  completionTokens: number
  totalTokens: number
  estimatedCostUsd: number
  rejectedQuotesCount: number
  unconfirmedMetricsCount: number
  needsReviewCount: number
  timestampDriftSec: number | null
  draft: CaseDraft | null
  unverifiedQuotes: string[]
  unverifiedMetrics: string[]
}

const DEFAULT_PRESETS: ProviderConfigPreset[] = [
  {
    name: 'default-current',
    transcriber: 'openai',
    chatReader: 'anthropic',
    analyzer: 'anthropic',
  },
  {
    name: 'all-gemini',
    transcriber: 'google',
    chatReader: 'google',
    analyzer: 'google',
  },
  {
    name: 'google-speech-gemini',
    transcriber: 'google-speech',
    chatReader: 'google',
    analyzer: 'google',
  },
]

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp'])
const AUDIO_EXTS = new Set(['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.opus', '.flac'])

const estimateTokensFromText = (text: string): number => {
  return Math.ceil(text.length / 3.5)
}

const estimateCost = (
  preset: ProviderConfigPreset,
  audioDurationMin: number,
  promptTokens: number,
  completionTokens: number,
  imagesCount: number
): number => {
  let cost = 0

  if (preset.transcriber === 'openai') {
    cost += audioDurationMin * 0.006
  } else if (preset.transcriber === 'google-speech') {
    cost += audioDurationMin * 0.016
  } else if (preset.transcriber === 'google') {
    cost += audioDurationMin * 0.0012
  }

  if (preset.chatReader === 'anthropic') {
    const imgTokens = imagesCount * 1600
    cost += (imgTokens / 1_000_000) * 3.0
  } else if (preset.chatReader === 'google') {
    const imgTokens = imagesCount * 258
    cost += (imgTokens / 1_000_000) * 0.075
  }

  if (preset.analyzer === 'anthropic') {
    cost += (promptTokens / 1_000_000) * 3.0
    cost += (completionTokens / 1_000_000) * 15.0
  } else if (preset.analyzer === 'google') {
    cost += (promptTokens / 1_000_000) * 0.075
    cost += (completionTokens / 1_000_000) * 0.3
  }

  return Math.round(cost * 10000) / 10000
}

const computeTimestampDrift = (
  baseline: Transcript,
  candidate: Transcript
): number | null => {
  if (!baseline.segments.length || !candidate.segments.length) {
    return null
  }

  let totalDiff = 0
  let comparedCount = 0

  const minLen = Math.min(baseline.segments.length, candidate.segments.length)
  for (let i = 0; i < minLen; i++) {
    const b = baseline.segments[i]
    const c = candidate.segments[i]
    const startDiff = Math.abs(b.start - c.start)
    const endDiff = Math.abs(b.end - c.end)
    totalDiff += (startDiff + endDiff) / 2
    comparedCount++
  }

  return comparedCount > 0 ? Math.round((totalDiff / comparedCount) * 100) / 100 : null
}

const parsePresetsArg = (argValue?: string): ProviderConfigPreset[] => {
  if (!argValue) return DEFAULT_PRESETS
  const names = argValue.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
  const presets: ProviderConfigPreset[] = []

  for (const name of names) {
    const matched = DEFAULT_PRESETS.find((p) => p.name.toLowerCase() === name)
    if (matched) {
      presets.push(matched)
    } else {
      presets.push({
        name,
        transcriber: resolveTranscriberProvider(process.env.TRANSCRIBER_PROVIDER, false),
        chatReader: resolveChatReaderProvider(process.env.CHAT_READER_PROVIDER, false),
        analyzer: resolveAnalyzerProvider(process.env.ANALYZER_PROVIDER, false),
      })
    }
  }

  return presets.length ? presets : DEFAULT_PRESETS
}

const main = async () => {
  const args = process.argv.slice(2)
  let dirArg = ''
  let configsArg = ''

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dir' && args[i + 1]) {
      dirArg = args[i + 1]
      i++
    } else if (args[i] === '--configs' && args[i + 1]) {
      configsArg = args[i + 1]
      i++
    } else if (!dirArg && !args[i].startsWith('--')) {
      dirArg = args[i]
    }
  }

  if (!dirArg) {
    console.error('Использование: compare-providers <папка_с_материалами> [--configs default-current,all-gemini,google-speech-gemini]')
    process.exit(1)
  }

  const resolvedDir = path.resolve(process.cwd(), dirArg)
  const dirStat = await fs.stat(resolvedDir).catch(() => null)
  if (!dirStat || !dirStat.isDirectory()) {
    console.error(`Ошибка: Директория ${resolvedDir} не найдена.`)
    process.exit(1)
  }

  const entries = await fs.readdir(resolvedDir, { withFileTypes: true })
  const files = entries.filter((e) => e.isFile()).map((e) => e.name)

  const audioFiles = files.filter((f) => AUDIO_EXTS.has(path.extname(f).toLowerCase()))
  const imageFiles = files.filter((f) => IMAGE_EXTS.has(path.extname(f).toLowerCase()))

  if (audioFiles.length === 0 && imageFiles.length === 0) {
    console.error(`В директории ${resolvedDir} не найдено подходящих аудио или изображений.`)
    process.exit(1)
  }

  console.log(`\n======================================================`)
  console.log(`ProofFlow AI Provider Comparison`)
  console.log(`Директория: ${resolvedDir}`)
  console.log(`Найдено аудио: ${audioFiles.length}, скриншотов: ${imageFiles.length}`)
  console.log(`======================================================\n`)

  const presets = parsePresetsArg(configsArg)

  const resolutionOptions: ProviderResolutionOptions = {
    isProd: false,
    useMocks: false,
    openaiKey: process.env.OPENAI_API_KEY,
    anthropicKey: process.env.ANTHROPIC_API_KEY,
    geminiApiKey: process.env.GEMINI_API_KEY,
  }

  let baselineTranscript: Transcript = { sourceId: 'whisper-baseline', segments: [] }
  if (audioFiles.length > 0) {
    const audioPath = path.join(resolvedDir, audioFiles[0])
    console.log(`Получение эталонной транскрибации Whisper для расчета дрифта таймкодов...`)
    try {
      const whisper = process.env.OPENAI_API_KEY
        ? new WhisperTranscriber(process.env.OPENAI_API_KEY)
        : new MockTranscriber()
      baselineTranscript = await whisper.transcribe(audioPath)
      console.log(`Эталон Whisper получен: ${baselineTranscript.segments.length} сегментов.\n`)
    } catch (e: unknown) {
      console.warn(`Не удалось получить эталон Whisper, дрифт таймкодов будет пропущен: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  const results: RunMetrics[] = []

  for (const preset of presets) {
    console.log(`Запуск конфигурации "${preset.name}":`)
    console.log(`  - Транскрибер: ${preset.transcriber}`)
    console.log(`  - Чат-ридер:   ${preset.chatReader}`)
    console.log(`  - Анализатор:  ${preset.analyzer}`)

    const startTime = Date.now()
    let promptTokens = 0
    let completionTokens = 0
    let approxAudioDurationMin = 0
    let currentTranscript: Transcript = { sourceId: '', segments: [] }
    const currentChatExtractions: ChatExtraction[] = []

    try {
      const transcriber = createTranscriber(preset.transcriber, resolutionOptions)
      for (const aFile of audioFiles) {
        const fullAudioPath = path.join(resolvedDir, aFile)
        const tr = await transcriber.transcribe(fullAudioPath)
        currentTranscript = tr
        const lastSeg = tr.segments[tr.segments.length - 1]
        if (lastSeg?.end) {
          approxAudioDurationMin = Math.max(approxAudioDurationMin, lastSeg.end / 60)
        }
      }

      const chatReader = createChatReader(preset.chatReader, resolutionOptions)
      for (let idx = 0; idx < imageFiles.length; idx++) {
        const imgPath = path.join(resolvedDir, imageFiles[idx])
        const extResult = await chatReader.readScreenshot(imgPath, imageFiles[idx], idx)
        currentChatExtractions.push(extResult)
      }

      const analyzer = createCaseAnalyzer(preset.analyzer, resolutionOptions)
      const draft = await analyzer.analyze({
        clientLabel: 'Тестовый Клиент',
        language: 'ru',
        transcripts: currentTranscript.segments.length ? [currentTranscript] : [],
        chatExtractions: currentChatExtractions,
      })

      const draftText = JSON.stringify(draft)
      const promptInputText = JSON.stringify({
        transcripts: currentTranscript,
        chatExtractions: currentChatExtractions,
      })
      promptTokens = estimateTokensFromText(promptInputText)
      completionTokens = estimateTokensFromText(draftText)

      const verifyResult = verifyDraft({
        draft,
        transcripts: currentTranscript.segments.length ? [currentTranscript] : [],
        chatExtractions: currentChatExtractions,
      })

      const drift = computeTimestampDrift(baselineTranscript, currentTranscript)
      const durationSec = Math.round(((Date.now() - startTime) / 1000) * 100) / 100
      const cost = estimateCost(
        preset,
        approxAudioDurationMin,
        promptTokens,
        completionTokens,
        imageFiles.length
      )

      results.push({
        configName: preset.name,
        material: path.basename(resolvedDir),
        durationSec,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        estimatedCostUsd: cost,
        rejectedQuotesCount: verifyResult.report.unverifiedQuotes.length,
        unconfirmedMetricsCount: verifyResult.report.unverifiedMetrics.length,
        needsReviewCount: verifyResult.draft.needsReview.length,
        timestampDriftSec: drift,
        draft: verifyResult.draft,
        unverifiedQuotes: verifyResult.report.unverifiedQuotes,
        unverifiedMetrics: verifyResult.report.unverifiedMetrics,
      })

      console.log(`  ✓ Успешно за ${durationSec}s | $${cost} | Ошибок верификации: ${verifyResult.report.unverifiedQuotes.length + verifyResult.report.unverifiedMetrics.length}\n`)
    } catch (err: unknown) {
      console.error(`  ✕ Ошибка в конфигурации ${preset.name}: ${err instanceof Error ? err.message : String(err)}\n`)
    }
  }

  const tableRows = results.map((r) => ({
    'Конфигурация': r.configName,
    'Время (сек)': r.durationSec,
    'Токены (in/out)': `${r.promptTokens}/${r.completionTokens}`,
    'Стоимость ($)': `$${r.estimatedCostUsd}`,
    'Отброшено цитат': r.rejectedQuotesCount,
    'Метрик без подтв.': r.unconfirmedMetricsCount,
    'needsReview': r.needsReviewCount,
    'Дрифт Whisper (сек)': r.timestampDriftSec !== null ? `${r.timestampDriftSec}s` : '—',
  }))

  console.log('ИТОГОВАЯ ТАБЛИЦА СРАВНЕНИЯ:')
  console.table(tableRows)

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const outputJsonPath = path.join(resolvedDir, `compare-results-${timestamp}.json`)
  await fs.writeFile(outputJsonPath, JSON.stringify({ results }, null, 2), 'utf-8')
  console.log(`Результаты сохранены в JSON: ${outputJsonPath}\n`)
}

main().catch((err) => {
  console.error('Непредвиденная ошибка в compare-providers:', err)
  process.exit(1)
})
