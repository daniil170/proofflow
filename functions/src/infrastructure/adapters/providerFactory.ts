import { CaseAnalyzer } from '../ports/CaseAnalyzer.js'
import { ChatReader } from '../ports/ChatReader.js'
import { Transcriber } from '../ports/Transcriber.js'
import { ClaudeCaseAnalyzer } from './ClaudeCaseAnalyzer.js'
import { ClaudeChatReader } from './ClaudeChatReader.js'
import { GeminiCaseAnalyzer } from './GeminiCaseAnalyzer.js'
import { GeminiChatReader } from './GeminiChatReader.js'
import { GeminiConfig } from './geminiClient.js'
import { GeminiTranscriber } from './GeminiTranscriber.js'
import { GoogleSpeechConfig, GoogleSpeechTranscriber } from './GoogleSpeechTranscriber.js'
import { MockCaseAnalyzer } from './MockCaseAnalyzer.js'
import { MockChatReader } from './MockChatReader.js'
import { MockTranscriber } from './MockTranscriber.js'
import { WhisperTranscriber } from './WhisperTranscriber.js'

export type TranscriberProvider = 'openai' | 'google' | 'google-speech' | 'mock'
export type ChatReaderProvider = 'anthropic' | 'google' | 'mock'
export type AnalyzerProvider = 'anthropic' | 'google' | 'mock'

export interface ProviderResolutionOptions {
  isProd: boolean
  useMocks?: boolean
  openaiKey?: string
  anthropicKey?: string
  geminiApiKey?: string
  geminiConfig?: GeminiConfig
  googleSpeechConfig?: GoogleSpeechConfig
}

export const resolveTranscriberProvider = (
  envValue = process.env.TRANSCRIBER_PROVIDER,
  useMocks = false
): TranscriberProvider => {
  if (!envValue) {
    return useMocks ? 'mock' : 'openai'
  }
  const normalized = envValue.toLowerCase().trim()
  if (
    normalized === 'openai' ||
    normalized === 'google' ||
    normalized === 'google-speech' ||
    normalized === 'mock'
  ) {
    return normalized
  }
  throw new Error(`Неизвестный провайдер транскрибации TRANSCRIBER_PROVIDER: "${envValue}". Допустимы: openai, google, google-speech, mock.`)
}

export const resolveChatReaderProvider = (
  envValue = process.env.CHAT_READER_PROVIDER,
  useMocks = false
): ChatReaderProvider => {
  if (!envValue) {
    return useMocks ? 'mock' : 'anthropic'
  }
  const normalized = envValue.toLowerCase().trim()
  if (
    normalized === 'anthropic' ||
    normalized === 'google' ||
    normalized === 'mock'
  ) {
    return normalized
  }
  throw new Error(`Неизвестный провайдер чтения скриншотов CHAT_READER_PROVIDER: "${envValue}". Допустимы: anthropic, google, mock.`)
}

export const resolveAnalyzerProvider = (
  envValue = process.env.ANALYZER_PROVIDER,
  useMocks = false
): AnalyzerProvider => {
  if (!envValue) {
    return useMocks ? 'mock' : 'anthropic'
  }
  const normalized = envValue.toLowerCase().trim()
  if (
    normalized === 'anthropic' ||
    normalized === 'google' ||
    normalized === 'mock'
  ) {
    return normalized
  }
  throw new Error(`Неизвестный провайдер анализатора кейсов ANALYZER_PROVIDER: "${envValue}". Допустимы: anthropic, google, mock.`)
}

export const assertGeminiTier = (
  isProd: boolean,
  hasGoogleProvider: boolean,
  tier = process.env.GEMINI_TIER
): void => {
  if (isProd && hasGoogleProvider && tier === 'free') {
    throw new Error(
      'Критическая ошибка безопасности: в продакшен-окружении запрещено использовать GEMINI_TIER=free. На бесплатном тарифе данные могут использоваться для улучшения продуктов провайдера. Используйте платный тариф (pay-as-you-go) или корпоративный Vertex AI.'
    )
  }
}

export const createTranscriber = (
  provider: TranscriberProvider,
  options: ProviderResolutionOptions
): Transcriber => {
  if (provider === 'mock') {
    return new MockTranscriber()
  }

  if (provider === 'openai') {
    const key = options.openaiKey || process.env.OPENAI_API_KEY
    if (options.isProd && !key) {
      throw new Error('Критическая ошибка конфигурации: не задан OPENAI_API_KEY для WhisperTranscriber в продакшене.')
    }
    return key ? new WhisperTranscriber(key) : new MockTranscriber()
  }

  if (provider === 'google') {
    const config = options.geminiApiKey
      ? { apiKey: options.geminiApiKey, ...options.geminiConfig }
      : options.geminiConfig
    return new GeminiTranscriber(config)
  }

  if (provider === 'google-speech') {
    return new GoogleSpeechTranscriber(options.googleSpeechConfig)
  }

  throw new Error(`Неподдерживаемый провайдер транскрибации: ${provider}`)
}

export const createChatReader = (
  provider: ChatReaderProvider,
  options: ProviderResolutionOptions
): ChatReader => {
  if (provider === 'mock') {
    return new MockChatReader()
  }

  if (provider === 'anthropic') {
    const key = options.anthropicKey || process.env.ANTHROPIC_API_KEY
    if (options.isProd && !key) {
      throw new Error('Критическая ошибка конфигурации: не задан ANTHROPIC_API_KEY для ClaudeChatReader в продакшене.')
    }
    return key ? new ClaudeChatReader(key) : new MockChatReader()
  }

  if (provider === 'google') {
    const config = options.geminiApiKey
      ? { apiKey: options.geminiApiKey, ...options.geminiConfig }
      : options.geminiConfig
    return new GeminiChatReader(config)
  }

  throw new Error(`Неподдерживаемый провайдер чтения скриншотов: ${provider}`)
}

export const createCaseAnalyzer = (
  provider: AnalyzerProvider,
  options: ProviderResolutionOptions
): CaseAnalyzer => {
  if (provider === 'mock') {
    return new MockCaseAnalyzer()
  }

  if (provider === 'anthropic') {
    const key = options.anthropicKey || process.env.ANTHROPIC_API_KEY
    if (options.isProd && !key) {
      throw new Error('Критическая ошибка конфигурации: не задан ANTHROPIC_API_KEY для ClaudeCaseAnalyzer в продакшене.')
    }
    return key ? new ClaudeCaseAnalyzer(key) : new MockCaseAnalyzer()
  }

  if (provider === 'google') {
    const config = options.geminiApiKey
      ? { apiKey: options.geminiApiKey, ...options.geminiConfig }
      : options.geminiConfig
    return new GeminiCaseAnalyzer(config)
  }

  throw new Error(`Неподдерживаемый провайдер анализа кейсов: ${provider}`)
}

export interface PipelineAdaptersBundle {
  transcriber: Transcriber
  chatReader: ChatReader
  analyzer: CaseAnalyzer
}

export const createPipelineAdapters = (
  options: ProviderResolutionOptions
): PipelineAdaptersBundle => {
  const transcriberProvider = resolveTranscriberProvider(undefined, options.useMocks)
  const chatReaderProvider = resolveChatReaderProvider(undefined, options.useMocks)
  const analyzerProvider = resolveAnalyzerProvider(undefined, options.useMocks)

  const hasGoogle =
    transcriberProvider === 'google' ||
    transcriberProvider === 'google-speech' ||
    chatReaderProvider === 'google' ||
    analyzerProvider === 'google'

  assertGeminiTier(options.isProd, hasGoogle)

  return {
    transcriber: createTranscriber(transcriberProvider, options),
    chatReader: createChatReader(chatReaderProvider, options),
    analyzer: createCaseAnalyzer(analyzerProvider, options),
  }
}
